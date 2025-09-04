'use client'

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { activitySchema, type ActivityFormData } from "@/lib/validations"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteActivity } from "@/app/activities/actions"

interface ActivityFormContentProps {
  initialData?: {
    id: string
    supporter_id: string
    service_user_id: string
    skill_id: string
    activity_date: string
    time_slot_id: string
    status_id: string
    notes: string | null
    arbitrary_time_notes: string | null
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

export function ActivityFormContent({ initialData }: ActivityFormContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
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
    defaultValues: initialData
      ? {
          supporter_id: initialData.supporter_id,
          service_user_id: initialData.service_user_id,
          skill_id: initialData.skill_id,
          activity_date: initialData.activity_date,
          time_slot_id: initialData.time_slot_id,
          status_id: initialData.status_id,
          notes: initialData.notes || "",
          arbitrary_time_notes: initialData.arbitrary_time_notes || "",
        }
      : {},
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      try {
        const [supportersResult, serviceUsersResult, skillsResult, timeSlotsResult, statusesResult] = await Promise.all(
          [
            supabase.from("supporters").select("id, name, status").order("name"),
            supabase.from("service_users").select("id, name").order("name"),
            supabase.from("skills").select("id, name").eq("is_active", true).order("name"),
            supabase.from("time_slots").select("id, display_name").order("day_of_week"),
            supabase.from("activity_statuses").select("id, name").order("name"),
          ],
        )

        if (supportersResult.data) {
          const supportersWithStatus = supportersResult.data.map((supporter) => ({
            id: supporter.id,
            name: supporter.name,
            status: supporter.status || "N/A",
          }))
          setSupporters(supportersWithStatus)
        }
        if (serviceUsersResult.data) setServiceUsers(serviceUsersResult.data as ServiceUserOption[])
        if (skillsResult.data) setSkills(skillsResult.data as SkillOption[])
        if (timeSlotsResult.data) setTimeSlots(timeSlotsResult.data as TimeSlotOption[])
        if (statusesResult.data) setStatuses(statusesResult.data as StatusOption[])

        const supporterId = searchParams.get("supporter")
        if (supporterId) {
          setValue("supporter_id", supporterId)
        }
      } catch (error) {
        console.error("データの取得に失敗しました:", error)
        toast.error("データの取得に失敗しました")
      }
    }

    fetchData()
  }, [searchParams, setValue])

  const onSubmit = (data: ActivityFormData) => {
    startTransition(async () => {
      const supabase = createClient()

      try {
        if (initialData) {
          const { error } = await supabase
            .from("activities")
            .update({
              supporter_id: data.supporter_id,
              service_user_id: data.service_user_id,
              skill_id: data.skill_id,
              activity_date: data.activity_date,
              time_slot_id: data.time_slot_id,
              status_id: data.status_id,
              notes: data.notes || null,
              arbitrary_time_notes: data.arbitrary_time_notes || null,
            })
            .eq("id", initialData.id)

          if (error) throw error

          toast.success("活動情報を更新しました")
          router.push(`/activities/${initialData.id}`)
        } else {
          const { error } = await supabase.from("activities").insert({
            supporter_id: data.supporter_id,
            service_user_id: data.service_user_id,
            skill_id: data.skill_id,
            activity_date: data.activity_date,
            time_slot_id: data.time_slot_id,
            status_id: data.status_id,
            notes: data.notes || null,
            arbitrary_time_notes: data.arbitrary_time_notes || null,
          })

          if (error) throw error

          toast.success("活動を登録しました")
          router.push("/activities")
        }
      } catch (error) {
        console.error("保存に失敗しました:", error)
        toast.error("保存に失敗しました")
      }
    })
  }

  const handleDelete = () => {
    if (!initialData) return
    startTransition(async () => {
      const result = await deleteActivity(initialData.id)
      if (result && result.success === false) {
        toast.error(`削除に失敗しました: ${result.message}`)
      }
    })
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
            <Select value={watch("supporter_id")} onValueChange={(value) => setValue("supporter_id", value)} disabled={isPending}>
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
            {errors.supporter_id && <p className="text-sm text-red-600 mt-1">{errors.supporter_id.message}</p>}
            {supporters.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                サポーターが登録されていません。先にサポーターを登録してください。
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="service_user_id">利用者 * ({serviceUsers.length}件)</Label>
            <Select value={watch("service_user_id")} onValueChange={(value) => setValue("service_user_id", value)} disabled={isPending}>
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
            {errors.service_user_id && <p className="text-sm text-red-600 mt-1">{errors.service_user_id.message}</p>}
          </div>

          <div>
            <Label htmlFor="skill_id">サポート内容 *</Label>
            <Select value={watch("skill_id")} onValueChange={(value) => setValue("skill_id", value)} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="サポート内容を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {skills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.skill_id && <p className="text-sm text-red-600 mt-1">{errors.skill_id.message}</p>}
          </div>

          <div>
            <Label htmlFor="activity_date">活動日 *</Label>
            <Input id="activity_date" type="date" {...register("activity_date")} disabled={isPending} />
            {errors.activity_date && <p className="text-sm text-red-600 mt-1">{errors.activity_date.message}</p>}
          </div>

          <div>
            <Label htmlFor="time_slot_id">時間帯 *</Label>
            <Select value={watch("time_slot_id")} onValueChange={(value) => setValue("time_slot_id", value)} disabled={isPending}>
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
            {errors.time_slot_id && <p className="text-sm text-red-600 mt-1">{errors.time_slot_id.message}</p>}
          </div>

          <div>
            <Label htmlFor="arbitrary_time_notes">任意の時間 (例: 14:30開始)</Label>
            <Input
              id="arbitrary_time_notes"
              {...register("arbitrary_time_notes")}
              placeholder="例: 14:30開始、午前中、夕方"
              disabled={isPending}
            />
            {errors.arbitrary_time_notes && (
              <p className="text-sm text-red-600 mt-1">{errors.arbitrary_time_notes.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status_id">ステータス *</Label>
            <Select value={watch("status_id")} onValueChange={(value) => setValue("status_id", value)} disabled={isPending}>
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
            {errors.status_id && <p className="text-sm text-red-600 mt-1">{errors.status_id.message}</p>}
          </div>

          <div>
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="活動に関する備考があれば記入してください"
              rows={3}
              disabled={isPending}
            />
            {errors.notes && <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-x-4 pt-4 border-t">
        {/* 左側に配置する削除ボタン */}
        <div>
          {initialData && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isPending}>
                  この活動を削除する
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この活動記録を完全に削除します。この操作は元に戻すことはできません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isPending ? '削除中...' : 'はい、削除します'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* 右側に配置するボタン群 */}
        <div className="flex items-center gap-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "保存中..." : initialData ? "更新する" : "登録する"}
          </Button>
        </div>
      </div>
    </form>
  )
}