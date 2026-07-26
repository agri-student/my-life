import { useState, type ReactNode } from 'react'
import { EXPENSE_CATEGORIES, getCategory } from '../../lib/categories'
import { todayKey } from '../../lib/date'
import { num, yen } from '../../lib/format'
import { RECEIPT_PROMPT, parseReceiptText, type ParsedReceipt } from '../../lib/receipt'
import { useMoney } from '../../store/useMoney'
import { Button, IconButton } from '../ui/Button'
import { AmountInput, Field, TextArea, TextInput } from '../ui/Field'
import { AlertIcon, CheckIcon, TrashIcon } from '../ui/icons'

interface ReceiptImportSheetProps {
  onDone(): void
}

/** 確認画面で 1 行ぶん編集できるようにした状態 */
interface Row {
  key: string
  include: boolean
  name: string
  price: number | ''
  categoryId: string
}

/** 1 件にまとめるか、品目ごとに記録するか */
type Mode = 'single' | 'items'

/**
 * レシートの取り込み。
 *
 * ①写真を撮る → ②手元の AI アプリに写真とプロンプトを渡す → ③返事を貼る、の 3 手順。
 * アプリから API を呼ばないので費用は 0 円で、キーを持たせる必要もない。
 * AI の返事は形がぶれるので、貼ったあとは必ずこの確認画面を通してから記録する。
 */
