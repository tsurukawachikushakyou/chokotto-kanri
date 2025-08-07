import { SupporterForm } from '@/components/supporter-form'

export default function NewSupporterPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">サポーター新規登録</h1>
        <p className="text-muted-foreground">
          新しいサポーターの情報を登録します
        </p>
      </div>

      <SupporterForm />
    </div>
  )
}
