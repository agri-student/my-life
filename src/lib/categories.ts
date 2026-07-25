import type { Category, SeriesSlot } from '../types'

/**
 * カテゴリ定義。
 *
 * slot は「そのカテゴリの色」を固定するための番号で、グラフ側は必ずここを見る。
 * 金額の大小で色を割り当てると、月が変わるたびに色が入れ替わって読めなくなるため。
 */
export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', label: '食べもの・カフェ', emoji: '🍰', kind: 'expense', slot: 1 },
  { id: 'book', label: '漫画・本', emoji: '📚', kind: 'expense', slot: 2 },
  { id: 'game', label: 'ゲーム・アプリ', emoji: '🎮', kind: 'expense', slot: 3 },
  { id: 'transport', label: '交通費', emoji: '🚃', kind: 'expense', slot: 4 },
  { id: 'fashion', label: '服・コスメ', emoji: '👕', kind: 'expense', slot: 5 },
  { id: 'oshi', label: '推し活・グッズ', emoji: '🎤', kind: 'expense', slot: 6 },
  { id: 'study', label: '文房具・勉強', emoji: '✏️', kind: 'expense', slot: 7 },
  { id: 'other', label: 'その他', emoji: '🧩', kind: 'expense', slot: 'other' },
]

export const INCOME_CATEGORIES: Category[] = [
  { id: 'allowance', label: 'おこづかい', emoji: '💰', kind: 'income' },
  { id: 'parttime', label: 'バイト代', emoji: '🧑‍🍳', kind: 'income' },
  { id: 'gift', label: 'お年玉・プレゼント', emoji: '🎁', kind: 'income' },
  { id: 'income-other', label: 'その他', emoji: '🧩', kind: 'income' },
]

export const ALL_CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

const BY_ID = new Map(ALL_CATEGORIES.map((c) => [c.id, c]))

/** 未知の id が来ても画面を壊さないためのフォールバック付き取得 */
export function getCategory(id: string): Category {
  return (
    BY_ID.get(id) ?? {
      id,
      label: 'ふめい',
      emoji: '❓',
      kind: 'expense',
      slot: 'other',
    }
  )
}

export function categoriesOf(kind: 'income' | 'expense'): Category[] {
  return kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

/** カテゴリの色（CSS 変数参照）。SVG の fill にもそのまま渡せる */
export function seriesColor(slot: SeriesSlot | undefined): string {
  if (slot === undefined || slot === 'other') return 'var(--series-other)'
  return `var(--series-${slot})`
}
