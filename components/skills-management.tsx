'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { skillSchema, type SkillFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Skill } from '@/lib/types/database'

interface SkillsManagementProps {
  initialSkills: Skill[]
}

export function SkillsManagement({ initialSkills }: SkillsManagementProps) {
  const [skills, setSkills] = useState(initialSkills)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      is_active: true,
    }
  })

  const openDialog = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill)
      setValue('name', skill.name)
      setValue('category', skill.category || '')
      setValue('is_active', skill.is_active || true)
    } else {
      setEditingSkill(null)
      reset({
        name: '',
        category: '',
        is_active: true,
      })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingSkill(null)
    reset()
  }

  const onSubmit = async (data: SkillFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (editingSkill) {
        // 更新
        const { data: updatedSkill, error } = await supabase
          .from('skills')
          .update({
            name: data.name,
            category: data.category || null,
            is_active: data.is_active,
          })
          .eq('id', editingSkill.id)
          .select()
          .single()

        if (error) throw error

        setSkills(skills.map((skill) => 
          skill.id === editingSkill.id ? updatedSkill as Skill : skill
        ))
        toast.success('スキルを更新しました')
      } else {
        // 新規作成
        const { data: newSkill, error } = await supabase
          .from('skills')
          .insert({
            name: data.name,
            category: data.category || null,
            is_active: data.is_active,
          })
          .select()
          .single()

        if (error) throw error

        setSkills([...skills, newSkill as Skill])
        toast.success('スキルを追加しました')
      }

      closeDialog()
    } catch (error) {
      console.error('保存に失敗しました:', error)
      toast.error('保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSkill = async (skill: Skill) => {
    if (!confirm(`「${skill.name}」を削除しますか？`)) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skill.id)

      if (error) throw error

      setSkills(skills.filter((s) => s.id !== skill.id))
      toast.success('スキルを削除しました')
    } catch (error) {
      console.error('削除に失敗しました:', error)
      toast.error('削除に失敗しました')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">登録済みスキル ({skills.length}件)</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新規追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSkill ? 'スキル編集' : 'スキル新規追加'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">スキル名 *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="家事支援"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">カテゴリ</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="生活支援"
                />
                {errors.category && (
                  <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={watch('is_active')}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
                <Label htmlFor="is_active">有効</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '保存中...' : editingSkill ? '更新' : '追加'}
                </Button>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  キャンセル
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>サポート名</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.map((skill) => (
            <TableRow key={skill.id}>
              <TableCell className="font-medium">{skill.name}</TableCell>
              <TableCell>{skill.category || '-'}</TableCell>
              <TableCell>
                <Badge variant={skill.is_active ? 'default' : 'secondary'}>
                  {skill.is_active ? '有効' : '無効'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDialog(skill)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSkill(skill)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
