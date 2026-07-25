import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'

const CONTROL =
  'w-full rounded-xl border border-hairline bg-surface-2 px-3 py-3 text-base text-ink placeholder:text-ink-muted focus:border-brand'

interface FieldProps {
  label: string
  hint?: string
  children: (id: string) => ReactNode
}

/** ラベルと入力を id で結びつけるだけの薄いラッパー */
export function Field({ label, hint, children }: FieldProps) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-ink-2">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
}

export function TextInput({ id, className = '', ...props }: TextInputProps) {
  return <input id={id} className={`${CONTROL} ${className}`} {...props} />
}

export function TextArea({
  id,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string }) {
  return <textarea id={id} rows={2} className={`${CONTROL} resize-none ${className}`} {...props} />
}

interface AmountInputProps {
  id: string
  value: number | ''
  onChange(value: number | ''): void
  autoFocus?: boolean
  placeholder?: string
}

/**
 * 金額入力。
 * inputMode="numeric" でスマホのテンキーを出し、円マークは装飾として横に置く。
 */
export function AmountInput({
  id,
  value,
  onChange,
  autoFocus,
  placeholder = '0',
}: AmountInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-hairline bg-surface-2 px-3 focus-within:border-brand">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value
          if (raw === '') return onChange('')
          const parsed = Math.floor(Number(raw))
          onChange(Number.isFinite(parsed) && parsed >= 0 ? parsed : '')
        }}
        className="w-full bg-transparent py-3 text-right text-2xl font-bold text-ink outline-none placeholder:text-ink-muted"
      />
      <span className="text-sm font-bold text-ink-2">円</span>
    </div>
  )
}

interface QuickAmountsProps {
  amounts: number[]
  onPick(amount: number): void
}

/** よく使う金額をワンタップで足せるチップ列 */
export function QuickAmounts({ amounts, onPick }: QuickAmountsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {amounts.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => onPick(amount)}
          className="min-h-9 rounded-full border border-hairline bg-surface-1 px-3 text-xs font-bold text-ink-2 hover:border-line"
        >
          +{amount.toLocaleString('ja-JP')}
        </button>
      ))}
    </div>
  )
}
