import { useMemo } from 'react'
import { buildCategories, type CategorySet } from '../lib/categories'
import { useMoney } from '../store/useMoney'

/**
 * 設定（名前の変更・非表示）を当てたカテゴリ一覧。
 * 画面からカテゴリを触るときは必ずこれを通す。
 */
export function useCategories(): CategorySet {
  const { data } = useMoney()
  const overrides = data.settings.categories
  return useMemo(() => buildCategories(overrides), [overrides])
}
