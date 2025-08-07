'use client'

import { Suspense } from 'react'
import { ActivityFormContent } from './activity-form-content'
import type { Tables } from '@/lib/supabase/types'

interface ActivityFormWrapperProps {
  initialData?: Tables<'activities'> & {
    supporters: { name: string }
    service_users: { name: string }
    skills: { name: string }
    time_slots: { display_name: string }
    activity_statuses: { name: string }
  }
}

function ActivityFormFallback() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export function ActivityFormWrapper({ initialData }: ActivityFormWrapperProps) {
  return (
    <Suspense fallback={<ActivityFormFallback />}>
      <ActivityFormContent initialData={initialData} />
    </Suspense>
  )
}
