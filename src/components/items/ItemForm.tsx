import { useState } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { fileToResizedDataUrl } from '../../lib/image'
import { useMoney } from '../../store/useMoney'
import { AmountInput, Field, TextArea, TextInput } from '../ui/Field'
import { Button } from '../ui/Button'
import { CameraIcon, CloseIcon } from '../ui/icons'
import type { WishItem } from '../../types'

interface ItemFormProps {
  /** 渡すと編集モードになる */
  item?: WishItem
  onDone(): void
}

/** ほしいもの / 買ったものの登録・編集フォーム */
export function ItemForm({ item, onDone }: ItemFormProps) {
  const { addItem, updateItem } = useMoney()
  const categories = useCategories()
  const [name, setName] = useState(item?.name ?? '')
  const [price, setPrice] = useState<number | ''>(item?.price ?? '')
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? 'other')
  const [url, setUrl] = useState(item?.url ?? '')
  const [memo, setMemo] = useState(item?.memo ?? '')
  const [imageDataUrl, setImageDataUrl] = useState(item?.imageDataUrl)
  const [imageError, setImageError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0

  // 隠したカテゴリは選択肢に出さない。ただし編集中のものは残す
  const visibleCategories = categories.expenseVisible.some((c) => c.id === categoryId)
    ? categories.expenseVisible
    : [...categories.expenseVisible, categories.get(categoryId)]

  const pickImage = async (file: File | undefined) => {
    if (!file) return
    setImageError(null)
    try {
      setImageDataUrl(await fileToResizedDataUrl(file))
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '写真を読み込めませんでした')
    }
  }

  const submit = () => {
    if (!canSubmit) return
    const payload = {
      name: name.trim(),
      price: price === '' ? 0 : price,
      categoryId,
      url: url.trim() || undefined,
      memo: memo.trim() || undefined,
      imageDataUrl,
    }

    if (item) updateItem(item.id, payload)
    else addItem(payload)
    onDone()
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <Field label="なにがほしい？">
        {(id) => (
          <TextInput
            id={id}
            value={name}
            placeholder="ワイヤレスイヤホン"
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>

      <Field label="値段" hint="入れておくと「あと何円で買えるか」が出ます">
        {(id) => <AmountInput id={id} value={price} onChange={setPrice} />}
      </Field>

      <Field label="カテゴリ（買ったときに支出として記録される）">
        {(id) => (
          <select
            id={id}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-hairline bg-surface-2 px-3 text-base text-ink"
          >
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.emoji} {category.label}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="space-y-1.5">
        <span className="block text-xs font-bold text-ink-2">写真（なくてもOK）</span>
        {imageDataUrl ? (
          <div className="relative w-fit">
            <img
              src={imageDataUrl}
              alt={`${name || 'ほしいもの'}の写真`}
              className="h-28 w-28 rounded-xl border border-hairline object-cover"
            />
            <button
              type="button"
              onClick={() => setImageDataUrl(undefined)}
              aria-label="写真を消す"
              className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border border-hairline bg-surface-1 text-ink-2"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        ) : (
          <label className="flex min-h-12 w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 text-sm font-bold text-ink-2">
            <CameraIcon size={18} />
            写真をえらぶ
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void pickImage(event.target.files?.[0])}
            />
          </label>
        )}
        <p className="text-xs text-ink-muted">
          長辺 640px まで小さくして保存するので、端末の容量はほとんど使いません。
        </p>
        {imageError && (
          <p className="text-xs font-bold text-critical" role="alert">
            {imageError}
          </p>
        )}
      </div>

      <Field label="リンク（なくてもOK）">
        {(id) => (
          <TextInput
            id={id}
            type="url"
            inputMode="url"
            value={url}
            placeholder="https://"
            onChange={(event) => setUrl(event.target.value)}
          />
        )}
      </Field>

      <Field label="メモ（なくてもOK）">
        {(id) => (
          <TextArea
            id={id}
            value={memo}
            placeholder="誕生日までに買う！"
            maxLength={100}
            onChange={(event) => setMemo(event.target.value)}
          />
        )}
      </Field>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onDone}>
          やめる
        </Button>
        <Button type="submit" size="lg" className="flex-2" disabled={!canSubmit}>
          {item ? '保存する' : 'リストに追加'}
        </Button>
      </div>
    </form>
  )
}
