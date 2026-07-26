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
  /** リストの中など、せまい場所に置くとき */
  size?: 'md' | 'sm'
  /** 値引きを入れられるようにする（レシートの取り込みで使う） */
  allowNegative?: boolean
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
  size = 'md',
  allowNegative = false,
}: AmountInputProps) {
  const small = size === 'sm'
  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl border border-hairline bg-surface-2 focus-within:border-brand ${
        small ? 'px-2' : 'px-3'
      }`}
    >
      <input
        id={id}
        type="number"
        inputMode={allowNegative ? 'text' : 'numeric'}
        min={allowNegative ? undefined : 0}
        step={1}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value
          if (raw === '' || raw === '-') return onChange('')
          const parsed = Math.trunc(Number(raw))
          if (!Number.isFinite(parsed)) return onChange('')
          onChange(allowNegative || parsed >= 0 ? parsed : '')
        }}
        className={`w-full bg-transparent text-right font-bold text-ink outline-none placeholder:text-ink-muted ${
          small ? 'py-2 text-base' : 'py-3 text-2xl'
        }`}
      />
      <span className={`font-bold text-ink-2 ${small ? 'text-xs' : 'text-sm'}`}>円</span>
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
