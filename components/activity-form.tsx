'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { activitySchema, type ActivityFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface ActivityFormProps {
  initialData?: {
    id: string
    supporter_id: string
    service_user_id: string
    skill_id: string
    activity_date: string
    time_slot_id: string
    status_id: string
    notes: string | null
    supporters: { name: string }
    service_users: { name: string }
    skills: { name: string }
    time_slots: { display_name: string }
    activity_statuses: { name: string }
  }
}

interface SupporterOption {
  id: string
  name: string
  status: string
}

interface ServiceUserOption {
  id: string
  name: string
}

interface SkillOption {
  id: string
  name: string
}

interface TimeSlotOption {
  id: string
  display_name: string
}

interface StatusOption {
  id: string
  name: string
}

export function ActivityForm({ initialData }: ActivityFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [supporters, setSupporters] = useState<SupporterOption[]>([])
  const [serviceUsers, setServiceUsers] = useState<ServiceUserOption[]>([])
  const [skills, setSkills] = useState<SkillOption[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlotOption[]>([])
  const [statuses, setStatuses] = useState<StatusOption[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: initialData ? {
      supporter_id: initialData.supporter_id,
      service_user_id: initialData.service_user_id,
      skill_id: initialData.skill_id,
      activity_date: initialData.activity_date,
      time_slot_id: initialData.time_slot_id,
      status_id: initialData.status_id,
      notes: initialData.notes || '',
    } : {}
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      try {
        const [
          supportersResult,
          serviceUsersResult,
          skillsResult,
          timeSlotsResult,
          statusesResult
        ] = await Promise.all([
          supabase.from('supporters').select('id, name, status').order('name'),
          supabase.from('service_users').select('id, name').order('name'),
          supabase.from('skills').select('id, name').eq('is_active', true).order('name'),
          supabase.from('time_slots').select('id, display_name').order('day_of_week'),
          supabase.from('activity_statuses').select('id, name').order('name')
        ])

        if (supportersResult.data) {
          // 型安全な処理: status が null の場合は 'N/A' に変換
          const supportersWithStatus = supportersResult.data.map((supporter) => ({
            id: supporter.id,
            name: supporter.name,
            status: supporter.status || 'N/A'
          }))
          setSupporters(supportersWithStatus)
        }
        if (serviceUsersResult.data) setServiceUsers(serviceUsersResult.data as ServiceUserOption[])
        if (skillsResult.data) setSkills(skillsResult.data as SkillOption[])
        if (timeSlotsResult.data) setTimeSlots(timeSlotsResult.data as TimeSlotOption[])
        if (statusesResult.data) setStatuses(statusesResult.data as StatusOption[])

        // URLパラメータからサポーターIDを取得して設定
        const supporterId = searchParams.get('supporter')
        if (supporterId) {
          setValue('supporter_id', supporterId)
        }
      } catch (error) {
        console.error('データの取得に失敗しました:', error)
        toast.error('データの取得に失敗しました')
      }
    }

    fetchData()
  }, [searchParams, setValue])

  const onSubmit = async (data: ActivityFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (initialData) {
        // 更新処理
        const { error } = await supabase
          .from('activities')
          .update({
            supporter_id: data.supporter_id,
            service_user_id: data.service_user_id,
            skill_id: data.skill_id,
            activity_date: data.activity_date,
            time_slot_id: data.time_slot_id,
            status_id: data.status_id,
            notes: data.notes || null,
          })
          .eq('id', initialData.id)

        if (error) throw error

        toast.success('活動情報を更新しました')
        router.push(`/activities/${initialData.id}`)
      } else {
        // 新規作成処理
        const { error } = await supabase
          .from('activities')
          .insert({
            supporter_id: data.supporter_id,
            service_user_id: data.service_user_id,
            skill_id: data.skill_id,
            activity_date: data.activity_date,
            time_slot_id: data.time_slot_id,
            status_id: data.status_id,
            notes: data.notes || null,
          })

        if (error) throw error

        toast.success('活動を登録しました')
        router.push('/activities')
      }
    } catch (error) {
      console.error('保存に失敗しました:', error)
      toast.error('保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>活動情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="supporter_id">サポーター * ({supporters.length}件)</Label>
            <Select
              value={watch('supporter_id')}
              onValueChange={(value) => setValue('supporter_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="サポーターを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {supporters.map((supporter) => (
                  <SelectItem key={supporter.id} value={supporter.id}>
                    {supporter.name} ({supporter.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supporter_id && (
              <p className="text-sm text-red-600 mt-1">{errors.supporter_id.message}</p>
            )}
            {supporters.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                サポーターが登録されていません。先にサポーターを登録してください。
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="service_user_id">利用者 * ({serviceUsers.length}件)</Label>
            <Select
              value={watch('service_user_id')}
              onValueChange={(value) => setValue('service_user_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="利用者を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {serviceUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_user_id && (
              <p className="text-sm text-red-600 mt-1">{errors.service_user_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="skill_id">スキル *</Label>
            <Select
              value={watch('skill_id')}
              onValueChange={(value) => setValue('skill_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="スキルを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {skills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.skill_id && (
              <p className="text-sm text-red-600 mt-1">{errors.skill_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="activity_date">活動日 *</Label>
            <Input
              id="activity_date"
              type="date"
              {...register('activity_date')}
            />
            {errors.activity_date && (
              <p className="text-sm text-red-600 mt-1">{errors.activity_date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="time_slot_id">時間帯 *</Label>
            <Select
              value={watch('time_slot_id')}
              onValueChange={(value) => setValue('time_slot_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="時間帯を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slot.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time_slot_id && (
              <p className="text-sm text-red-600 mt-1">{errors.time_slot_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status_id">ステータス *</Label>
            <Select
              value={watch('status_id')}
              onValueChange={(value) => setValue('status_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="ステータスを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status_id && (
              <p className="text-sm text-red-600 mt-1">{errors.status_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="活動に関する備考があれば記入してください"
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : initialData ? '更新' : '登録'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          キャンセル
        </Button>
      </div>
    </form>
  )
}
