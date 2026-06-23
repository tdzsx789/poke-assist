import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { useAppContext } from '../../../AppContext'
import { SelectField } from '../../../components/SelectField/SelectField'
import {
  getPositionLabel,
  playerTypeLabels,
  playerTypeOptions,
  tableSizeOptions,
  type TableSize,
} from '../../../domain/review'
import type { PlayerType, Position } from '../../../mockApi'
import './PlayersPage.css'

export function PlayersPage() {
  const {
    addOrUpdatePlayer,
    availablePositions,
    busy,
    cancelPlayerEditing,
    changeTableSize,
    deletePlayer,
    editPlayer,
    editingPlayerId,
    getTableValidationMessage,
    isAddingPlayer,
    isTableComplete,
    playerDraft,
    playerDraftPosition,
    players,
    saveCurrentTableTemplate,
    setPlayerDraft,
    setTableTemplateName,
    startAddPlayer,
    tableIsFull,
    tableSize,
    tableTemplateName,
  } = useAppContext()
  const playerModalOpen = isAddingPlayer || Boolean(editingPlayerId)
  const editingPlayer = players.find((player) => player.id === editingPlayerId)

  return (
    <section className="player-workspace">
      <div className="table-panel">
        <div className="section-heading">
          <div>
            <h2>2. 牌桌与玩家信息</h2>
          </div>
        </div>
        <div className="table-template-panel">
          <label>
            <span>当前牌桌名称</span>
            <input value={tableTemplateName} onChange={(event) => setTableTemplateName(event.target.value)} placeholder="例如：周五常规局 6 人桌" />
          </label>
          <button className="ghost-action" type="button" onClick={saveCurrentTableTemplate} disabled={busy || !isTableComplete}>
            <Save size={16} />
            保存当前牌桌
          </button>
        </div>
        <div className="table-config-panel">
          <label>
            <span>桌人数</span>
            <SelectField
              ariaLabel="桌人数"
              options={tableSizeOptions.map((size) => ({ value: size, label: `${size} 人桌` }))}
              value={tableSize}
              onChange={(nextValue) => changeTableSize(nextValue as TableSize)}
            />
          </label>
          <div>
            <strong>
              已录入 {players.length}/{tableSize} 人
            </strong>
            <span>{isTableComplete ? '当前牌桌信息完整；点击座位卡编辑玩家。' : getTableValidationMessage()}</span>
          </div>
        </div>
        <div className="position-strip" aria-label="当前桌型位置">
          {availablePositions.map((position) => {
            const seatedPlayer = players.find((player) => player.position === position)
            return (
              <article className={seatedPlayer ? `seat-card filled ${seatedPlayer.isHero ? 'hero' : ''}` : 'seat-card empty'} key={position}>
                <div className="seat-card-header">
                  <div>
                    <strong>{getPositionLabel(position, tableSize)}</strong>
                    <span>{seatedPlayer ? (seatedPlayer.isHero ? 'Hero / 当前主视角' : '对手玩家') : '空位'}</span>
                  </div>
                  {seatedPlayer && <span className={seatedPlayer.isHero ? 'player-badge hero-badge' : 'player-badge'}>{playerTypeLabels[seatedPlayer.playerType]}</span>}
                </div>
                {seatedPlayer ? (
                  <>
                    <div className="seat-player-main">
                      <strong>{seatedPlayer.name}</strong>
                      <span>{seatedPlayer.startingStack}BB</span>
                    </div>
                    <p>{seatedPlayer.rangeNotes || '暂无范围备注'}</p>
                    <div className="row-actions seat-card-actions">
                      <button type="button" onClick={() => editPlayer(seatedPlayer)} disabled={busy}>
                        <Pencil size={16} />
                        编辑
                      </button>
                      <button type="button" onClick={() => deletePlayer(seatedPlayer.id)} disabled={busy}>
                        <Trash2 size={16} />
                        删除
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>还没有玩家坐在这个位置。</p>
                    <button className="ghost-action full" type="button" onClick={() => startAddPlayer(position)} disabled={busy || tableIsFull}>
                      <Plus size={16} />
                      添加玩家
                    </button>
                  </>
                )}
              </article>
            )
          })}
        </div>
        {playerModalOpen && (
          <div className="modal-scrim" role="presentation" onMouseDown={cancelPlayerEditing}>
            <form className="player-modal" role="dialog" aria-modal="true" aria-labelledby="player-modal-title" onSubmit={addOrUpdatePlayer} onMouseDown={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 id="player-modal-title">{editingPlayerId ? '编辑玩家' : '添加玩家'}</h2>
                  <p>{editingPlayer ? `${getPositionLabel(editingPlayer.position, tableSize)} · ${editingPlayer.name}` : `${getPositionLabel(playerDraftPosition, tableSize)} 空位`}</p>
                </div>
                <button className="icon-action" type="button" onClick={cancelPlayerEditing} aria-label="关闭玩家编辑弹窗">
                  <X size={18} />
                </button>
              </div>
              {tableIsFull && !editingPlayerId && <div className="empty-state">当前 {tableSize} 人桌已满。请先删除玩家，或把桌人数调大。</div>}
              <div className="form-grid compact player-editor-main">
                <label>
                  <span>玩家名称</span>
                  <input value={playerDraft.name} onChange={(event) => setPlayerDraft({ ...playerDraft, name: event.target.value })} autoFocus />
                </label>
                <label>
                  <span>位置</span>
                  <SelectField
                    ariaLabel="位置"
                    options={availablePositions.map((item) => ({ value: item, label: getPositionLabel(item, tableSize) }))}
                    value={playerDraftPosition}
                    onChange={(nextValue) => setPlayerDraft({ ...playerDraft, position: nextValue as Position })}
                  />
                </label>
                <label>
                  <span>玩家类型</span>
                  <SelectField
                    ariaLabel="玩家类型"
                    options={playerTypeOptions}
                    value={playerDraft.playerType}
                    onChange={(nextValue) => setPlayerDraft({ ...playerDraft, playerType: nextValue as PlayerType })}
                  />
                </label>
                <label>
                  <span>起始筹码 BB</span>
                  <input type="number" value={playerDraft.startingStack} onChange={(event) => setPlayerDraft({ ...playerDraft, startingStack: Number(event.target.value) })} />
                </label>
              </div>
              <label>
                <span>范围备注</span>
                <textarea value={playerDraft.rangeNotes} onChange={(event) => setPlayerDraft({ ...playerDraft, rangeNotes: event.target.value })} />
              </label>
              <div className="modal-footer">
                <label className="checkbox-field">
                  <input type="checkbox" checked={playerDraft.isHero} onChange={(event) => setPlayerDraft({ ...playerDraft, isHero: event.target.checked })} />
                  <span>设为 Hero</span>
                </label>
                <div className="row-actions player-editor-actions">
                  <button type="button" onClick={cancelPlayerEditing}>
                    取消
                  </button>
                  <button className="primary-action" type="submit" disabled={busy || (tableIsFull && !editingPlayerId)}>
                    <Save size={18} />
                    {editingPlayerId ? '保存玩家' : '添加玩家'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
