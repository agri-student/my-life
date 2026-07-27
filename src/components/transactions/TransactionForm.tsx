import { useEffect, useRef, useState } from 'react'
import { categoriesOf } from '../../lib/categories'
import { todayKey } from '../../lib/date'
import { useMoney } from '../../store/useMoney'
import { AmountInput, Field, QuickAmounts, TextArea, TextInput } from '../ui/Field'
import { Button } from '../ui/Button'
import { CameraIcon, TrashIcon } from '../ui/icons'
import type { Transaction, TransactionKind } from '../../types'

interface TransactionFormProps {
  /** 開いたときに選ばれているタブ（新規のときだけ効く） */
  initialKind?: TransactionKind
  /** 渡すと編集モードになる */
  transaction?: Transaction
  onDone(): void
  /** レシートの取り込み画面へ切り替える（新規のときだけ出す） */
  onOpenReceipt?(): void
}

const QUICK_EXPENSE = [100, 500, 1000]
const QUICK_INCOME = [500, 1000, 5000]

/**
 * 収入・支出の入力フォーム。
 * 「金額 → カテゴリ → 決定」の 3 ステップで終われるように、日付とメモは下に置いて任意にしている。
 */
export function TransactionForm({
  initialKind = 'expense',
  transaction,
  onDone,
  onOpenReceipt,
}: TransactionFormProps) {
  const { addTransaction, updateTransaction, removeTransaction } = useMoney()
  const editing = transaction !== undefined

  const [kind, setKind] = useState<TransactionKind>(transaction?.kind ?? initialKind)
  const [amount, setAmount] = useState<number | ''>(transaction?.amount ?? '')
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? categoriesOf(initialKind)[0].id,
  )
  const [date, setDate] = useState(transaction?.date ?? todayKey())
  const [memo, setMemo] = useState(transaction?.memo ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const confirmRef = useRef<HTMLDivElement>(null)

  // 確認は画面の下に出るので、押したら見える位置まで送る
  useEffect(() => {
    if (confirmingDelete) confirmRef.current?.scrollIntoView({ block: 'nearest' })
  }, [confirmingDelete])

  /*
   * 収入 / 支出を切り替えたら、そのタブの先頭カテゴリに移す。
   * useEffect でやるとマウント時にも動いて、編集で開いたときに
   * もとのカテゴリを消してしまうので、切り替えた瞬間だけ動かす。
   */
  const changeKind = (next: TransactionKind) => {
    if (next === kind) return
    setKind(next)
    setCategoryId(categoriesOf(next)[0].id)
  }

  const categories = categoriesOf(kind)
  const canSubmit = amount !== '' && amount > 0

  const submit = () => {
    if (!canSubmit) return
    const payload = { kind, amount, categoryId, date, memo: memo.trim() || undefined }
    if (transaction) updateTransaction(transaction.id, payload)
    else addTransaction(payload)
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
            onClick={() => changeKind(value)}
            className={`min-h-10 rounded-lg text-sm font-bold transition-colors ${
              kind === value ? 'bg-surface-1 text-ink' : 'text-ink-2'
            }`}
          >
            {value === 'expense' ? '使った' : 'もらった'}
          </button>
        ))}
      </div>

      {!editing && kind === 'expense' && onOpenReceipt && (
        <button
          type="button"
          onClick={onOpenReceipt}
          className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-dashed border-line px-3 text-sm font-bold text-ink-2"
        >
          <CameraIcon size={18} />
          レシートから読みこむ
        </button>
      )}

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
          {editing ? '保存する' : '記録する'}
        </Button>
      </div>

      {editing && (
        <div className="border-t border-hairline pt-3">
          {confirmingDelete ? (
            <div
              ref={confirmRef}
              className="space-y-2 rounded-xl border border-critical/40 bg-critical/10 p-3"
            >
              <p className="text-xs font-bold text-ink">この記録を消しますか？もとに戻せません。</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmingDelete(false)}
                >
                  消さない
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    removeTransaction(transaction.id)
                    onDone()
                  }}
                >
                  消す
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="danger"
              className="w-full"
              onClick={() => setConfirmingDelete(true)}
            >
              <TrashIcon size={16} />
              この記録を消す
            </Button>
          )}
        </div>
      )}
    </form>
  )
}
