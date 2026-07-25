import { useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { ThemeSetting } from '../types'

const THEME_KEY = 'okozukai:theme'

/**
 * ライト / ダーク / OS 追従の切り替え。
 * 解決した結果を <html data-theme> に書き込む（index.html の先読みスクリプトと同じキー）。
 */
export function useTheme() {
  const [setting, setSetting] = useLocalStorage<ThemeSetting>(THEME_KEY, 'system')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const dark = setting === 'dark' || (setting === 'system' && media.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }

    apply()
    if (setting !== 'system') return

    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [setting])

  const cycle = useCallback(() => {
    setSetting((prev) => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'))
  }, [setSetting])

  return { setting, setSetting, cycle }
}
