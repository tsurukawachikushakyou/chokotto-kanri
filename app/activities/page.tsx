import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Eye, CheckCircle } from 'lucide-react'
import { ActivityFilters } from '@/components/activity-filters'
import { formatDateWithWeekday } from '@/lib/utils/date-utils'
import { parseSearchParams, type BasePageProps } from '@/lib/types/page-props'
import type { ActivityFilters as ActivityFiltersType, ActivityWithRelations } from '@/lib/types/database'

async function getActivities(searchParams: ActivityFiltersType): Promise<ActivityWithRelations[]> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('activities')
      .select(`
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
    if (searchParams.supporter && searchParams.supporter !== 'all') {
      query = query.eq('supporter_id', searchParams.supporter)
    }
    if (searchParams.service_user && searchParams.service_user !== 'all') {
      query = query.eq('service_user_id', searchParams.service_user)
    }
    if (searchParams.status && searchParams.status !== 'all') {
      query = query.eq('status_id', searchParams.status)
    }
    if (searchParams.date_from) {
      query = query.gte('activity_date', searchParams.date_from)
    }
    if (searchParams.date_to) {
      query = query.lte('activity_date', searchParams.date_to)
    }

    const { data, error } = await query.order('activity_date', { ascending: false })

    if (error) throw error

    // 名前検索は後処理で行う
    let filteredData = (data as ActivityWithRelations[]) || []
    if (searchParams.search) {
      const searchLower = searchParams.search.toLowerCase()
      filteredData = filteredData.filter((activity: ActivityWithRelations) =>
        activity.supporters.name.toLowerCase().includes(searchLower) ||
        activity.service_users.name.toLowerCase().includes(searchLower) ||
        activity.skills.name.toLowerCase().includes(searchLower)
      )
    }

    return filteredData
  } catch (error) {
    console.error('活動履歴一覧の取得に失敗しました:', error)
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
    const [
      { data: supporters },
      { data: serviceUsers },
      { data: statuses }
    ] = await Promise.all([
      supabase.from('supporters').select('id, name').order('name'),
      supabase.from('service_users').select('id, name').order('name'),
      supabase.from('activity_statuses').select('id, name').order('name')
    ])

    return {
      supporters: (supporters as FilterOption[]) || [],
      serviceUsers: (serviceUsers as FilterOption[]) || [],
      statuses: (statuses as FilterOption[]) || []
    }
  } catch (error) {
    console.error('フィルタオプションの取得に失敗しました:', error)
    return { supporters: [], serviceUsers: [], statuses: [] }
  }
}

const statusColors = {
  '予定': 'bg-blue-100 text-blue-800',
  '完了': 'bg-green-100 text-green-800',
  'キャンセル': 'bg-red-100 text-red-800',
  '仮予約': 'bg-yellow-100 text-yellow-800',
} as const

export default async function ActivitiesPage(props: BasePageProps) {
  const searchParams = parseSearchParams(await props.searchParams)
  const [activities, filterOptions] = await Promise.all([
    getActivities(searchParams),
    getFilterOptions()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">活動履歴一覧</h1>
          <p className="text-muted-foreground">
            すべての活動履歴を管理できます
          </p>
        </div>
        <Button asChild>
          <Link href="/activities/new">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      {/* フィルター */}
      <ActivityFilters 
        supporters={filterOptions.supporters}
        serviceUsers={filterOptions.serviceUsers}
        statuses={filterOptions.statuses}
        initialValues={searchParams}
      />

      {/* 活動履歴一覧 */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">条件に一致する活動履歴が見つかりません</p>
          </div>
        ) : (
          activities.map((activity: ActivityWithRelations) => (
            <Card key={activity.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold">
                        {activity.supporters.name} → {activity.service_users.name}
                      </h3>
                      <Badge className={statusColors[activity.activity_statuses.name as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                        {activity.activity_statuses.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>📅 {formatDateWithWeekday(activity.activity_date)}</span>
                      <span>⏰ {activity.time_slots.display_name}</span>
                      <span>🔧 {activity.skills.name}</span>
                    </div>
                    {activity.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        💬 {activity.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/activities/${activity.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        詳細
                      </Link>
                    </Button>
                    {activity.activity_statuses.name === '予定' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/activities/${activity.id}/complete`}>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          完了
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
    </div>
  )
}
