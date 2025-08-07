import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Activity, Calendar } from 'lucide-react'
import { format, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { formatDateWithWeekday } from '@/lib/utils/date-utils'
import type { ActivityWithRelations } from '@/lib/types/database'

async function getDashboardStats() {
  const supabase = await createClient()

  try {
    // 統計情報を並列で取得
    const [
      { count: totalSupporters },
      { count: activeSupporters },
      { count: totalServiceUsers },
      { count: totalActivities }
    ] = await Promise.all([
      supabase.from('supporters').select('*', { count: 'exact', head: true }),
      supabase.from('supporters').select('*', { count: 'exact', head: true }).eq('status', '登録完了'),
      supabase.from('service_users').select('*', { count: 'exact', head: true }),
      supabase.from('activities').select('*', { count: 'exact', head: true })
    ])

    return {
      totalSupporters: totalSupporters || 0,
      activeSupporters: activeSupporters || 0,
      totalServiceUsers: totalServiceUsers || 0,
      totalActivities: totalActivities || 0
    }
  } catch (error) {
    console.error('統計情報の取得に失敗しました:', error)
    return {
      totalSupporters: 0,
      activeSupporters: 0,
      totalServiceUsers: 0,
      totalActivities: 0
    }
  }
}

async function getTodayActivities(): Promise<ActivityWithRelations[]> {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  try {
    const { data, error } = await supabase
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
      .eq('activity_date', today)
      .order('activity_date', { ascending: true })

    if (error) throw error
    return (data as ActivityWithRelations[]) || []
  } catch (error) {
    console.error('本日の活動予定の取得に失敗しました:', error)
    return []
  }
}

async function getWeekActivities(): Promise<ActivityWithRelations[]> {
  const supabase = await createClient()
  const now = new Date()
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  try {
    const { data, error } = await supabase
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
      .gte('activity_date', weekStart)
      .lte('activity_date', weekEnd)
      .order('activity_date', { ascending: true })

    if (error) throw error
    return (data as ActivityWithRelations[]) || []
  } catch (error) {
    console.error('今週の活動予定の取得に失敗しました:', error)
    return []
  }
}

export default async function Dashboard() {
  const [stats, todayActivities, weekActivities] = await Promise.all([
    getDashboardStats(),
    getTodayActivities(),
    getWeekActivities()
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          システムの概要と本日の活動予定を確認できます
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総サポーター数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSupporters}</div>
            <p className="text-xs text-muted-foreground">
              登録されているサポーター
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活動中サポーター</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSupporters}</div>
            <p className="text-xs text-muted-foreground">
              登録完了ステータス
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総利用者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServiceUsers}</div>
            <p className="text-xs text-muted-foreground">
              登録されている利用者
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総活動回数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              これまでの活動実績
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 本日の活動予定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              本日の活動予定
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayActivities.length === 0 ? (
              <p className="text-muted-foreground">本日の活動予定はありません</p>
            ) : (
              <div className="space-y-3">
                {todayActivities.map((activity: ActivityWithRelations) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <div>
                      <p className="font-medium">
                        {activity.supporters.name} → {activity.service_users.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.skills.name} | {activity.time_slots.display_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                        {activity.activity_statuses.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 今週の活動予定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              今週の活動予定
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weekActivities.length === 0 ? (
              <p className="text-muted-foreground">今週の活動予定はありません</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {weekActivities.map((activity: ActivityWithRelations) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <div>
                      <p className="font-medium">
                        {activity.supporters.name} → {activity.service_users.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateWithWeekday(activity.activity_date)} | {activity.time_slots.display_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.skills.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        isToday(new Date(activity.activity_date)) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.activity_statuses.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
