import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, Eye, Edit } from 'lucide-react'
import { ServiceUserFilters } from '@/components/service-user-filters'
import { parseSearchParams, type BasePageProps } from '@/lib/types/page-props'
import { getUniqueValues } from '@/lib/utils/array-utils'
import type { ServiceUserFilters as ServiceUserFiltersType, ServiceUser } from '@/lib/types/database'

async function getServiceUsers(searchParams: ServiceUserFiltersType): Promise<ServiceUser[]> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('service_users')
      .select('*')

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
    const { data } = await supabase
      .from('service_users')
      .select('area')
      .not('area', 'is', null)

    const uniqueAreas = getUniqueValues(data?.map((item) => item.area) || [])
    return uniqueAreas
  } catch (error) {
    console.error('エリア一覧の取得に失敗しました:', error)
    return []
  }
}

export default async function ServiceUsersPage(props: BasePageProps) {
  const searchParams = parseSearchParams(await props.searchParams)
  const [serviceUsers, areas] = await Promise.all([
    getServiceUsers(searchParams),
    getAreas()
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">利用者一覧</h1>
          <p className="text-muted-foreground">
            登録されている利用者を管理できます
          </p>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {serviceUsers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">条件に一致する利用者が見つかりません</p>
          </div>
        ) : (
          serviceUsers.map((serviceUser: ServiceUser) => (
            <Card key={serviceUser.id}>
              <CardHeader>
                <CardTitle className="text-lg">{serviceUser.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceUser.phone && (
                    <p className="text-sm text-muted-foreground">
                      📞 {serviceUser.phone}
                    </p>
                  )}
                  {serviceUser.email && (
                    <p className="text-sm text-muted-foreground">
                      ✉️ {serviceUser.email}
                    </p>
                  )}
                  {serviceUser.area && (
                    <p className="text-sm text-muted-foreground">
                      📍 {serviceUser.area}
                    </p>
                  )}
                  {serviceUser.special_notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      💬 {serviceUser.special_notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/service-users/${serviceUser.id}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      詳細
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/service-users/${serviceUser.id}/edit`}>
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
