import { getCategory } from '../../lib/categories'
import { formatDateLabel } from '../../lib/date'
import { signedYen } from '../../lib/format'
import { TrashIcon } from '../ui/icons'
import { IconButton } from '../ui/Button'
import type { Transaction } from '../../types'

interface TransactionListProps {
  transactions: Transaction[]
  /** 消せるようにするか（履歴画面だけ true） */
  onDelete?: (id: string) => void
  /** 日付ごとの見出しを出すか */
  grouped?: boolean
}

/** 新しい順に並べた収支のリスト */
export function TransactionList({ transactions, onDelete, grouped = false }: TransactionListProps) {
  const sorted = [...transactions].sort((a, b) =>
    a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
  )

  if (!grouped) {
    return (
      <ul className="divide-y divide-hairline">
        {sorted.map((transaction) => (
          <Row key={transaction.id} transaction={transaction} onDelete={onDelete} showDate />
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
              <Row key={transaction.id} transaction={transaction} onDelete={onDelete} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Row({
  transaction,
  onDelete,
  showDate = false,
}: {
  transaction: Transaction
  onDelete?: (id: string) => void
  /** 日付ごとの見出しがあるときは行に日付を出さない（同じ情報が 2 回出るため） */
  showDate?: boolean
}) {
  const category = getCategory(transaction.categoryId)
  const isIncome = transaction.kind === 'income'
  const amount = isIncome ? transaction.amount : -transaction.amount

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base"
      >
        {category.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">
          {transaction.memo?.trim() || category.label}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {category.label}
          {showDate && <>・{formatDateLabel(transaction.date)}</>}
        </p>
      </div>

      <span
        className={`tabular shrink-0 text-sm font-bold ${
          isIncome ? 'text-success-text' : 'text-ink'
        }`}
      >
        {signedYen(amount)}
      </span>

      {onDelete && (
        <IconButton
          label={`${transaction.memo?.trim() || category.label} を消す`}
          className="-mr-2 size-9"
          onClick={() => onDelete(transaction.id)}
        >
          <TrashIcon size={16} />
        </IconButton>
      )}
    </li>
  )
}
