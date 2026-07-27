import { EXPENSE_CATEGORIES } from './categories'
import { toDateKey } from './date'
import type { Category } from '../types'

/**
 * レシートの読み取り結果を取り込む層。
 *
 * 写真そのものをアプリで解析はしない。手元の AI アプリ（ChatGPT / Claude など）に
 * 写真を読ませて、返ってきたテキストをここに貼ってもらう方式にしている。
 * こうすると API キーが不要で費用が 0 円のまま、精度は AI のものが使える。
 *
 * AI の返事は毎回同じ形にならないので、パーサーは次の順に受け付ける。
 *   1. JSON（前後に説明文やコードフェンスが付いていても拾う）
 *   2. 行ごとの「品名 金額」テキスト
 * どちらで読めても、記録する前に必ず確認画面を通す。
 */

export interface ParsedReceiptItem {
  name: string
  /** 円。値引きはマイナス */
  price: number
  categoryId: string
}

export interface ParsedReceipt {
  /** YYYY-MM-DD。読み取れなければ undefined */
  date?: string
  shop?: string
  /** レシートに書かれていた合計。読み取れなければ undefined */
  total?: number
  items: ParsedReceiptItem[]
  /** ユーザーに知らせたい注意（読み飛ばした行、合計の不一致など） */
  warnings: string[]
}

/**
 * AI に渡す指示文。カテゴリ一覧は実際に使っているものから作るので、
 * 名前を変えたり隠したりしても指示文と選択肢がズレない。
 */
export function receiptPrompt(categories: Category[] = EXPENSE_CATEGORIES): string {
  return `このレシートの写真を読み取って、下の JSON だけを返してください。説明や前置きは書かないでください。

{
  "date": "YYYY-MM-DD",
  "shop": "店の名前",
  "total": 合計金額の数字,
  "items": [
    { "name": "品名", "price": 金額の数字, "category": "カテゴリ" }
  ]
}

ルール
- 金額は数字だけ（円やカンマは書かない）
- 割引・値引きはマイナスの数字にする
- 小計・合計・お預り・おつり・ポイントは items に入れない
- category は次のどれか 1 つ:
  ${categories.map((c) => c.label).join(' / ')}
- 読み取れない項目は書かない
- 日付が読み取れないときは "date" を "" にする`
}

/** 合計・支払いなど、品目ではない行 */
const SUMMARY_LINE =
  /^(小?計|合[ 　]*計|総[ 　]*額|税[ 　]*込|税[ 　]*抜|消費税|内税|外税|課税対象|お?預(り|かり)|お?釣り?|おつり|ポイント|point|残高|支払|お支払|現金|クレジット|カード|電子マネー|交通系|バーコード|レジ|担当|TEL|電話)/i

/** 合計として使える行（金額を取り出す） */
const TOTAL_LINE = /^(合[ 　]*計|総[ 　]*額|お?買上げ?計|税[ 　]*込[ 　]*(合[ 　]*計)?)/

export function parseReceiptText(input: string, today = new Date()): ParsedReceipt {
  // 全角の数字・記号を半角にそろえてから扱う
  const text = input.normalize('NFKC').trim()
  if (!text) {
    return { items: [], warnings: ['なにも貼られていません。'] }
  }

  const fromJson = tryParseJson(text, today)
  if (fromJson) return fromJson

  return parseLines(text, today)
}

/* -------------------------------------------------------------------------- */
/* JSON として読む                                                             */
/* -------------------------------------------------------------------------- */

