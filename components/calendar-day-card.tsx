"use client"

import { cn } from "@/lib/utils"
import { format, isToday } from "date-fns"
import Link from "next/link"
import type { ActivityWithRelations } from "@/lib/types/database"

interface CalendarDayCardProps {
  date: Date
  activities: ActivityWithRelations[]
  isCurrentMonth: boolean
}

// 活動のドットの色を定義
const activityColors = ["bg-sky-500", "bg-emerald-500", "bg-amber-500"]

export function CalendarDayCard({ date, activities, isCurrentMonth }: CalendarDayCardProps) {
  const day = format(date, "d")
  const isTodayDate = isToday(date)
  const formattedDate = format(date, "yyyy-MM-dd")
  const dailyListUrl = `/activities?view=list&date_from=${formattedDate}&date_to=${formattedDate}`

  return (
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
          "text-right text-xs font-medium rounded-sm focus:outline-none focus:ring-2 focus:ring-ring",
          isTodayDate && "text-primary font-bold",
        )}
      >
        {day}
      </Link>
      <div className="flex-1 mt-0.5 space-y-1 overflow-y-auto scrollbar-hide">
        {/* 表示する活動は最大3件まで */}
        {activities.slice(0, 3).map((activity, index) => (
          <Link
            href={`/activities/${activity.id}`}
            key={activity.id}
            className="flex items-center gap-1 p-0.5 rounded-sm transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {/* 色付きドット */}
            <span
              className={cn(
                "block w-1.5 h-1.5 rounded-full flex-shrink-0",
                activityColors[index % activityColors.length],
              )}
            ></span>
            {/* 利用者名（はみ出たら省略） */}
            <p className="text-[10px] leading-tight truncate text-secondary-foreground">
              {activity.service_users.name}
            </p>
          </Link>
        ))}
        {/* 4件以上ある場合は件数を表示 */}
        {activities.length > 3 && (
          <Link
            href={dailyListUrl}
            className="block text-xs text-center text-muted-foreground mt-1 rounded-sm p-0.5 transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
          >
            他{activities.length - 3}件
          </Link>
        )}
      </div>
    </div>
  )
}