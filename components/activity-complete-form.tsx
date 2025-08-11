'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const completeSchema = z.object({
  completion_notes: z.string().min(1, '活動報告は必須です'),
})

type CompleteFormData = z.infer<typeof completeSchema>

interface ActivityCompleteFormProps {
  activity: {
    id: string
    activity_date: string
    notes: string | null
    supporters: { name: string }
    service_users: { name: string }
    skills: { name: string }
    time_slots: { display_name: string }
  }
}

export function ActivityCompleteForm({ activity }: ActivityCompleteFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteFormData>({
    resolver: zodResolver(completeSchema),
  })

  const onSubmit = async (data: CompleteFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // 完了ステータスのIDを取得
      const { data: completedStatus, error: statusError } = await supabase
        .from('activity_statuses')
        .select('id')
        .eq('name', '完了')
        .single()

      if (statusError) throw statusError

      // 活動を完了状態に更新
      const updatedNotes = activity.notes 
        ? `${activity.notes}\n\n【活動報告】\n${data.completion_notes}`
        : `【活動報告】\n${data.completion_notes}`

      const { error: updateError } = await supabase
        .from('activities')
        .update({
          status_id: completedStatus.id,
          notes: updatedNotes,
        })
        .eq('id', activity.id)

      if (updateError) throw updateError

      toast.success('活動を完了しました')
      router.push(`/activities/${activity.id}`)
    } catch (error) {
      console.error('完了処理に失敗しました:', error)
      toast.error('完了処理に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>活動概要</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">活動日:</span>
              <span className="ml-2">{format(new Date(activity.activity_date), 'yyyy年M月d日(E)', { locale: ja })}</span>
            </div>
            <div>
              <span className="font-medium">時間帯:</span>
              <span className="ml-2">{activity.time_slots.display_name}</span>
            </div>
            <div>
              <span className="font-medium">サポーター:</span>
              <span className="ml-2">{activity.supporters.name}</span>
            </div>
            <div>
              <span className="font-medium">利用者:</span>
              <span className="ml-2">{activity.service_users.name}</span>
            </div>
            <div className="col-span-2">
              <span className="font-medium">サポート内容:</span>
              <span className="ml-2">{activity.skills.name}</span>
            </div>
          </div>
          
          {activity.notes && (
            <div className="mt-4">
              <span className="font-medium">事前備考:</span>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                {activity.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>活動報告</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="completion_notes">活動報告 *</Label>
            <Textarea
              id="completion_notes"
              {...register('completion_notes')}
              placeholder="活動の内容、結果、特記事項などを詳しく記入してください"
              rows={6}
              className="mt-2"
            />
            {errors.completion_notes && (
              <p className="text-sm text-red-600 mt-1">{errors.completion_notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '完了処理中...' : '活動を完了する'}
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