export function ReceiptImportSheet({ onDone }: ReceiptImportSheetProps) {
  const { addTransaction, addTransactions } = useMoney()
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null)

  const [date, setDate] = useState(todayKey())
  const [shop, setShop] = useState('')
  const [mode, setMode] = useState<Mode>('single')
  const [rows, setRows] = useState<Row[]>([])

  const checked = rows.filter((row) => row.include && row.price !== '')
  // 「1件にまとめる」の合計。値引き（マイナス）もそのまま足すので実際の支払額になる
  const sum = checked.reduce((acc, row) => acc + (row.price === '' ? 0 : row.price), 0)
  /*
   * 「品目ごと」に記録するのはプラスの行だけ。
   * 支出は正の数で持つ決まりなので、値引き行を絶対値で足すと
   * 逆に支出が増えてしまう。値引きは「1件にまとめる」側で差し引く。
   */
  const itemRows = checked.filter((row) => row.price !== '' && row.price > 0)
  const discounts = checked.filter((row) => row.price !== '' && row.price < 0)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(RECEIPT_PROMPT)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // https でない・許可されていない等でコピーできないことがある。
      // その場合は下の「文章を見る」から手で選んでもらう。
      setCopied(false)
    }
  }

  const read = () => {
    const result = parseReceiptText(pasted)
    setParsed(result)
    setDate(result.date ?? todayKey())
    setShop(result.shop ?? '')
    setRows(
      result.items.map((item, index) => ({
        key: `${index}-${item.name}`,
        include: true,
        name: item.name,
        price: item.price,
        categoryId: item.categoryId,
      })),
    )
    // 品目が読めなかったときは、合計だけでも 1 件として記録できるようにする
    setMode(result.items.length > 1 ? 'single' : 'items')
    setStep('confirm')
  }

  const patchRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const save = () => {
    if (mode === 'items') {
      addTransactions(
        itemRows.map((row) => ({
          kind: 'expense' as const,
          amount: row.price === '' ? 0 : row.price,
          categoryId: row.categoryId,
          date,
          memo: [shop.trim(), row.name.trim()].filter(Boolean).join(' / ') || undefined,
        })),
      )
    } else {
      addTransaction({
        kind: 'expense',
        amount: totalForSingle(parsed, sum),
        categoryId: mainCategoryId(itemRows),
        date,
        memo: shop.trim() || 'レシート',
      })
    }
    onDone()
  }

  if (step === 'input') {
    return (
      <div className="space-y-4">
        <ol className="space-y-3">
          <Step number={1} title="レシートを写真に撮る">
            スマホのカメラでレシート全体が入るように撮ります。
          </Step>

          <Step number={2} title="AI アプリに写真とこの文章を送る">
            <p className="mb-2">
              ChatGPT や Claude などのアプリに、撮った写真といっしょに下の文章を送ってください。
            </p>
            <Button variant="secondary" onClick={() => void copyPrompt()} className="w-full">
              {copied ? (
                <>
                  <CheckIcon size={16} />
                  コピーしました
                </>
              ) : (
                '文章をコピーする'
              )}
            </Button>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-bold text-ink-2">
                文章を見る（手でコピーしたいとき）
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-surface-2 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-ink">
                {RECEIPT_PROMPT}
              </pre>
            </details>
          </Step>

          <Step number={3} title="返ってきた内容をここに貼る">
            <TextArea
              id="receipt-paste"
              rows={6}
              value={pasted}
              placeholder={'{\n  "date": "2026-07-25",\n  "items": [...]\n}'}
              onChange={(event) => setPasted(event.target.value)}
              className="font-mono text-xs"
            />
          </Step>
        </ol>

        <div className="flex gap-2">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onDone}>
            やめる
          </Button>
          <Button size="lg" className="flex-2" disabled={!pasted.trim()} onClick={read}>
            読みこむ
          </Button>
        </div>

        <p className="text-xs text-ink-muted">
          写真そのものはこのアプリから外に出ません。AI に送るかどうかは毎回あなたが決められます。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {parsed?.warnings.map((warning) => (
        <p
          key={warning}
          className="flex items-start gap-1.5 rounded-xl border border-warning/40 bg-warning/10 p-2.5 text-xs text-ink"
        >
          <AlertIcon size={16} />
          <span>{warning}</span>
        </p>
      ))}

      <div className="grid grid-cols-2 gap-3">
        <Field label="日付">
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>
        <Field label="お店の名前">
          {(id) => (
            <TextInput
              id={id}
              value={shop}
              placeholder="コンビニ"
              onChange={(event) => setShop(event.target.value)}
            />
          )}
        </Field>
      </div>

      <div role="tablist" aria-label="記録のしかた" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
        {(
          [
            ['single', '1件にまとめる'],
            ['items', '品目ごとに記録'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={`min-h-10 rounded-lg text-sm font-bold transition-colors ${
              mode === value ? 'bg-surface-1 text-ink' : 'text-ink-2'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.key}
              className={`rounded-xl border p-2.5 ${
                row.include ? 'border-hairline bg-surface-1' : 'border-hairline bg-surface-2 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.include}
                  onChange={(event) => patchRow(row.key, { include: event.target.checked })}
                  aria-label={`${row.name} を記録にふくめる`}
                  className="size-5 shrink-0 accent-[var(--brand)]"
                />
                <input
                  value={row.name}
                  onChange={(event) => patchRow(row.key, { name: event.target.value })}
                  aria-label="品名"
                  className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-sm font-bold text-ink"
                />
                <IconButton
                  label={`${row.name} を消す`}
                  className="size-9"
                  onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                >
                  <TrashIcon size={16} />
                </IconButton>
              </div>

              <div className="mt-1.5 flex items-center gap-2 pl-7">
                <div className="w-24 shrink-0">
                  <AmountInput
                    id={`price-${row.key}`}
                    value={row.price}
                    size="sm"
                    allowNegative
                    onChange={(value) => patchRow(row.key, { price: value })}
                  />
                </div>
                <select
                  value={row.categoryId}
                  onChange={(event) => patchRow(row.key, { categoryId: event.target.value })}
                  aria-label="カテゴリ"
                  disabled={mode === 'single'}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-hairline bg-surface-2 px-2 text-sm text-ink disabled:opacity-50"
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.emoji} {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-hairline bg-surface-2 p-3 text-xs text-ink-2">
          品目は読み取れませんでした。下の金額を直せば 1 件として記録できます。
        </div>
      )}

      {mode === 'single' ? (
        <div className="space-y-3 rounded-xl border border-hairline bg-surface-2 p-3">
          <Field label="記録する金額（1件にまとめる）">
            {(id) => (
              <AmountInput
                id={id}
                value={totalForSingle(parsed, sum)}
                onChange={(value) =>
                  setParsed((prev) => ({
                    date: prev?.date,
                    shop: prev?.shop,
                    items: prev?.items ?? [],
                    warnings: prev?.warnings ?? [],
                    total: value === '' ? 0 : value,
                  }))
                }
              />
            )}
          </Field>
          <p className="text-xs text-ink-2">
            カテゴリは
            <span className="font-bold text-ink">
              {' '}
              {getCategory(mainCategoryId(itemRows)).emoji}{' '}
              {getCategory(mainCategoryId(itemRows)).label}{' '}
            </span>
            （金額がいちばん大きい品目のカテゴリ）で記録します。
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="tabular text-sm text-ink-2">
            記録する: <span className="font-bold text-ink">{itemRows.length}件</span> ・ 合計{' '}
            <span className="font-bold text-ink">{yen(itemRows.reduce((acc, row) => acc + (row.price === '' ? 0 : row.price), 0))}</span>
          </p>
          {discounts.length > 0 && (
            <p className="flex items-start gap-1.5 text-xs text-ink-2">
              <AlertIcon size={14} />
              <span>
                値引き（{discounts.map((row) => row.name).join('・')}）は品目ごとには記録できません。
                差し引いた金額で残したいときは「1件にまとめる」を選んでください。
              </span>
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep('input')}>
          もどる
        </Button>
        <Button
          size="lg"
          className="flex-2"
          disabled={mode === 'items' ? itemRows.length === 0 : totalForSingle(parsed, sum) <= 0}
          onClick={save}
        >
          {mode === 'items' ? `${itemRows.length}件を記録する` : `${num(totalForSingle(parsed, sum))}円を記録する`}
        </Button>
      </div>
    </div>
  )
}

/** まとめて 1 件にするときの金額。レシートの合計があればそれを優先する */
function totalForSingle(parsed: ParsedReceipt | null, sum: number): number {
  return parsed?.total !== undefined && parsed.total > 0 ? parsed.total : sum
}

/** いちばん金額の大きい品目のカテゴリ。品目がなければ その他 */
function mainCategoryId(rows: Row[]): string {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const price = Math.abs(row.price === '' ? 0 : row.price)
    totals.set(row.categoryId, (totals.get(row.categoryId) ?? 0) + price)
  }
  const top = [...totals].sort((a, b) => b[1] - a[1])[0]
  return top?.[0] ?? 'other'
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: ReactNode
}) {
  return (
    <li className="rounded-xl border border-hairline p-3">
      <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-ink">
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-brand-ink"
        >
          {number}
        </span>
        {title}
      </p>
      <div className="pl-8 text-xs leading-relaxed text-ink-2">{children}</div>
    </li>
  )
}
