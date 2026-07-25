import { useCallback, useEffect, useState } from 'react'

export const ROUTES = ['home', 'items', 'history', 'settings'] as const
export type Route = (typeof ROUTES)[number]

function currentRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(hash) ? (hash as Route) : 'home'
}

/**
 * ハッシュだけの超小さいルーター。
 * ライブラリを足さずに、スマホの「戻る」ボタンでタブが戻るようにするため。
 */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(currentRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    window.location.hash = `#/${next}`
  }, [])

  return { route, navigate }
}
