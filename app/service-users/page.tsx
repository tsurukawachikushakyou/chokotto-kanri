import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ServiceUserFilters } from '@/components/service-user-filters'
import { parseSearchParams, type BasePageProps } from '@/lib/types/page-props'
import { getUniqueValues } from '@/lib/utils/array-utils'
import type { ServiceUserFilters as ServiceUserFiltersType, ServiceUser } from '@/lib/types/database'
import { ServiceUserCard } from '@/components/service-user-card' // ★ 新しいコンポーネントをインポート

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
    <div className="space-y-6">
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

      <ServiceUserFilters areas={areas} initialValues={searchParams} />

      {serviceUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">条件に一致する利用者が見つかりません</p>
          </CardContent>
        </Card>
      ) : (
        // ★ 改善点: グリッドレイアウトから、シングルカラムのflexレイアウトに変更
        <div className="flex flex-col gap-4">
          {serviceUsers.map((user: ServiceUser) => (
            <ServiceUserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}