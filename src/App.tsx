import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { BottomNav } from './components/layout/BottomNav'
import { ItemForm } from './components/items/ItemForm'
import { TransactionForm } from './components/transactions/TransactionForm'
import { BottomSheet } from './components/ui/BottomSheet'
import { PlusIcon } from './components/ui/icons'
import { useHashRoute, type Route } from './hooks/useHashRoute'
import { thisMonthKey } from './lib/date'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { ItemsPage } from './pages/ItemsPage'
import { SettingsPage } from './pages/SettingsPage'
import { useMoney } from './store/useMoney'
import type { WishItem } from './types'

const TITLES: Record<Route, string> = {
  home: 'おこづかい帳',
  items: 'ほしいもの・買ったもの',
  history: 'きろく',
  settings: '設定',
}

/** 開いている入力シート */
type Sheet = { type: 'transaction' } | { type: 'item'; item?: WishItem } | null

export default function App() {
  const { ready, error, dismissError } = useMoney()
  const { route, navigate } = useHashRoute()
  const [month, setMonth] = useState(thisMonthKey)
  const [sheet, setSheet] = useState<Sheet>(null)

  // 読み込み中に空の残高（0円）を一瞬見せないため、最初の load を待つ
  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-plane text-sm text-ink-muted">
        よみこみ中…
      </div>
    )
  }

  const openTransaction = () => setSheet({ type: 'transaction' })
  const openItem = (item?: WishItem) => setSheet({ type: 'item', item })
  const closeSheet = () => setSheet(null)

  return (
    <AppShell
      title={TITLES[route]}
      nav={<BottomNav route={route} onNavigate={navigate} />}
      floating={
        route !== 'settings' && (
          <button
            onClick={() => (route === 'items' ? openItem() : openTransaction())}
            className="fixed right-4 bottom-20 z-20 flex min-h-14 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-bold text-brand-ink"
          >
            <PlusIcon />
            {route === 'items' ? 'ほしいもの' : '記録する'}
          </button>
        )
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-critical/40 bg-critical/10 p-3 text-xs text-ink"
        >
          <span className="flex-1">{error}</span>
          <button onClick={dismissError} className="font-bold text-ink-2">
            閉じる
          </button>
        </div>
      )}

      {route === 'home' && (
        <DashboardPage
          month={month}
          onMonthChange={setMonth}
          onAdd={openTransaction}
          onEditItem={openItem}
          onNavigate={navigate}
        />
      )}
      {route === 'items' && <ItemsPage onAddItem={() => openItem()} onEditItem={openItem} />}
      {route === 'history' && (
        <HistoryPage month={month} onMonthChange={setMonth} onAdd={openTransaction} />
      )}
      {route === 'settings' && <SettingsPage />}

      <BottomSheet
        open={sheet?.type === 'transaction'}
        title="お金を記録する"
        onClose={closeSheet}
      >
        {sheet?.type === 'transaction' && <TransactionForm onDone={closeSheet} />}
      </BottomSheet>

      <BottomSheet
        open={sheet?.type === 'item'}
        title={sheet?.type === 'item' && sheet.item ? 'ほしいものを編集' : 'ほしいものを追加'}
        onClose={closeSheet}
      >
        {sheet?.type === 'item' && <ItemForm item={sheet.item} onDone={closeSheet} />}
      </BottomSheet>
    </AppShell>
  )
}
