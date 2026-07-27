import { getCategory } from '../../lib/categories'
import { formatDateLabel } from '../../lib/date'
import { signedYen } from '../../lib/format'
import { ChevronRightIcon } from '../ui/icons'
import type { Transaction } from '../../types'

interface TransactionListProps {
  transactions: Transaction[]
  /**
   * 行をタップしたときに開く編集画面。
   * 消すのは編集画面の中（確認つき）に置いてある。一覧にゴミ箱を並べると、
   * 行をタップしたつもりで消してしまう事故が起きるため。
   */
  onEdit?: (transaction: Transaction) => void
  /** 日付ごとの見出しを出すか */
  grouped?: boolean
}

/** 新しい順に並べた収支のリスト */
export function TransactionList({ transactions, onEdit, grouped = false }: TransactionListProps) {
  const sorted = [...transactions].sort((a, b) =>
    a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
  )

  if (!grouped) {
    return (
      <ul className="divide-y divide-hairline">
        {sorted.map((transaction) => (
          <Row key={transaction.id} transaction={transaction} onEdit={onEdit} showDate />
        ))}
      </ul>
    )
  }

  const groups = new Map<string, Transaction[]>()
  for (const transaction of sorted) {
    const bucket = groups.get(transaction.date) ?? []
    bucket.push(transaction)
    groups.set(transaction.date, bucket)
  }

  return (
    <div className="space-y-4">
      {[...groups].map(([date, rows]) => (
        <div key={date}>
          <h3 className="mb-1 text-xs font-bold text-ink-muted">{formatDateLabel(date)}</h3>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-surface-1 px-3">
            {rows.map((transaction) => (
              <Row key={transaction.id} transaction={transaction} onEdit={onEdit} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Row({
  transaction,
  onEdit,
  showDate = false,
}: {
  transaction: Transaction
  onEdit?: (transaction: Transaction) => void
  /** 日付ごとの見出しがあるときは行に日付を出さない（同じ情報が 2 回出るため） */
  showDate?: boolean
}) {
  const category = getCategory(transaction.categoryId)
  const isIncome = transaction.kind === 'income'
  const title = transaction.memo?.trim() || category.label

  const body = (
    <>
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base"
      >
        {category.emoji}
      </span>

      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-bold text-ink">{title}</span>
        <span className="block truncate text-xs text-ink-muted">
          {category.label}
          {showDate && <>・{formatDateLabel(transaction.date)}</>}
        </span>
      </span>

      <span
        className={`tabular shrink-0 text-sm font-bold ${
          isIncome ? 'text-success-text' : 'text-ink'
        }`}
      >
        {signedYen(isIncome ? transaction.amount : -transaction.amount)}
      </span>
    </>
  )

  if (!onEdit) {
    return <li className="flex items-center gap-3 py-2.5">{body}</li>
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onEdit(transaction)}
        aria-label={`${title} ${signedYen(isIncome ? transaction.amount : -transaction.amount)} を直す`}
        className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-surface-2"
      >
        {body}
        <ChevronRightIcon size={16} className="-mr-1 shrink-0 text-ink-muted" />
      </button>
    </li>
  )
}