function tryParseJson(text: string, today: Date): ParsedReceipt | null {
  const raw = extractJson(text)
  if (!raw) return null

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }

  const warnings: string[] = []

  // 配列だけを返してくるパターン（[{name, price}, ...]）にも対応する
  const source = Array.isArray(value) ? { items: value } : value
  if (!source || typeof source !== 'object') return null

  const record = source as Record<string, unknown>
  const rawItems = Array.isArray(record.items) ? record.items : null
  if (!rawItems) return null

  const items: ParsedReceiptItem[] = []
  for (const entry of rawItems) {
    if (!entry || typeof entry !== 'object') continue
    const item = entry as Record<string, unknown>
    const price = toAmount(item.price ?? item.amount ?? item.値段 ?? item.金額)
    const name = String(item.name ?? item.品名 ?? item.item ?? '').trim()
    if (price === null) {
      if (name) warnings.push(`「${name}」は金額が読み取れないので飛ばしました。`)
      continue
    }
    items.push({
      name: name || '品名なし',
      price,
      categoryId: resolveCategoryId(
        typeof item.category === 'string' ? item.category : String(item.カテゴリ ?? ''),
      ),
    })
  }

  const total = toAmount(record.total ?? record.合計) ?? undefined
  const date = normalizeDate(String(record.date ?? record.日付 ?? ''), today)
  const shop = String(record.shop ?? record.店名 ?? '').trim() || undefined

  return {
    date,
    shop,
    total,
    items,
    warnings: [...warnings, ...checkTotal(items, total)],
  }
}

/** 説明文やコードフェンスに囲まれていても JSON 部分だけ取り出す */
function extractJson(text: string): string | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  const body = fenced ? fenced[1].trim() : text

  const candidates = [
    { start: body.indexOf('{'), end: body.lastIndexOf('}') },
    { start: body.indexOf('['), end: body.lastIndexOf(']') },
  ]
    .filter(({ start, end }) => start !== -1 && end > start)
    // 先に出てくる括弧を使う。配列だけを返してくる形（[{...}]）で、
    // 中の { を先に拾ってしまわないようにするため。
    .sort((a, b) => a.start - b.start)

  const hit = candidates[0]
  return hit ? body.slice(hit.start, hit.end + 1) : null
}

/* -------------------------------------------------------------------------- */
/* 行ごとのテキストとして読む                                                   */
/* -------------------------------------------------------------------------- */

function parseLines(text: string, today: Date): ParsedReceipt {
  const items: ParsedReceiptItem[] = []
  const warnings: string[] = []
  let total: number | undefined
  let date: string | undefined
  let shop: string | undefined

  for (const rawLine of text.split(/\r?\n/)) {
    // 表・CSV・TSV で来ることもあるので区切りをそろえる
    const line = rawLine.replace(/^\s*[|｜]\s*|\s*[|｜]\s*$/g, '').trim()
    if (!line || /^[-=|:\s]+$/.test(line)) continue

    if (!date) {
      const found = findDate(line, today)
      if (found) {
        date = found
        // 日付だけの行なら品目としては扱わない
        if (/^[\d年月日/.\s()月火水木金土日]+$/.test(line)) continue
      }
    }

    if (TOTAL_LINE.test(line)) {
      const amount = lastAmount(line)
      if (amount !== null && total === undefined) total = amount
      continue
    }

    if (SUMMARY_LINE.test(line)) continue

    const amount = lastAmount(line)
    if (amount === null) {
      // 金額のない行は店名の候補（最初の 1 行だけ）
      if (!shop && items.length === 0 && line.length <= 30) shop = line
      continue
    }

    const name = cleanName(line)
    if (!name) continue
    items.push({ name, price: amount, categoryId: resolveCategoryId(findCategoryWord(line)) })
  }

  if (items.length === 0) {
    warnings.push('品目を読み取れませんでした。AI の返事をそのまま貼れているか確かめてください。')
  }

  return { date, shop, total, items, warnings: [...warnings, ...checkTotal(items, total)] }
}

/** 行の末尾から金額を取り出す（「牛乳 158円」「牛乳,158」「牛乳 ¥1,280」） */
function lastAmount(line: string): number | null {
  const matches = [...line.matchAll(/([-−▲△]?)\s*[¥￥]?\s*(\d{1,3}(?:,\d{3})+|\d+)\s*円?/g)]
  if (matches.length === 0) return null

  const last = matches[matches.length - 1]
  const digits = Number(last[2].replace(/,/g, ''))
  if (!Number.isFinite(digits)) return null
  return last[1] ? -digits : digits
}

