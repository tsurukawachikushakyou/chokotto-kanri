import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ActivityCompleteForm } from '@/components/activity-complete-form'
import type { PagePropsWithId } from '@/lib/types/page-props'

interface ActivityForComplete {
  id: string
  activity_date: string
  notes: string | null
  arbitrary_time_notes: string | null // ★ この行を追加
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

async function getActivity(id: string): Promise<ActivityForComplete | null> {
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
    // 型アサーションは、取得したデータがこの形状であることをTypeScriptに伝える
    return data as ActivityForComplete
  } catch (error) {
    console.error('活動情報の取得に失敗しました:', error)
    return null
  }
}

export default async function ActivityCompletePage(props: PagePropsWithId) {
  const params = await props.params
  const activity = await getActivity(params.id)

  if (!activity) {
    notFound()
  }

  if (activity.activity_statuses.name !== '予定') {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">活動完了処理</h1>
        <p className="text-muted-foreground">
          {activity.supporters.name} → {activity.service_users.name} の活動を完了します
        </p>
      </div>

      <ActivityCompleteForm activity={activity} />
    </div>
  )
}