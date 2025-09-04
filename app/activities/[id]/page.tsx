// -------------------- app/activities/[id]/page.tsx (完全版) --------------------
// このコードをコピーして、ファイルの中身と完全に置き換えてください。

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import {
  Edit,
  ArrowLeft,
  CheckCircle,
  Calendar,
  Clock,
  User,
  Users,
  Wrench,
  FileText,
  Phone,
  Mail,

} from 'lucide-react'
import { formatDateWithWeekday, formatDateTime } from '@/lib/utils/date-utils'
import type { PagePropsWithId } from '@/lib/types/page-props'
// 変更点2: 新しく作成する削除ボタンのUIコンポーネントをインポートします
import { DeleteActivityButton } from '@/components/delete-activity-button'


// interface定義は、あなたの既存コードのままです
interface ActivityDetail {
  id: string
  activity_date: string
  notes: string | null
  arbitrary_time_notes: string | null
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

// getActivity関数も、あなたの既存コードのままです
async function getActivity(id: string): Promise<ActivityDetail | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('activities')
      .select(
        `
        *,
        supporters(id, name, phone, email),
        service_users(id, name, phone, email),
        skills(name),
        time_slots(display_name),
        activity_statuses(name)
      `,
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ActivityDetail
  } catch (error) {
    console.error('活動詳細の取得に失敗しました:', error)
    return null
  }
}

// statusColorsオブジェクトも、あなたの既存コードのままです
const statusColors = {
  予定: 'bg-blue-100 text-blue-800 border-blue-200',
  完了: 'bg-green-100 text-green-800 border-green-200',
  キャンセル: 'bg-red-100 text-red-800 border-red-200',
  仮予約: 'bg-yellow-100 text-yellow-800 border-yellow-200',
} as const

// DetailItemコンポーネントも、あなたの既存コードのままです
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

// ここからがページの本体です
export default async function ActivityDetailPage(props: PagePropsWithId) {
  const params = await props.params
  const activity = await getActivity(params.id)

  if (!activity) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link href="/activities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              一覧に戻る
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">活動詳細</h1>
        </div>
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          {activity.activity_statuses.name === '予定' && (
            <Button asChild>
              <Link href={`/activities/${activity.id}/complete`}>
                <CheckCircle className="mr-2 h-4 w-4" />
                活動を完了
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/activities/${activity.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Link>
          </Button>

          {/* 変更点3: 編集ボタンの隣に、新しく作成する削除ボタンコンポーネントを配置します */}
          <DeleteActivityButton activityId={activity.id} />
          
        </div>
      </div>

      <div className="space-y-6">
        {/* 概要カード */}
        <Card>
          <CardHeader>
            <CardTitle>概要</CardTitle>
            <CardDescription>{formatDateWithWeekday(activity.activity_date)}の活動</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">サポーター</div>
                  <Link href={`/supporters/${activity.supporters.id}`} className="font-semibold text-base sm:text-lg hover:underline">
                    {activity.supporters.name}
                  </Link>
                </div>
              </div>
              <ArrowLeft className="h-6 w-6 text-muted-foreground rotate-180 sm:rotate-0 self-center" />
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">利用者</div>
                  <Link
                    href={`/service-users/${activity.service_users.id}`}
                    className="font-semibold text-base sm:text-lg hover:underline"
                  >
                    {activity.service_users.name}
                  </Link>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">ステータス</span>
              <Badge className={statusColors[activity.activity_statuses.name as keyof typeof statusColors]}>
                {activity.activity_statuses.name}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 詳細情報グリッド */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 左カラム: 活動内容 */}
          <Card>
            <CardHeader>
              <CardTitle>活動内容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={Calendar} label="実施日">
                {formatDateWithWeekday(activity.activity_date)}
              </DetailItem>
              <DetailItem icon={Clock} label="時間">
                <span>
                  {activity.time_slots.display_name}
                  {activity.arbitrary_time_notes && (
                    <span className="text-muted-foreground ml-2">({activity.arbitrary_time_notes})</span>
                  )}
                </span>
              </DetailItem>
              <DetailItem icon={Wrench} label="スキル">
                {activity.skills.name}
              </DetailItem>
              <DetailItem icon={FileText} label="備考">
                <p className="whitespace-pre-wrap">{activity.notes}</p>
              </DetailItem>
            </CardContent>
          </Card>

          {/* 右カラム: 関係者連絡先 */}
          <Card>
            <CardHeader>
              <CardTitle>関係者連絡先</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  サポーター
                </h4>
                <div className="space-y-4">
                  <DetailItem icon={Phone} label="電話番号">
                    {activity.supporters.phone}
                  </DetailItem>
                  <DetailItem icon={Mail} label="メール">
                    {activity.supporters.email}
                  </DetailItem>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  利用者
                </h4>
                <div className="space-y-4">
                  <DetailItem icon={Phone} label="電話番号">
                    {activity.service_users.phone}
                  </DetailItem> 
                  <DetailItem icon={Mail} label="メール">
                    {activity.service_users.email}
                  </DetailItem>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="text-xs text-muted-foreground">
          <CardContent className="p-3 flex flex-wrap justify-between gap-x-4 gap-y-1">
            <span>登録日: {formatDateTime(activity.created_at)}</span>
            <span>更新日: {formatDateTime(activity.updated_at)}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
// -------------------- ここまで --------------------