"use client"

import { cn } from "@/lib/utils"
import { format, isToday, isSaturday, isSunday } from "date-fns"
import { isHoliday } from "@/lib/utils/calendar-utils"
import Link from "next/link"
import type { ActivityWithRelations } from "@/lib/types/database"

interface CalendarDayCardProps {
  date: Date
  activities: ActivityWithRelations[]
  isCurrentMonth: boolean
}

const activityColors = [
  { bg: 'bg-sky-100', text: 'text-sky-800', hoverBg: 'hover:bg-sky-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', hoverBg: 'hover:bg-emerald-200' },
  { bg: 'bg-amber-100', text: 'text-amber-800', hoverBg: 'hover:bg-amber-200' },
  { bg: 'bg-rose-100', text: 'text-rose-800', hoverBg: 'hover:bg-rose-200' },
]

export function CalendarDayCard({ date, activities, isCurrentMonth }: CalendarDayCardProps) {
  const day = format(date, "d")
  const isTodayDate = isToday(date)
  const formattedDate = format(date, "yyyy-MM-dd")
  const dailyListUrl = `/activities?view=list&date_from=${formattedDate}&date_to=${formattedDate}`

  const isWeekend = isSaturday(date) || isSunday(date)
  const isPublicHoliday = isHoliday(date)

  return (
    // ★ 改善点: 高さを h-20 (80px) に変更し、スクロールを不要にする
    <div
      className={cn(
        "relative h-20 p-1.5 border rounded-md flex flex-col overflow-hidden",
        !isCurrentMonth && "text-muted-foreground bg-muted/40",
        isTodayDate && "border-primary",
      )}
    >
      <Link
        href={dailyListUrl}
        className={cn(
          "text-right text-xs font-semibold rounded-sm focus:outline-none focus:ring-2 focus:ring-ring",
          isTodayDate && "text-primary font-bold",
          (isWeekend || isPublicHoliday) && isCurrentMonth && "text-red-500",
        )}
      >
        {day}
      </Link>
      <div className="flex-1 mt-1 space-y-1 overflow-y-auto scrollbar-hide">
        {/* ★ 改善点: 予定の表示方法を「1件のみ」または「件数バッジ」に最適化 */}
        {activities.length === 1 && (
          <Link
            href={`/activities/${activities[0].id}`}
            title={activities[0].service_users.name}
            className={cn(
              "block w-full text-left rounded-sm px-1.5 py-0.5 text-xs font-semibold truncate transition-colors",
              activityColors[0].bg,
              activityColors[0].text,
              activityColors[0].hoverBg,
              "focus:outline-none focus:ring-1 focus:ring-ring"
            )}
          >
            {activities[0].service_users.name}
          </Link>
        )}
        {activities.length > 1 && (
          <Link
            href={dailyListUrl}
            className="block text-center mt-2"
          >
            <span className="inline-flex items-center justify-center text-xs font-bold text-primary bg-primary/10 rounded-full h-6 w-6 hover:bg-primary/20 transition-colors">
              +{activities.length}
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}