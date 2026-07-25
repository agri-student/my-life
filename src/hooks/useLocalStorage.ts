import { useCallback, useEffect, useState } from 'react'

/**
 * useState と同じ使い方で、値を LocalStorage にも残すフック。
 *
 * アプリ本体のデータは storage.ts / MoneyStore が担当するので、
 * こちらはテーマ設定のような「ちょっとした 1 つの値」用。
 * 同じキーを別タブで変えたときも追従する。
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => read(key, initialValue))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`[useLocalStorage] "${key}" を保存できませんでした`, error)
    }
  }, [key, value])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return
      setValue(read(key, initialValue))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, initialValue])

  const remove = useCallback(() => {
    localStorage.removeItem(key)
    setValue(initialValue)
  }, [key, initialValue])

  return [value, setValue, remove] as const
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}
