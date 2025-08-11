import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Edit,
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Wrench,
  Clock,
  PlusCircle,
} from 'lucide-react'
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
      .select(
        `
        *,
        supporter_skills(
          skills(id, name, category)
        ),
        supporter_schedules(
          time_slots(id, display_name, day_of_week, period)
        )
      `,
      )
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
      .select(
        `
        id,
        activity_date,
        notes,
        service_users(name),
        skills(name),
        time_slots(display_name),
        activity_statuses(name)
      `,
      )
      .eq('supporter_id', supporterId)
      .order('activity_date', { ascending: false })
      .limit(5)

    if (error) throw error
    return (data as SupporterActivity[]) || []
  } catch (error) {
    console.error('活動履歴の取得に失敗しました:', error)
    return []
  }
}

const statusColors = {
  応募受付: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  面接済み: 'bg-blue-100 text-blue-800 border-blue-200',
  登録完了: 'bg-green-100 text-green-800 border-green-200',
  休止中: 'bg-gray-100 text-gray-800 border-gray-200',
} as const

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

export default async function SupporterDetailPage(props: PagePropsWithId) {
  const params = await props.params
  const [supporter, activities] = await Promise.all([getSupporter(params.id), getSupporterActivities(params.id)])

  if (!supporter) {
    notFound()
  }

  const sortedSchedules = [...supporter.supporter_schedules].sort(
    (a, b) => a.time_slots.day_of_week - b.time_slots.day_of_week,
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link href="/supporters">
              <ArrowLeft className="mr-2 h-4 w-4" />
              一覧に戻る
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{supporter.name}</h1>
            <Badge className={statusColors[supporter.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
              {supporter.status || 'N/A'}
            </Badge>
          </div>
          <p className="text-muted-foreground">サポーター詳細情報</p>
        </div>
        <div className="flex gap-2 self-start sm:self-end">
          <Button asChild>
            <Link href={`/activities/new?supporter=${supporter.id}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              活動を登録
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/supporters/${supporter.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左カラム: 詳細情報 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={Phone} label="電話番号">{supporter.phone}</DetailItem>
              <DetailItem icon={Mail} label="メール">{supporter.email}</DetailItem>
              <DetailItem icon={MapPin} label="住所">{supporter.address}</DetailItem>
              <DetailItem icon={User} label="エリア">{supporter.area}</DetailItem>
              <DetailItem icon={FileText} label="備考">
                <p className="whitespace-pre-wrap">{supporter.notes}</p>
              </DetailItem>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>スキル・活動可能時間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={Wrench} label="できること">
                {supporter.supporter_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {supporter.supporter_skills.map((ss) => (
                      <Badge key={ss.skills.id} variant="secondary">
                        {ss.skills.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">未登録</span>
                )}
              </DetailItem>
              <DetailItem icon={Clock} label="活動時間">
                {sortedSchedules.length > 0 ? (
                  <div className="space-y-1">
                    {sortedSchedules.map((ss) => (
                      <p key={ss.time_slots.id}>{ss.time_slots.display_name}</p>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">未登録</span>
                )}
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
              <p>登録日: {formatDate(supporter.created_at)}</p>
              <p>更新日: {formatDate(supporter.updated_at)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 最近の活動履歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>最近の活動履歴</CardTitle>
            {activities.length > 0 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/activities?supporter=${supporter.id}`}>すべて見る</Link>
              </Button>
            )}
          </div>
          <CardDescription>直近5件の活動履歴を表示しています。</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">活動履歴がありません。</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-semibold">{activity.skills.name}</p>
                      <p className="text-sm text-muted-foreground">利用者: {activity.service_users.name}</p>
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