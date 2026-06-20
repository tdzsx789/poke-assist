import { Bot } from 'lucide-react'
import { useAppContext } from '../../AppContext'
import { actionTypeLabels, streetLabels } from '../../domain/review'
import './StatsPage.css'

export function StatsPage() {
  const {
    actions,
    analyzedActions,
    currentHand,
    navigateToRoute,
    players,
    setSelectedActionId,
  } = useAppContext()
  const resultCount = analyzedActions.length + (currentHand.overallSuggestion ? 1 : 0)

  return (
    <section className="page-panel ai-results-page">
      <div className="section-heading">
        <div>
          <h2>AI 结果保存页</h2>
          <p>{resultCount === 0 ? '当前手牌还没有已保存的 AI 分析结果。' : `当前手牌已保存 ${resultCount} 条 AI 分析结果。`}</p>
        </div>
        <button className="ghost-action" type="button" onClick={() => navigateToRoute({ section: 'review', reviewStep: 3 })}>
          回到行动信息
        </button>
      </div>
      {resultCount === 0 ? (
        <div className="empty-state">
          <Bot size={22} />
          <p>在“行动信息”里保存玩家行动后，点击对应街道的“分析”，结果会出现在这里。</p>
        </div>
      ) : (
        <div className="ai-result-grid">
          {currentHand.overallSuggestion && (
            <button
              className="ai-result-card"
              type="button"
              onClick={() => {
                setSelectedActionId(actions[0]?.id ?? '')
                navigateToRoute({ section: 'review', reviewStep: 4 })
              }}
            >
              <div>
                <span>整手牌总结</span>
                <strong>{currentHand.overallSuggestion}</strong>
              </div>
              <div className="ai-result-metrics">
                <span>GTO {currentHand.overallGtoScore ?? '-'}</span>
                <span>全局建议</span>
              </div>
            </button>
          )}
          {analyzedActions.map((action) => {
            const player = players.find((item) => item.id === action.playerId)
            return (
              <button
                className="ai-result-card"
                key={action.id}
                type="button"
                onClick={() => {
                  setSelectedActionId(action.id)
                  navigateToRoute({ section: 'review', reviewStep: 4 })
                }}
              >
                <div>
                  <span>
                    {streetLabels[action.street]} · {player?.position ?? '-'} · {player?.name ?? '未知玩家'}
                  </span>
                  <strong>{action.analysis?.oneLineConclusion}</strong>
                </div>
                <div className="ai-result-metrics">
                  <span>GTO {action.analysis?.gtoScore}</span>
                  <span>EV {action.analysis?.evValue}</span>
                  <span>{actionTypeLabels[action.actionType]}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
