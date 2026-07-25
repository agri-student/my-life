/**
 * アプリ全体で使うデータ型。
 * 複式簿記はやらない。「入ってきたお金」と「出ていったお金」の 1 行 = 1 Transaction。
 */

/** 収支の種類 */
export type TransactionKind = 'income' | 'expense'

/** カテゴリ色のスロット番号（index.css の --series-N に対応、1〜7 と その他） */
export type SeriesSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'other'

export interface Category {
  id: string
  /** 画面に出す名前 */
  label: string
  /** 見た目のアクセント（絵文字 1 文字） */
  emoji: string
  /** 収入カテゴリか支出カテゴリか */
  kind: TransactionKind
  /**
   * グラフで使う色スロット。カテゴリに固定で紐づく（= 金額順に並べ替えても
   * 色は動かない）。支出カテゴリだけが持つ。
   */
  slot?: SeriesSlot
}

/** 収入・支出 1 件 */
export interface Transaction {
  id: string
  kind: TransactionKind
  /** 円。整数・正の数で持つ（支出でもマイナスにしない） */
  amount: number
  /** Category.id */
  categoryId: string
  /** ひとことメモ（任意） */
  memo?: string
  /** YYYY-MM-DD（ローカル日付） */
  date: string
  /** ISO 8601 */
  createdAt: string
  /** 「ほしいものリスト」から買ったときに紐づく WishItem.id */
  itemId?: string
}

/** ほしいもの / 買ったもの 1 件 */
export interface WishItem {
  id: string
  name: string
  /** 円。値段が未定なら 0 */
  price: number
  /** 貯めた金額（円） */
  saved: number
  status: 'wish' | 'bought'
  /** 支出カテゴリの Category.id（買ったときにこのカテゴリで記録する） */
  categoryId: string
  /** 商品ページなどの URL（任意） */
  url?: string
  /** 写真（リサイズ済み data URL、任意） */
  imageDataUrl?: string
  memo?: string
  createdAt: string
  updatedAt: string
  /** 買った日 YYYY-MM-DD */
  boughtAt?: string
}

export interface Settings {
  /** 1 か月に使っていい金額の目安（円）。0 なら予算なし */
  monthlyBudget: number
  theme: ThemeSetting
}

export type ThemeSetting = 'light' | 'dark' | 'system'

/** LocalStorage に入る全データ。version はマイグレーション用 */
export interface AppData {
  version: number
  transactions: Transaction[]
  items: WishItem[]
  settings: Settings
}

/** カテゴリ別集計の 1 行 */
export interface CategoryTotal {
  category: Category
  total: number
  /** 0〜1 */
  ratio: number
  count: number
}

/** 1 か月分のまとめ */
export interface MonthSummary {
  /** YYYY-MM */
  month: string
  income: number
  expense: number
  /** income - expense */
  net: number
  byCategory: CategoryTotal[]
}
