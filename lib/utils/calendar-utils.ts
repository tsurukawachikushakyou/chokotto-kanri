import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  // ★ 修正点: isSaturday と isSunday のインポートを削除
} from "date-fns"
import { ja } from "date-fns/locale"
import holiday_jp from "@holiday-jp/holiday_jp"

/**
 * 指定された月のカレンダーグリッドを構成する日付の配列を返します。
 * 週の始まりは日曜日です。
 */
export function getCalendarDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 }) // 0 = Sunday
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end })
}

/**
 * 日付を「YYYY年M月」形式でフォーマットします。
 */
export function formatMonthYear(date: Date): string {
  return format(date, "yyyy年M月", { locale: ja })
}

/**
 * 指定された日付の1ヶ月前の日付を返します。
 */
export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1)
}

/**
 * 指定された日付の1ヶ月後の日付を返します。
 */
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1)
}

/**
 * 指定された日付が日本の祝日かどうかを判定します。
 * @param date - 判定するDateオブジェクト
 * @returns 祝日であればtrue、そうでなければfalse
 */
export function isHoliday(date: Date): boolean {
  return holiday_jp.isHoliday(date)
}

/**
 * 曜日の表示名（日曜日始まり）
 */
export const dayNames = ["日", "月", "火", "水", "木", "金", "土"]