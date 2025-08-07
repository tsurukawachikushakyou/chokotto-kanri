import { z } from 'zod'

// 共通のバリデーションスキーマ
const phoneSchema = z.string().optional().or(z.literal(''))
const emailSchema = z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal(''))
const textSchema = z.string().optional().or(z.literal(''))

export const supporterSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  phone: phoneSchema,
  email: emailSchema,
  address: textSchema,
  area: textSchema,
  notes: textSchema,
  status: z.enum(['応募受付', '面接済み', '登録完了', '休止中']),
  skills: z.array(z.string()),
  schedules: z.array(z.string()),
})

export const serviceUserSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  phone: phoneSchema,
  email: emailSchema,
  address: textSchema,
  area: textSchema,
  special_notes: textSchema,
})

export const activitySchema = z.object({
  supporter_id: z.string().min(1, 'サポーターを選択してください'),
  service_user_id: z.string().min(1, '利用者を選択してください'),
  skill_id: z.string().min(1, 'スキルを選択してください'),
  activity_date: z.string().min(1, '活動日を選択してください'),
  time_slot_id: z.string().min(1, '時間帯を選択してください'),
  status_id: z.string().min(1, 'ステータスを選択してください'),
  notes: textSchema,
})

export const skillSchema = z.object({
  name: z.string().min(1, 'スキル名は必須です'),
  category: textSchema,
  is_active: z.boolean(),
})

export const activityStatusSchema = z.object({
  name: z.string().min(1, 'ステータス名は必須です'),
  description: textSchema,
})

// 型推論用の型定義
export type SupporterFormData = z.infer<typeof supporterSchema>
export type ServiceUserFormData = z.infer<typeof serviceUserSchema>
export type ActivityFormData = z.infer<typeof activitySchema>
export type SkillFormData = z.infer<typeof skillSchema>
export type ActivityStatusFormData = z.infer<typeof activityStatusSchema>
