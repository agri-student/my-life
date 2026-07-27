/**
 * 日付ユーティリティ。
 * 保存する日付は必ずローカルタイムの YYYY-MM-DD（"2026-07-25"）。
 * new Date('2026-07-25') は UTC 解釈で 1 日ずれることがあるので、
 * 文字列 → Date の変換はこのファイルの関数だけを通す。
 */

/** YYYY-MM-DD（ローカル） */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** YYYY-MM（ローカル） */
export function toMonthKey(date: Date): string {
  return toDateKey(date).slice(0, 7)
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function thisMonthKey(): string {
  return toMonthKey(new Date())
}

/** "2026-07-25" -> Date（ローカル 0 時） */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** "2026-07" -> "2026年7月" */
export function formatMonth(monthKey: string): string {
  const [y, m] = monthKey.split('-')
  return `${y}年${Number(m)}月`
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

/** "2026-07-25" -> "7/25(土)" */
export function formatDateShort(dateKey: string): string {
  const d = parseDateKey(dateKey)
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`
}

/** "2026-07-25" -> "今日" / "きのう" / "7/25(土)" */
export function formatDateLabel(dateKey: string): string {
  const today = new Date()
  if (dateKey === toDateKey(today)) return '今日'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (dateKey === toDateKey(yesterday)) return 'きのう'
  return formatDateShort(dateKey)
}

/** monthKey を offset か月ずらす。addMonths("2026-01", -1) === "2025-12" */
export function addMonths(monthKey: string, offset: number): string {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1 + offset, 1)
  return toMonthKey(d)
}

/** その月の日数 */
export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/**
 * その月の「残り日数」（今日を含む）。
 * 過去の月なら 0、未来の月なら月の日数を返す。
 */
export function daysLeftInMonth(monthKey: string): number {
  const now = new Date()
  const current = toMonthKey(now)
  if (monthKey < current) return 0
  if (monthKey > current) return daysInMonth(monthKey)
  return daysInMonth(monthKey) - now.getDate() + 1
}

/**
 * その月に記録するときの初期日付。
 * 今月を見ているなら今日、過去の月を見ているならその月の末日。
 * 表示中の月と違う月の日付が既定になっていると、
 * 入れたはずの記録が画面に出てこなくて混乱するため。
 */
export function defaultDateForMonth(monthKey: string, today = new Date()): string {
  if (monthKey === toMonthKey(today)) return toDateKey(today)
  const [y, m] = monthKey.split('-').map(Number)
  return toDateKey(new Date(y, m - 1, daysInMonth(monthKey)))
}

export function isSameMonth(dateKey: string, monthKey: string): boolean {
  return dateKey.slice(0, 7) === monthKey
}
