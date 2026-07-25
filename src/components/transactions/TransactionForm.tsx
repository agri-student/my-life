import { useEffect, useState } from 'react'
import { categoriesOf } from '../../lib/categories'
import { todayKey } from '../../lib/date'
import { useMoney } from '../../store/useMoney'
import { AmountInput, Field, QuickAmounts, TextArea, TextInput } from '../ui/Field'
import { Button } from '../ui/Button'
import type { TransactionKind } from '../../types'

interface TransactionFormProps {
  /** 開いたときに選ばれているタブ */
  initialKind?: TransactionKind
  onDone(): void
}

const QUICK_EXPENSE = [100, 500, 1000]
const QUICK_INCOME = [500, 1000, 5000]

/**
 * 収入・支出の入力フォーム。
 * 「金額 → カテゴリ → 決定」の 3 ステップで終われるように、日付とメモは下に置いて任意にしている。
 */
export function TransactionForm({ initialKind = 'expense', onDone }: TransactionFormProps) {
  const { addTransaction } = useMoney()
  const [kind, setKind] = useState<TransactionKind>(initialKind)
  const [amount, setAmount] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState(categoriesOf(initialKind)[0].id)
  const [date, setDate] = useState(todayKey())
  const [memo, setMemo] = useState('')

  // 収入 / 支出を切り替えたら、そのタブの先頭カテゴリに戻す
  useEffect(() => {
    setCategoryId(categoriesOf(kind)[0].id)
  }, [kind])

  const categories = categoriesOf(kind)
  const canSubmit = amount !== '' && amount > 0

  const submit = () => {
    if (!canSubmit) return
    addTransaction({ kind, amount, categoryId, date, memo: memo.trim() || undefined })
    onDone()
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div
        role="tablist"
        aria-label="記録の種類"
        className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1"
      >
        {(['expense', 'income'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            onClick={() => setKind(value)}
            className={`min-h-10 rounded-lg text-sm font-bold transition-colors ${
              kind === value ? 'bg-surface-1 text-ink' : 'text-ink-2'
            }`}
          >
            {value === 'expense' ? '使った' : 'もらった'}
          </button>
        ))}
      </div>

      <Field label="いくら？">
        {(id) => (
          <div className="space-y-2">
            <AmountInput id={id} value={amount} onChange={setAmount} autoFocus />
            <QuickAmounts
              amounts={kind === 'expense' ? QUICK_EXPENSE : QUICK_INCOME}
              onPick={(value) => setAmount((prev) => (prev === '' ? value : prev + value))}
            />
          </div>
        )}
      </Field>

      <fieldset>
        <legend className="mb-1.5 block text-xs font-bold text-ink-2">なにに？</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((category) => {
            const selected = category.id === categoryId
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategoryId(category.id)}
                className={`flex min-h-12 items-center gap-1.5 rounded-xl border px-2.5 text-left text-xs font-bold transition-colors ${
                  selected
                    ? 'border-brand bg-brand/10 text-ink'
                    : 'border-hairline bg-surface-2 text-ink-2'
                }`}
              >
                <span className="text-base" aria-hidden="true">
                  {category.emoji}
                </span>
                <span className="leading-tight">{category.label}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="いつ？">
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={date}
              max={todayKey()}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>
        <Field label="メモ（なくてもOK）">
          {(id) => (
            <TextArea
              id={id}
              value={memo}
              placeholder="友だちとタピオカ"
              maxLength={60}
              onChange={(event) => setMemo(event.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onDone}>
          やめる
        </Button>
        <Button type="submit" size="lg" className="flex-2" disabled={!canSubmit}>
          記録する
        </Button>
      </div>
    </form>
  )
}
