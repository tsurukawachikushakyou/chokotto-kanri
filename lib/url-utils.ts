/**
 * URL操作のユーティリティ関数
 * クライアントサイドでのURL操作を統一化
 */

export function createSearchParamsString(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== 'all' && value.trim() !== '') {
      searchParams.set(key, value)
    }
  })
  
  return searchParams.toString()
}

export function updateUrlWithParams(
  pathname: string, 
  params: Record<string, string | undefined>
): string {
  const searchString = createSearchParamsString(params)
  return searchString ? `${pathname}?${searchString}` : pathname
}
