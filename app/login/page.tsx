// -------------------- /app/login/page.tsx (完全版) --------------------
// このコードをコピーして、/app/login/page.tsxファイルの中身と完全に置き換えてください。

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client' // あなたの既存のヘルパー関数をインポート

// ↓↓ shadcn/uiなどのコンポーネントライブラリを使っている場合は、
//    これらのインポートパスが正しいか確認してください。
//    もし使っていない場合は、これらを<divや<form>などの標準HTMLタグに置き換えてください。
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'


export default function LoginPage() {
  const supabase = createClient()

  // Supabaseに登録したユーザーのメールアドレス（固定）
  const TEAM_EMAIL = 'tsurukawa.chikushakyou@gmail.com' 
  
  // コンポーネントの状態管理
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ログインボタンが押されたときの処理
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // フォームのデフォルトの送信動作を防ぐ
    setError(null) // 前のエラーメッセージをクリア
    setLoading(true) // ローディング状態を開始

    // Supabaseにメールとパスワードを送信して認証を試みる
    const { error } = await supabase.auth.signInWithPassword({
      email: TEAM_EMAIL,
      password,
    })

    // 認証でエラーが発生した場合の処理
    if (error) {
      if (error.message === 'Invalid login credentials') {
        setError('パスワードが正しくありません。')
      } else {
        // その他の予期せぬエラー
        setError(`エラー: ${error.message}`)
      }
      setLoading(false) // ローディング状態を解除
      return // 処理を中断
    }

    // ログインに成功した場合、ページをリロードしてホームページに遷移
    // router.push('/') ではなく window.location.href を使うことで、
    // セッション情報を確実に最新の状態に更新できる
    window.location.href = '/'
  }

  // ページの見た目（JSX）
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">ログイン</CardTitle>
          <CardDescription>
            チームで共有しているパスワードを入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading} // ローディング中は入力を無効化
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
// -------------------- ここまで --------------------