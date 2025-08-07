import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Eye, Edit } from 'lucide-react'
import { SupporterFilters } from '@/components/supporter-filters'
import { parseSearchParams, type BasePageProps } from '@/lib/types/page-props'
import { getUniqueValues } from '@/lib/utils/array-utils'
import type { SupporterFilters as SupporterFiltersType } from '@/lib/types/database'

interface SupporterWithSkills {
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

async function getSupporters(searchParams: SupporterFiltersType): Promise<SupporterWithSkills[]> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('supporters')
      .select(`
        id,
        name,
        phone,
        email,
        area,
        status,
        created_at,
        supporter_skills(
          skills(name)
        )
      `)

    // フィルタリング
    if (searchParams.search) {
      query = query.ilike('name', `%${searchParams.search}%`)
    }
    if (searchParams.status && searchParams.status !== 'all') {
      query = query.eq('status', searchParams.status)
    }
    if (searchParams.area && searchParams.area !== 'all') {
      query = query.eq('area', searchParams.area)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // スキルフィルタリングは後処理で行う
    let filteredData = (data as SupporterWithSkills[]) || []
    if (searchParams.skill && searchParams.skill !== 'all') {
      filteredData = filteredData.filter((supporter: SupporterWithSkills) =>
        supporter.supporter_skills.some((ss) => ss.skills.name === searchParams.skill)
      )
    }

    return filteredData
  } catch (error) {
    console.error('サポーター一覧の取得に失敗しました:', error)
    return []
  }
}

async function getFilterOptions(): Promise<{ areas: string[]; skills: string[] }> {
  const supabase = await createClient()

  try {
    const [
      { data: areas },
      { data: skills }
    ] = await Promise.all([
      supabase.from('supporters').select('area').not('area', 'is', null),
      supabase.from('skills').select('name').eq('is_active', true)
    ])

    // null安全な配列処理
    const uniqueAreas = getUniqueValues(areas?.map((item) => item.area) || [])
    const skillNames = skills?.map((skill) => skill.name) || []

    return { areas: uniqueAreas, skills: skillNames }
  } catch (error) {
    console.error('フィルタオプションの取得に失敗しました:', error)
    return { areas: [], skills: [] }
  }
}

const statusColors = {
  '応募受付': 'bg-yellow-100 text-yellow-800',
  '面接済み': 'bg-blue-100 text-blue-800',
  '登録完了': 'bg-green-100 text-green-800',
  '休止中': 'bg-gray-100 text-gray-800',
} as const

export default async function SupportersPage(props: BasePageProps) {
  const searchParams = parseSearchParams(await props.searchParams)
  const [supporters, filterOptions] = await Promise.all([
    getSupporters(searchParams),
    getFilterOptions()
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">サポーター一覧</h1>
          <p className="text-muted-foreground">
            登録されているサポーターを管理できます
          </p>
        </div>
        <Button asChild>
          <Link href="/supporters/new">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      {/* フィルター */}
      <SupporterFilters 
        areas={filterOptions.areas}
        skills={filterOptions.skills}
        initialValues={searchParams}
      />

      {/* サポーター一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {supporters.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">条件に一致するサポーターが見つかりません</p>
          </div>
        ) : (
          supporters.map((supporter: SupporterWithSkills) => (
            <Card key={supporter.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{supporter.name}</CardTitle>
                  <Badge className={statusColors[supporter.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                    {supporter.status || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {supporter.phone && (
                    <p className="text-sm text-muted-foreground">
                      📞 {supporter.phone}
                    </p>
                  )}
                  {supporter.email && (
                    <p className="text-sm text-muted-foreground">
                      ✉️ {supporter.email}
                    </p>
                  )}
                  {supporter.area && (
                    <p className="text-sm text-muted-foreground">
                      📍 {supporter.area}
                    </p>
                  )}
                  
                  {/* スキル表示 */}
                  {supporter.supporter_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {supporter.supporter_skills.slice(0, 3).map((ss, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {ss.skills.name}
                        </Badge>
                      ))}
                      {supporter.supporter_skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{supporter.supporter_skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/supporters/${supporter.id}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      詳細
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/supporters/${supporter.id}/edit`}>
                      <Edit className="mr-1 h-3 w-3" />
                      編集
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
