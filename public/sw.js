/*
 * サービスワーカー（オフライン対応）。
 *
 * ビルドごとにファイル名のハッシュが変わるため、事前に固定のリストを持たず
 * 「一度読んだものをキャッシュしていく」方式にしている。ライブラリなしで動く。
 *
 *  - ナビゲーション（ページ遷移）: ネット優先 → 失敗したらキャッシュの index.html
 *      = 新しいデプロイをすぐ拾いつつ、圏外でもアプリが開く
 *  - assets/（ハッシュ付きファイル）: キャッシュ優先
 *      = 中身が変われば必ず別のファイル名になるので、古いものを掴む心配がない
 *  - それ以外の同一オリジン: キャッシュを返しつつ裏で更新
 *
 * 記録そのものは LocalStorage にあるので、ここではファイルだけを扱う。
 */

const VERSION = 'v1'
const CACHE = `okozukai-${VERSION}`
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // ページ遷移：ネット優先、ダメならキャッシュ
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          void put(request, response.clone())
          return response
        })
        .catch(async () => (await caches.match('./index.html')) ?? Response.error()),
    )
    return
  }

  // ハッシュ付きの成果物：キャッシュ優先
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            void put(request, response.clone())
            return response
          }),
      ),
    )
    return
  }

  // それ以外：キャッシュを返しつつ裏で更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request)
        .then((response) => {
          void put(request, response.clone())
          return response
        })
        .catch(() => cached ?? Response.error())
      return cached ?? fresh
    }),
  )
})

async function put(request, response) {
  if (!response.ok || response.type === 'opaque') return
  const cache = await caches.open(CACHE)
  await cache.put(request, response)
}
