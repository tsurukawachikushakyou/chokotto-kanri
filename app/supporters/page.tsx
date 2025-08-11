import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Eye, Edit, MoreVertical, Phone, Mail, MapPin, Wrench } from 'lucide-react'
import { SupporterFilters } from '@/components/supporter-filters'
import { parseSearchParams, type BasePageProps } from '@/lib/types/page-props'
import { getUniqueValues } from '@/lib/utils/array-utils'
import type { SupporterFilters as SupporterFiltersType } from '@/lib/types/database'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
    let query = supabase.from('supporters').select(`
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
        supporter.supporter_skills.some((ss) => ss.skills.name === searchParams.skill),
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
    const [{ data: areas }, { data: skills }] = await Promise.all([
      supabase.from('supporters').select('area').not('area', 'is', null),
      supabase.from('skills').select('name').eq('is_active', true),
    ])

    const uniqueAreas = getUniqueValues(areas?.map((item) => item.area) || [])
    const skillNames = skills?.map((skill) => skill.name) || []

    return { areas: uniqueAreas, skills: skillNames }
  } catch (error) {
    console.error('フィルタオプションの取得に失敗しました:', error)
    return { areas: [], skills: [] }
  }
}

const statusColors = {
  応募受付: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  面接済み: 'bg-blue-100 text-blue-800 border-blue-200',
  登録完了: 'bg-green-100 text-green-800 border-green-200',
  休止中: 'bg-gray-100 text-gray-800 border-gray-200',
} as const

export default async function SupportersPage(props: BasePageProps) {
  const searchParams = parseSearchParams(await props.searchParams)
  const [supporters, filterOptions] = await Promise.all([getSupporters(searchParams), getFilterOptions()])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* ページヘッダー */}
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

      {/* フィルター */}
      <SupporterFilters areas={filterOptions.areas} skills={filterOptions.skills} initialValues={searchParams} />

      {/* サポーター一覧 */}
      {supporters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">条件に一致するサポーターが見つかりません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supporters.map((supporter: SupporterWithSkills) => (
            <Card key={supporter.id} className="flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{supporter.name}</CardTitle>
                    <Badge className={statusColors[supporter.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                      {supporter.status || 'N/A'}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/supporters/${supporter.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          詳細表示
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/supporters/${supporter.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          編集
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                {supporter.area && (
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                    <span>{supporter.area}</span>
                  </div>
                )}
                {supporter.phone && (
                  <div className="flex items-center">
                    <Phone className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                    <span>{supporter.phone}</span>
                  </div>
                )}
                {supporter.email && (
                  <div className="flex items-center">
                    <Mail className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{supporter.email}</span>
                  </div>
                )}
                {supporter.supporter_skills.length > 0 && (
                  <div className="flex items-start pt-2">
                    <Wrench className="mr-2 h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {supporter.supporter_skills.slice(0, 3).map((ss, index) => (
                        <Badge key={index} variant="secondary">
                          {ss.skills.name}
                        </Badge>
                      ))}
                      {supporter.supporter_skills.length > 3 && (
                        <Badge variant="secondary">+{supporter.supporter_skills.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}