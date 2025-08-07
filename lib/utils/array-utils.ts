/**
 * 配列操作用のユーティリティ関数
 * 型安全なフィルタリング
 */

/**
 * null値を除外する型ガード関数
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * 文字列配列からnull/undefinedを除外
 */
export function filterNullableStrings(
  array: (string | null | undefined)[]
): string[] {
  return array.filter(isNotNull)
}

/**
 * 配列から重複を除去（null安全）
 */
export function getUniqueValues<T>(
  array: (T | null | undefined)[],
  selector?: (item: T) => string | number
): T[] {
  const validItems = array.filter(isNotNull)
  
  if (!selector) {
    return [...new Set(validItems)]
  }
  
  const seen = new Set<string | number>()
  return validItems.filter(item => {
    const key = selector(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
