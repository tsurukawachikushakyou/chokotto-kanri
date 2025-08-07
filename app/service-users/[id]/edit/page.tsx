import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ServiceUserForm } from '@/components/service-user-form'
import type { PagePropsWithId } from '@/lib/types/page-props'
import type { ServiceUser } from '@/lib/types/database'

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
    console.error('利用者情報の取得に失敗しました:', error)
    return null
  }
}

export default async function EditServiceUserPage(props: PagePropsWithId) {
  const params = await props.params
  const serviceUser = await getServiceUser(params.id)

  if (!serviceUser) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">利用者編集</h1>
        <p className="text-muted-foreground">
          {serviceUser.name}さんの情報を編集します
        </p>
      </div>

      <ServiceUserForm initialData={serviceUser} />
    </div>
  )
}
