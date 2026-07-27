import { useMemo } from 'react'
import { CategoryShareChart } from '../components/charts/CategoryShareChart'
import { MonthlyTrendChart } from '../components/charts/MonthlyTrendChart'
import { BalanceHero } from '../components/dashboard/BalanceHero'
import { MonthSwitcher } from '../components/dashboard/MonthSwitcher'
import { ItemCard } from '../components/items/ItemCard'
import { TransactionList } from '../components/transactions/TransactionList'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { daysLeftInMonth, formatMonth } from '../lib/date'
import { yen } from '../lib/format'
import {
  budgetLeft,
  dailyPace,
  itemProgress,
  monthSummary,
  monthlyTotals,
  totalBalance,
  transactionsOfMonth,
} from '../lib/stats'
import { useCategories } from '../hooks/useCategories'
import { useMoney } from '../store/useMoney'
import type { Route } from '../hooks/useHashRoute'
import type { Transaction, WishItem } from '../types'

interface DashboardPageProps {
  month: string
  onMonthChange(month: string): void
  onAdd(): void
  onEditItem(item: WishItem): void
  onEditTransaction(transaction: Transaction): void
  onNavigate(route: Route): void
}

export function DashboardPage({
  month,
  onMonthChange,
  onAdd,
  onEditItem,
  onEditTransaction,
  onNavigate,
}: DashboardPageProps) {
  const { data } = useMoney()
  const { transactions, items, settings } = data

  const categories = useCategories()
  const summary = useMemo(
    () => monthSummary(transactions, month, categories.expense),
    [transactions, month, categories],
  )
  const balance = useMemo(() => totalBalance(transactions), [transactions])
  const recent = useMemo(
    () => transactionsOfMonth(transactions, month).slice(0, 5),
    [transactions, month],
  )
  const trend = useMemo(() => monthlyTotals(transactions, month, 6), [transactions, month])
  const hasTrend = trend.some((row) => row.income > 0 || row.expense > 0)

  // 「あと少しで買える」ものを 2 件だけ前に出す（進み方の多い順）
  const nextTargets = useMemo(
    () =>
      items
        .filter((item) => item.status === 'wish' && item.price > 0)
        .sort((a, b) => itemProgress(b, balance).ratio - itemProgress(a, balance).ratio)
        .slice(0, 2),
    [items, balance],
  )

  const daysLeft = daysLeftInMonth(month)
  const left = budgetLeft(settings.monthlyBudget, summary.expense)

  return (
    <div className="space-y-4">
      <MonthSwitcher month={month} onChange={onMonthChange} />

      <BalanceHero
        balance={balance}
        income={summary.income}
        expense={summary.expense}
        monthlyBudget={settings.monthlyBudget}
        left={left}
        pace={dailyPace(left, daysLeft)}
        daysLeft={daysLeft}
      />

      <Card>
        <CardHeader
          title="なにに使った？"
          hint={`${formatMonth(month)}の支出 ${yen(summary.expense)}`}
        />
        {summary.byCategory.length > 0 ? (
          <CategoryShareChart rows={summary.byCategory} total={summary.expense} />
        ) : (
          <EmptyState
            emoji="🧾"
            title="この月の支出はまだないよ"
            description="使ったお金を記録すると、なにに使ったかがグラフになります。"
            action={<Button onClick={onAdd}>記録してみる</Button>}
          />
        )}
      </Card>

      {hasTrend && (
        <Card>
          <CardHeader title="月ごとの収支" hint="棒をタップするとその月に切りかえられます" />
          <MonthlyTrendChart rows={trend} selectedMonth={month} onSelectMonth={onMonthChange} />
        </Card>
      )}

      {nextTargets.length > 0 && (
        <Card>
          <CardHeader
            title="次に買いたいもの"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('items')}>
                ぜんぶ見る
              </Button>
            }
          />
          <div className="space-y-2">
            {nextTargets.map((item) => (
              <ItemCard key={item.id} item={item} balance={balance} onEdit={onEditItem} />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title="さいきんの記録"
          action={
            recent.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => onNavigate('history')}>
                ぜんぶ見る
              </Button>
            ) : undefined
          }
        />
        {recent.length > 0 ? (
          <TransactionList transactions={recent} onEdit={onEditTransaction} />
        ) : (
          <EmptyState emoji="✏️" title="まだ記録がないよ" />
        )}
      </Card>
    </div>
  )
}
