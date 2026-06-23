import { Loader2, Save, Sparkles, UserCircle, X } from 'lucide-react'
import { useState } from 'react'
import { apiClient } from '../../../apiClient'
import { useAppContext } from '../../../AppContext'
import { CardDisplay, CardPickerGroup } from '../../../components/Card/Card'
import { SelectField } from '../../../components/SelectField/SelectField'
import { buildActionCoachPrompt } from '../../../domain/aiPrompts'
import {
  actionDraftKey,
  actionTypeLabels,
  actionTypeOptionsByStreet,
  createActionDraft,
  dealtStreetOrder,
  getAvailableStreets,
  getPositionLabel,
  getPlayersForStreet,
  getPreviousActionSize,
  getResolvedActionSize,
  hasCompleteCards,
  lockedSizingActionTypes,
  nonSizingActionTypes,
  normalizeActionType,
  playerTypeLabels,
  sizeUnitOptions,
  streetLabels,
  type DealtStreet,
} from '../../../domain/review'
import type { ActionCoachResult, ActionDraft, ActionType, HandAction, HandPlayer, SizeUnit, Street } from '../../../mockApi'
import './ActionsPage.css'

type ActionChoice = ActionType | 'UNSET'

export function ActionsPage() {
  const {
    actionDrafts,
    actions,
    availablePositions,
    busy,
    currentHand,
    editingActionId,
    editingBoardStreet,
    saveBoardCard,
    savePlayerAction,
    selectedActionId,
    setActionDrafts,
    setEditingBoardStreet,
    setSelectedActionId,
    setViewingPlayerId,
    showNotice,
    tableSize,
    updateActionDraft,
    viewingPlayerId,
    visiblePlayers,
    players,
  } = useAppContext()
  const [unsetActionKeys, setUnsetActionKeys] = useState<Record<string, boolean>>({})
  const [coachResults, setCoachResults] = useState<Record<string, ActionCoachResult>>({})
  const [pendingCoachKey, setPendingCoachKey] = useState<string | null>(null)
  const [pendingCoachMode, setPendingCoachMode] = useState<'suggest' | 'review' | null>(null)

  const viewingPlayer = players.find((player) => player.id === viewingPlayerId)
  const sortedActions = [...actions].sort((first, second) => first.actionOrder - second.actionOrder)
  const activeStreetOrder = getAvailableStreets(currentHand)
  const streetCardValues: Record<Street, string> = {
    PREFLOP: '',
    FLOP: currentHand.boardFlop,
    TURN: currentHand.boardTurn,
    RIVER: currentHand.boardRiver,
  }
  const boardCardCounts: Record<DealtStreet, number> = {
    FLOP: 3,
    TURN: 1,
    RIVER: 1,
  }

  const toPersistedDraft = (action: HandAction): ActionDraft => ({
    playerId: action.playerId,
    street: action.street,
    actionType: normalizeActionType(action.actionType),
    actionSize: action.actionSize,
    sizeUnit: action.sizeUnit === 'PERCENT' ? 'BB' : action.sizeUnit,
  })

  const clearCoachResult = (key: string) => {
    setCoachResults((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const clearUnsetState = (key: string) => {
    setUnsetActionKeys((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const getDraftSnapshot = (street: Street, player: HandPlayer, existingAction?: HandAction) => {
    const key = actionDraftKey(street, player.id)
    const persistedDraft = existingAction ? toPersistedDraft(existingAction) : undefined
    const draft = actionDrafts[key] ?? persistedDraft ?? createActionDraft(street, player.id)
    const normalizedDraftActionType = normalizeActionType(draft.actionType)
    const isUnset = unsetActionKeys[key] ?? (!existingAction && !actionDrafts[key])
    const previousSize = getPreviousActionSize(street, player.id, visiblePlayers, sortedActions, availablePositions)
    const sizeUnitValue = draft.sizeUnit === 'PERCENT' ? 'BB' : draft.sizeUnit
    const actionSizeValue = getResolvedActionSize(street, normalizedDraftActionType, Number(draft.actionSize), player.startingStack, previousSize)
    return {
      key,
      draft,
      persistedDraft,
      normalizedDraftActionType,
      isUnset,
      previousSize,
      sizeUnitValue,
      actionSizeValue,
    }
  }

  const updateUnsetFlag = (key: string, nextValue: boolean) => {
    setUnsetActionKeys((current) => {
      if (current[key] === nextValue) return current
      return { ...current, [key]: nextValue }
    })
  }

  const handleActionChoiceChange = (street: Street, player: HandPlayer, nextChoice: ActionChoice, fallback?: ActionDraft) => {
    const key = actionDraftKey(street, player.id)
    clearCoachResult(key)
    if (nextChoice === 'UNSET') {
      updateUnsetFlag(key, true)
      setActionDrafts((current) => {
        if (!(key in current)) return current
        const next = { ...current }
        delete next[key]
        return next
      })
      return
    }
    updateUnsetFlag(key, false)
    updateActionDraft(street, player.id, { actionType: nextChoice }, fallback)
  }

  const handleDraftPatch = (street: Street, player: HandPlayer, patch: Partial<ActionDraft>, fallback?: ActionDraft) => {
    const key = actionDraftKey(street, player.id)
    clearCoachResult(key)
    updateUnsetFlag(key, false)
    updateActionDraft(street, player.id, patch, fallback)
  }

  const handleSaveAction = async (street: Street, player: HandPlayer, existingAction?: HandAction) => {
    const { key, isUnset } = getDraftSnapshot(street, player, existingAction)
    if (isUnset) return
    clearCoachResult(key)
    await savePlayerAction(street, player, existingAction)
    clearUnsetState(key)
  }

  const handleCoachRequest = async (street: Street, player: HandPlayer, mode: 'suggest' | 'review', existingAction?: HandAction) => {
    const snapshot = getDraftSnapshot(street, player, existingAction)
    if (mode === 'suggest' && !snapshot.isUnset) return
    if (mode === 'review' && snapshot.isUnset) return

    setPendingCoachKey(snapshot.key)
    setPendingCoachMode(mode)
    clearCoachResult(snapshot.key)

    try {
      const prompt = buildActionCoachPrompt({
        mode,
        tableSize,
        hand: currentHand,
        players,
        actions,
        street,
        targetPlayer: player,
        ...(mode === 'review'
          ? {
              reviewAction: {
                actionType: snapshot.normalizedDraftActionType,
                actionSize: snapshot.actionSizeValue,
                sizeUnit: snapshot.sizeUnitValue,
              },
            }
          : {}),
      })
      console.log(`[${prompt.modeLabel} Prompt]`, prompt)

      const payload = {
        street,
        playerId: player.id,
        playerName: player.name,
        playerType: player.playerType,
        position: player.position,
        startingStack: player.startingStack,
        previousSize: snapshot.previousSize,
        gameType: currentHand.gameType,
        ...(mode === 'review'
          ? {
              actionType: snapshot.normalizedDraftActionType,
              actionSize: snapshot.actionSizeValue,
              sizeUnit: snapshot.sizeUnitValue,
            }
          : {}),
      }
      const result = mode === 'suggest' ? await apiClient.getActionAdvice(payload) : await apiClient.reviewActionLine(payload)
      setCoachResults((current) => ({ ...current, [snapshot.key]: result }))
    } catch {
      showNotice(mode === 'suggest' ? 'AI 建议暂时不可用' : 'AI 复核暂时不可用', 'error')
    } finally {
      setPendingCoachKey(null)
      setPendingCoachMode(null)
    }
  }

  const renderStreetBoardEditor = (street: DealtStreet, forceOpen = false) => {
    const value = streetCardValues[street]
    const isComplete = hasCompleteCards(value, boardCardCounts[street])
    const isEditing = forceOpen || editingBoardStreet === street
    return (
      isEditing && (
        <div className={isComplete ? 'street-board-card ready editing' : 'street-board-card editing'}>
          <CardPickerGroup count={boardCardCounts[street]} label={streetLabels[street]} value={value} onChange={(nextValue) => saveBoardCard(street, nextValue)} allowEmpty />
        </div>
      )
    )
  }

  const renderStreetBoardDisplay = (street: Street, value: string) => {
    if (street === 'PREFLOP' || !value) return null
    const dealtStreet = street as DealtStreet
    if (!hasCompleteCards(value, boardCardCounts[dealtStreet])) return null
    return (
      <div className="street-dealt-row">
        <button
          className="street-dealt-cards"
          type="button"
          aria-label={`${editingBoardStreet === dealtStreet ? '关闭' : '编辑'}${streetLabels[street]}牌面`}
          onClick={() => setEditingBoardStreet((current) => (current === dealtStreet ? null : dealtStreet))}
        >
          <CardDisplay value={value} />
        </button>
      </div>
    )
  }

  const renderStreetBoardToggle = (street: DealtStreet) => (
    <button
      className="ghost-action street-board-toggle"
      type="button"
      onClick={() => setEditingBoardStreet((current) => (current === street ? null : street))}
    >
      添加
    </button>
  )

  const renderBoardAddPrompts = () =>
    dealtStreetOrder.map((street) => {
      const isComplete = hasCompleteCards(streetCardValues[street], boardCardCounts[street])
      const hasStage = activeStreetOrder.includes(street)
      const isEditing = editingBoardStreet === street
      const showPrompt = !hasStage || isEditing
      if (!showPrompt) return null
      return (
        <article className="street-action-group gated next-board-street-group" key={`next-board-${street}`}>
          <div className="street-action-header">
            <div className="street-action-title">
              <strong>{streetLabels[street]}</strong>
            </div>
          </div>
          <div className="empty-street">
            <button
              className="optional-card-add street-board-add-button"
              type="button"
              onClick={() => setEditingBoardStreet((current) => (current === street ? null : street))}
            >
              添加
            </button>
          </div>
          {isEditing ? renderStreetBoardEditor(street, true) : null}
          {!isEditing && isComplete ? (
            <div className="street-board-inline-preview">
              <button
                className="street-dealt-cards"
                type="button"
                aria-label={`编辑${streetLabels[street]}牌面`}
                onClick={() => setEditingBoardStreet(street)}
              >
                <CardDisplay value={streetCardValues[street]} />
              </button>
            </div>
          ) : null}
        </article>
      )
    })

  const renderPlayerActionCard = (street: Street, player: HandPlayer, existingAction?: HandAction) => {
    const { key, persistedDraft, normalizedDraftActionType, isUnset, sizeUnitValue, actionSizeValue } = getDraftSnapshot(street, player, existingAction)
    const actionChoice = isUnset ? 'UNSET' : normalizedDraftActionType
    const needsSize = actionChoice !== 'UNSET' && !nonSizingActionTypes.has(normalizedDraftActionType)
    const sizeLocked = actionChoice !== 'UNSET' && lockedSizingActionTypes.has(normalizedDraftActionType)
    const isSelected = existingAction && selectedActionId === existingAction.id
    const isEditing = existingAction && editingActionId === existingAction.id
    const heroCards = player.isHero ? currentHand.heroCards : player.holeCards
    const coachResult = coachResults[key]
    const coachLoading = pendingCoachKey === key
    const suggestDisabled = busy || coachLoading || !isUnset
    const reviewDisabled = busy || coachLoading || isUnset
    const actionOptions = [
      ...(!existingAction ? [{ value: 'UNSET' as ActionChoice, label: '未行动' }] : []),
      ...actionTypeOptionsByStreet[street].map((item) => ({ value: item as ActionChoice, label: actionTypeLabels[item] })),
    ]
    return (
      <article className={`player-action-card${isSelected ? ' selected' : ''}${isEditing ? ' editing' : ''}`} key={player.id}>
        <div className="player-action-header">
          <span className="action-position-badge">{getPositionLabel(player.position, tableSize)}</span>
          <button className="player-action-main" type="button" onClick={() => existingAction && setSelectedActionId(existingAction.id)} disabled={!existingAction}>
            <strong>{player.name}</strong>
            <span>{player.isHero ? 'Hero' : playerTypeLabels[player.playerType]} · {player.startingStack}BB</span>
          </button>
          {player.isHero && (
            <span className="hero-hole-cards" aria-label="Hero 手牌">
              <CardDisplay value={heroCards} />
            </span>
          )}
          <button className="icon-action compact" type="button" onClick={() => setViewingPlayerId(player.id)} aria-label={`查看${player.name}玩家信息`}>
            <UserCircle size={17} />
          </button>
        </div>
        <div className="action-editor-grid">
          <label>
            <span>行动</span>
            <SelectField
              ariaLabel="行动"
              options={actionOptions}
              value={actionChoice}
              onChange={(nextValue) => handleActionChoiceChange(street, player, nextValue as ActionChoice, persistedDraft)}
            />
          </label>
          <label>
            <span>大小</span>
            <input
              disabled={!needsSize || sizeLocked}
              min={0}
              step="0.1"
              type="number"
              value={needsSize ? actionSizeValue : 0}
              onChange={(event) => handleDraftPatch(street, player, { actionSize: Number(event.target.value) }, persistedDraft)}
            />
          </label>
          <label>
            <span>单位</span>
            <SelectField
              ariaLabel="单位"
              disabled={!needsSize}
              options={sizeUnitOptions}
              value={sizeUnitValue}
              onChange={(nextValue) => handleDraftPatch(street, player, { sizeUnit: nextValue as SizeUnit }, persistedDraft)}
            />
          </label>
        </div>
        <div className="row-actions player-action-actions">
          <button className="primary-action" type="button" onClick={() => void handleSaveAction(street, player, existingAction)} disabled={busy || isUnset}>
            <Save size={16} />
            {existingAction ? '更新' : '保存'}
          </button>
          <button type="button" onClick={() => void handleCoachRequest(street, player, 'suggest', existingAction)} disabled={suggestDisabled}>
            {coachLoading && pendingCoachMode === 'suggest' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
            AI建议
          </button>
          <button type="button" onClick={() => void handleCoachRequest(street, player, 'review', existingAction)} disabled={reviewDisabled}>
            {coachLoading && pendingCoachMode === 'review' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
            AI复核
          </button>
        </div>
        {coachResult ? (
          <div className="logic-note player-ai-note">
            <Sparkles size={16} />
            <div>
              <h3>{coachResult.headline}</h3>
              <p>{coachResult.primaryText}</p>
              <p>{coachResult.secondaryText}</p>
            </div>
          </div>
        ) : null}
      </article>
    )
  }

  return (
    <section className="action-workspace">
      <div className="table-panel">
        <div className="section-heading">
          <div>
            <h2>4. 行动信息</h2>
          </div>
        </div>
        <div className="street-action-list">
          {activeStreetOrder.map((street) => {
            const streetPlayers = getPlayersForStreet(street, visiblePlayers, sortedActions, availablePositions)
            const boardBlocked = (street === 'TURN' && !hasCompleteCards(currentHand.boardTurn, 1)) || (street === 'RIVER' && !hasCompleteCards(currentHand.boardRiver, 1))
            const streetCards = streetCardValues[street]
            return (
              <article className={boardBlocked ? 'street-action-group gated' : 'street-action-group'} key={street}>
                <div className="street-action-header">
                  <div className="street-action-title">
                    <strong>{streetLabels[street]}</strong>
                  </div>
                  <div className="street-action-tools">{street !== 'PREFLOP' ? renderStreetBoardToggle(street as DealtStreet) : null}</div>
                </div>
                {renderStreetBoardDisplay(street, streetCards)}
                {(street === 'FLOP' || street === 'TURN' || street === 'RIVER') && editingBoardStreet === street ? renderStreetBoardEditor(street as DealtStreet, true) : null}
                {boardBlocked ? (
                  <div className="empty-street">{streetLabels[street]}牌面完整后，该街行动会出现在这里。</div>
                ) : streetPlayers.length === 0 ? (
                  <div className="empty-street">没有可进入{streetLabels[street]}的玩家。</div>
                ) : (
                  <div className="player-action-grid">
                    {streetPlayers.map((player) => renderPlayerActionCard(street, player, sortedActions.find((action) => action.street === street && action.playerId === player.id)))}
                  </div>
                )}
              </article>
            )
          })}
          {renderBoardAddPrompts()}
        </div>
      </div>
      {viewingPlayer && (
        <div className="modal-scrim" role="presentation" onMouseDown={() => setViewingPlayerId(null)}>
          <article className="player-modal player-info-modal" role="dialog" aria-modal="true" aria-labelledby="player-info-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="player-info-title">{viewingPlayer.name}</h2>
                <p>
                  {getPositionLabel(viewingPlayer.position, tableSize)} · {viewingPlayer.isHero ? 'Hero' : playerTypeLabels[viewingPlayer.playerType]}
                </p>
              </div>
              <button className="icon-action" type="button" onClick={() => setViewingPlayerId(null)} aria-label="关闭玩家信息弹窗">
                <X size={18} />
              </button>
            </div>
            <div className="player-info-grid">
              <div>
                <span>起始筹码</span>
                <strong>{viewingPlayer.startingStack}BB</strong>
              </div>
              <div>
                <span>玩家类型</span>
                <strong>{playerTypeLabels[viewingPlayer.playerType]}</strong>
              </div>
              <div>
                <span>底牌</span>
                <strong>
                  <CardDisplay value={viewingPlayer.isHero ? currentHand.heroCards : viewingPlayer.holeCards} />
                </strong>
              </div>
            </div>
            <div className="logic-note player-info-note">
              <UserCircle size={18} />
              <div>
                <h3>范围备注</h3>
                <p>{viewingPlayer.rangeNotes || '暂无范围备注'}</p>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
