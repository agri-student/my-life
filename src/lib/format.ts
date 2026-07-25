const numberFormat = new Intl.NumberFormat('ja-JP')

/** 1200 -> "1,200円" */
export function yen(amount: number): string {
  return `${numberFormat.format(Math.round(amount))}円`
}

/** 1200 -> "1,200"（単位を別要素で出したいとき） */
export function num(amount: number): string {
  return numberFormat.format(Math.round(amount))
}

/** 0.324 -> "32%"（0 より大きく 1% 未満なら "1%未満"） */
export function percent(ratio: number): string {
  if (ratio > 0 && ratio < 0.005) return '1%未満'
  return `${Math.round(ratio * 100)}%`
}

/** 収支の符号つき表示。+1200円 / -800円 */
export function signedYen(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
  return `${sign}${yen(Math.abs(amount))}`
}
