import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, UserCheck, Activity } from 'lucide-react' // ★ 不要なアイコンを削除
import { format, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { formatDateWithWeekday } from '@/lib/utils/date-utils'
import type { ActivityWithRelations } from '@/lib/types/database'
import Link from 'next/link'
// import { Button } from '@/components/ui/button' // ★ Buttonは使っていないので削除
import { Badge } from '@/components/ui/badge'

// --- データ取得関数 (変更なし) ---
async function getDashboardStats() {
  const supabase = await createClient()
  try {
    const [{ count: totalSupporters }, { count: activeSupporters }, { count: totalServiceUsers }, { count: totalActivities }] = await Promise.all([
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
    return { totalSupporters: 0, activeSupporters: 0, totalServiceUsers: 0, totalActivities: 0 }
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
      .select(`*, supporters!inner(id, name), service_users!inner(id, name), skills!inner(name), time_slots!inner(display_name), activity_statuses!inner(name)`)
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

// --- コンポーネント ---
export default async function Dashboard() {
  const [stats, weekActivities] = await Promise.all([
    getDashboardStats(),
    getWeekActivities()
  ])

  const todayActivities = weekActivities.filter(activity => isToday(new Date(activity.activity_date)))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">システムの概要と今後の活動予定を確認できます</p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex justify-between items-center">
              <span>総サポーター数</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalSupporters}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">登録されている全サポーター</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex justify-between items-center">
              <span>活動中サポーター</span>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-3xl">{stats.activeSupporters}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">「登録完了」ステータス</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex justify-between items-center">
              <span>総利用者数</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalServiceUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">登録されている全利用者</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex justify-between items-center">
              <span>総活動回数</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalActivities}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">これまでの全活動実績</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 本日の活動予定 */}
        <Card>
          <CardHeader>
            <CardTitle>本日の活動予定</CardTitle>
            <CardDescription>今日行われる活動の一覧です。</CardDescription>
          </CardHeader>
          <CardContent>
            {todayActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">本日の活動予定はありません</p>
            ) : (
              <div className="space-y-4">
                {todayActivities.map((activity) => (
                  <Link key={activity.id} href={`/activities/${activity.id}`} className="block p-3 rounded-md hover:bg-accent">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-semibold">{activity.skills.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.supporters.name} → {activity.service_users.name}
                        </p>
                      </div>
                      <Badge variant="outline">{activity.activity_statuses.name}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 今週の活動予定 */}
        <Card>
          <CardHeader>
            <CardTitle>今週の活動予定</CardTitle>
            <CardDescription>本日以降の今週の活動一覧です。</CardDescription>
          </CardHeader>
          <CardContent>
            {weekActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">今週の活動予定はありません</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {weekActivities.map((activity) => (
                  <Link key={activity.id} href={`/activities/${activity.id}`} className="block p-3 rounded-md hover:bg-accent">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-semibold">{formatDateWithWeekday(activity.activity_date)}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.supporters.name} → {activity.service_users.name}
                        </p>
                      </div>
                      <Badge variant={isToday(new Date(activity.activity_date)) ? "default" : "outline"}>
                        {activity.activity_statuses.name}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}