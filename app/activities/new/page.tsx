import { ActivityFormWrapper } from '@/components/activity-form-wrapper'

export default function NewActivityPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">活動新規登録</h1>
        <p className="text-muted-foreground">
          新しい活動を登録します
        </p>
      </div>

      <ActivityFormWrapper />
    </div>
  )
}
