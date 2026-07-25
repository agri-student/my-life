import { addMonths, formatMonth, thisMonthKey } from '../../lib/date'
import { IconButton } from '../ui/Button'
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons'

interface MonthSwitcherProps {
  month: string
  onChange(month: string): void
}

/**
 * 表示する月を切り替える。
 * この 1 か所でページ全体（残高カードもグラフも履歴も）が同じ月に切り替わる。
 */
export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  const current = thisMonthKey()

  return (
    <div className="flex items-center justify-between gap-1">
      <IconButton label="前の月" onClick={() => onChange(addMonths(month, -1))}>
        <ChevronLeftIcon />
      </IconButton>

      <p className="text-sm font-bold text-ink">
        {formatMonth(month)}
        {month === current && <span className="ml-1 text-xs text-ink-muted">（今月）</span>}
      </p>

      <IconButton
        label="次の月"
        disabled={month >= current}
        onClick={() => onChange(addMonths(month, 1))}
      >
        <ChevronRightIcon />
      </IconButton>
    </div>
  )
}
