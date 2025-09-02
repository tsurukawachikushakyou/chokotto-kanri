// -------------------- middleware.ts (完全版) --------------------
// このコードをコピーして、middleware.tsファイルの中身と完全に置き換えてください。

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // レスポンスオブジェクトを事前に作成
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Middlewareの特殊な環境に合わせてSupabaseクライアントを初期化
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Middleware内でCookieをセットするためにリクエストとレスポンスの両方にセット
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Middleware内でCookieを削除するためにリクエストとレスポンスの両方にセット
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ユーザーのセッション情報を取得して、ログイン状態を確認
  const { data: { user } } = await supabase.auth.getUser()

  // ケース1: ログインしていない、かつ、アクセス先がログインページでない場合
  if (!user && request.nextUrl.pathname !== '/login') {
    // ログインページへ強制的にリダイレクト
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // ケース2: ログイン済み、かつ、アクセス先がログインページの場合
  if (user && request.nextUrl.pathname === '/login') {
    // すでにログインしているので、ホームページへリダイレクト
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 上記のどのケースにも当てはまらない場合は、そのままアクセスを許可
  return response
}

// Middlewareがどのパスで実行されるかを定義
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
// -------------------- ここまで --------------------