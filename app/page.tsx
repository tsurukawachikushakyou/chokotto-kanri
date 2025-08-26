import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, UserCheck, Activity, Clock } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { formatDateWithWeekday } from '@/lib/utils/date-utils'
import type { ActivityWithRelations } from '@/lib/types/database'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ActivityCalendar } from '@/components/activity-calendar'

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

async function getMonthActivities(): Promise<ActivityWithRelations[]> {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`*, supporters!inner(id, name), service_users!inner(id, name), skills!inner(name), time_slots!inner(display_name), activity_statuses!inner(name)`)
      .gte('activity_date', monthStart)
      .lte('activity_date', monthEnd)
      .order('activity_date', { ascending: true })
    if (error) throw error
    return (data as ActivityWithRelations[]) || []
  } catch (error) {
    console.error('今月の活動予定の取得に失敗しました:', error)
    return []
  }
}

export default async function Dashboard() {
  const [stats, monthActivities] = await Promise.all([
    getDashboardStats(),
    getMonthActivities()
  ])

  const today = new Date()
  const todayActivities = monthActivities.filter(activity => isToday(new Date(activity.activity_date)))
  const weekActivities = monthActivities.filter(activity => {
      const activityDate = new Date(activity.activity_date);
      return activityDate >= startOfWeek(today, { weekStartsOn: 1 }) && activityDate <= endOfWeek(today, { weekStartsOn: 1 });
  });

  // CSS変数をコンポーネント内で定義
  const supporterColor = 'hsl(var(--supporter))';
  const userColor = 'hsl(var(--user))';
  const primaryColor = 'hsl(var(--primary))';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">システムの概要と今後の活動予定を確認できます</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/supporters">
          <Card className="transition-all hover:shadow-md" style={{ borderColor: `hsla(221.2, 83.2%, 53.3%, 0.2)`, backgroundColor: `hsla(221.2, 83.2%, 53.3%, 0.05)` }}>
            <CardHeader className="pb-2">
              <CardDescription className="flex justify-between items-center">
                <span>総サポーター数</span>
                <Users className="h-4 w-4" style={{ color: supporterColor }} />
              </CardDescription>
              <CardTitle className="text-3xl" style={{ color: supporterColor }}>{stats.totalSupporters}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">登録サポーター</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/supporters?status=登録完了">
          <Card className="transition-all hover:shadow-md" style={{ borderColor: `hsla(221.2, 83.2%, 53.3%, 0.2)`, backgroundColor: `hsla(221.2, 83.2%, 53.3%, 0.05)` }}>
            <CardHeader className="pb-2">
              <CardDescription className="flex justify-between items-center">
                <span>活動中サポーター</span>
                <UserCheck className="h-4 w-4" style={{ color: supporterColor }} />
              </CardDescription>
              <CardTitle className="text-3xl" style={{ color: supporterColor }}>{stats.activeSupporters}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">「登録完了」ステータス</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/service-users">
          <Card className="transition-all hover:shadow-md" style={{ borderColor: `hsla(142.1, 76.2%, 36.3%, 0.2)`, backgroundColor: `hsla(142.1, 76.2%, 36.3%, 0.05)` }}>
            <CardHeader className="pb-2">
              <CardDescription className="flex justify-between items-center">
                <span>総利用者数</span>
                <Users className="h-4 w-4" style={{ color: userColor }} />
              </CardDescription>
              <CardTitle className="text-3xl" style={{ color: userColor }}>{stats.totalServiceUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">登録されている利用者</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/activities">
          <Card className="transition-all hover:shadow-md" style={{ borderColor: `hsla(0, 0%, 9%, 0.2)`, backgroundColor: `hsla(0, 0%, 9%, 0.05)` }}>
            <CardHeader className="pb-2">
              <CardDescription className="flex justify-between items-center">
                <span>総活動回数</span>
                <Activity className="h-4 w-4" style={{ color: primaryColor }} />
              </CardDescription>
              <CardTitle className="text-3xl" style={{ color: primaryColor }}>{stats.totalActivities}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">これまでの全活動実績</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>本日の活動予定</CardTitle>
            <CardDescription>今日行われる活動の一覧です。</CardDescription>
          </CardHeader>
          <CardContent>
            {todayActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">本日の活動予定はありません</p>
            ) : (
              <div className="space-y-1">
                {todayActivities.map((activity) => (
                  <Link key={activity.id} href={`/activities/${activity.id}`} className="block p-3 rounded-md hover:bg-accent">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1.5">
                        <p className="font-semibold">{activity.skills.name}</p>
                        <p className="text-sm font-medium">
                          <span>{activity.supporters.name}</span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span>{activity.service_users.name}</span>
                        </p>
                        {/* ★ 改善点: 時間をアイコン付きで表示 */}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{activity.time_slots.display_name}{activity.arbitrary_time_notes && ` (${activity.arbitrary_time_notes})`}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">{activity.activity_statuses.name}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>今週の活動予定</CardTitle>
            <CardDescription>本日以降の今週の活動一覧です。</CardDescription>
          </CardHeader>
          <CardContent>
            {weekActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">今週の活動予定はありません</p>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {weekActivities.map((activity) => (
                  <Link key={activity.id} href={`/activities/${activity.id}`} className="block p-3 rounded-md hover:bg-accent">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1.5">
                        <p className={cn("font-semibold", isToday(new Date(activity.activity_date)) && "text-primary")}>
                          {formatDateWithWeekday(activity.activity_date)}
                        </p>
                        <p className="text-sm font-medium">
                          <span>{activity.supporters.name}</span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span>{activity.service_users.name}</span>
                        </p>
                        {/* ★ 改善点: 時間をアイコン付きで表示 */}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{activity.time_slots.display_name}{activity.arbitrary_time_notes && ` (${activity.arbitrary_time_notes})`}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">{activity.activity_statuses.name}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>今月の活動カレンダー</CardTitle>
              <CardDescription>今月の活動予定の概要をカレンダーで確認できます。</CardDescription>
          </CardHeader>
          <CardContent>
              <ActivityCalendar initialActivities={monthActivities} initialMonth={format(today, "yyyy-MM-dd")} />
          </CardContent>
      </Card>
    </div>
  )
}