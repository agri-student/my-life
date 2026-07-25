import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:opacity-90',
  secondary: 'bg-surface-2 text-ink border border-hairline hover:border-line',
  ghost: 'text-ink-2 hover:bg-surface-2',
  danger: 'text-critical border border-critical/40 hover:bg-critical/10',
}

// タップ領域は最低 44px を確保する（スマホで押しやすいように）
const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-13 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** アイコンだけのボタンには必ずラベルを付ける */
  label: string
  children: ReactNode
}

export function IconButton({ label, className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex size-11 items-center justify-center rounded-xl text-ink-2 transition-colors hover:bg-surface-2 disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
