import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * 日付フォーマット用のユーティリティ関数
 * null値を安全に処理
 */
export function formatDate(
  date: string | null | undefined,
  formatString: string = 'yyyy年M月d日'
): string {
  if (!date) return 'N/A'
  
  try {
    return format(new Date(date), formatString, { locale: ja })
  } catch (error) {
    console.error('日付フォーマットエラー:', error)
    return 'N/A'
  }
}

export function formatDateTime(
  date: string | null | undefined,
  formatString: string = 'yyyy年M月d日 HH:mm'
): string {
  if (!date) return 'N/A'
  
  try {
    return format(new Date(date), formatString, { locale: ja })
  } catch (error) {
    console.error('日時フォーマットエラー:', error)
    return 'N/A'
  }
}

export function formatDateWithWeekday(
  date: string | null | undefined
): string {
  if (!date) return 'N/A'
  
  try {
    return format(new Date(date), 'yyyy年M月d日(E)', { locale: ja })
  } catch (error) {
    console.error('日付フォーマットエラー:', error)
    return 'N/A'
  }
}
