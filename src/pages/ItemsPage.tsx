import { useMemo, useState } from 'react'
import { ItemCard } from '../components/items/ItemCard'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PlusIcon } from '../components/ui/icons'
import { yen } from '../lib/format'
import { itemProgress, totalBalance } from '../lib/stats'
import { useMoney } from '../store/useMoney'
import type { WishItem } from '../types'

interface ItemsPageProps {
  onAddItem(): void
  onEditItem(item: WishItem): void
}

type Tab = 'wish' | 'bought'

export function ItemsPage({ onAddItem, onEditItem }: ItemsPageProps) {
  const { data } = useMoney()
  const [tab, setTab] = useState<Tab>('wish')
  const balance = useMemo(() => totalBalance(data.transactions), [data.transactions])

  // あと少しで買えるものを上に出す
  const wish = useMemo(
    () =>
      data.items
        .filter((item) => item.status === 'wish')
        .sort((a, b) => itemProgress(b, balance).ratio - itemProgress(a, balance).ratio),
    [data.items, balance],
  )

  const bought = useMemo(
    () =>
      data.items
        .filter((item) => item.status === 'bought')
        .sort((a, b) => (b.boughtAt ?? '').localeCompare(a.boughtAt ?? '')),
    [data.items],
  )

  const shown = tab === 'wish' ? wish : bought
  const wishTotal = wish.reduce((sum, item) => sum + item.price, 0)
  const buyableNow = wish.filter((item) => item.price > 0 && itemProgress(item, balance).reached)

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="リストの種類" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
        {(
          [
            ['wish', `ほしいもの（${wish.length}）`],
            ['bought', `買ったもの（${bought.length}）`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`min-h-10 rounded-lg text-sm font-bold transition-colors ${
              tab === value ? 'bg-surface-1 text-ink' : 'text-ink-2'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'wish' && wish.length > 0 && (
        <Card>
          <h2 className="text-xs font-bold text-ink-2">いま使えるお金</h2>
          <p className="tabular mt-0.5 text-xl font-bold text-ink">{yen(Math.max(balance, 0))}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {buyableNow.length > 0 ? (
              <span className="font-bold text-success-text">
                {buyableNow.length}件は いま買える！
              </span>
            ) : (
              <>ぜんぶで {yen(wishTotal)} ぶん</>
            )}
          </p>
        </Card>
      )}

      {shown.length > 0 ? (
        <div className="space-y-2">
          {shown.map((item) => (
            <ItemCard key={item.id} item={item} balance={balance} onEdit={onEditItem} />
          ))}
        </div>
      ) : (
        <CardEmpty tab={tab} onAddItem={onAddItem} />
      )}
    </div>
  )
}

function CardEmpty({ tab, onAddItem }: { tab: Tab; onAddItem(): void }) {
  return (
    <Card>
      <CardHeader title={tab === 'wish' ? 'ほしいものリスト' : '買ったもの'} />
      {tab === 'wish' ? (
        <EmptyState
          emoji="✨"
          title="ほしいものを登録しよう"
          description="値段を入れると「あと何円で買えるか」が見えるよ。写真やリンクもつけられます。"
          action={
            <Button onClick={onAddItem}>
              <PlusIcon size={18} />
              追加する
            </Button>
          }
        />
      ) : (
        <EmptyState
          emoji="🛍️"
          title="まだ買ったものがないよ"
          description="ほしいものリストで「買った」を押すと、ここに移動して支出にも記録されます。"
        />
      )}
    </Card>
  )
}
