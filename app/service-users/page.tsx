import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card' // ★ CardDescriptionを削除
import Link from 'next/link'
import { Plus, Eye, Edit, MoreVertical, Phone, Mail, MapPin } from 'lucide-react'
import { ServiceUserFilters } from '@/components/service-user-filters'
import { parseSearchParams, type BasePageProps } from '@/lib/types/page-props'
import { getUniqueValues } from '@/lib/utils/array-utils'
import type { ServiceUserFilters as ServiceUserFiltersType, ServiceUser } from '@/lib/types/database'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

async function getServiceUsers(searchParams: ServiceUserFiltersType): Promise<ServiceUser[]> {
  const supabase = await createClient()

  try {
    let query = supabase.from('service_users').select('*')

    // フィルタリング
    if (searchParams.search) {
      query = query.ilike('name', `%${searchParams.search}%`)
    }
    if (searchParams.area && searchParams.area !== 'all') {
      query = query.eq('area', searchParams.area)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return (data as ServiceUser[]) || []
  } catch (error) {
    console.error('利用者一覧の取得に失敗しました:', error)
    return []
  }
}

async function getAreas(): Promise<string[]> {
  const supabase = await createClient()

  try {
    const { data } = await supabase.from('service_users').select('area').not('area', 'is', null)

    const uniqueAreas = getUniqueValues(data?.map((item) => item.area) || [])
    return uniqueAreas
  } catch (error) {
    console.error('エリア一覧の取得に失敗しました:', error)
    return []
  }
}

export default async function ServiceUsersPage(props: BasePageProps) {
  const searchParams = parseSearchParams(await props.searchParams)
  const [serviceUsers, areas] = await Promise.all([getServiceUsers(searchParams), getAreas()])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">利用者一覧</h1>
          <p className="text-muted-foreground">登録されている利用者を管理できます</p>
        </div>
        <Button asChild>
          <Link href="/service-users/new">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      {/* フィルター */}
      <ServiceUserFilters areas={areas} initialValues={searchParams} />

      {/* 利用者一覧 */}
      {serviceUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">条件に一致する利用者が見つかりません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceUsers.map((user: ServiceUser) => (
            <Card key={user.id} className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/service-users/${user.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        詳細表示
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/service-users/${user.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        編集
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                {user.area && (
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                    <span>{user.area}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center">
                    <Phone className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center">
                    <Mail className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
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