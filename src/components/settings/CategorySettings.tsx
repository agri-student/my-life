import { useState } from 'react'
import { seriesColor } from '../../lib/categories'
import { useCategories } from '../../hooks/useCategories'
import { useMoney } from '../../store/useMoney'
import { Button } from '../ui/Button'
import { CheckIcon } from '../ui/icons'
import type { Category, CategoryOverride } from '../../types'

/**
 * カテゴリの名前を変える / 選択肢から隠す。
 *
 * 追加・削除ではなく「名前」と「表示・非表示」だけにしている。
 * カテゴリには見分けやすい色が 1 つずつ固定で割り当ててあり、
 * 自由に増やすとその保証（色覚多様性への配慮）が崩れるため。
 * 隠したカテゴリも、過去の記録の表示にはそのまま使われる。
 */
export function CategorySettings() {
  const { data, updateSettings } = useMoney()
  const categories = useCategories()
  const [saved, setSaved] = useState(false)

  const overrides = data.settings.categories ?? {}

  const patch = (id: string, next: CategoryOverride) => {
    const merged = { ...overrides[id], ...next }
    // 既定に戻ったキーは持たない（設定を小さく保つ）
    if (!merged.label) delete merged.label
    if (!merged.hidden) delete merged.hidden

    const all = { ...overrides }
    if (Object.keys(merged).length === 0) delete all[id]
    else all[id] = merged

    updateSettings({ categories: all })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {categories.expense.map((category) => (
          <Row
            key={category.id}
            category={category}
            base={category.id}
            hidden={categories.isHidden(category.id)}
            onRename={(label) => patch(category.id, { label })}
            onToggle={(hidden) => patch(category.id, { hidden })}
          />
        ))}
      </ul>

      <p className="text-xs text-ink-muted">
        隠したカテゴリは入力の選択肢に出なくなります。すでに記録したものはそのまま残り、
        グラフにも出ます。
      </p>

      {Object.keys(overrides).length > 0 && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => updateSettings({ categories: {} })}
        >
          もとの名前・表示に戻す
        </Button>
      )}

      {saved && (
        <p className="flex items-center gap-1 text-xs font-bold text-success-text" role="status">
          <CheckIcon size={14} />
          保存しました
        </p>
      )}
    </div>
  )
}

interface RowProps {
  category: Category
  base: string
  hidden: boolean
  onRename(label: string): void
  onToggle(hidden: boolean): void
}

function Row({ category, hidden, onRename, onToggle }: RowProps) {
  const [label, setLabel] = useState(category.label)

  return (
    <li
      className={`flex items-center gap-2 rounded-xl border border-hairline p-2 ${
        hidden ? 'bg-surface-2 opacity-60' : 'bg-surface-1'
      }`}
    >
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: seriesColor(category.slot) }}
      />
      <span aria-hidden="true" className="shrink-0 text-base">
        {category.emoji}
      </span>

      <input
        value={label}
        maxLength={12}
        aria-label={`${category.label} の名前`}
        onChange={(event) => setLabel(event.target.value)}
        onBlur={() => {
          const next = label.trim()
          if (next !== category.label) onRename(next)
        }}
        className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1.5 text-sm font-bold text-ink"
      />

      <label className="flex shrink-0 items-center gap-1.5 pr-1 text-xs text-ink-2">
        <input
          type="checkbox"
          checked={!hidden}
          onChange={(event) => onToggle(!event.target.checked)}
          aria-label={`${category.label} を使う`}
          className="size-5 accent-[var(--brand)]"
        />
        使う
      </label>
    </li>
  )
}
