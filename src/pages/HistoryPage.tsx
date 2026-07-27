import { useMemo, useState } from 'react'
import { MonthSwitcher } from '../components/dashboard/MonthSwitcher'
import { TransactionList } from '../components/transactions/TransactionList'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { TextInput } from '../components/ui/Field'
import { CloseIcon } from '../components/ui/icons'
import { useCategories } from '../hooks/useCategories'
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
  const categories = useCategories()
  const [filter, setFilter] = useState<Filter>('all')
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const rows = useMemo(
    () => transactionsOfMonth(data.transactions, month),
    [data.transactions, month],
  )
  const summary = useMemo(
    () => monthSummary(data.transactions, month, categories.expense),
    [data.transactions, month, categories],
  )

  /*
   * しぼりこみ。キーワードはメモとカテゴリ名の両方を見る
   * （「カフェ」で探したときに、メモに書いていなくても食べもの・カフェが出るように）。
   */
  const shown = useMemo(() => {
    const needle = keyword.trim().toLowerCase()
    return rows.filter((t) => {
      if (filter !== 'all' && t.kind !== filter) return false
      if (categoryId && t.categoryId !== categoryId) return false
      if (!needle) return true
      const label = categories.get(t.categoryId).label.toLowerCase()
      return (t.memo ?? '').toLowerCase().includes(needle) || label.includes(needle)
    })
  }, [rows, filter, categoryId, keyword, categories])

  /** この月に実際に使われているカテゴリだけをチップに出す */
  const usedCategories = useMemo(() => {
    const ids = new Set(rows.map((t) => t.categoryId))
    return [...categories.expense, ...categories.income].filter((c) => ids.has(c.id))
  }, [rows, categories])

  const filtering = keyword.trim() !== '' || categoryId !== null || filter !== 'all'
  const shownTotal = shown.reduce(
    (sum, t) => sum + (t.kind === 'income' ? t.amount : -t.amount),
    0,
  )

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

      <div className="space-y-2">
        <div className="relative">
          <TextInput
            id="history-search"
            type="search"
            value={keyword}
            placeholder="メモやカテゴリで探す"
            aria-label="記録を探す"
            onChange={(event) => setKeyword(event.target.value)}
            className={keyword ? 'pr-11' : undefined}
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              aria-label="検索をやめる"
              className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-2"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

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

        {usedCategories.length > 1 && (
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
            {usedCategories.map((category) => {
              const selected = categoryId === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setCategoryId(selected ? null : category.id)}
                  aria-pressed={selected}
                  className={`min-h-9 shrink-0 rounded-full border px-3 text-xs font-bold whitespace-nowrap transition-colors ${
                    selected
                      ? 'border-brand bg-brand/10 text-ink'
                      : 'border-hairline bg-surface-1 text-ink-2'
                  }`}
                >
                  <span aria-hidden="true">{category.emoji} </span>
                  {category.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {filtering && shown.length > 0 && (
        <p className="tabular text-xs text-ink-2">
          {shown.length}件 ・ 合計{' '}
          <span className={`font-bold ${shownTotal < 0 ? 'text-ink' : 'text-success-text'}`}>
            {signedYen(shownTotal)}
          </span>
        </p>
      )}

      {shown.length > 0 ? (
        <TransactionList transactions={shown} onEdit={onEditTransaction} grouped />
      ) : (
        <Card>
          {filtering ? (
            <EmptyState
              emoji="🔍"
              title="見つかりませんでした"
              description="ことばを変えるか、しぼりこみを外してみてください。"
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setKeyword('')
                    setCategoryId(null)
                    setFilter('all')
                  }}
                >
                  しぼりこみを外す
                </Button>
              }
            />
          ) : (
            <EmptyState
              emoji="🗓️"
              title="この月の記録はまだないよ"
              action={<Button onClick={onAdd}>記録する</Button>}
            />
          )}
        </Card>
      )}
    </div>
  )
}
