'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { activityStatusSchema, type ActivityStatusFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// ★ 修正点: 不要なインポートを削除し、CardとCardContentのみにする
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Tables } from '@/lib/supabase/types'

interface ActivityStatusesManagementProps {
  initialStatuses: Tables<'activity_statuses'>[]
}

export function ActivityStatusesManagement({ initialStatuses }: ActivityStatusesManagementProps) {
  const [statuses, setStatuses] = useState(initialStatuses)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<Tables<'activity_statuses'> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ActivityStatusFormData>({
    resolver: zodResolver(activityStatusSchema),
  })

  const openDialog = (status?: Tables<'activity_statuses'>) => {
    if (status) {
      setEditingStatus(status)
      setValue('name', status.name)
      setValue('description', status.description || '')
    } else {
      setEditingStatus(null)
      reset({
        name: '',
        description: '',
      })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingStatus(null)
    reset()
  }

  const onSubmit = async (data: ActivityStatusFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (editingStatus) {
        const { data: updatedStatus, error } = await supabase
          .from('activity_statuses')
          .update({ name: data.name, description: data.description || null })
          .eq('id', editingStatus.id)
          .select().single()
        if (error) throw error
        setStatuses(statuses.map(s => s.id === editingStatus.id ? updatedStatus : s))
        toast.success('活動ステータスを更新しました')
      } else {
        const { data: newStatus, error } = await supabase
          .from('activity_statuses')
          .insert({ name: data.name, description: data.description || null })
          .select().single()
        if (error) throw error
        setStatuses([...statuses, newStatus])
        toast.success('活動ステータスを追加しました')
      }
      closeDialog()
    } catch (error) {
      console.error('保存に失敗しました:', error)
      toast.error('保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteStatus = async (status: Tables<'activity_statuses'>) => {
    if (!confirm(`「${status.name}」を削除しますか？`)) return
    const supabase = createClient()
    try {
      const { error } = await supabase.from('activity_statuses').delete().eq('id', status.id)
      if (error) throw error
      setStatuses(statuses.filter(s => s.id !== status.id))
      toast.success('活動ステータスを削除しました')
    } catch (error) {
      console.error('削除に失敗しました:', error)
      toast.error('削除に失敗しました')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">登録済み ({statuses.length}件)</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}><Plus className="mr-2 h-4 w-4" />新規追加</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStatus ? '活動ステータス編集' : '活動ステータス新規追加'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">ステータス名 *</Label>
                <Input id="name" {...register('name')} placeholder="予定" />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea id="description" {...register('description')} placeholder="ステータスの説明を入力してください" rows={3} />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>キャンセル</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? '保存中...' : editingStatus ? '更新' : '追加'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="md:hidden space-y-3">
        {statuses.map((status) => (
          <Card key={status.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-semibold text-base">{status.name}</p>
                  <p className="text-sm text-muted-foreground">{status.description || '説明はありません'}</p>
                </div>
                <div className="flex flex-col gap-2 -mt-2 -mr-2">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(status)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteStatus(status)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ステータス名</TableHead>
              <TableHead>説明</TableHead>
              <TableHead className="w-[120px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.id}>
                <TableCell className="font-medium">{status.name}</TableCell>
                <TableCell>{status.description || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(status)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteStatus(status)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}