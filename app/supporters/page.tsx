import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { SupporterFilters } from '@/components/supporter-filters'
import { parseSearchParams, type BasePageProps } from '@/lib/types/page-props'
import { getUniqueValues } from '@/lib/utils/array-utils'
import type { SupporterFilters as SupporterFiltersType } from '@/lib/types/database'
import { SupporterCard } from '@/components/supporter-card'

interface SupporterForListPage {
  id: string
  name: string
  phone: string | null
  email: string | null
  area: string | null
  status: string | null
  created_at: string
  supporter_skills: Array<{
    skills: {
      name: string
    }
  }>
}

async function getSupporters(searchParams: SupporterFiltersType): Promise<SupporterForListPage[]> {
  const supabase = await createClient()

  try {
    let query = supabase.from('supporters').select(`
        id,
        name,
        phone,
        email,
        area,
        status,
        created_at,
        supporter_skills(skills(name)),
        supporter_schedules!inner(time_slot_id)
      `)

    if (searchParams.search) {
      query = query.ilike('name', `%${searchParams.search}%`)
    }
    if (searchParams.status && searchParams.status !== 'all') {
      query = query.eq('status', searchParams.status)
    }
    if (searchParams.area && searchParams.area !== 'all') {
      query = query.eq('area', searchParams.area)
    }
    if (searchParams.time_slot && searchParams.time_slot !== 'all') {
      query = query.eq('supporter_schedules.time_slot_id', searchParams.time_slot)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    let filteredData = (data as SupporterForListPage[]) || []
    if (searchParams.skill && searchParams.skill !== 'all') {
      filteredData = filteredData.filter((supporter: SupporterForListPage) =>
        supporter.supporter_skills.some((ss) => ss.skills.name === searchParams.skill),
      )
    }
    
    const uniqueSupporters = Array.from(new Map(filteredData.map(s => [s.id, s])).values());
    return uniqueSupporters
  } catch (error) {
    console.error('サポーター一覧の取得に失敗しました:', error)
    return []
  }
}

async function getFilterOptions(): Promise<{ areas: string[]; skills: string[]; timeSlots: Array<{id: string; display_name: string}> }> {
  const supabase = await createClient()
  try {
    const [
      { data: areasData },
      { data: skillsData },
      { data: timeSlotsData }
    ] = await Promise.all([
      supabase.from('supporters').select('area').not('area', 'is', null),
      supabase.from('skills').select('name').eq('is_active', true),
      supabase.from('time_slots').select('id, display_name').order('day_of_week').order('period'),
    ])

    const uniqueAreas = getUniqueValues(areasData?.map((item) => item.area) || [])
    const skillNames = skillsData?.map((skill) => skill.name) || []
    return { areas: uniqueAreas, skills: skillNames, timeSlots: timeSlotsData || [] }
  } catch (error) {
    console.error('フィルタオプションの取得に失敗しました:', error)
    return { areas: [], skills: [], timeSlots: [] }
  }
}

export default async function SupportersPage(props: BasePageProps) {
  const searchParams = parseSearchParams(await props.searchParams)
  const [supporters, filterOptions] = await Promise.all([getSupporters(searchParams), getFilterOptions()])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">サポーター一覧</h1>
          <p className="text-muted-foreground">登録されているサポーターを管理できます</p>
        </div>
        <Button asChild>
          <Link href="/supporters/new">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      <SupporterFilters 
        areas={filterOptions.areas} 
        skills={filterOptions.skills} 
        timeSlots={filterOptions.timeSlots} 
        initialValues={searchParams} 
      />

      {supporters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">条件に一致するサポーターが見つかりません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {supporters.map((supporter) => (
            <SupporterCard key={supporter.id} supporter={supporter} />
          ))}
        </div>
      )}
    </div>
  )
}