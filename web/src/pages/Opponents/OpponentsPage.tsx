import { useAppContext } from '../../AppContext'
import { AnalysisBlock } from '../../components/AnalysisBlock/AnalysisBlock'
import {
  boardTextureLabels,
  patternTypeLabels,
  playerTypeLabels,
  positionLabels,
} from '../../domain/review'
import './OpponentsPage.css'

export function OpponentsPage() {
  const {
    analyzeOpponent,
    busy,
    createStrategyFromOpponent,
    inspectHand,
    opponentHands,
    opponents,
    selectedOpponent,
    selectedOpponentId,
    setSelectedOpponentId,
  } = useAppContext()

  return (
    <section className="page-panel">
      <div className="section-heading">
        <div>
          <h2>对手分析</h2>
          <p>覆盖对手列表、详情、风格分析、行动模式、交手记录。</p>
        </div>
      </div>
      <div className="split-panel padded">
        <div className="card-grid single">
          {opponents.map((opponent) => (
            <article className={selectedOpponentId === opponent.id ? 'data-card hero' : 'data-card'} key={opponent.id}>
              <div>
                <strong>{opponent.name}</strong>
                <span>
                  手动 {playerTypeLabels[opponent.manualType]} · 推断 {playerTypeLabels[opponent.inferredType]}
                </span>
              </div>
              <div className="metric-grid">
                <span>样本 {opponent.analyzedHandsCount}</span>
                <span>Open {opponent.preflopStats.openFreq}%</span>
                <span>3-bet {opponent.preflopStats.threeBetFreq}%</span>
                <span>C-bet {opponent.postflopStats.flopCbetFreq}%</span>
                <span>Bluff {opponent.styleMetrics.bluffProbability}%</span>
                <span>AF {opponent.styleMetrics.aggressionFactor}</span>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => setSelectedOpponentId(opponent.id)}>
                  查看详情
                </button>
                <button type="button" onClick={() => analyzeOpponent(opponent.id)} disabled={busy}>
                  分析 {opponent.name}
                </button>
                <button type="button" onClick={() => createStrategyFromOpponent(opponent.id)}>
                  生成 {opponent.name} 策略
                </button>
              </div>
            </article>
          ))}
        </div>
        {selectedOpponent && (
          <aside className="analysis-panel compact-panel">
            <div className="section-heading">
              <div>
                <h2>{selectedOpponent.name} 详情</h2>
                <p>风格、范围与交手记录。</p>
              </div>
            </div>
            <AnalysisBlock title="翻前范围" text={selectedOpponent.inferredRanges.preflop} />
            <AnalysisBlock title="翻后范围" text={selectedOpponent.inferredRanges.postflop} />
            <h3>行动模式</h3>
            <div className="mini-list">
              {selectedOpponent.patterns.map((pattern) => (
                <div key={pattern.id}>
                  <strong>{patternTypeLabels[pattern.patternType]}</strong>
                  <span>
                    {pattern.position === 'ANY' ? '任意位置' : positionLabels[pattern.position]} · {boardTextureLabels[pattern.boardTexture] ?? pattern.boardTexture} · 频率 {pattern.frequency}% · 样本 {pattern.sampleSize}
                  </span>
                </div>
              ))}
            </div>
            <h3>交手记录</h3>
            <div className="mini-list">
              {opponentHands.map((item) => (
                <button key={item.id} type="button" onClick={() => inspectHand(item.id, 'view')}>
                  {item.title} · GTO {item.score}
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}
