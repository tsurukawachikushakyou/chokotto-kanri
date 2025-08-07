import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SupporterForm } from '@/components/supporter-form'
import type { PagePropsWithId } from '@/lib/types/page-props'
import type { SupporterWithRelations } from '@/lib/types/database'

async function getSupporter(id: string): Promise<SupporterWithRelations | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('supporters')
      .select(`
        *,
        supporter_skills(
          skills(id, name)
        ),
        supporter_schedules(
          time_slots(id, display_name)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as SupporterWithRelations
  } catch (error) {
    console.error('サポーター情報の取得に失敗しました:', error)
    return null
  }
}

export default async function EditSupporterPage(props: PagePropsWithId) {
  const params = await props.params
  const supporter = await getSupporter(params.id)

  if (!supporter) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">サポーター編集</h1>
        <p className="text-muted-foreground">
          {supporter.name}さんの情報を編集します
        </p>
      </div>

      <SupporterForm initialData={supporter} />
    </div>
  )
}
