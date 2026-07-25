/**
 * 写真を LocalStorage に入れられるサイズまで縮めて data URL にする。
 *
 * LocalStorage は 5MB 前後しかなく、data URL は Base64 で約 1.33 倍に膨らむ。
 * スマホの写真をそのまま入れると数枚で容量オーバーするので、
 * 長辺 640px / JPEG 品質 0.7 まで落としてから保存する。
 */
const MAX_EDGE = 640
const QUALITY = 0.7

export async function fileToResizedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('画像ファイルを選んでください')
  }

  const bitmap = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('画像を処理できませんでした')
  ctx.drawImage(bitmap, 0, 0, width, height)

  if ('close' in bitmap) bitmap.close()

  return canvas.toDataURL('image/jpeg', QUALITY)
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }

  // Safari の古いバージョン向けフォールバック
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}
