import { getCategory } from '../../lib/categories'
import { formatDateShort } from '../../lib/date'
import { num, yen } from '../../lib/format'
import { itemProgress } from '../../lib/stats'
import { useMoney } from '../../store/useMoney'
import { Meter } from '../charts/Meter'
import { Button, IconButton } from '../ui/Button'
import { CheckIcon, LinkIcon, PiggyIcon, TrashIcon } from '../ui/icons'
import type { WishItem } from '../../types'

interface ItemCardProps {
  item: WishItem
  onEdit(item: WishItem): void
}

/** 1 回の「貯金する」で足す額 */
const SAVE_STEP = 500

/** ほしいもの / 買ったもの 1 件のカード */
export function ItemCard({ item, onEdit }: ItemCardProps) {
  const { addSaving, markAsBought, removeItem } = useMoney()
  const category = getCategory(item.categoryId)
  const { ratio, remaining, reached } = itemProgress(item)
  const bought = item.status === 'bought'

  return (
    <article className="flex gap-3 rounded-2xl border border-hairline bg-surface-1 p-3">
      {item.imageDataUrl ? (
        <img
          src={item.imageDataUrl}
          alt={item.name}
          className={`size-20 shrink-0 rounded-xl border border-hairline object-cover ${
            bought ? 'opacity-60' : ''
          }`}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl"
        >
          {category.emoji}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-ink">{item.name}</h3>
            <p className="text-xs text-ink-muted">
              {category.label}
              {item.price > 0 && <> ・{yen(item.price)}</>}
            </p>
          </div>
          <IconButton
            label={`${item.name} を消す`}
            className="-mt-1 -mr-1 size-9"
            onClick={() => removeItem(item.id)}
          >
            <TrashIcon size={16} />
          </IconButton>
        </div>

        {bought ? (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-success-text">
            <CheckIcon size={14} />
            買った{item.boughtAt && <>（{formatDateShort(item.boughtAt)}）</>}
          </p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {item.price > 0 && (
              <>
                <Meter
                  ratio={ratio}
                  size="sm"
                  tone={reached ? 'good' : 'brand'}
                  label={`${item.name} の貯金の進み方`}
                />
                <p className="tabular text-xs text-ink-2">
                  <span className="font-bold text-ink">{num(item.saved)}</span> / {num(item.price)}円
                  {reached ? (
                    <span className="ml-1.5 font-bold text-success-text">買える！</span>
                  ) : (
                    <span className="ml-1.5">あと {yen(remaining)}</span>
                  )}
                </p>
              </>
            )}

            {item.memo && <p className="text-xs text-ink-2">{item.memo}</p>}

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addSaving(item.id, SAVE_STEP)}
                aria-label={`${item.name} に ${SAVE_STEP} 円ためる`}
              >
                <PiggyIcon size={16} />+{num(SAVE_STEP)}
              </Button>
              <Button size="sm" onClick={() => markAsBought(item.id)}>
                <CheckIcon size={16} />
                買った
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                編集
              </Button>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-xs font-bold text-brand"
                >
                  <LinkIcon size={16} />
                  ページ
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
