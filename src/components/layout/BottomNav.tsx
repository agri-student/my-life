import { GearIcon, HeartIcon, HomeIcon, ListIcon } from '../ui/icons'
import type { Route } from '../../hooks/useHashRoute'

interface BottomNavProps {
  route: Route
  onNavigate(route: Route): void
}

const TABS: Array<{ route: Route; label: string; Icon: typeof HomeIcon }> = [
  { route: 'home', label: 'ホーム', Icon: HomeIcon },
  { route: 'items', label: 'ほしいもの', Icon: HeartIcon },
  { route: 'history', label: 'きろく', Icon: ListIcon },
  { route: 'settings', label: '設定', Icon: GearIcon },
]

/** スマホの親指が届く位置に置くタブバー（PC でも同じ位置に出す） */
export function BottomNav({ route, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="メインメニュー"
      className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface-1/95 pt-1 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map(({ route: value, label, Icon }) => {
          const active = route === value
          return (
            <li key={value} className="flex-1">
              <button
                onClick={() => onNavigate(value)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-12 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
                  active ? 'text-brand' : 'text-ink-muted'
                }`}
              >
                <Icon size={22} />
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
