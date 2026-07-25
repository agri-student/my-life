import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createId } from '../lib/id'
import { todayKey } from '../lib/date'
import { DEFAULT_DATA, StorageQuotaError, dataStore } from '../lib/storage'
import { MoneyContext, type MoneyStore } from './MoneyContext'
import type { AppData, Transaction, WishItem } from '../types'

/**
 * ストアの実体。状態を持ち、変わるたびに保存層へ書き戻すだけのコンポーネント。
 * 型と操作の一覧は MoneyContext.ts、読み出しフックは useMoney.ts にある。
 */
export function MoneyProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 読み込み直後の初期値をそのまま書き戻さないためのフラグ
  const loaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    dataStore.load().then((loadedData) => {
      if (cancelled) return
      if (loadedData) setData(loadedData)
      loaded.current = true
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loaded.current) return
    dataStore.save(data).catch((err: unknown) => {
      setError(
        err instanceof StorageQuotaError
          ? err.message
          : '保存できませんでした。ブラウザの設定を確認してみてください。',
      )
    })
  }, [data])

  const store = useMemo<MoneyStore>(() => {
    const patchItem = (id: string, patch: Partial<WishItem>) =>
      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
        ),
      }))

    return {
      data,
      ready,
      error,
      dismissError: () => setError(null),

      addTransaction(input) {
        const transaction: Transaction = {
          ...input,
          id: createId(),
          createdAt: new Date().toISOString(),
        }
        setData((prev) => ({ ...prev, transactions: [transaction, ...prev.transactions] }))
        return transaction
      },

      updateTransaction(id, patch) {
        setData((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }))
      },

      removeTransaction(id) {
        setData((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
        }))
      },

      addItem(input) {
        const now = new Date().toISOString()
        const item: WishItem = {
          status: 'wish',
          saved: 0,
          ...input,
          id: createId(),
          createdAt: now,
          updatedAt: now,
        }
        setData((prev) => ({ ...prev, items: [item, ...prev.items] }))
        return item
      },

      updateItem: patchItem,

      removeItem(id) {
        setData((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }))
      },

      addSaving(id, amount) {
        setData((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  saved: Math.max(0, item.saved + amount),
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        }))
      },

      markAsBought(id) {
        const now = new Date().toISOString()
        const date = todayKey()
        setData((prev) => {
          const item = prev.items.find((i) => i.id === id)
          if (!item || item.status === 'bought') return prev

          // 買った記録は支出としても残す（値段が入っているときだけ）
          const transactions =
            item.price > 0
              ? [
                  {
                    id: createId(),
                    kind: 'expense' as const,
                    amount: item.price,
                    categoryId: item.categoryId,
                    memo: item.name,
                    date,
                    createdAt: now,
                    itemId: item.id,
                  },
                  ...prev.transactions,
                ]
              : prev.transactions

          return {
            ...prev,
            transactions,
            items: prev.items.map((i) =>
              i.id === id ? { ...i, status: 'bought', boughtAt: date, updatedAt: now } : i,
            ),
          }
        })
      },

      updateSettings(patch) {
        setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
      },

      replaceAll(next) {
        setData(next)
      },

      resetAll() {
        setData({ ...DEFAULT_DATA, settings: data.settings })
      },
    }
  }, [data, ready, error])

  return <MoneyContext.Provider value={store}>{children}</MoneyContext.Provider>
}
