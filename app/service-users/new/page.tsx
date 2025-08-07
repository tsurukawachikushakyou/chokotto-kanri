import { ServiceUserForm } from '@/components/service-user-form'

export default function NewServiceUserPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">利用者新規登録</h1>
        <p className="text-muted-foreground">
          新しい利用者の情報を登録します
        </p>
      </div>

      <ServiceUserForm />
    </div>
  )
}
