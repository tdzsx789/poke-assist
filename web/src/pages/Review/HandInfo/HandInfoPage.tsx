import { useState } from 'react'
import { useAppContext } from '../../../AppContext'
import { CardPickerGroup } from '../../../components/Card/Card'
import { SelectField } from '../../../components/SelectField/SelectField'
import { gameTypeOptions, hasCompleteCards, splitCards, tournamentStageOptions } from '../../../domain/review'
import './HandInfoPage.css'

export function HandInfoPage() {
  const { currentHand, updateHand } = useAppContext()
  const hasAnyBoardCards = [currentHand.boardFlop, currentHand.boardTurn, currentHand.boardRiver].some((value) => splitCards(value).length > 0)
  const [boardEditorOpened, setBoardEditorOpened] = useState(hasAnyBoardCards)
  const showBoardEditor = boardEditorOpened || hasAnyBoardCards

  return (
    <section className="hand-form-panel" aria-label="手牌信息录入表单">
      <div className="section-heading">
        <div>
          <h2>3. 手牌信息录入</h2>
        </div>
      </div>
      <form className="hand-form" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>基础信息</legend>
          <div className="form-grid">
            <label>
              <span>手牌名称 · 必填</span>
              <input
                required
                value={currentHand.handName}
                placeholder="例如：FT AJs BTN open vs SB call"
                onChange={(event) => updateHand('handName', event.target.value)}
              />
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>游戏信息</legend>
          <div className="form-grid">
            <label>
              <span>游戏类型</span>
              <SelectField ariaLabel="游戏类型" options={gameTypeOptions} value={currentHand.gameType} onChange={(nextValue) => updateHand('gameType', nextValue)} />
            </label>
            <label>
              <span>锦标赛阶段</span>
              <SelectField
                ariaLabel="锦标赛阶段"
                options={tournamentStageOptions}
                value={currentHand.tournamentStage}
                onChange={(nextValue) => updateHand('tournamentStage', nextValue)}
              />
            </label>
            <label>
              <span>小盲</span>
              <input
                required
                min={0}
                type="number"
                value={currentHand.smallBlind}
                placeholder="100"
                onChange={(event) => updateHand('smallBlind', event.target.value === '' ? '' : Number(event.target.value))}
              />
            </label>
            <label>
              <span>大盲</span>
              <input
                required
                min={0}
                type="number"
                value={currentHand.bigBlind}
                placeholder="200"
                onChange={(event) => updateHand('bigBlind', event.target.value === '' ? '' : Number(event.target.value))}
              />
            </label>
            <label>
              <span>Ante · 选填</span>
              <input
                min={0}
                type="number"
                value={currentHand.ante}
                placeholder="200"
                onChange={(event) => updateHand('ante', event.target.value === '' ? '' : Number(event.target.value))}
              />
            </label>
            <label>
              <span>有效筹码量 BB</span>
              <input type="number" value={currentHand.effectiveStack} onChange={(event) => updateHand('effectiveStack', Number(event.target.value))} />
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>牌面信息</legend>
          <div className="card-entry-layout">
            <section className="card-entry-section hero-cards-entry">
              <h3>Hero 手牌</h3>
              <CardPickerGroup count={2} label="Hero 手牌" value={currentHand.heroCards} onChange={(value) => updateHand('heroCards', value)} />
            </section>
            <section className="card-entry-section board-cards-entry">
              <h3>公共牌</h3>
              {showBoardEditor ? (
                <div className="board-card-grid">
                  <div className="card-street-entry flop-card-entry">
                    <span>翻牌面 · 选填</span>
                    <CardPickerGroup
                      count={3}
                      label="翻牌面"
                      value={currentHand.boardFlop}
                      onChange={(value) => {
                        updateHand('boardFlop', value)
                        if (!hasCompleteCards(value, 3)) {
                          updateHand('boardTurn', '')
                          updateHand('boardRiver', '')
                        }
                      }}
                      allowEmpty
                      optionalCollapsed
                    />
                  </div>
                  <div className="card-street-entry turn-card-entry">
                    <span>转牌 · 选填</span>
                    <CardPickerGroup
                      count={1}
                      label="转牌"
                      value={currentHand.boardTurn}
                      onChange={(value) => {
                        updateHand('boardTurn', value)
                        if (!hasCompleteCards(value, 1)) {
                          updateHand('boardRiver', '')
                        }
                      }}
                      allowEmpty
                      optionalCollapsed
                    />
                  </div>
                  <div className="card-street-entry river-card-entry">
                    <span>河牌 · 选填</span>
                    <CardPickerGroup count={1} label="河牌" value={currentHand.boardRiver} onChange={(value) => updateHand('boardRiver', value)} allowEmpty optionalCollapsed />
                  </div>
                </div>
              ) : (
                <button className="optional-card-add board-add-trigger" type="button" onClick={() => setBoardEditorOpened(true)}>
                  添加公共牌
                </button>
              )}
            </section>
          </div>
        </fieldset>
      </form>
    </section>
  )
}
