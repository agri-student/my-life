import { useContext } from 'react'
import { MoneyContext, type MoneyStore } from './MoneyContext'
import type { Settings, Transaction, WishItem } from '../types'

export function useMoney(): MoneyStore {
  const store = useContext(MoneyContext)
  if (!store) throw new Error('useMoney は MoneyProvider の中で使ってください')
  return store
}

/** よく使う値のショートカット */
export function useTransactions(): Transaction[] {
  return useMoney().data.transactions
}

export function useItems(): WishItem[] {
  return useMoney().data.items
}

export function useSettings(): Settings {
  return useMoney().data.settings
}
