import { describe, expect, it } from 'vitest'
import { buildCategories } from './categories'
import { defaultDateForMonth } from './date'
import { expenseByCategory, itemProgress, totalBalance } from './stats'
import { CURRENT_VERSION, migrate } from './storage'
import type { Transaction, WishItem } from '../types'

const TODAY = new Date(2026, 6, 25) // 2026-07-25

function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36),
    kind: 'expense',
    amount: 100,
    categoryId: 'food',
    date: '2026-07-10',
    createdAt: '2026-07-10T00:00:00.000Z',
    ...partial,
  }
}

function item(partial: Partial<WishItem>): WishItem {
  return {
    id: 'i1',
    name: 'イヤホン',
    price: 8800,
    status: 'wish',
    categoryId: 'other',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...partial,
  }
}

describe('itemProgress（残高から計算する）', () => {
  it('残高が足りないときは「あと何円」を返す', () => {
    const result = itemProgress(item({ price: 8800 }), 3000)
    expect(result.remaining).toBe(5800)
    expect(result.reached).toBe(false)
    expect(result.ratio).toBeCloseTo(3000 / 8800)
  })

  it('残高が足りていれば買える', () => {
    const result = itemProgress(item({ price: 1800 }), 3000)
    expect(result.remaining).toBe(0)
    expect(result.reached).toBe(true)
    expect(result.ratio).toBe(1)
  })

  it('残高がマイナスでも 0 として扱う（あと何円が増えない）', () => {
    const result = itemProgress(item({ price: 1000 }), -500)
    expect(result.remaining).toBe(1000)
    expect(result.ratio).toBe(0)
  })

  it('値段が未設定なら進捗を出さない', () => {
    expect(itemProgress(item({ price: 0 }), 5000)).toEqual({
      ratio: 0,
      remaining: 0,
      reached: false,
    })
  })

  it('表示している数字が残高とズレない', () => {
    // 残高 3,030 円しかないのに「7,300 円貯まっている」と出ていた不具合の確認
    const transactions = [tx({ kind: 'income', amount: 5000 }), tx({ amount: 1970 })]
    const balance = totalBalance(transactions)
    expect(balance).toBe(3030)
    expect(itemProgress(item({ price: 8800 }), balance).remaining).toBe(8800 - 3030)
  })
})

describe('defaultDateForMonth', () => {
  it('今月を見ているなら今日', () => {
    expect(defaultDateForMonth('2026-07', TODAY)).toBe('2026-07-25')
  })

  it('過去の月を見ているならその月の末日（今日にならない）', () => {
    expect(defaultDateForMonth('2026-06', TODAY)).toBe('2026-06-30')
    expect(defaultDateForMonth('2026-02', TODAY)).toBe('2026-02-28')
  })
})

describe('buildCategories（名前の変更・非表示）', () => {
  it('上書きがなければ定義どおり', () => {
    const c = buildCategories()
    expect(c.expense).toHaveLength(8)
    expect(c.expenseVisible).toHaveLength(8)
    expect(c.get('food').label).toBe('食べもの・カフェ')
  })

  it('名前を変えられる', () => {
    const c = buildCategories({ oshi: { label: '部活' } })
    expect(c.get('oshi').label).toBe('部活')
    // 色スロットは変わらない
    expect(c.get('oshi').slot).toBe(6)
  })

  it('空文字にしても元の名前に戻るだけ（名無しにはならない）', () => {
    expect(buildCategories({ food: { label: '   ' } }).get('food').label).toBe('食べもの・カフェ')
  })

  it('隠したものは選択肢から消えるが、一覧と取得には残る', () => {
    const c = buildCategories({ oshi: { hidden: true } })
    expect(c.expenseVisible.map((x) => x.id)).not.toContain('oshi')
    expect(c.expense.map((x) => x.id)).toContain('oshi')
    expect(c.get('oshi').label).toBe('推し活・グッズ')
    expect(c.isHidden('oshi')).toBe(true)
  })

  it('収入カテゴリにも効く', () => {
    const c = buildCategories({ parttime: { hidden: true } })
    expect(c.incomeVisible.map((x) => x.id)).not.toContain('parttime')
  })
})

describe('expenseByCategory（名前を変えても集計は壊れない）', () => {
  it('変えた名前で集計結果が返る', () => {
    const rows = expenseByCategory(
      [tx({ categoryId: 'oshi', amount: 2200 }), tx({ categoryId: 'food', amount: 800 })],
      buildCategories({ oshi: { label: '部活' } }).expense,
    )
    const oshi = rows.find((r) => r.category.id === 'oshi')
    expect(oshi?.category.label).toBe('部活')
    expect(oshi?.total).toBe(2200)
  })

  it('隠したカテゴリの過去の記録も集計に出る', () => {
    const categories = buildCategories({ oshi: { hidden: true } })
    const rows = expenseByCategory([tx({ categoryId: 'oshi', amount: 500 })], categories.expense)
    expect(rows.map((r) => r.category.id)).toContain('oshi')
  })
})

describe('migrate（v1 → v2）', () => {
  it('古い saved（貯めた額）を落とす', () => {
    const result = migrate({
      version: 1,
      transactions: [],
      items: [{ id: 'i1', name: 'イヤホン', price: 8800, saved: 3500, status: 'wish' }],
      settings: { monthlyBudget: 5000, theme: 'system' },
    })
    expect(result.version).toBe(CURRENT_VERSION)
    expect(result.items[0]).not.toHaveProperty('saved')
    expect(result.items[0].name).toBe('イヤホン')
  })

  it('壊れた JSON でも既定値で立ち上がる', () => {
    expect(migrate(null).items).toEqual([])
    expect(migrate({ items: 'こわれている' }).items).toEqual([])
  })
})
