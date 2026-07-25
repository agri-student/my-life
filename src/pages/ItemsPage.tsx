import { useMemo, useState } from 'react'
import { ItemCard } from '../components/items/ItemCard'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PlusIcon } from '../components/ui/icons'
import { yen } from '../lib/format'
import { itemProgress } from '../lib/stats'
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

  const wish = useMemo(
    () =>
      data.items
        .filter((item) => item.status === 'wish')
        .sort((a, b) => itemProgress(b).ratio - itemProgress(a).ratio),
    [data.items],
  )

  const bought = useMemo(
    () =>
      data.items
        .filter((item) => item.status === 'bought')
        .sort((a, b) => (b.boughtAt ?? '').localeCompare(a.boughtAt ?? '')),
    [data.items],
  )

  const shown = tab === 'wish' ? wish : bought
  const savedTotal = wish.reduce((sum, item) => sum + item.saved, 0)
  const remainingTotal = wish.reduce((sum, item) => sum + itemProgress(item).remaining, 0)

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
          <h2 className="text-xs font-bold text-ink-2">ほしいもの用に貯めた合計</h2>
          <p className="tabular mt-0.5 text-xl font-bold text-ink">{yen(savedTotal)}</p>
          {remainingTotal > 0 && (
            <p className="mt-1 text-xs text-ink-muted">
              ぜんぶ買うには あと {yen(remainingTotal)}
            </p>
          )}
        </Card>
      )}

      {shown.length > 0 ? (
        <div className="space-y-2">
          {shown.map((item) => (
            <ItemCard key={item.id} item={item} onEdit={onEditItem} />
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
