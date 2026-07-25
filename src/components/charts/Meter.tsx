interface MeterProps {
  /** 0〜1 に丸めて表示する */
  ratio: number
  /** スクリーンリーダー用の説明 */
  label: string
  /** 予算オーバーなど、注意を出したいとき */
  tone?: 'brand' | 'good' | 'critical'
  size?: 'sm' | 'md'
}

const TONE_FILL: Record<NonNullable<MeterProps['tone']>, string> = {
  brand: 'bg-brand',
  good: 'bg-good',
  critical: 'bg-critical',
}

/**
 * 「目標に対してどれくらい？」を 1 本で見せるメーター。
 * 1 つの値と上限の比較なので、円グラフではなくトラック付きのバーを使う。
 */
export function Meter({ ratio, label, tone = 'brand', size = 'md' }: MeterProps) {
  const clamped = Math.max(0, Math.min(ratio, 1))
  const percent = Math.round(clamped * 100)

  return (
    <div
      role="meter"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full overflow-hidden rounded-[4px] bg-surface-2 ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}
    >
      <div
        className={`h-full rounded-[4px] transition-[width] duration-300 ${TONE_FILL[tone]}`}
        style={{ width: `${Math.max(clamped * 100, clamped > 0 ? 2 : 0)}%` }}
      />
    </div>
  )
}
