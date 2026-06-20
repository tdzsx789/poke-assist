import { X } from 'lucide-react'
import {
  rankOptions,
  readCard,
  replaceCardAt,
  splitCards,
  suitImages,
  suitOptions,
  type CardValue,
} from '../../domain/review'
import './Card.css'

export function CardPickerGroup({
  value,
  count,
  label,
  onChange,
  allowEmpty = false,
  optionalCollapsed = false,
}: {
  value: string
  count: number
  label: string
  onChange: (value: string) => void
  allowEmpty?: boolean
  optionalCollapsed?: boolean
}) {
  const cards = splitCards(value)
  const shouldCollapse = optionalCollapsed && allowEmpty && cards.length === 0
  const updateCard = (index: number, field: 'suit' | 'rank', nextValue: string) => {
    const current = readCard(cards[index] ?? '')
    const next = {
      ...current,
      [field]: nextValue,
    }
    const nextCard = next.suit && next.rank ? `${next.suit}${next.rank}` : next.suit ? next.suit : next.rank ? `·${next.rank}` : ''
    onChange(replaceCardAt(value, index, nextCard))
  }

  if (shouldCollapse) {
    return (
      <button
        className="optional-card-add"
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onChange('·')
        }}
      >
        添加{label}
      </button>
    )
  }

  return (
    <div className="card-picker-group">
      {Array.from({ length: count }, (_, index) => {
        const card = readCard(cards[index] ?? '')
        const preview = card.suit && card.rank ? (`${card.suit}${card.rank}` as CardValue) : ''
        return (
          <div className="card-picker" key={index}>
            <span className={preview ? 'card-picker-preview selected' : 'card-picker-preview'}>
              {preview ? <CardDisplay value={preview} /> : <span className="card-picker-empty">未选</span>}
            </span>
            {allowEmpty && (
              <button className="clear-card-button" type="button" aria-label={`清除${label}`} onClick={() => onChange(replaceCardAt(value, index, ''))} disabled={!cards[index]}>
                <X size={12} />
              </button>
            )}
            <div className="suit-button-row" role="radiogroup" aria-label={`${label}第 ${index + 1} 张牌花色`}>
              {suitOptions.map((suit) => (
                <button
                  aria-label={`${label}第 ${index + 1} 张牌${suit}`}
                  aria-pressed={card.suit === suit}
                  className={card.suit === suit ? `suit-button selected ${suit}` : `suit-button ${suit}`}
                  key={suit}
                  title={suit}
                  type="button"
                  onClick={() => updateCard(index, 'suit', card.suit === suit && allowEmpty ? '' : suit)}
                >
                  <img alt="" src={suitImages[suit]} />
                </button>
              ))}
            </div>
            <div className="rank-button-grid" role="radiogroup" aria-label={`${label}第 ${index + 1} 张牌点数`}>
              {rankOptions.map((rank) => (
                <button
                  aria-label={`${label}第 ${index + 1} 张牌${rank}`}
                  aria-pressed={card.rank === rank}
                  className={card.rank === rank ? 'rank-button selected' : 'rank-button'}
                  key={rank}
                  type="button"
                  onClick={() => updateCard(index, 'rank', card.rank === rank && allowEmpty ? '' : rank)}
                >
                  {rank}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CardDisplay({ value, prefix }: { value: string; prefix?: string }) {
  const cards = splitCards(value).filter((item) => item !== '·' && item !== '-')
  if (cards.length === 0) return <span>{prefix ? `${prefix} -` : '-'}</span>

  return (
    <span className="card-display">
      {prefix && <span className="card-prefix">{prefix}</span>}
      {cards.map((card, index) => {
        const parsed = readCard(card)
        if (!parsed.suit || !parsed.rank) {
          return (
            <span className="card-token text" key={`${card}-${index}`}>
              {card}
            </span>
          )
        }
        return (
          <span className={`card-token ${parsed.suit}`} key={`${card}-${index}`} title={card}>
            <img alt={parsed.suit} src={suitImages[parsed.suit]} />
            <strong>{parsed.rank}</strong>
          </span>
        )
      })}
    </span>
  )
}
