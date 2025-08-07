import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ActivityFormWrapper } from '@/components/activity-form-wrapper'
import type { PagePropsWithId } from '@/lib/types/page-props'

interface ActivityForEdit {
  id: string
  activity_date: string
  notes: string | null
  supporter_id: string
  service_user_id: string
  skill_id: string
  time_slot_id: string
  status_id: string
  created_at: string
  updated_at: string
  supporters: {
    name: string
  }
  service_users: {
    name: string
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

async function getActivity(id: string): Promise<ActivityForEdit | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        supporters(name),
        service_users(name),
        skills(name),
        time_slots(display_name),
        activity_statuses(name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ActivityForEdit
  } catch (error) {
    console.error('活動情報の取得に失敗しました:', error)
    return null
  }
}

export default async function EditActivityPage(props: PagePropsWithId) {
  const params = await props.params
  const activity = await getActivity(params.id)

  if (!activity) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">活動編集</h1>
        <p className="text-muted-foreground">
          活動情報を編集します
        </p>
      </div>

      <ActivityFormWrapper initialData={activity} />
    </div>
  )
}
