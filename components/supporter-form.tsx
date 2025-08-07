'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supporterSchema, type SupporterFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { SupporterWithRelations } from '@/lib/types/database'

interface SupporterFormProps {
  initialData?: SupporterWithRelations
}

interface SkillOption {
  id: string
  name: string
}

interface TimeSlotOption {
  id: string
  display_name: string
}

export function SupporterForm({ initialData }: SupporterFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [skills, setSkills] = useState<SkillOption[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlotOption[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SupporterFormData>({
    resolver: zodResolver(supporterSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      phone: initialData.phone || '',
      email: initialData.email || '',
      address: initialData.address || '',
      area: initialData.area || '',
      notes: initialData.notes || '',
      status: (initialData.status as SupporterFormData['status']) || '応募受付',
      skills: initialData.supporter_skills.map((ss) => ss.skills.id),
      schedules: initialData.supporter_schedules.map((ss) => ss.time_slots.id),
    } : {
      status: '応募受付',
      skills: [],
      schedules: [],
    }
  })

  const selectedSkills = watch('skills')
  const selectedSchedules = watch('schedules')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      try {
        const [skillsResult, timeSlotsResult] = await Promise.all([
          supabase.from('skills').select('id, name').eq('is_active', true).order('name'),
          supabase.from('time_slots').select('id, display_name').order('day_of_week', { ascending: true })
        ])

        if (skillsResult.data) setSkills(skillsResult.data as SkillOption[])
        if (timeSlotsResult.data) setTimeSlots(timeSlotsResult.data as TimeSlotOption[])
      } catch (error) {
        console.error('データの取得に失敗しました:', error)
        toast.error('データの取得に失敗しました')
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (data: SupporterFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (initialData) {
        // 更新処理
        const { error: updateError } = await supabase
          .from('supporters')
          .update({
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            area: data.area || null,
            notes: data.notes || null,
            status: data.status,
          })
          .eq('id', initialData.id)

        if (updateError) throw updateError

        // スキルの更新
        await supabase.from('supporter_skills').delete().eq('supporter_id', initialData.id)
        if (data.skills.length > 0) {
          const skillInserts = data.skills.map((skillId: string) => ({
            supporter_id: initialData.id,
            skill_id: skillId,
          }))
          const { error: skillError } = await supabase
            .from('supporter_skills')
            .insert(skillInserts)
          if (skillError) throw skillError
        }

        // スケジュールの更新
        await supabase.from('supporter_schedules').delete().eq('supporter_id', initialData.id)
        if (data.schedules.length > 0) {
          const scheduleInserts = data.schedules.map((timeSlotId: string) => ({
            supporter_id: initialData.id,
            time_slot_id: timeSlotId,
          }))
          const { error: scheduleError } = await supabase
            .from('supporter_schedules')
            .insert(scheduleInserts)
          if (scheduleError) throw scheduleError
        }

        toast.success('サポーター情報を更新しました')
        router.push(`/supporters/${initialData.id}`)
      } else {
        // 新規作成処理
        const { data: supporter, error: insertError } = await supabase
          .from('supporters')
          .insert({
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            area: data.area || null,
            notes: data.notes || null,
            status: data.status,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // スキルの登録
        if (data.skills.length > 0) {
          const skillInserts = data.skills.map((skillId: string) => ({
            supporter_id: supporter.id,
            skill_id: skillId,
          }))
          const { error: skillError } = await supabase
            .from('supporter_skills')
            .insert(skillInserts)
          if (skillError) throw skillError
        }

        // スケジュールの登録
        if (data.schedules.length > 0) {
          const scheduleInserts = data.schedules.map((timeSlotId: string) => ({
            supporter_id: supporter.id,
            time_slot_id: timeSlotId,
          }))
          const { error: scheduleError } = await supabase
            .from('supporter_schedules')
            .insert(scheduleInserts)
          if (scheduleError) throw scheduleError
        }

        toast.success('サポーターを登録しました')
        router.push('/supporters')
      }
    } catch (error) {
      console.error('保存に失敗しました:', error)
      toast.error('保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkillChange = (skillId: string, checked: boolean) => {
    const currentSkills = selectedSkills || []
    if (checked) {
      setValue('skills', [...currentSkills, skillId])
    } else {
      setValue('skills', currentSkills.filter((id: string) => id !== skillId))
    }
  }

  const handleScheduleChange = (timeSlotId: string, checked: boolean) => {
    const currentSchedules = selectedSchedules || []
    if (checked) {
      setValue('schedules', [...currentSchedules, timeSlotId])
    } else {
      setValue('schedules', currentSchedules.filter((id: string) => id !== timeSlotId))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">名前 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="山田太郎"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="090-1234-5678"
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="東京都渋谷区..."
            />
            {errors.address && (
              <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="area">エリア</Label>
            <Input
              id="area"
              {...register('area')}
              placeholder="渋谷区"
            />
            {errors.area && (
              <p className="text-sm text-red-600 mt-1">{errors.area.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status">ステータス</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as SupporterFormData['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="応募受付">応募受付</SelectItem>
                <SelectItem value="面接済み">面接済み</SelectItem>
                <SelectItem value="登録完了">登録完了</SelectItem>
                <SelectItem value="休止中">休止中</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="特記事項があれば記入してください"
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>スキル</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {skills.map((skill: SkillOption) => (
              <div key={skill.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`skill-${skill.id}`}
                  checked={selectedSkills?.includes(skill.id) || false}
                  onCheckedChange={(checked) => handleSkillChange(skill.id, checked as boolean)}
                />
                <Label htmlFor={`skill-${skill.id}`} className="text-sm">
                  {skill.name}
                </Label>
              </div>
            ))}
          </div>
          {errors.skills && (
            <p className="text-sm text-red-600 mt-2">{errors.skills.message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>活動可能時間</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timeSlots.map((timeSlot: TimeSlotOption) => (
              <div key={timeSlot.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`schedule-${timeSlot.id}`}
                  checked={selectedSchedules?.includes(timeSlot.id) || false}
                  onCheckedChange={(checked) => handleScheduleChange(timeSlot.id, checked as boolean)}
                />
                <Label htmlFor={`schedule-${timeSlot.id}`} className="text-sm">
                  {timeSlot.display_name}
                </Label>
              </div>
            ))}
          </div>
          {errors.schedules && (
            <p className="text-sm text-red-600 mt-2">{errors.schedules.message}</p>
          )}
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
