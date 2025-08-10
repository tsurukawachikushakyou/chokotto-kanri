import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye, CheckCircle, List, CalendarDays } from "lucide-react"
import { ActivityFilters } from "@/components/activity-filters"
import { formatDateWithWeekday } from "@/lib/utils/date-utils"
import { parseSearchParams, type BasePageProps } from "@/lib/types/page-props"
import type { ActivityFilters as ActivityFiltersType, ActivityWithRelations } from "@/lib/types/database"
import { ActivityCalendar } from "@/components/activity-calendar"
import { format, startOfMonth, endOfMonth } from "date-fns"

async function getActivities(searchParams: ActivityFiltersType): Promise<ActivityWithRelations[]> {
  const supabase = await createClient()

  try {
    let query = supabase.from("activities").select(`
        id,
        activity_date,
        notes,
        supporter_id,
        service_user_id,
        skill_id,
        time_slot_id,
        status_id,
        created_at,
        updated_at,
        supporters!inner(id, name),
        service_users!inner(id, name),
        skills!inner(name),
        time_slots!inner(display_name),
        activity_statuses!inner(name)
      `)

    // フィルタリング
    if (searchParams.supporter && searchParams.supporter !== "all") {
      query = query.eq("supporter_id", searchParams.supporter)
    }
    if (searchParams.service_user && searchParams.service_user !== "all") {
      query = query.eq("service_user_id", searchParams.service_user)
    }
    if (searchParams.status && searchParams.status !== "all") {
      query = query.eq("status_id", searchParams.status)
    }
    if (searchParams.date_from) {
      query = query.gte("activity_date", searchParams.date_from)
    }
    if (searchParams.date_to) {
      query = query.lte("activity_date", searchParams.date_to)
    }

    const { data, error } = await query.order("activity_date", { ascending: false })

    if (error) throw error

    // 名前検索は後処理で行う
    let filteredData = (data as ActivityWithRelations[]) || []
    if (searchParams.search) {
      const searchLower = searchParams.search.toLowerCase()
      filteredData = filteredData.filter(
        (activity: ActivityWithRelations) =>
          activity.supporters.name.toLowerCase().includes(searchLower) ||
          activity.service_users.name.toLowerCase().includes(searchLower) ||
          activity.skills.name.toLowerCase().includes(searchLower),
      )
    }

    return filteredData
  } catch (error) {
    console.error("活動履歴一覧の取得に失敗しました:", error)
    return []
  }
}

interface FilterOption {
  id: string
  name: string
}

async function getFilterOptions(): Promise<{
  supporters: FilterOption[]
  serviceUsers: FilterOption[]
  statuses: FilterOption[]
}> {
  const supabase = await createClient()

  try {
    const [{ data: supporters }, { data: serviceUsers }, { data: statuses }] = await Promise.all([
      supabase.from("supporters").select("id, name").order("name"),
      supabase.from("service_users").select("id, name").order("name"),
      supabase.from("activity_statuses").select("id, name").order("name"),
    ])

    return {
      supporters: (supporters as FilterOption[]) || [],
      serviceUsers: (serviceUsers as FilterOption[]) || [],
      statuses: (statuses as FilterOption[]) || [],
    }
  } catch (error) {
    console.error("フィルタオプションの取得に失敗しました:", error)
    return { supporters: [], serviceUsers: [], statuses: [] }
  }
}

const statusColors = {
  予定: "bg-blue-100 text-blue-800 border-blue-200",
  完了: "bg-green-100 text-green-800 border-green-200",
  キャンセル: "bg-red-100 text-red-800 border-red-200",
  仮予約: "bg-yellow-100 text-yellow-800 border-yellow-200",
} as const

export default async function ActivitiesPage(props: BasePageProps) {
  const searchParams = parseSearchParams(await props.searchParams)
  const viewMode = searchParams.view === "calendar" ? "calendar" : "list"

  let activities: ActivityWithRelations[] = []
  const filterOptions = await getFilterOptions()

  let initialCalendarMonth: string = format(new Date(), "yyyy-MM-dd")

  if (viewMode === "calendar") {
    const currentCalendarDate = searchParams.month ? new Date(searchParams.month) : new Date()
    initialCalendarMonth = format(currentCalendarDate, "yyyy-MM-dd")

    const monthStart = format(startOfMonth(currentCalendarDate), "yyyy-MM-dd")
    const monthEnd = format(endOfMonth(currentCalendarDate), "yyyy-MM-dd")

    activities = await getActivities({
      date_from: monthStart,
      date_to: monthEnd,
    })
  } else {
    activities = await getActivities(searchParams)
  }

  // コンテナのクラスを統一し、常に同じ幅にする
  const containerClass = "max-w-4xl mx-auto px-4 sm:px-6 space-y-6"

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">活動履歴一覧</h1>
          <p className="text-muted-foreground">すべての活動履歴を管理できます</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button asChild>
            <Link href="/activities/new">
              <Plus className="mr-2 h-4 w-4" />
              新規登録
            </Link>
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" asChild>
            <Link href="/activities?view=list">
              <List className="mr-2 h-4 w-4" />
              リスト表示
            </Link>
          </Button>
          <Button variant={viewMode === "calendar" ? "default" : "outline"} size="sm" asChild>
            <Link href={`/activities?view=calendar&month=${initialCalendarMonth}`}>
              <CalendarDays className="mr-2 h-4 w-4" />
              カレンダー表示
            </Link>
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          <ActivityFilters
            supporters={filterOptions.supporters}
            serviceUsers={filterOptions.serviceUsers}
            statuses={filterOptions.statuses}
            initialValues={searchParams}
          />
          <div className="space-y-4">
            {activities.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">条件に一致する活動履歴が見つかりません</p>
                </CardContent>
              </Card>
            ) : (
              activities.map((activity: ActivityWithRelations) => (
                <Card key={activity.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-grow space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2">
                          <h3 className="text-lg font-semibold leading-tight">
                            <span className="font-bold">{activity.supporters.name}</span>
                            <span className="mx-2 text-muted-foreground">→</span>
                            <span className="font-bold">{activity.service_users.name}</span>
                          </h3>
                          <Badge
                            className={
                              statusColors[activity.activity_statuses.name as keyof typeof statusColors] ||
                              "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {activity.activity_statuses.name}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> {formatDateWithWeekday(activity.activity_date)}
                          </span>
                          <span className="flex items-center">
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> {activity.time_slots.display_name}
                          </span>
                          <span className="flex items-center">
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> {activity.skills.name}
                          </span>
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-muted-foreground pt-1">
                            <span className="font-medium">備考:</span> {activity.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <Link href={`/activities/${activity.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            詳細表示
                          </Link>
                        </Button>
                        {activity.activity_statuses.name === "予定" && (
                          <Button variant="outline" size="sm" asChild className="w-full">
                            <Link href={`/activities/${activity.id}/complete`}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              完了処理
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        <ActivityCalendar initialActivities={activities} initialMonth={initialCalendarMonth} />
      )}
    </div>
  )
}