import { useEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import { IconButton } from './Button'

interface BottomSheetProps {
  open: boolean
  title: string
  onClose(): void
  children: ReactNode
}

/**
 * スマホでは下からのシート、PC では中央のダイアログとして出る入力パネル。
 * <dialog> を使うので、Esc キー・フォーカストラップ・背面のスクロール止めが標準で付く。
 */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // モーダルの <dialog> は inset:0 + margin:auto で中央に来る。
  // 縦マージンを mt-auto / mb-0 にするとスマホでは下寄せ（= シート）になる。
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // 背景（dialog 自身）のタップで閉じる
        if (event.target === ref.current) onClose()
      }}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-lg rounded-t-3xl border border-hairline bg-surface-1 p-0 text-ink backdrop:bg-black/40 sm:my-auto sm:rounded-3xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
        <h2 className="text-base font-bold">{title}</h2>
        <IconButton label="閉じる" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className="safe-bottom max-h-[calc(92dvh-3.5rem)] overflow-y-auto px-4 py-4">
        {children}
      </div>
    </dialog>
  )
}
