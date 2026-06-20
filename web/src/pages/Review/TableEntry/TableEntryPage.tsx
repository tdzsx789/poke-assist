import { Library, Loader2, Plus } from 'lucide-react'
import { useAppContext } from '../../../AppContext'
import { SelectField } from '../../../components/SelectField/SelectField'
import './TableEntryPage.css'

export function TableEntryPage() {
  const {
    busy,
    createNewTableDraft,
    loadSavedTable,
    selectedTableTemplateId,
    setSelectedTableTemplateId,
    tableTemplates,
  } = useAppContext()

  return (
    <section className="table-entry-panel">
      <div className="section-heading">
        <div>
          <h2>选择牌桌入口</h2>
        </div>
      </div>
      <div className="table-entry-grid">
        <article className="entry-card primary-entry">
          <div>
            <span>新牌桌</span>
            <h3>创建新牌桌</h3>
            <p>从空白 6 人桌开始录入玩家、位置、类型和筹码。保存后下次可复用。</p>
          </div>
          <button className="primary-action full" type="button" onClick={createNewTableDraft} disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
            创建新牌桌
          </button>
        </article>
        <article className="entry-card">
          <div>
            <span>已保存</span>
            <h3>加载已保存牌桌</h3>
            <p>选择常用牌桌模板，直接带入玩家列表和座位信息，再录入本手牌。</p>
          </div>
          <label>
            <span>选择牌桌模板</span>
            <SelectField
              ariaLabel="选择牌桌模板"
              disabled={busy || tableTemplates.length === 0}
              options={tableTemplates.map((template) => ({
                value: template.id,
                label: `${template.name}（${template.tableSize}人桌）`,
              }))}
              value={selectedTableTemplateId}
              onChange={setSelectedTableTemplateId}
            />
          </label>
          <button className="ghost-action full" type="button" onClick={() => loadSavedTable(selectedTableTemplateId || (tableTemplates[0]?.id ?? ''))} disabled={busy || tableTemplates.length === 0}>
            <Library size={18} />
            加载已保存牌桌
          </button>
        </article>
      </div>
    </section>
  )
}
