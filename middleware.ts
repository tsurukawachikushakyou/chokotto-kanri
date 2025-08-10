import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const password = process.env.SIMPLE_AUTH_PASSWORD;

  if (!password) {
    return NextResponse.next();
  }
  
  // ログインページ自体と、そのエラー表示の場合はチェック対象外
  if (req.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  const storedPassword = req.cookies.get('simple-auth-password')?.value;

  // パスワードが一致しない場合
  if (storedPassword !== password) {
    // === ▼ 修正箇所 ▼ ===
    // ログインページへリダイレクトする際に、エラーを示すクエリパラメータを付与する
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', '1'); 
    
    // ログイン試行後のリダイレクトの場合、元のクッキーを削除して再入力を促す
    if (req.nextUrl.pathname === '/') {
       const response = NextResponse.redirect(loginUrl);
       response.cookies.delete('simple-auth-password');
       return response;
    }
    
    return NextResponse.redirect(loginUrl);
    // === ▲ 修正箇所 ▲ ===
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};