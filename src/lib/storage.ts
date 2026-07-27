import type { AppData, WishItem } from '../types'

/**
 * 保存層。
 *
 * 画面やストアはこの `DataStore` インターフェースだけに依存しているので、
 * あとで Supabase / IndexedDB に差し替えるときは同じ形の実装を 1 つ足して
 * `dataStore` の中身を入れ替えるだけで済む（呼び出し側は変更なし）。
 * 戻り値を Promise にしてあるのは、そのときに型を変えなくていいようにするため。
 */
export interface DataStore {
  load(): Promise<AppData | null>
  save(data: AppData): Promise<void>
  clear(): Promise<void>
}

export const STORAGE_KEY = 'okozukai:data'
export const CURRENT_VERSION = 2

export const DEFAULT_DATA: AppData = {
  version: CURRENT_VERSION,
  transactions: [],
  items: [],
  settings: {
    monthlyBudget: 5000,
    theme: 'system',
  },
}

/** 保存に失敗した理由（容量オーバーはユーザーに伝える必要がある） */
export class StorageQuotaError extends Error {
  constructor() {
    super('保存できる容量がいっぱいです。写真つきのアイテムを減らしてみてください。')
    this.name = 'StorageQuotaError'
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22)
  )
}

/**
 * 壊れた／古い JSON を受け取っても落ちないように整える。
 * version が上がったときのマイグレーションもここに足していく。
 */
export function migrate(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DATA }
  const data = raw as Partial<AppData>

  return {
    version: CURRENT_VERSION,
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    // v1 の items が持っていた saved（貯めた額）は廃止した。
    // 残高から計算するようにしたので、残っていても落とす。
    items: Array.isArray(data.items)
      ? data.items.map((item) => {
          const { saved: _dropped, ...rest } = item as WishItem & { saved?: number }
          return rest
        })
      : [],
    settings: {
      ...DEFAULT_DATA.settings,
      ...(data.settings ?? {}),
    },
  }
}

export const localDataStore: DataStore = {
  async load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return migrate(JSON.parse(raw))
    } catch (error) {
      // JSON が壊れている / プライベートモードで読めない
      console.warn('[storage] 読み込みに失敗したので初期データで start します', error)
      return null
    }
  },

  async save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      if (isQuotaError(error)) throw new StorageQuotaError()
      throw error
    }
  },

  async clear() {
    localStorage.removeItem(STORAGE_KEY)
  },
}

/** アプリが使う保存先。差し替えポイントはここ 1 行だけ */
export const dataStore: DataStore = localDataStore

/** バックアップ用の JSON 文字列 */
export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

/** バックアップ JSON の取り込み */
export function importJson(text: string): AppData {
  return migrate(JSON.parse(text))
}
