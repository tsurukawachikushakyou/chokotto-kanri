import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Edit, ArrowLeft, CheckCircle, Calendar, Clock, User, Users } from 'lucide-react'
import { formatDateWithWeekday } from '@/lib/utils/date-utils'
import type { PagePropsWithId } from '@/lib/types/page-props'

interface ActivityDetail {
  id: string
  activity_date: string
  notes: string | null
  supporter_id: string
  service_user_id: string
  skill_id: string
  time_slot_id: string
  status_id: string
  created_at: string
  updated_at: string
  supporters: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  service_users: {
    id: string
    name: string
    phone: string | null
    email: string | null
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

async function getActivity(id: string): Promise<ActivityDetail | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        supporters(id, name, phone, email),
        service_users(id, name, phone, email),
        skills(name),
        time_slots(display_name),
        activity_statuses(name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ActivityDetail
  } catch (error) {
    console.error('活動詳細の取得に失敗しました:', error)
    return null
  }
}

const statusColors = {
  '予定': 'bg-blue-100 text-blue-800',
  '完了': 'bg-green-100 text-green-800',
  'キャンセル': 'bg-red-100 text-red-800',
  '仮予約': 'bg-yellow-100 text-yellow-800',
} as const

export default async function ActivityDetailPage(props: PagePropsWithId) {
  const params = await props.params
  const activity = await getActivity(params.id)

  if (!activity) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/activities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              一覧に戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">活動詳細</h1>
            <p className="text-muted-foreground">
              {formatDateWithWeekday(activity.activity_date)}の活動
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activity.activity_statuses.name === '予定' && (
            <Button asChild>
              <Link href={`/activities/${activity.id}/complete`}>
                <CheckCircle className="mr-2 h-4 w-4" />
                完了処理
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/activities/${activity.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 活動情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              活動情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">ステータス</span>
              <Badge className={statusColors[activity.activity_statuses.name as keyof typeof statusColors]}>
                {activity.activity_statuses.name}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateWithWeekday(activity.activity_date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{activity.time_slots.display_name}</span>
            </div>

            <div>
              <span className="font-medium">スキル: </span>
              <span>{activity.skills.name}</span>
            </div>

            {activity.notes && (
              <div>
                <span className="font-medium">備考</span>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {activity.notes}
                </p>
              </div>
            )}

            <Separator />

            <div className="text-sm text-muted-foreground">
              <p>登録日: {formatDateWithWeekday(activity.created_at)}</p>
              <p>更新日: {formatDateWithWeekday(activity.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* 関係者情報 */}
        <div className="space-y-6">
          {/* サポーター情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                サポーター
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Link 
                  href={`/supporters/${activity.supporters.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {activity.supporters.name}
                </Link>
              </div>
              {activity.supporters.phone && (
                <p className="text-sm text-muted-foreground">
                  📞 {activity.supporters.phone}
                </p>
              )}
              {activity.supporters.email && (
                <p className="text-sm text-muted-foreground">
                  ✉️ {activity.supporters.email}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 利用者情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                利用者
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Link 
                  href={`/service-users/${activity.service_users.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {activity.service_users.name}
                </Link>
              </div>
              {activity.service_users.phone && (
                <p className="text-sm text-muted-foreground">
                  📞 {activity.service_users.phone}
                </p>
              )}
              {activity.service_users.email && (
                <p className="text-sm text-muted-foreground">
                  ✉️ {activity.service_users.email}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
