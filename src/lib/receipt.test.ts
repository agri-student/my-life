import { describe, expect, it } from 'vitest'
import { normalizeDate, parseReceiptText, resolveCategoryId, toAmount } from './receipt'

// AI の返事は形がぶれるので、実際に返ってきそうな書き方を並べて確かめる
const TODAY = new Date(2026, 6, 25) // 2026-07-25

describe('parseReceiptText / JSON', () => {
  it('そのままの JSON を読める', () => {
    const result = parseReceiptText(
      JSON.stringify({
        date: '2026-07-20',
        shop: 'ローソン 駅前店',
        total: 638,
        items: [
          { name: 'カフェラテ', price: 180, category: '食べもの・カフェ' },
          { name: 'おにぎり', price: 158, category: '食べもの・カフェ' },
          { name: 'ジャンプ', price: 300, category: '漫画・本' },
        ],
      }),
      TODAY,
    )

    expect(result.date).toBe('2026-07-20')
    expect(result.shop).toBe('ローソン 駅前店')
    expect(result.total).toBe(638)
    expect(result.items).toEqual([
      { name: 'カフェラテ', price: 180, categoryId: 'food' },
      { name: 'おにぎり', price: 158, categoryId: 'food' },
      { name: 'ジャンプ', price: 300, categoryId: 'book' },
    ])
    expect(result.warnings).toEqual([])
  })

  it('コードフェンスと前置きが付いていても読める', () => {
    const result = parseReceiptText(
      'はい、読み取りました！\n\n```json\n{"date":"2026-07-01","items":[{"name":"ノート","price":220,"category":"文房具・勉強"}]}\n```\n\n他にもあればどうぞ。',
      TODAY,
    )

    expect(result.date).toBe('2026-07-01')
    expect(result.items).toEqual([{ name: 'ノート', price: 220, categoryId: 'study' }])
  })

  it('items の配列だけ返ってきても読める', () => {
    const result = parseReceiptText('[{"name":"パン","price":140}]', TODAY)
    expect(result.items).toEqual([{ name: 'パン', price: 140, categoryId: 'other' }])
  })

  it('金額が文字列でもカンマ付きでも読める', () => {
    const result = parseReceiptText(
      '{"items":[{"name":"スニーカー","price":"12,800円","category":"服・コスメ"}]}',
      TODAY,
    )
    expect(result.items).toEqual([{ name: 'スニーカー', price: 12800, categoryId: 'fashion' }])
  })

  it('値引きはマイナスとして扱う', () => {
    const result = parseReceiptText(
      '{"total":1000,"items":[{"name":"Tシャツ","price":1200},{"name":"割引","price":-200}]}',
      TODAY,
    )
    expect(result.items[1].price).toBe(-200)
    expect(result.warnings).toEqual([]) // 1200 - 200 = 1000 なので警告なし
  })

  it('合計が合わないときは警告を出す（記録は止めない）', () => {
    const result = parseReceiptText(
      '{"total":700,"items":[{"name":"弁当","price":500}]}',
      TODAY,
    )
    expect(result.items).toHaveLength(1)
    expect(result.warnings[0]).toContain('違います')
  })

  it('金額が読めない品目は飛ばして知らせる', () => {
    const result = parseReceiptText(
      '{"items":[{"name":"よくわからない商品","price":null},{"name":"牛乳","price":158}]}',
      TODAY,
    )
    expect(result.items).toEqual([{ name: '牛乳', price: 158, categoryId: 'other' }])
    expect(result.warnings[0]).toContain('よくわからない商品')
  })

  it('日付が空文字なら undefined にする', () => {
    const result = parseReceiptText('{"date":"","items":[{"name":"ガム","price":120}]}', TODAY)
    expect(result.date).toBeUndefined()
  })
})

