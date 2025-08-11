import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SkillsManagement } from '@/components/skills-management'
import { ActivityStatusesManagement } from '@/components/activity-statuses-management'
import type { Skill, ActivityStatus } from '@/lib/types/database'

async function getSkills(): Promise<Skill[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('category', { ascending: true })
      .order('name')

    if (error) throw error
    return (data as Skill[]) || []
  } catch (error) {
    console.error('スキル一覧の取得に失敗しました:', error)
    return []
  }
}

async function getActivityStatuses(): Promise<ActivityStatus[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('activity_statuses')
      .select('*')
      .order('name')

    if (error) throw error
    return (data as ActivityStatus[]) || []
  } catch (error) {
    console.error('活動ステータス一覧の取得に失敗しました:', error)
    return []
  }
}

export default async function SettingsPage() {
  const [skills, activityStatuses] = await Promise.all([
    getSkills(),
    getActivityStatuses()
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground">
          アプリケーションの基本的な設定を管理します
        </p>
      </div>

      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="skills">サポート内容管理</TabsTrigger>
          <TabsTrigger value="statuses">活動ステータス管理</TabsTrigger>
        </TabsList>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>サポート内容の管理</CardTitle>
              <CardDescription>
                サポーターが提供できる「スキル」の種類を管理します。ここで登録した内容が、活動登録時の選択肢になります。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkillsManagement initialSkills={skills} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses">
          <Card>
            <CardHeader>
              <CardTitle>活動ステータス管理</CardTitle>
              <CardDescription>
                活動の進捗状況を示す「ステータス」を管理します。「予定」「完了」「キャンセル」などがこれにあたります。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityStatusesManagement initialStatuses={activityStatuses} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}