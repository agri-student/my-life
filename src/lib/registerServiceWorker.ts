/**
 * サービスワーカーの登録。
 *
 * 開発中は登録しない（キャッシュが効いて変更が反映されず、混乱するため）。
 * 本番ビルドでのみ、ページの読み込みが終わってから登録する。
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error: unknown) => {
      // 登録に失敗してもアプリ自体は普通に動く（オフライン対応が付かないだけ）
      console.warn('[sw] 登録できませんでした', error)
    })
  })
}