describe('parseReceiptText / 行テキスト', () => {
  it('「品名 金額」の行を読める', () => {
    const result = parseReceiptText(
      ['セブンイレブン', '2026/7/22', 'カフェオレ 150円', 'サンドイッチ 320円', '合計 470円'].join(
        '\n',
      ),
      TODAY,
    )

    expect(result.date).toBe('2026-07-22')
    expect(result.shop).toBe('セブンイレブン')
    expect(result.total).toBe(470)
    expect(result.items).toEqual([
      { name: 'カフェオレ', price: 150, categoryId: 'other' },
      { name: 'サンドイッチ', price: 320, categoryId: 'other' },
    ])
  })

  it('小計・お預り・おつりは品目に入れない', () => {
    const result = parseReceiptText(
      ['おにぎり 158', '小計 158', '消費税 12', '合計 170', 'お預り 500', 'おつり 330'].join('\n'),
      TODAY,
    )
    expect(result.items).toEqual([{ name: 'おにぎり', price: 158, categoryId: 'other' }])
    expect(result.total).toBe(170)
  })

  it('カンマ・円・¥ の混在を読める', () => {
    const result = parseReceiptText(['スニーカー ¥12,800', 'くつ下 ￥580円'].join('\n'), TODAY)
    expect(result.items.map((i) => i.price)).toEqual([12800, 580])
  })

  it('個数の表記を品名から取り除く', () => {
    const result = parseReceiptText(['チョコ x2 240', 'ジュース 3点 450'].join('\n'), TODAY)
    expect(result.items.map((i) => i.name)).toEqual(['チョコ', 'ジュース'])
  })

  it('CSV・TSV・表形式でも読める', () => {
    const csv = parseReceiptText(['牛乳,158', 'パン,140'].join('\n'), TODAY)
    expect(csv.items.map((i) => [i.name, i.price])).toEqual([
      ['牛乳', 158],
      ['パン', 140],
    ])

    const table = parseReceiptText(
      ['| 品名 | 金額 |', '| --- | --- |', '| 牛乳 | 158 |', '| パン | 140 |'].join('\n'),
      TODAY,
    )
    expect(table.items.map((i) => i.price)).toEqual([158, 140])
  })

  it('行にカテゴリ名が書かれていれば拾う', () => {
    const result = parseReceiptText('マンガ 漫画・本 550', TODAY)
    expect(result.items[0].categoryId).toBe('book')
  })

  it('値引き行はマイナスになる', () => {
    const result = parseReceiptText(['Tシャツ 2,980', '会員値引 -300'].join('\n'), TODAY)
    expect(result.items.map((i) => i.price)).toEqual([2980, -300])
  })

  it('全角の数字でも読める', () => {
    const result = parseReceiptText('ノート　２２０円', TODAY)
    expect(result.items).toEqual([{ name: 'ノート', price: 220, categoryId: 'other' }])
  })

  it('読み取れないときは警告を返す', () => {
    const result = parseReceiptText('すみません、この画像からは読み取れませんでした。', TODAY)
    expect(result.items).toEqual([])
    expect(result.warnings[0]).toContain('読み取れませんでした')
  })

  it('空のときは警告を返す', () => {
    expect(parseReceiptText('   ', TODAY).warnings[0]).toContain('なにも貼られていません')
  })
})

describe('normalizeDate', () => {
  it('いろいろな書き方を YYYY-MM-DD にそろえる', () => {
    expect(normalizeDate('2026-07-25', TODAY)).toBe('2026-07-25')
    expect(normalizeDate('2026/7/5', TODAY)).toBe('2026-07-05')
    expect(normalizeDate('2026年7月5日', TODAY)).toBe('2026-07-05')
    expect(normalizeDate('2026.07.05', TODAY)).toBe('2026-07-05')
  })

  it('年がないときは今年とみなす', () => {
    expect(normalizeDate('7/5', TODAY)).toBe('2026-07-05')
    expect(normalizeDate('7月5日', TODAY)).toBe('2026-07-05')
  })

  it('年がなく未来になるときは前の年とみなす', () => {
    // 2026-07-25 に「12/28」のレシートを入れたら 2025 年のもの
    expect(normalizeDate('12/28', TODAY)).toBe('2025-12-28')
  })

  it('存在しない日付は読み取らない', () => {
    expect(normalizeDate('2026-02-31', TODAY)).toBeUndefined()
    expect(normalizeDate('2026-13-01', TODAY)).toBeUndefined()
    expect(normalizeDate('レシート', TODAY)).toBeUndefined()
  })
})

describe('resolveCategoryId', () => {
  it('ラベルと id のどちらでも引ける', () => {
    expect(resolveCategoryId('食べもの・カフェ')).toBe('food')
    expect(resolveCategoryId('food')).toBe('food')
  })

  it('一部だけ書かれていても寄せる', () => {
    expect(resolveCategoryId('カフェ')).toBe('food')
    expect(resolveCategoryId('漫画')).toBe('book')
    expect(resolveCategoryId('コスメ')).toBe('fashion')
  })

  it('分からないものは その他 にする', () => {
    expect(resolveCategoryId('日用品')).toBe('other')
    expect(resolveCategoryId('')).toBe('other')
    expect(resolveCategoryId(undefined)).toBe('other')
  })
})

describe('toAmount', () => {
  it('数値・文字列・記号つきを読める', () => {
    expect(toAmount(158)).toBe(158)
    expect(toAmount('1,280円')).toBe(1280)
    expect(toAmount('¥980')).toBe(980)
    expect(toAmount('-100')).toBe(-100)
    expect(toAmount('△100')).toBe(-100)
    expect(toAmount('１５８')).toBe(158)
  })

  it('読めないものは null', () => {
    expect(toAmount('')).toBeNull()
    expect(toAmount(null)).toBeNull()
    expect(toAmount('なし')).toBeNull()
    expect(toAmount(Number.NaN)).toBeNull()
  })
})
