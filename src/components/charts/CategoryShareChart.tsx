import { useState } from 'react'
import { seriesColor } from '../../lib/categories'
import { percent, yen } from '../../lib/format'
import type { CategoryTotal } from '../../types'

interface CategoryShareChartProps {
  rows: CategoryTotal[]
  total: number
}

/** 積み上げバーのセグメント間の隙間（px）。境界線は引かず、地の色のすき間で分ける */
const GAP = 2

/**
 * カテゴリ別の支出「割合」。
 *
 * 形：全体に対する内訳なので横向きの 100% 積み上げバー。円グラフにしていないのは
 * 近い値どうしの大小が読めなくなるため。
 * 色：カテゴリに固定された系列色（金額で並べ替えても色は動かない）。
 * 値：バーの下の表に必ず金額と % を出す（色だけに情報を持たせない・
 *     ライトモードで背景とのコントラストが 3:1 未満の色があるため、表示ラベルが必須）。
 */
export function CategoryShareChart({ rows, total }: CategoryShareChartProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  if (rows.length === 0 || total === 0) return null

  // 表は金額の多い順。バーは定義順（= 色スロット順）のままにして、
  // 隣り合う色の組み合わせが月ごとに変わらないようにしている。
  const ranked = [...rows].sort((a, b) => b.total - a.total)
  const gapShare = (GAP * (rows.length - 1)) / rows.length
  const active = rows.find((row) => row.category.id === activeId)

  return (
    <div>
      <div className="relative">
        <div className="flex h-7 w-full items-stretch overflow-hidden rounded-[4px]" style={{ gap: GAP }}>
          {rows.map((row) => (
            <button
              key={row.category.id}
              type="button"
              style={{
                width: `calc(${row.ratio * 100}% - ${gapShare}px)`,
                minWidth: 4,
                backgroundColor: seriesColor(row.category.slot),
              }}
              className="h-full rounded-[4px] transition-opacity focus-visible:outline-offset-2"
              onMouseEnter={() => setActiveId(row.category.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(row.category.id)}
              onBlur={() => setActiveId(null)}
              onClick={() => setActiveId((prev) => (prev === row.category.id ? null : row.category.id))}
              aria-label={`${row.category.label} ${yen(row.total)}・${percent(row.ratio)}`}
            />
          ))}
        </div>

        {active && (
          <div
            className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-hairline bg-surface-1 px-2.5 py-1.5 text-xs whitespace-nowrap text-ink shadow-sm"
            style={{ left: `${tooltipLeft(rows, active.category.id)}%` }}
          >
            <span aria-hidden="true">{active.category.emoji} </span>
            <span className="font-bold">{active.category.label}</span>
            <span className="ml-1.5 tabular text-ink-2">
              {yen(active.total)}・{percent(active.ratio)}
            </span>
          </div>
        )}
      </div>

      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">カテゴリ別の支出（金額と割合）</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">カテゴリ</th>
            <th scope="col">金額</th>
            <th scope="col">割合</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row) => (
            <tr
              key={row.category.id}
              onMouseEnter={() => setActiveId(row.category.id)}
              onMouseLeave={() => setActiveId(null)}
              className={row.category.id === activeId ? 'bg-surface-2' : undefined}
            >
              <th scope="row" className="py-1.5 pr-2 text-left font-medium text-ink">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: seriesColor(row.category.slot) }}
                  />
                  <span className="truncate">
                    <span aria-hidden="true">{row.category.emoji} </span>
                    {row.category.label}
                  </span>
                </span>
              </th>
              <td className="tabular py-1.5 pr-2 text-right whitespace-nowrap text-ink">
                {yen(row.total)}
              </td>
              <td className="tabular w-12 py-1.5 text-right whitespace-nowrap text-ink-2">
                {percent(row.ratio)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** セグメントの中心位置（%）。端に寄りすぎると吹き出しがはみ出すので少し内側に寄せる */
function tooltipLeft(rows: CategoryTotal[], id: string): number {
  let acc = 0
  for (const row of rows) {
    if (row.category.id === id) {
      const center = (acc + row.ratio / 2) * 100
      return Math.min(Math.max(center, 16), 84)
    }
    acc += row.ratio
  }
  return 50
}
