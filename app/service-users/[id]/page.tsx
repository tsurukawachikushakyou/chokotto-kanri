import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Edit, ArrowLeft, User, Phone, Mail, MapPin, FileText, Calendar, Clock } from 'lucide-react' // ★ Wrenchを削除
import { formatDate, formatDateWithWeekday } from '@/lib/utils/date-utils'
import type { PagePropsWithId } from '@/lib/types/page-props'
import type { ServiceUser } from '@/lib/types/database'

interface ServiceUserActivity {
  id: string
  activity_date: string
  notes: string | null
  supporters: {
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

async function getServiceUser(id: string): Promise<ServiceUser | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('service_users').select('*').eq('id', id).single()

    if (error) throw error
    return data as ServiceUser
  } catch (error) {
    console.error('利用者詳細の取得に失敗しました:', error)
    return null
  }
}

async function getServiceUserActivities(serviceUserId: string): Promise<ServiceUserActivity[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('activities')
      .select(
        `
        id,
        activity_date,
        notes,
        supporters(name),
        skills(name),
        time_slots(display_name),
        activity_statuses(name)
      `,
      )
      .eq('service_user_id', serviceUserId)
      .order('activity_date', { ascending: false })
      .limit(5) // 表示件数を5件に調整

    if (error) throw error
    return (data as ServiceUserActivity[]) || []
  } catch (error) {
    console.error('利用履歴の取得に失敗しました:', error)
    return []
  }
}

// 詳細情報を表示するための補助コンポーネント (再利用)
function DetailItem({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  if (!children) {
    return null
  }
  return (
    <div className="flex flex-col sm:flex-row sm:items-start">
      <div className="flex items-center text-muted-foreground mb-1 sm:mb-0 sm:w-28">
        <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex-1 text-sm font-medium pl-6 sm:pl-0">{children}</div>
    </div>
  )
}

export default async function ServiceUserDetailPage(props: PagePropsWithId) {
  const params = await props.params
  const [serviceUser, activities] = await Promise.all([
    getServiceUser(params.id),
    getServiceUserActivities(params.id),
  ])

  if (!serviceUser) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link href="/service-users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              一覧に戻る
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{serviceUser.name}</h1>
          <p className="text-muted-foreground">利用者詳細情報</p>
        </div>
        <Button asChild>
          <Link href={`/service-users/${serviceUser.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左カラム: 詳細情報 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>詳細情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={Phone} label="電話番号">
                {serviceUser.phone}
              </DetailItem>
              <DetailItem icon={Mail} label="メール">
                {serviceUser.email}
              </DetailItem>
              <DetailItem icon={MapPin} label="住所">
                {serviceUser.address}
              </DetailItem>
              <DetailItem icon={User} label="エリア">
                {serviceUser.area}
              </DetailItem>
              <DetailItem icon={FileText} label="特記事項">
                <p className="whitespace-pre-wrap">{serviceUser.special_notes}</p>
              </DetailItem>
            </CardContent>
          </Card>
        </div>

        {/* 右カラム: 登録情報 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>登録情報</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>登録日: {formatDate(serviceUser.created_at)}</p>
              <p>更新日: {formatDate(serviceUser.updated_at)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 最近の利用履歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>最近の利用履歴</CardTitle>
            {activities.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                <Link href={`/activities?service_user=${serviceUser.id}`}>
                    すべて見る
                </Link>
                </Button>
            )}
          </div>
          <CardDescription>直近5件の活動履歴を表示しています。</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">利用履歴がありません。</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-semibold">{activity.skills.name}</p>
                      <p className="text-sm text-muted-foreground">
                        サポーター: {activity.supporters.name}
                      </p>
                    </div>
                    <Badge variant="outline">{activity.activity_statuses.name}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    <span>{formatDateWithWeekday(activity.activity_date)}</span>
                    <span className="mx-2">|</span>
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                    <span>{activity.time_slots.display_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}