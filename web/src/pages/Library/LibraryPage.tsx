import { Search } from 'lucide-react'
import { useAppContext } from '../../AppContext'
import { CardDisplay } from '../../components/Card/Card'
import { SelectField } from '../../components/SelectField/SelectField'
import {
  gameTypeLabels,
  gameTypeOptions,
  playerTypeLabels,
  playerTypeOptions,
  tournamentStageLabels,
  tournamentStageOptions,
} from '../../domain/review'
import type { GameType, PlayerType, TournamentStage } from '../../mockApi'
import './LibraryPage.css'

export function LibraryPage() {
  const {
    deleteHand,
    handFilters,
    handList,
    inspectHand,
    refreshHandList,
    resetHandFilters,
    setHandFilters,
  } = useAppContext()

  return (
    <section className="page-panel">
      <div className="section-heading">
        <div>
          <h2>2.3 历史记录管理</h2>
          <p>支持按时间、游戏类型、阶段、对手类型、GTO 分数和关键词筛选。</p>
        </div>
      </div>
      <div className="filter-bar expanded">
        <label>
          <span>搜索</span>
          <div className="input-with-icon">
            <Search size={16} />
            <input value={handFilters.search ?? ''} onChange={(event) => setHandFilters({ ...handFilters, search: event.target.value })} placeholder="手牌、公共牌、Hero 手牌" />
          </div>
        </label>
        <label>
          <span>游戏类型</span>
          <SelectField
            ariaLabel="游戏类型筛选"
            options={[{ value: 'ALL', label: '全部' }, ...gameTypeOptions]}
            value={handFilters.gameType ?? 'ALL'}
            onChange={(nextValue) => setHandFilters({ ...handFilters, gameType: nextValue as 'ALL' | GameType })}
          />
        </label>
        <label>
          <span>锦标赛阶段</span>
          <SelectField
            ariaLabel="锦标赛阶段筛选"
            options={[{ value: 'ALL', label: '全部' }, ...tournamentStageOptions]}
            value={handFilters.stage ?? 'ALL'}
            onChange={(nextValue) => setHandFilters({ ...handFilters, stage: nextValue as 'ALL' | TournamentStage })}
          />
        </label>
        <label>
          <span>对手类型</span>
          <SelectField
            ariaLabel="对手类型筛选"
            options={[{ value: 'ALL', label: '全部' }, ...playerTypeOptions]}
            value={handFilters.opponentType ?? 'ALL'}
            onChange={(nextValue) => setHandFilters({ ...handFilters, opponentType: nextValue as 'ALL' | PlayerType })}
          />
        </label>
        <label>
          <span>开始日期</span>
          <input type="date" value={handFilters.dateFrom ?? ''} onChange={(event) => setHandFilters({ ...handFilters, dateFrom: event.target.value })} />
        </label>
        <label>
          <span>结束日期</span>
          <input type="date" value={handFilters.dateTo ?? ''} onChange={(event) => setHandFilters({ ...handFilters, dateTo: event.target.value })} />
        </label>
        <label>
          <span>GTO 评分低于</span>
          <input type="number" value={handFilters.maxScore ?? ''} onChange={(event) => setHandFilters({ ...handFilters, maxScore: event.target.value ? Number(event.target.value) : undefined })} />
        </label>
        <button className="primary-action" type="button" onClick={refreshHandList}>
          查询
        </button>
        <button className="ghost-action" type="button" onClick={resetHandFilters}>
          重置
        </button>
      </div>
      <div className="card-grid">
        {handList.length === 0 ? (
          <div className="empty-state">没有符合筛选条件的手牌。可以重置筛选，或先在复盘工作台保存一手牌。</div>
        ) : handList.map((item) => (
          <article className="data-card" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>
                {gameTypeLabels[item.gameType]} · {tournamentStageLabels[item.stage]} · {item.createdAt.slice(0, 10)}
              </span>
            </div>
            <div className="card-summary">
              <CardDisplay value={item.heroCards} prefix="Hero" />
              <CardDisplay value={item.board} prefix="Board" />
            </div>
            <div className="metric-row">
              <span>GTO {item.score}</span>
              <span>{playerTypeLabels[item.opponentType]}</span>
              <span>{item.analysisDirty ? '需重新分析' : '分析有效'}</span>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => inspectHand(item.id, 'view')}>
                查看详情
              </button>
              <button type="button" onClick={() => inspectHand(item.id, 'edit')}>
                编辑并重新分析
              </button>
              <button type="button" onClick={() => deleteHand(item.id)}>
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
