import { CheckCircle2 } from 'lucide-react'
import './AnalysisBlock.css'

export function AnalysisBlock({ title, text, highlight = false }: { title: string; text: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'analysis-block highlight' : 'analysis-block'}>
      <CheckCircle2 size={18} />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  )
}
