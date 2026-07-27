import { useMemo, useState } from 'react'
import { MonthSwitcher } from '../components/dashboard/MonthSwitcher'
import { TransactionList } from '../components/transactions/TransactionList'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { signedYen, yen } from '../lib/format'
import { monthSummary, transactionsOfMonth } from '../lib/stats'
import { useMoney } from '../store/useMoney'
import type { Transaction, TransactionKind } from '../types'

interface HistoryPageProps {
  month: string
  onMonthChange(month: string): void
  onAdd(): void
  onEditTransaction(transaction: Transaction): void
}

type Filter = 'all' | TransactionKind

export function HistoryPage({
  month,
  onMonthChange,
  onAdd,
  onEditTransaction,
}: HistoryPageProps) {
  const { data } = useMoney()
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(() => transactionsOfMonth(data.transactions, month), [data.transactions, month])
  const summary = useMemo(() => monthSummary(data.transactions, month), [data.transactions, month])
  const shown = filter === 'all' ? rows : rows.filter((t) => t.kind === filter)

  return (
    <div className="space-y-4">
      <MonthSwitcher month={month} onChange={onMonthChange} />

      <Card>
        <CardHeader title="この月のまとめ" />
        <dl className="grid grid-cols-3 gap-2 text-center">
          {(
            [
              ['もらった', yen(summary.income), 'text-success-text'],
              ['使った', yen(summary.expense), 'text-ink'],
              ['のこり', signedYen(summary.net), summary.net < 0 ? 'text-critical' : 'text-ink'],
            ] as const
          ).map(([label, value, tone]) => (
            <div key={label} className="rounded-xl bg-surface-2 px-2 py-2.5">
              <dt className="text-xs text-ink-muted">{label}</dt>
              <dd className={`tabular mt-0.5 text-sm font-bold ${tone}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="flex gap-1.5">
        {(
          [
            ['all', 'ぜんぶ'],
            ['expense', '使った'],
            ['income', 'もらった'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`min-h-9 rounded-full border px-3 text-xs font-bold transition-colors ${
              filter === value
                ? 'border-brand bg-brand/10 text-ink'
                : 'border-hairline bg-surface-1 text-ink-2'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length > 0 ? (
        <TransactionList transactions={shown} onEdit={onEditTransaction} grouped />
      ) : (
        <Card>
          <EmptyState
            emoji="🗓️"
            title="この月の記録はまだないよ"
            action={<Button onClick={onAdd}>記録する</Button>}
          />
        </Card>
      )}
    </div>
  )
}
