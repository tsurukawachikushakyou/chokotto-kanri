import type { Database } from '@/lib/supabase/types'

// データベースから取得するデータの型定義
export type Supporter = Database['public']['Tables']['supporters']['Row']
export type ServiceUser = Database['public']['Tables']['service_users']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type TimeSlot = Database['public']['Tables']['time_slots']['Row']
export type ActivityStatus = Database['public']['Tables']['activity_statuses']['Row']

// リレーション付きの型定義
export interface SupporterWithRelations extends Supporter {
  supporter_skills: Array<{
    skills: {
      id: string
      name: string
      category: string | null
    }
  }>
  supporter_schedules: Array<{
    time_slots: {
      id: string
      display_name: string
      day_of_week: number
      period: string
    }
  }>
}

export interface ActivityWithRelations extends Activity {
  supporters: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  service_users: {
    id: string
    name: string
    phone: string | null
    email: string | null
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

// フィルター用の型定義
export interface SupporterFilters {
  search?: string
  status?: string
  area?: string
  skill?: string
}

export interface ServiceUserFilters {
  search?: string
  area?: string
}

export interface ActivityFilters {
  search?: string
  supporter?: string
  service_user?: string
  status?: string
  date_from?: string
  date_to?: string
}

export interface MatchingFilters {
  skills?: string
  time_slots?: string
}
