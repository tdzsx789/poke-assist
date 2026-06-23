import { Bot, CheckCircle2, Sparkles } from 'lucide-react'
import { useAppContext } from '../../../AppContext'
import { AnalysisBlock } from '../../../components/AnalysisBlock/AnalysisBlock'
import { actionTypeLabels, streetLabels } from '../../../domain/review'
import './AnalysisPage.css'

export function AnalysisPage() {
  const {
    actions,
    analyzeHand,
    busy,
    currentHand,
    players,
    selectedAction,
    selectedActionId,
    setSelectedActionId,
  } = useAppContext()
  const hasAnalysis = actions.some((action) => Boolean(action.analysis))
  const analyzeLabel = hasAnalysis ? '重新分析整手牌' : '运行整手牌分析'

  return (
    <section className="analysis-layout">
      <div className="table-panel">
        <div className="section-heading">
          <div>
            <h2>5. AI 行动分析结果</h2>
          </div>
          <button className="ghost-action" type="button" onClick={analyzeHand} disabled={busy || actions.length === 0}>
            <Sparkles size={16} />
            {analyzeLabel}
          </button>
        </div>
        <div className="action-summary-grid">
          {actions.map((action) => {
            const player = players.find((item) => item.id === action.playerId)
            return (
              <button className={selectedActionId === action.id ? 'summary-action selected' : 'summary-action'} key={action.id} type="button" onClick={() => setSelectedActionId(action.id)}>
                <strong>
                  #{action.actionOrder} {streetLabels[action.street]} · {player?.name ?? '未知玩家'} {actionTypeLabels[action.actionType]}
                </strong>
                <span>{action.analysis?.oneLineConclusion ?? '尚未分析'}</span>
              </button>
            )
          })}
        </div>
      </div>
      <aside className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>AI 分析面板</h2>
            <p>{selectedAction ? `${streetLabels[selectedAction.street]} · ${actionTypeLabels[selectedAction.actionType]}` : '请选择行动'}</p>
          </div>
        </div>
        {selectedAction?.analysis ? (
          <>
            <div className="score-card">
              <div>
                <span>GTO 评分</span>
                <strong>{selectedAction.analysis.gtoScore}</strong>
              </div>
              <div>
                <span>EV 值</span>
                <strong>{selectedAction.analysis.evValue}</strong>
              </div>
            </div>
            <AnalysisBlock title="一句话结论" text={selectedAction.analysis.oneLineConclusion} highlight />
            <AnalysisBlock title="Range 分析" text={selectedAction.analysis.rangeAnalysis} />
            <AnalysisBlock title="EV / 最优行动" text={`建议行动：${actionTypeLabels[selectedAction.analysis.optimalAction]}。${selectedAction.analysis.suggestion}`} />
            <AnalysisBlock title="下注尺度" text={selectedAction.analysis.betSizingReview} />
            <AnalysisBlock title="Exploit 调整" text={selectedAction.analysis.exploitAdjustment} />
            <AnalysisBlock title="ICM 影响" text={selectedAction.analysis.icmImpact} />
          </>
        ) : (
          <div className="empty-state">
            <Bot size={22} />
            <p>当前还没有 AI 分析结果。可以直接运行整手牌分析，或回到行动信息继续补充行动。</p>
            <button className="primary-action" type="button" onClick={analyzeHand} disabled={busy || actions.length === 0}>
              <Sparkles size={16} />
              {analyzeLabel}
            </button>
          </div>
        )}
        {currentHand.overallSuggestion && (
          <div className="logic-note">
            <CheckCircle2 size={18} />
            <div>
              <h3>整手牌总结 · {currentHand.overallGtoScore}</h3>
              <p>{currentHand.overallSuggestion}</p>
            </div>
          </div>
        )}
      </aside>
    </section>
  )
}
