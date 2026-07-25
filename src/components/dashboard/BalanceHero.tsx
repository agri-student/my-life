import { num, yen } from '../../lib/format'
import { Meter } from '../charts/Meter'
import { AlertIcon } from '../ui/icons'

interface BalanceHeroProps {
  /** 今もっているお金（すべての記録の合計） */
  balance: number
  /** 今月の支出 */
  expense: number
  /** 今月の収入 */
  income: number
  /** 今月の予算（0 なら未設定） */
  monthlyBudget: number
  /** 今月あと何円使えるか（予算未設定なら null） */
  left: number | null
  /** 1 日あたりのめやす（予算未設定・月末なら null） */
  pace: number | null
  daysLeft: number
}

/**
 * ダッシュボードの主役。
 * 「今いくら持ってる？」は 1 つの数字なのでグラフにせず、大きな数字（ヒーロー数値）で出す。
 */
export function BalanceHero({
  balance,
  expense,
  income,
  monthlyBudget,
  left,
  pace,
  daysLeft,
}: BalanceHeroProps) {
  const over = left !== null && left < 0
  const usedRatio = monthlyBudget > 0 ? expense / monthlyBudget : 0

  return (
    <section className="rounded-2xl border border-hairline bg-surface-1 p-4">
      <h2 className="text-xs font-bold text-ink-2">いま使えるお金</h2>

      {/* ヒーロー数値。大きい数字に tabular-nums は使わない（間延びして見えるため） */}
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-4xl leading-none font-bold text-ink">{num(balance)}</span>
        <span className="text-base font-bold text-ink-2">円</span>
      </p>

      <dl className="mt-3 flex gap-4 text-xs">
        <div className="flex gap-1.5">
          <dt className="text-ink-muted">今月もらった</dt>
          <dd className="tabular font-bold text-success-text">{yen(income)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-ink-muted">今月使った</dt>
          <dd className="tabular font-bold text-ink">{yen(expense)}</dd>
        </div>
      </dl>

      {monthlyBudget > 0 && (
        <div className="mt-4 space-y-2 border-t border-hairline pt-3">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-bold text-ink-2">今月の予算 {yen(monthlyBudget)}</span>
            <span className="tabular text-ink-muted">{Math.round(usedRatio * 100)}% つかった</span>
          </div>

          <Meter
            ratio={usedRatio}
            tone={over ? 'critical' : 'brand'}
            label={`今月の予算のつかい方（${yen(expense)} / ${yen(monthlyBudget)}）`}
          />

          {over ? (
            <p className="flex items-center gap-1.5 text-xs font-bold text-critical">
              <AlertIcon size={16} />
              予算を {yen(Math.abs(left))} オーバー
            </p>
          ) : (
            <p className="text-xs text-ink-2">
              あと <span className="tabular font-bold text-ink">{yen(left ?? 0)}</span> つかえる
              {pace !== null && daysLeft > 0 && (
                <span className="text-ink-muted">
                  {' '}
                  ／ 残り{daysLeft}日なら 1日 {yen(pace)}
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
