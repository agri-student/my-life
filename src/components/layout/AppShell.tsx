import type { ReactNode } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { IconButton } from '../ui/Button'
import { DeviceIcon, MoonIcon, SunIcon } from '../ui/icons'

interface AppShellProps {
  title: string
  children: ReactNode
  /** 下部のタブバー */
  nav: ReactNode
  /** 右下の追加ボタンなど */
  floating?: ReactNode
}

const THEME_LABEL = {
  light: 'ライト（タップでダーク）',
  dark: 'ダーク（タップで端末に合わせる）',
  system: '端末に合わせる（タップでライト）',
} as const

/**
 * 画面の外枠。
 * スマホ幅を基準に max-w-lg でセンタリングし、PC でもそのまま 1 カラムで見せる。
 */
export function AppShell({ title, children, nav, floating }: AppShellProps) {
  const { setting, cycle } = useTheme()
  const ThemeIcon = setting === 'light' ? SunIcon : setting === 'dark' ? MoonIcon : DeviceIcon

  return (
    <div className="min-h-dvh bg-plane">
      <header className="sticky top-0 z-10 border-b border-hairline bg-plane/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-2">
          <h1 className="text-base font-bold text-ink">{title}</h1>
          <IconButton label={`表示テーマ：${THEME_LABEL[setting]}`} onClick={cycle}>
            <ThemeIcon />
          </IconButton>
        </div>
      </header>

      {/* 下のタブバー + 追加ボタンに隠れないぶんの余白 */}
      <main className="mx-auto max-w-lg px-4 pt-4 pb-36">{children}</main>

      {floating}
      {nav}
    </div>
  )
}
