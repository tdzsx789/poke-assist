import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SelectOption } from '../../domain/review'
import './SelectField.css'

export function SelectField<Value extends string | number>({
  ariaLabel,
  disabled = false,
  options,
  value,
  onChange,
}: {
  ariaLabel: string
  disabled?: boolean
  options: SelectOption<Value>[]
  value: Value
  onChange: (value: Value) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()
  const selected = options.find((item) => item.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return
      const target = event.target
      if (target instanceof Node && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className={`select-field${open ? ' open' : ''}${disabled ? ' disabled' : ''}`} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={disabled ? false : open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="select-field-trigger"
        disabled={disabled}
        type="button"
        onClick={() => {
          if (disabled) return
          setOpen((current) => !current)
        }}
      >
        <span>{selected?.label ?? ''}</span>
        <ChevronDown size={16} />
      </button>
      {open && !disabled && (
        <div className="select-field-dropdown" role="listbox" id={listboxId} aria-label={ariaLabel}>
          {options.map((item) => {
            const isSelected = item.value === value
            return (
              <button
                aria-selected={isSelected}
                className={`select-field-option${isSelected ? ' selected' : ''}`}
                disabled={item.disabled}
                key={String(item.value)}
                role="option"
                type="button"
                onClick={() => {
                  if (item.disabled) return
                  onChange(item.value)
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
