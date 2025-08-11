import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground">
          システムのマスタデータを管理できます
        </p>
      </div>

      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="skills">サポート内容管理</TabsTrigger>
          <TabsTrigger value="statuses">活動ステータス管理</TabsTrigger>
        </TabsList>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>サポート内容の管理</CardTitle>
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
