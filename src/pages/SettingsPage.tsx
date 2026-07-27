import { useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { AmountInput, Field } from '../components/ui/Field'
import { DeviceIcon, MoonIcon, SunIcon } from '../components/ui/icons'
import { CategorySettings } from '../components/settings/CategorySettings'
import { useTheme } from '../hooks/useTheme'
import { createSampleData } from '../lib/sampleData'
import { exportJson, importJson } from '../lib/storage'
import { useMoney } from '../store/useMoney'
import type { ThemeSetting } from '../types'

export function SettingsPage() {
  const { data, updateSettings, replaceAll, resetAll } = useMoney()
  const { setting: theme, setSetting: setTheme } = useTheme()
  const [budget, setBudget] = useState<number | ''>(data.settings.monthlyBudget || '')
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const saveBudget = () => {
    updateSettings({ monthlyBudget: budget === '' ? 0 : budget })
    setMessage('予算を保存しました')
  }

  const download = () => {
    const blob = new Blob([exportJson(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `okozukai-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    try {
      replaceAll(importJson(await file.text()))
      setMessage('バックアップから読み込みました')
    } catch {
      setMessage('このファイルは読み込めませんでした')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="今月つかえる予算" hint="0 円にすると予算のメーターを隠せます" />
        <div className="space-y-3">
          <Field label="1か月の予算">
            {(id) => <AmountInput id={id} value={budget} onChange={setBudget} />}
          </Field>
          <Button onClick={saveBudget} className="w-full">
            保存する
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="カテゴリ"
          hint="名前を変えたり、使わないものを隠したりできます"
        />
        <CategorySettings />
      </Card>

      <Card>
        <CardHeader title="見た目" />
        <div
          role="radiogroup"
          aria-label="テーマ"
          className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1"
        >
          {(
            [
              ['light', 'ライト', SunIcon],
              ['dark', 'ダーク', MoonIcon],
              ['system', '端末に合わせる', DeviceIcon],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              role="radio"
              aria-checked={theme === value}
              onClick={() => setTheme(value as ThemeSetting)}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                theme === value ? 'bg-surface-1 text-ink' : 'text-ink-2'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="データ"
          hint="記録はこの端末のブラウザ（LocalStorage）に保存されます"
        />
        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={download}>
            バックアップを書き出す
          </Button>

          <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>
            バックアップを読み込む
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(event) => void upload(event.target.files?.[0])}
          />

          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              if (!confirm('記録をぜんぶ消します。もとに戻せません。よろしいですか？')) return
              resetAll()
              setMessage('データを消しました')
            }}
          >
            記録をぜんぶ消す
          </Button>

          {/*
            サンプルデータは開発中の動作確認用。
            本番では出さない（実際に使い始めたあとに押すと全部消えてしまうため）。
          */}
          {import.meta.env.DEV && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                replaceAll(createSampleData())
                setMessage('サンプルデータを入れました（開発用）')
              }}
            >
              サンプルデータを入れる（開発用）
            </Button>
          )}
        </div>

        {message && (
          <p className="mt-3 text-xs font-bold text-success-text" role="status">
            {message}
          </p>
        )}
      </Card>

      <p className="px-1 pb-2 text-xs text-ink-muted">
        データは外部に送信されません。ブラウザの履歴やサイトデータを消すと記録も消えるので、
        大事な記録はときどきバックアップを書き出しておくと安心です。
      </p>
    </div>
  )
}
