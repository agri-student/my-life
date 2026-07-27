import { createContext } from 'react'
import type { AppData, Settings, Transaction, WishItem } from '../types'

/**
 * アプリの状態と、それを更新する操作の一覧。
 *
 * - 状態は AppData 1 つだけ。更新は必ずこの操作関数を通す
 * - 変更があったら保存層（lib/storage.ts の dataStore）へ書き戻す
 * - 保存層は Promise を返すので、あとで Supabase に替えてもこの形は変わらない
 */
export interface MoneyStore {
  data: AppData
  /** 最初の読み込みが終わったか（終わるまで画面は出さない） */
  ready: boolean
  /** 保存に失敗したときのメッセージ（容量オーバーなど） */
  error: string | null
  dismissError(): void

  addTransaction(input: NewTransaction): Transaction
  /** レシートの取り込みなど、複数件を 1 回の更新でまとめて足す */
  addTransactions(inputs: NewTransaction[]): void
  updateTransaction(id: string, patch: Partial<Omit<Transaction, 'id'>>): void
  removeTransaction(id: string): void

  addItem(input: NewItem): WishItem
  updateItem(id: string, patch: Partial<Omit<WishItem, 'id' | 'createdAt'>>): void
  removeItem(id: string): void
  /** ほしいもの → 買った。同時に支出も記録する */
  markAsBought(id: string, date?: string): void
  /** 「買った」を取り消す。ひもづく支出の記録も一緒に消す */
  unmarkAsBought(id: string): void

  updateSettings(patch: Partial<Settings>): void
  replaceAll(next: AppData): void
  resetAll(): void
}

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>
export type NewItem = Omit<WishItem, 'id' | 'createdAt' | 'updatedAt' | 'status'> &
  Partial<Pick<WishItem, 'status'>>

export const MoneyContext = createContext<MoneyStore | null>(null)
