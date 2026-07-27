import { useState } from 'react'
import { formatMonth } from '../../lib/date'
import { num, signedYen, yen } from '../../lib/format'
import type { MonthTotal } from '../../lib/stats'

interface MonthlyTrendChartProps {
  rows: MonthTotal[]
  /** いま選ばれている月（YYYY-MM）。棒をタップするとこの月が変わる */
  selectedMonth: string
  onSelectMonth(month: string): void
}

/** プロット部分の高さ（px）。下の月ラベルはこの外に置く（軸が切れないように） */
const PLOT_HEIGHT = 104

/**
 * 月ごとの「もらった / 使った」の推移。
 *
 * 形：月ごとの合計という区切られた値なので、線ではなく並べた棒（グループ縦棒）。
 * 色：2 系列を見分けるための系列色（もらった = 青 / 使った = オレンジ）。
 *     収支の green / red は「良い・悪い」を表すステータス色なので、系列には使わない。
 * 値：選んだ月の金額は下の 1 行に必ず出す。棒そのものも読み上げ用のラベルを持っていて
 *     （「2026年6月：もらった 5,000円、使った 3,000円」）、色や形だけに情報を寄せていない。
 */
export function MonthlyTrendChart({
  rows,
  selectedMonth,
  onSelectMonth,
}: MonthlyTrendChartProps) {
  // ホバー中の月。無ければ選択中の月を読み上げ行に出す
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null)
  const focusMonth = hoveredMonth ?? selectedMonth
  const focus = rows.find((row) => row.month === focusMonth)

  const max = Math.max(...rows.map((row) => Math.max(row.income, row.expense)), 1)

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-[var(--series-1)]" />
          <span className="text-ink-2">もらった</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-[var(--series-2)]" />
          <span className="text-ink-2">使った</span>
        </span>
      </figcaption>

      {/* 目盛りは上端の 1 本だけ。ラベルは線の上に置く（棒と重ならないように） */}
      <p className="tabular mb-0.5 text-right text-[10px] leading-none text-ink-muted">
        {num(max)}
      </p>

      <div className="relative" style={{ height: PLOT_HEIGHT }}>
        <div className="absolute inset-x-0 top-0 border-t border-grid" />

        <div className="flex h-full items-end gap-1.5">
          {rows.map((row) => {
            const selected = row.month === selectedMonth
            // 選択中か、いま触っている月をはっきり見せる
            const active = selected || row.month === hoveredMonth
            return (
              <button
                key={row.month}
                type="button"
                onClick={() => onSelectMonth(row.month)}
                onMouseEnter={() => setHoveredMonth(row.month)}
                onMouseLeave={() => setHoveredMonth(null)}
                onFocus={() => setHoveredMonth(row.month)}
                onBlur={() => setHoveredMonth(null)}
                aria-pressed={selected}
                aria-label={`${formatMonth(row.month)}：もらった ${yen(row.income)}、使った ${yen(row.expense)}`}
                className="flex h-full flex-1 items-end justify-center gap-[2px] rounded-t-[4px]"
              >
                <Bar value={row.income} max={max} color="var(--series-1)" dim={!active} />
                <Bar value={row.expense} max={max} color="var(--series-2)" dim={!active} />
              </button>
            )
          })}
        </div>
      </div>

      {/* 月ラベルはプロットの外。選択中の月だけ濃くする（色ではなく太さで示す） */}
      <div className="flex gap-1.5 border-t border-line pt-1.5">
        {rows.map((row) => (
          <p
            key={row.month}
            className={`flex-1 text-center text-[11px] ${
              row.month === selectedMonth ? 'font-bold text-ink' : 'text-ink-muted'
            }`}
          >
            {Number(row.month.slice(5))}月
          </p>
        ))}
      </div>

      {focus && (
        <div className="mt-2 text-xs" aria-live="polite">
          <p className="flex items-baseline justify-between gap-2">
            <span className="font-bold text-ink">{formatMonth(focus.month)}</span>
            <span
              className={`tabular font-bold ${
                focus.net < 0 ? 'text-critical' : 'text-success-text'
              }`}
            >
              {signedYen(focus.net)}
            </span>
          </p>
          <p className="tabular mt-0.5 text-ink-2">
            もらった {yen(focus.income)}・使った {yen(focus.expense)}
          </p>
        </div>
      )}

    </figure>
  )
}

interface BarProps {
  value: number
  max: number
  color: string
  /** 選択中の月以外は少し引っ込める（色は変えない） */
  dim: boolean
}

function Bar({ value, max, color, dim }: BarProps) {
  if (value <= 0) return <span className="w-2.5" />
  return (
    <span
      aria-hidden="true"
      className={`w-2.5 rounded-t-[4px] transition-opacity ${dim ? 'opacity-70' : ''}`}
      style={{
        height: `${Math.max((value / max) * 100, 2)}%`,
        backgroundColor: color,
      }}
    />
  )
}
