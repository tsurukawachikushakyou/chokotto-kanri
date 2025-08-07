import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Edit, ArrowLeft, User, Phone, Mail, MapPin, FileText } from 'lucide-react'
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
    const { data, error } = await supabase
      .from('service_users')
      .select('*')
      .eq('id', id)
      .single()

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
      .select(`
        id,
        activity_date,
        notes,
        supporters(name),
        skills(name),
        time_slots(display_name),
        activity_statuses(name)
      `)
      .eq('service_user_id', serviceUserId)
      .order('activity_date', { ascending: false })
      .limit(10)

    if (error) throw error
    return (data as ServiceUserActivity[]) || []
  } catch (error) {
    console.error('利用履歴の取得に失敗しました:', error)
    return []
  }
}

export default async function ServiceUserDetailPage(props: PagePropsWithId) {
  const params = await props.params
  const [serviceUser, activities] = await Promise.all([
    getServiceUser(params.id),
    getServiceUserActivities(params.id)
  ])

  if (!serviceUser) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/service-users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              一覧に戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{serviceUser.name}</h1>
            <p className="text-muted-foreground">利用者詳細情報</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/service-users/${serviceUser.id}/edit`}>
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
            {serviceUser.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{serviceUser.phone}</span>
              </div>
            )}

            {serviceUser.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{serviceUser.email}</span>
              </div>
            )}

            {serviceUser.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{serviceUser.address}</span>
              </div>
            )}

            {serviceUser.area && (
              <div>
                <span className="font-medium">エリア: </span>
                <span>{serviceUser.area}</span>
              </div>
            )}

            <Separator />

            <div className="text-sm text-muted-foreground">
              <p>登録日: {formatDate(serviceUser.created_at)}</p>
              <p>更新日: {formatDate(serviceUser.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* 特記事項 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              特記事項
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceUser.special_notes ? (
              <p className="whitespace-pre-wrap">{serviceUser.special_notes}</p>
            ) : (
              <p className="text-muted-foreground">特記事項はありません</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 利用履歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>最近の利用履歴</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/activities?service_user=${serviceUser.id}`}>
                すべて見る
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground">利用履歴がありません</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity: ServiceUserActivity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div>
                    <p className="font-medium">
                      {activity.supporters.name} - {activity.skills.name}
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
