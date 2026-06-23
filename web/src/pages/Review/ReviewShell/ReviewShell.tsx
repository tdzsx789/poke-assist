import { Bot, CheckCircle2, ChevronRight, Circle, Clock3, Loader2, Save, Sparkles } from 'lucide-react'
import { useAppContext } from '../../../AppContext'
import { reviewSteps, type ReviewStep } from '../../../domain/review'
import { ActionsPage } from '../Actions/ActionsPage'
import { AnalysisPage } from '../Analysis/AnalysisPage'
import { HandInfoPage } from '../HandInfo/HandInfoPage'
import { PlayersPage } from '../Players/PlayersPage'
import { TableEntryPage } from '../TableEntry/TableEntryPage'
import './ReviewShell.css'

export function ReviewShell() {
  const {
    actions,
    analyzeHand,
    busy,
    currentHand,
    getHandInfoValidationMessage,
    getTableValidationMessage,
    goToReviewStep,
    isHandInfoComplete,
    isTableComplete,
    reviewStep,
    saveHand,
    saveTableAndContinue,
  } = useAppContext()

  const renderReviewStep = () => {
    if (reviewStep === 0) return <TableEntryPage />
    if (reviewStep === 1) return <PlayersPage />
    if (reviewStep === 2) return <HandInfoPage />
    if (reviewStep === 3) return <ActionsPage />
    return <AnalysisPage />
  }

  const nextDisabled = busy || reviewStep === 0 || (reviewStep === 1 && !isTableComplete) || (reviewStep === 2 && !isHandInfoComplete)
  const nextTitle =
    reviewStep === 0
      ? '请先选择创建或加载牌桌'
      : reviewStep === 1 && !isTableComplete
        ? getTableValidationMessage()
        : reviewStep === 2 && !isHandInfoComplete
          ? getHandInfoValidationMessage()
          : undefined
  const nextLabel = reviewStep === 0 ? '先选择牌桌入口' : reviewStep === 1 ? '保存牌桌并进入手牌信息' : reviewStep === 2 ? '保存手牌并进入行动信息' : reviewStep === 3 ? '去 AI 分析结果页' : '进入下一步'
  const nextAction = reviewStep === 1 ? saveTableAndContinue : reviewStep === 2 ? saveHand : () => goToReviewStep(Math.min(reviewStep + 1, 4) as ReviewStep)

  return (
    <>
      <section className="review-layout" id="review">
        <section className="main-panel">
          {renderReviewStep()}
          {reviewStep > 0 ? (
            <footer className="review-action-bar">
              <div>
                <strong>{reviewSteps[reviewStep].label}</strong>
              </div>
              <div className="review-action-buttons">
                <button className="ghost-action" type="button" onClick={() => goToReviewStep(Math.max(reviewStep - 1, 0) as ReviewStep)} disabled={reviewStep === 0 || busy}>
                  上一步
                </button>
                {reviewStep < 4 ? (
                  <button
                    className="primary-action"
                    type="button"
                    onClick={nextAction}
                    disabled={nextDisabled}
                    title={nextTitle}
                  >
                    {busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                    {nextLabel}
                  </button>
                ) : (
                  <button className="primary-action" type="button" onClick={analyzeHand} disabled={busy || actions.length === 0}>
                    {busy ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                    运行整手牌分析
                  </button>
                )}
              </div>
            </footer>
          ) : null}
        </section>
        <aside className="step-panel" aria-label="复盘流程">
          <div className="section-heading">
            <div>
              <h2>手牌分析流程</h2>
            </div>
          </div>
          <div className="step-list">
            {reviewSteps.map((step, index) => (
              <button
                className={`step-card ${index === reviewStep ? 'current' : index < reviewStep ? 'done' : 'next'}`}
                key={step.label}
                type="button"
                onClick={() => goToReviewStep(index as ReviewStep)}
                disabled={busy || (index > 1 && !isTableComplete) || (index > 2 && !isHandInfoComplete)}
                title={
                  index > 1 && !isTableComplete
                    ? getTableValidationMessage()
                    : index > 2 && !isHandInfoComplete
                      ? getHandInfoValidationMessage()
                      : undefined
                }
              >
                {index < reviewStep ? <CheckCircle2 size={18} /> : index === reviewStep ? <Clock3 size={18} /> : <Circle size={18} />}
                <div>
                  <strong>{step.label}</strong>
                </div>
              </button>
            ))}
          </div>
          <div className="logic-note">
            <Bot size={18} />
            <div>
              <h3>分析状态</h3>
              <p>{currentHand.analysisDirty ? '基础信息、玩家或行动已变更，需要重新分析。' : '当前分析结果与手牌信息一致。'}</p>
            </div>
          </div>
        </aside>
      </section>
      <section className="flow-strip">
        <span>牌桌入口</span>
        <ChevronRight size={16} />
        <span>玩家信息</span>
        <ChevronRight size={16} />
        <span>手牌信息</span>
        <ChevronRight size={16} />
        <span>行动信息</span>
        <ChevronRight size={16} />
        <span>分街道分析</span>
        <ChevronRight size={16} />
        <span>历史沉淀</span>
      </section>
    </>
  )
}
