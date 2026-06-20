import { useAppContext } from '../../AppContext'
import { SelectField } from '../../components/SelectField/SelectField'
import {
  adjustmentScopeLabels,
  adjustmentScopeOptions,
  adjustmentTypeLabels,
  adjustmentTypeOptions,
  strategyOutcomeLabels,
  strategyOutcomeOptions,
} from '../../domain/review'
import type { AdjustmentScope, AdjustmentType, StrategyOutcome } from '../../mockApi'
import './StrategiesPage.css'

export function StrategiesPage() {
  const {
    createEvaluation,
    createOrUpdateStrategy,
    deleteStrategy,
    editStrategy,
    editingStrategyId,
    evaluationDraft,
    evaluations,
    opponents,
    refreshStrategies,
    selectedStrategy,
    setEvaluationDraft,
    setEvaluationStrategyId,
    setStrategyDraft,
    strategies,
    strategyDraft,
    toggleStrategy,
    busy,
  } = useAppContext()

  return (
    <section className="page-panel">
      <div className="section-heading">
        <div>
          <h2>策略调整与收益评估</h2>
          <p>管理策略启用状态、收益评估和复盘记录。</p>
        </div>
        <button className="ghost-action" type="button" onClick={refreshStrategies} disabled={busy}>
          刷新策略
        </button>
      </div>
      <section className="split-panel padded">
        <div>
          <div className="card-grid single">
            {strategies.length === 0 ? (
              <div className="empty-state">暂无策略。可从对手画像生成一条，或使用右侧表单手动创建。</div>
            ) : strategies.map((strategy) => (
              <article className="data-card" key={strategy.id}>
                <div>
                  <strong>
                    {strategy.playerName} · {adjustmentTypeLabels[strategy.adjustmentType]} {adjustmentScopeLabels[strategy.adjustmentScope]}
                  </strong>
                  <span>{strategy.isActive ? '已启用' : '已停用'}</span>
                </div>
                <p>{strategy.adjustedStrategy}</p>
                <p>{strategy.reason}</p>
                <div className="metric-row">
                  <span>预期 EV +{strategy.expectedEvImprovement} BB/100</span>
                  <span>置信度 {strategy.confidenceLevel}%</span>
                  <span>最后使用 {strategy.lastUsedAt?.slice(0, 10) ?? '-'}</span>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => editStrategy(strategy)}>
                    编辑
                  </button>
                  <button type="button" onClick={() => toggleStrategy(strategy.id)}>
                    {strategy.isActive ? '停用' : '启用'}
                  </button>
                  <button type="button" onClick={() => deleteStrategy(strategy.id)}>
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
          <h3 className="subheading">评估记录</h3>
          <div className="mini-list">
            {evaluations.length === 0 ? (
              <div>暂无策略评估记录。</div>
            ) : evaluations.map((evaluation) => (
              <div key={evaluation.id}>
                <strong>
                  {strategyOutcomeLabels[evaluation.outcome]} · EV {evaluation.evDifference >= 0 ? '+' : ''}
                  {evaluation.evDifference}
                </strong>
                <span>
                  评分 {evaluation.effectivenessRating}/5 · {evaluation.notes}
                </span>
              </div>
            ))}
          </div>
        </div>
        <form className="side-form" onSubmit={createOrUpdateStrategy}>
          <h2>{editingStrategyId ? '编辑策略' : '创建策略'}</h2>
          <label>
            <span>目标对手</span>
            <SelectField
              ariaLabel="目标对手"
              options={opponents.map((opponent) => ({ value: opponent.id, label: opponent.name }))}
              value={strategyDraft.playerId}
              onChange={(nextValue) => setStrategyDraft({ ...strategyDraft, playerId: nextValue })}
            />
          </label>
          <div className="form-grid compact">
            <label>
              <span>调整街道</span>
              <SelectField
                ariaLabel="调整街道"
                options={adjustmentTypeOptions}
                value={strategyDraft.adjustmentType}
                onChange={(nextValue) => setStrategyDraft({ ...strategyDraft, adjustmentType: nextValue as AdjustmentType })}
              />
            </label>
            <label>
              <span>调整范围</span>
              <SelectField
                ariaLabel="调整范围"
                options={adjustmentScopeOptions}
                value={strategyDraft.adjustmentScope}
                onChange={(nextValue) => setStrategyDraft({ ...strategyDraft, adjustmentScope: nextValue as AdjustmentScope })}
              />
            </label>
          </div>
          <label>
            <span>原始 GTO 策略</span>
            <textarea value={strategyDraft.originalStrategy} onChange={(event) => setStrategyDraft({ ...strategyDraft, originalStrategy: event.target.value })} />
          </label>
          <label>
            <span>调整后策略</span>
            <textarea value={strategyDraft.adjustedStrategy} onChange={(event) => setStrategyDraft({ ...strategyDraft, adjustedStrategy: event.target.value })} />
          </label>
          <label>
            <span>调整理由</span>
            <textarea value={strategyDraft.reason} onChange={(event) => setStrategyDraft({ ...strategyDraft, reason: event.target.value })} />
          </label>
          <div className="form-grid compact">
            <label>
              <span>预期 EV 提升</span>
              <input type="number" value={strategyDraft.expectedEvImprovement} onChange={(event) => setStrategyDraft({ ...strategyDraft, expectedEvImprovement: Number(event.target.value) })} />
            </label>
            <label>
              <span>置信度</span>
              <input type="number" value={strategyDraft.confidenceLevel} onChange={(event) => setStrategyDraft({ ...strategyDraft, confidenceLevel: Number(event.target.value) })} />
            </label>
          </div>
          <button className="primary-action full" type="submit">
            {editingStrategyId ? '更新策略' : '创建策略'}
          </button>
          {selectedStrategy && (
            <div className="evaluation-box">
              <h3>创建策略评估</h3>
              <label>
                <span>评估策略</span>
                <SelectField
                  ariaLabel="评估策略"
                  options={strategies.map((strategy) => ({
                    value: strategy.id,
                    label: `${strategy.playerName} · ${adjustmentTypeLabels[strategy.adjustmentType]} ${adjustmentScopeLabels[strategy.adjustmentScope]}`,
                  }))}
                  value={selectedStrategy.id}
                  onChange={setEvaluationStrategyId}
                />
              </label>
              <div className="form-grid compact">
                <label>
                  <span>实际 EV</span>
                  <input type="number" value={evaluationDraft.actualEv} onChange={(event) => setEvaluationDraft({ ...evaluationDraft, actualEv: Number(event.target.value) })} />
                </label>
                <label>
                  <span>预期 EV</span>
                  <input type="number" value={evaluationDraft.expectedEv} onChange={(event) => setEvaluationDraft({ ...evaluationDraft, expectedEv: Number(event.target.value) })} />
                </label>
              </div>
              <label>
                <span>结果</span>
                <SelectField
                  ariaLabel="结果"
                  options={strategyOutcomeOptions}
                  value={evaluationDraft.outcome}
                  onChange={(nextValue) => setEvaluationDraft({ ...evaluationDraft, outcome: nextValue as StrategyOutcome })}
                />
              </label>
              <label>
                <span>效果评分</span>
                <input type="number" min={1} max={5} value={evaluationDraft.effectivenessRating} onChange={(event) => setEvaluationDraft({ ...evaluationDraft, effectivenessRating: Number(event.target.value) })} />
              </label>
              <label>
                <span>备注</span>
                <textarea value={evaluationDraft.notes} onChange={(event) => setEvaluationDraft({ ...evaluationDraft, notes: event.target.value })} />
              </label>
              <button className="ghost-action full" type="button" onClick={createEvaluation}>
                创建评估
              </button>
            </div>
          )}
        </form>
      </section>
    </section>
  )
}
