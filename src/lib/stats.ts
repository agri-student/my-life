import { EXPENSE_CATEGORIES, getCategory } from './categories'
import { addMonths, isSameMonth } from './date'
import type { CategoryTotal, MonthSummary, Transaction, WishItem } from '../types'

/** すべての記録から今の残高（= 収入合計 - 支出合計）を出す */
export function totalBalance(transactions: Transaction[]): number {
  return transactions.reduce(
    (sum, t) => sum + (t.kind === 'income' ? t.amount : -t.amount),
    0,
  )
}

export function transactionsOfMonth(
  transactions: Transaction[],
  monthKey: string,
): Transaction[] {
  return transactions.filter((t) => isSameMonth(t.date, monthKey))
}

/** カテゴリ別の支出合計。カテゴリ定義の順番（= 色スロット順）で返す */
export function expenseByCategory(transactions: Transaction[]): CategoryTotal[] {
  const totals = new Map<string, { total: number; count: number }>()

  for (const t of transactions) {
    if (t.kind !== 'expense') continue
    const current = totals.get(t.categoryId) ?? { total: 0, count: 0 }
    totals.set(t.categoryId, { total: current.total + t.amount, count: current.count + 1 })
  }

  const sum = [...totals.values()].reduce((acc, v) => acc + v.total, 0)

  // 定義順で並べる。金額順に並べ替えると隣り合う色の組み合わせが毎月変わり、
  // 積み上げバーの見分けづらさ（色覚多様性の観点）が保証できなくなる。
  const ordered = EXPENSE_CATEGORIES.map((category) => {
    const hit = totals.get(category.id)
    return {
      category,
      total: hit?.total ?? 0,
      count: hit?.count ?? 0,
      ratio: sum > 0 ? (hit?.total ?? 0) / sum : 0,
    }
  }).filter((row) => row.total > 0)

  // 定義に無い id（旧データなど）も拾って末尾に置く
  for (const [id, value] of totals) {
    if (EXPENSE_CATEGORIES.some((c) => c.id === id)) continue
    ordered.push({
      category: getCategory(id),
      total: value.total,
      count: value.count,
      ratio: sum > 0 ? value.total / sum : 0,
    })
  }

  return ordered
}

export function monthSummary(
  transactions: Transaction[],
  monthKey: string,
): MonthSummary {
  const rows = transactionsOfMonth(transactions, monthKey)
  const income = rows
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expense = rows
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    month: monthKey,
    income,
    expense,
    net: income - expense,
    byCategory: expenseByCategory(rows),
  }
}

/** 推移グラフ 1 本ぶん（1 か月） */
export interface MonthTotal {
  /** YYYY-MM */
  month: string
  income: number
  expense: number
  net: number
}

/**
 * endMonth で終わる連続した count か月ぶんの収支。
 * 記録がない月も 0 として必ず含める（グラフの横軸を飛ばさないため）。
 */
export function monthlyTotals(
  transactions: Transaction[],
  endMonth: string,
  count = 6,
): MonthTotal[] {
  const buckets = new Map<string, { income: number; expense: number }>()
  for (let i = count - 1; i >= 0; i -= 1) {
    buckets.set(addMonths(endMonth, -i), { income: 0, expense: 0 })
  }

  for (const t of transactions) {
    const bucket = buckets.get(t.date.slice(0, 7))
    if (!bucket) continue
    if (t.kind === 'income') bucket.income += t.amount
    else bucket.expense += t.amount
  }

  return [...buckets].map(([month, { income, expense }]) => ({
    month,
    income,
    expense,
    net: income - expense,
  }))
}

/** 記録がある月を新しい順に返す（月セレクタ用）。今月は必ず含める */
export function monthsWithData(transactions: Transaction[], currentMonth: string): string[] {
  const set = new Set(transactions.map((t) => t.date.slice(0, 7)))
  set.add(currentMonth)
  return [...set].sort().reverse()
}

/** 「あと何円」「何%たまった」をまとめて出す */
export interface ItemProgress {
  /** 0〜1（値段未設定なら 0） */
  ratio: number
  /** あと必要な金額（円） */
  remaining: number
  /** 貯金だけで買えるか */
  reached: boolean
}

export function itemProgress(item: WishItem): ItemProgress {
  if (item.price <= 0) {
    return { ratio: 0, remaining: 0, reached: false }
  }
  const ratio = Math.min(item.saved / item.price, 1)
  return {
    ratio,
    remaining: Math.max(item.price - item.saved, 0),
    reached: item.saved >= item.price,
  }
}

/** 今月あと何円使えるか。予算 0（＝未設定）なら null */
export function budgetLeft(monthlyBudget: number, expense: number): number | null {
  if (monthlyBudget <= 0) return null
  return monthlyBudget - expense
}

/** 残り日数で割った「1 日に使えるめやす」。予算なし・月末なら null */
export function dailyPace(left: number | null, daysLeft: number): number | null {
  if (left === null || daysLeft <= 0) return null
  return Math.max(Math.floor(left / daysLeft), 0)
}
