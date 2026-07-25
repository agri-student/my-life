import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

/** 情報のかたまり 1 つぶん。境界は hairline 1 本だけ（影は使わない） */
export function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-hairline bg-surface-1 p-4 ${className}`}
    >
      {children}
    </section>
  )
}

interface CardHeaderProps {
  title: string
  hint?: string
  action?: ReactNode
}

export function CardHeader({ title, hint, action }: CardHeaderProps) {
  return (
    <header className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
      </div>
      {action}
    </header>
  )
}
