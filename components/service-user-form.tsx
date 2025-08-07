'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceUserSchema, type ServiceUserFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Tables } from '@/lib/supabase/types'

interface ServiceUserFormProps {
  initialData?: Tables<'service_users'>
}

export function ServiceUserForm({ initialData }: ServiceUserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceUserFormData>({
    resolver: zodResolver(serviceUserSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      phone: initialData.phone || '',
      email: initialData.email || '',
      address: initialData.address || '',
      area: initialData.area || '',
      special_notes: initialData.special_notes || '',
    } : {}
  })

  const onSubmit = async (data: ServiceUserFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (initialData) {
        // 更新処理
        const { error } = await supabase
          .from('service_users')
          .update({
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            area: data.area || null,
            special_notes: data.special_notes || null,
          })
          .eq('id', initialData.id)

        if (error) throw error

        toast.success('利用者情報を更新しました')
        router.push(`/service-users/${initialData.id}`)
      } else {
        // 新規作成処理
        const { error } = await supabase
          .from('service_users')
          .insert({
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            area: data.area || null,
            special_notes: data.special_notes || null,
          })

        if (error) throw error

        toast.success('利用者を登録しました')
        router.push('/service-users')
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
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">名前 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="田中花子"
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
            <Label htmlFor="special_notes">特記事項</Label>
            <Textarea
              id="special_notes"
              {...register('special_notes')}
              placeholder="特別な配慮事項や要望があれば記入してください"
              rows={4}
            />
            {errors.special_notes && (
              <p className="text-sm text-red-600 mt-1">{errors.special_notes.message}</p>
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
