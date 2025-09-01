import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const password = process.env.SIMPLE_AUTH_PASSWORD;

  // デバッグ用のログはそのまま残しても、削除してもOKです
  console.log('--- Middleware Check ---');
  console.log('Expected Password (from env):', password);
  const storedPassword = req.cookies.get('simple-auth-password')?.value;
  console.log('Received Password (from cookie):', storedPassword);

  if (!password) {
    return NextResponse.next();
  }
  
  if (req.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // パスワードが一致しない場合
  if (storedPassword !== password) {
    console.log('Password mismatch. Redirecting to login.');
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', '1'); 
    
    // === ▼ 修正箇所 ▼ ===
    // パスワードが一致しない場合は、どのページへのアクセスであっても
    // 古いCookieを削除してからログインページへリダイレクトする
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('simple-auth-password');
    return response;
    // === ▲ 修正箇所 ▲ ===
  }

  console.log('Password matched. Allowing access.');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};