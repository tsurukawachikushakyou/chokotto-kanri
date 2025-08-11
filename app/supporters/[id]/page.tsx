import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Edit, ArrowLeft, Calendar, User, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { formatDate, formatDateWithWeekday } from '@/lib/utils/date-utils'
import type { PagePropsWithId } from '@/lib/types/page-props'
import type { SupporterWithRelations } from '@/lib/types/database'

interface SupporterActivity {
  id: string
  activity_date: string
  notes: string | null
  service_users: {
    name: string
  }
  skills: {
    name: string
  }
  time_slots: {
    display_name: string
  }
  activity_statuses: {
    name: string
  }
}

async function getSupporter(id: string): Promise<SupporterWithRelations | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('supporters')
      .select(`
        *,
        supporter_skills(
          skills(id, name, category)
        ),
        supporter_schedules(
          time_slots(id, display_name, day_of_week, period)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as SupporterWithRelations
  } catch (error) {
    console.error('サポーター詳細の取得に失敗しました:', error)
    return null
  }
}

async function getSupporterActivities(supporterId: string): Promise<SupporterActivity[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        activity_date,
        notes,
        service_users(name),
        skills(name),
        time_slots(display_name),
        activity_statuses(name)
      `)
      .eq('supporter_id', supporterId)
      .order('activity_date', { ascending: false })
      .limit(10)

    if (error) throw error
    return (data as SupporterActivity[]) || []
  } catch (error) {
    console.error('活動履歴の取得に失敗しました:', error)
    return []
  }
}

const statusColors = {
  '応募受付': 'bg-yellow-100 text-yellow-800',
  '面接済み': 'bg-blue-100 text-blue-800',
  '登録完了': 'bg-green-100 text-green-800',
  '休止中': 'bg-gray-100 text-gray-800',
} as const

export default async function SupporterDetailPage(props: PagePropsWithId) {
  const params = await props.params
  const [supporter, activities] = await Promise.all([
    getSupporter(params.id),
    getSupporterActivities(params.id)
  ])

  if (!supporter) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/supporters">
              <ArrowLeft className="mr-2 h-4 w-4" />
              一覧に戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{supporter.name}</h1>
            <p className="text-muted-foreground">サポーター詳細情報</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/supporters/${supporter.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">ステータス</span>
              <Badge className={statusColors[supporter.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                {supporter.status || 'N/A'}
              </Badge>
            </div>

            {supporter.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{supporter.phone}</span>
              </div>
            )}

            {supporter.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{supporter.email}</span>
              </div>
            )}

            {supporter.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{supporter.address}</span>
              </div>
            )}

            {supporter.area && (
              <div>
                <span className="font-medium">エリア: </span>
                <span>{supporter.area}</span>
              </div>
            )}

            {supporter.notes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">備考</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {supporter.notes}
                </p>
              </div>
            )}

            <Separator />

            <div className="text-sm text-muted-foreground">
              <p>登録日: {formatDate(supporter.created_at)}</p>
              <p>更新日: {formatDate(supporter.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* スキル・スケジュール */}
        <div className="space-y-6">
          {/* スキル */}
          <Card>
            <CardHeader>
              <CardTitle>できること</CardTitle>
            </CardHeader>
            <CardContent>
              {supporter.supporter_skills.length === 0 ? (
                <p className="text-muted-foreground">できることが登録されていません</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {supporter.supporter_skills.map((ss) => (
                    <Badge key={ss.skills.id} variant="secondary">
                      {ss.skills.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 活動可能時間 */}
          <Card>
            <CardHeader>
              <CardTitle>活動可能時間</CardTitle>
            </CardHeader>
            <CardContent>
              {supporter.supporter_schedules.length === 0 ? (
                <p className="text-muted-foreground">活動可能時間が登録されていません</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {supporter.supporter_schedules
                    .sort((a, b) => a.time_slots.day_of_week - b.time_slots.day_of_week)
                    .map((ss) => (
                      <div key={ss.time_slots.id} className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{ss.time_slots.display_name}</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 活動履歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>最近の活動履歴</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/activities?supporter=${supporter.id}`}>
                すべて見る
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground">活動履歴がありません</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity: SupporterActivity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div>
                    <p className="font-medium">
                      {activity.service_users.name} - {activity.skills.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateWithWeekday(activity.activity_date)} | {activity.time_slots.display_name}
                    </p>
                    {activity.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {activity.activity_statuses.name}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
