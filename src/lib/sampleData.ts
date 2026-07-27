import { createId } from './id'
import { addMonths, thisMonthKey, toDateKey } from './date'
import { CURRENT_VERSION } from './storage'
import type { AppData, Transaction, WishItem } from '../types'

/**
 * 動作確認用のサンプルデータ。
 * 「今月の n 日」で作るので、いつ実行しても今月のグラフが埋まる。
 */
function dayOfThisMonth(day: number): string {
  const [y, m] = thisMonthKey().split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return toDateKey(new Date(y, m - 1, Math.min(day, lastDay)))
}

function dayOfLastMonth(day: number): string {
  const [y, m] = addMonths(thisMonthKey(), -1).split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return toDateKey(new Date(y, m - 1, Math.min(day, lastDay)))
}

interface Seed {
  kind: Transaction['kind']
  amount: number
  categoryId: string
  memo?: string
  date: string
}

const SEEDS: Seed[] = [
  // 先月
  { kind: 'income', amount: 5000, categoryId: 'allowance', memo: '5月ぶん', date: dayOfLastMonth(1) },
  { kind: 'expense', amount: 780, categoryId: 'food', memo: 'クレープ', date: dayOfLastMonth(6) },
  { kind: 'expense', amount: 1320, categoryId: 'book', memo: '新刊2冊', date: dayOfLastMonth(14) },
  { kind: 'expense', amount: 900, categoryId: 'transport', memo: 'ライブ遠征', date: dayOfLastMonth(22) },

  // 今月
  { kind: 'income', amount: 5000, categoryId: 'allowance', memo: '今月のおこづかい', date: dayOfThisMonth(1) },
  { kind: 'income', amount: 6400, categoryId: 'parttime', memo: 'カフェ 8時間', date: dayOfThisMonth(5) },
  { kind: 'expense', amount: 620, categoryId: 'food', memo: '友だちとタピオカ', date: dayOfThisMonth(3) },
  { kind: 'expense', amount: 1100, categoryId: 'book', memo: '漫画の新刊', date: dayOfThisMonth(4) },
  { kind: 'expense', amount: 480, categoryId: 'transport', memo: '電車（部活の遠征）', date: dayOfThisMonth(6) },
  { kind: 'expense', amount: 1500, categoryId: 'game', memo: 'ゲームの課金', date: dayOfThisMonth(8) },
  { kind: 'expense', amount: 340, categoryId: 'study', memo: 'シャーペンの芯とノート', date: dayOfThisMonth(9) },
  { kind: 'expense', amount: 2200, categoryId: 'oshi', memo: 'ライブのグッズ', date: dayOfThisMonth(12) },
  { kind: 'expense', amount: 850, categoryId: 'food', memo: 'コンビニ', date: dayOfThisMonth(15) },
  { kind: 'expense', amount: 2980, categoryId: 'fashion', memo: 'Tシャツ', date: dayOfThisMonth(18) },
  { kind: 'expense', amount: 300, categoryId: 'other', memo: 'ガチャガチャ', date: dayOfThisMonth(20) },
]

const ITEM_SEEDS: Array<Omit<WishItem, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'ワイヤレスイヤホン',
    price: 8800,
    status: 'wish',
    categoryId: 'other',
    memo: 'ノイキャン付きがいい。誕生日までに買う',
    url: 'https://example.com/earphone',
  },
  {
    name: '推しのアクスタ（新弾）',
    price: 1800,
    status: 'wish',
    categoryId: 'oshi',
    memo: '発売日：来週の金曜',
  },
  {
    name: 'スニーカー',
    price: 12000,
    status: 'wish',
    categoryId: 'fashion',
    memo: '白か黒でまだ迷ってる',
  },
  {
    name: 'Tシャツ',
    price: 2980,
    status: 'bought',
    categoryId: 'fashion',
    memo: 'セールで買えた！',
    boughtAt: dayOfThisMonth(18),
  },
]

export function createSampleData(): AppData {
  const now = new Date().toISOString()

  const transactions: Transaction[] = SEEDS.map((seed) => ({
    id: createId(),
    createdAt: now,
    ...seed,
  }))

  const items: WishItem[] = ITEM_SEEDS.map((seed) => ({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    ...seed,
  }))

  return {
    version: CURRENT_VERSION,
    transactions,
    items,
    settings: { monthlyBudget: 12000, theme: 'system' },
  }
}
