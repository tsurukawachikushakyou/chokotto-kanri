"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getCalendarDays, formatMonthYear, getPreviousMonth, getNextMonth, dayNames } from "@/lib/utils/calendar-utils"
import { CalendarDayCard } from "./calendar-day-card"
import { isSameMonth, format } from "date-fns"
import type { ActivityWithRelations } from "@/lib/types/database"
import { useRouter, useSearchParams } from "next/navigation"

interface ActivityCalendarProps {
  initialActivities: ActivityWithRelations[]
  initialMonth: string // YYYY-MM-DD format
}

export function ActivityCalendar({ initialActivities, initialMonth }: ActivityCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // initialMonthを基に現在の表示月を初期化
  const [currentDate, setCurrentDate] = useState<Date>(new Date(initialMonth))

  // サーバーコンポーネントから渡された活動データを日付ごとにグループ化
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, ActivityWithRelations[]>()
    initialActivities.forEach((activity) => {
      const dateKey = format(new Date(activity.activity_date), "yyyy-MM-dd")
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)?.push(activity)
    })
    return map
  }, [initialActivities])

  // 現在の表示月に基づいてカレンダーの日付を生成
  const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate])

  // URLのmonthパラメータを更新する関数
  const updateMonthInUrl = useCallback(
    (newDate: Date) => {
      const newMonthString = format(newDate, "yyyy-MM-dd")
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      current.set("month", newMonthString)
      current.set("view", "calendar") // カレンダー表示を維持
      const query = current.toString()
      router.push(`/activities?${query}`)
    },
    [router, searchParams],
  )

  const handlePreviousMonth = useCallback(() => {
    const newDate = getPreviousMonth(currentDate)
    setCurrentDate(newDate)
    updateMonthInUrl(newDate)
  }, [currentDate, updateMonthInUrl])

  const handleNextMonth = useCallback(() => {
    const newDate = getNextMonth(currentDate)
    setCurrentDate(newDate)
    updateMonthInUrl(newDate)
  }, [currentDate, updateMonthInUrl])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl sm:text-2xl font-bold">{formatMonthYear(currentDate)}</h2>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {dayNames.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayDate, index) => {
          const dateKey = format(dayDate, "yyyy-MM-dd")
          const activitiesForDay = activitiesByDate.get(dateKey) || []
          const isDayInCurrentMonth = isSameMonth(dayDate, currentDate)

          return (
            <CalendarDayCard
              key={index}
              date={dayDate}
              activities={activitiesForDay}
              isCurrentMonth={isDayInCurrentMonth}
            />
          )
        })}
      </div>
    </div>
  )
}