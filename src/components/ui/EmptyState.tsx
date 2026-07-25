import type { ReactNode } from 'react'

interface EmptyStateProps {
  emoji: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="text-3xl" aria-hidden="true">
        {emoji}
      </span>
      <p className="text-sm font-bold text-ink">{title}</p>
      {description && <p className="max-w-xs text-xs text-ink-2">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
