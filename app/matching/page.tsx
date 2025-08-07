import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User, Phone, Mail, MapPin, Award } from 'lucide-react'
import { MatchingFilters } from '@/components/matching-filters'
import { parseSearchParams, type BasePageProps } from '@/lib/types/page-props'
import type { MatchingFilters as MatchingFiltersType, Skill, TimeSlot } from '@/lib/types/database'

interface MatchingSupporter {
  id: string
  name: string
  phone: string | null
  email: string | null
  area: string | null
  status: string | null
  supporter_skills: Array<{
    skills: {
      id: string
      name: string
    }
  }>
  supporter_schedules: Array<{
    time_slots: {
      id: string
      display_name: string
    }
  }>
  completed_activities: number
}

async function getMatchingSupporters(searchParams: MatchingFiltersType): Promise<MatchingSupporter[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('supporters')
      .select(`
        id,
        name,
        phone,
        email,
        area,
        status,
        supporter_skills(
          skills(id, name)
        ),
        supporter_schedules(
          time_slots(id, display_name)
        )
      `)
      .in('status', ['登録完了', '面接済み']);

    if (error) throw error

    let filteredData = (data as MatchingSupporter[]) || []

    // スキルフィルタリング
    if (searchParams.skills) {
      const selectedSkills = searchParams.skills.split(',')
      filteredData = filteredData.filter((supporter: MatchingSupporter) =>
        selectedSkills.every((skillId: string) =>
          supporter.supporter_skills.some((ss) => ss.skills.id === skillId)
        )
      )
    }

    // 時間帯フィルタリング
    if (searchParams.time_slots) {
      const selectedTimeSlots = searchParams.time_slots.split(',')
      filteredData = filteredData.filter((supporter: MatchingSupporter) =>
        selectedTimeSlots.every((timeSlotId: string) =>
          supporter.supporter_schedules.some((ss) => ss.time_slots.id === timeSlotId)
        )
      )
    }

    // 活動完了回数を取得
    const supportersWithCounts = await Promise.all(
      filteredData.map(async (supporter: MatchingSupporter) => {
        const { data: completedStatus } = await supabase
          .from('activity_statuses')
          .select('id')
          .eq('name', '完了')
          .single()

        const { count } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('supporter_id', supporter.id)
          .eq('status_id', completedStatus?.id || '')

        return {
          ...supporter,
          completed_activities: count || 0
        }
      })
    )

    return supportersWithCounts
  } catch (error) {
    console.error('マッチング検索に失敗しました:', error)
    return []
  }
}

async function getFilterOptions(): Promise<{
  skills: Skill[]
  timeSlots: TimeSlot[]
}> {
  const supabase = await createClient()

  try {
    const [
      { data: skills },
      { data: timeSlots }
    ] = await Promise.all([
      supabase.from('skills').select('id, name, category').eq('is_active', true).order('category', { ascending: true }).order('name'),
      supabase.from('time_slots').select('id, display_name, day_of_week').order('day_of_week')
    ])

    return {
      skills: (skills as Skill[]) || [],
      timeSlots: (timeSlots as TimeSlot[]) || []
    }
  } catch (error) {
    console.error('フィルタオプションの取得に失敗しました:', error)
    return { skills: [], timeSlots: [] }
  }
}

export default async function MatchingPage(props: BasePageProps) {
  const searchParams = parseSearchParams(await props.searchParams)
  const [supporters, filterOptions] = await Promise.all([
    getMatchingSupporters(searchParams),
    getFilterOptions()
  ])

  const hasFilters = searchParams.skills || searchParams.time_slots

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">マッチング検索</h1>
        <p className="text-muted-foreground">
          スキルと活動可能時間でサポーターを検索できます
        </p>
      </div>

      {/* フィルター */}
      <MatchingFilters 
        skills={filterOptions.skills}
        timeSlots={filterOptions.timeSlots}
        initialValues={searchParams}
      />

      {/* 検索結果 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            検索結果 ({supporters.length}件)
          </h2>
        </div>

        {!hasFilters ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">スキルまたは活動可能時間を選択して検索してください</p>
          </div>
        ) : supporters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">条件に一致するサポーターが見つかりません</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {supporters.map((supporter: MatchingSupporter) => (
              <Card key={supporter.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{supporter.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={supporter.status === '登録完了' ? 'default' : 'secondary'}>
                        {supporter.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Award className="h-4 w-4" />
                        <span>{supporter.completed_activities}回</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 連絡先情報 */}
                  <div className="space-y-2">
                    {supporter.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{supporter.phone}</span>
                      </div>
                    )}
                    {supporter.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{supporter.email}</span>
                      </div>
                    )}
                    {supporter.area && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{supporter.area}</span>
                      </div>
                    )}
                  </div>

                  {/* スキル */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">スキル</h4>
                    <div className="flex flex-wrap gap-1">
                      {supporter.supporter_skills.slice(0, 3).map((ss) => (
                        <Badge key={ss.skills.id} variant="secondary" className="text-xs">
                          {ss.skills.name}
                        </Badge>
                      ))}
                      {supporter.supporter_skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{supporter.supporter_skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 活動可能時間 */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">活動可能時間</h4>
                    <div className="text-xs text-muted-foreground">
                      {supporter.supporter_schedules.slice(0, 2).map((ss) => (
                        <div key={ss.time_slots.id}>
                          {ss.time_slots.display_name}
                        </div>
                      ))}
                      {supporter.supporter_schedules.length > 2 && (
                        <div>他{supporter.supporter_schedules.length - 2}件</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/supporters/${supporter.id}`}>
                        <User className="mr-1 h-3 w-3" />
                        詳細
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/activities/new?supporter=${supporter.id}`}>
                        活動登録
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