/** 品名部分を取り出す。金額・個数・記号を落とす */
function cleanName(line: string): string {
  return line
    .replace(/([-−▲△]?)\s*[¥￥]?\s*(\d{1,3}(?:,\d{3})+|\d+)\s*円?\s*$/, '')
    .replace(/[,\t|｜]+\s*$/, '')
    .replace(/\s*[x×＊*]\s*\d+\s*(個|点)?\s*$/i, '')
    .replace(/\s*\d+\s*(個|点)\s*$/, '')
    .replace(/^[-*・\s]+/, '')
    .replace(/[\s,\t]+$/, '')
    .trim()
}

/** 行の中にカテゴリ名が書かれていれば拾う（「牛乳 158 食べもの・カフェ」） */
function findCategoryWord(line: string): string {
  for (const category of EXPENSE_CATEGORIES) {
    if (line.includes(category.label)) return category.label
  }
  return ''
}

/* -------------------------------------------------------------------------- */
/* 共通の変換                                                                  */
/* -------------------------------------------------------------------------- */

/** 「1,280円」「¥1280」「-100」「1280」→ 数値。読めなければ null */
export function toAmount(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : null
  if (typeof value !== 'string') return null

  const text = value.normalize('NFKC').trim()
  if (!text) return null

  const negative = /^[-−▲△]/.test(text)
  const digits = text.replace(/[^\d.]/g, '')
  if (!digits) return null

  const amount = Math.round(Number(digits))
  if (!Number.isFinite(amount)) return null
  return negative ? -amount : amount
}

/** カテゴリ名（表記ゆれあり）を Category.id に寄せる。分からなければ その他 */
export function resolveCategoryId(raw: string | undefined): string {
  const key = (raw ?? '').normalize('NFKC').trim()
  if (!key) return 'other'

  const exact = EXPENSE_CATEGORIES.find((c) => c.id === key || c.label === key)
  if (exact) return exact.id

  // 「食べもの」「カフェ」のように一部だけ書かれている場合
  const loose = EXPENSE_CATEGORIES.find((category) =>
    category.label
      .split('・')
      .some((part) => part.length >= 2 && (key.includes(part) || part.includes(key))),
  )
  return loose?.id ?? 'other'
}

/** いろいろな書き方の日付を YYYY-MM-DD にそろえる */
export function normalizeDate(raw: string, today = new Date()): string | undefined {
  const found = findDate(raw.normalize('NFKC'), today)
  return found
}

function findDate(text: string, today: Date): string | undefined {
  // 2026-07-25 / 2026/7/25 / 2026年7月25日
  const full = /(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/.exec(text)
  if (full) return buildDate(Number(full[1]), Number(full[2]), Number(full[3]))

  // 7/25 / 7月25日（年はレシートを見ている「いま」の年とみなす）
  const short = /(?:^|[^\d])(\d{1,2})\s*[-/.月]\s*(\d{1,2})\s*日?(?!\d)/.exec(text)
  if (short) {
    const month = Number(short[1])
    const day = Number(short[2])
    const candidate = buildDate(today.getFullYear(), month, day)
    if (!candidate) return undefined
    // 未来の日付になるなら前の年のレシートと考える（年末年始のため）
    if (candidate > toDateKey(today)) {
      return buildDate(today.getFullYear() - 1, month, day)
    }
    return candidate
  }

  return undefined
}

function buildDate(year: number, month: number, day: number): string | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  const date = new Date(year, month - 1, day)
  // 2 月 31 日のような存在しない日付をはじく
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return undefined
  return toDateKey(date)
}

function checkTotal(items: ParsedReceiptItem[], total: number | undefined): string[] {
  if (total === undefined || items.length === 0) return []
  const sum = items.reduce((acc, item) => acc + item.price, 0)
  if (sum === total) return []
  return [
    `品目の合計（${sum.toLocaleString('ja-JP')}円）とレシートの合計（${total.toLocaleString('ja-JP')}円）が違います。税や読み取りもれかもしれません。`,
  ]
}
