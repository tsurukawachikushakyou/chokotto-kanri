'use client';

import { Suspense, useState, useEffect } from 'react'; // Suspense をインポート
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

// 実際のロジックを持つコンポーネントを切り出す
function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams(); // このフックがSuspenseを必要とする

  // ページが読み込まれた時に、URLのクエリパラメータをチェックする
  useEffect(() => {
    if (searchParams.get('error') === '1') {
      setError('パスワードが違うか、有効期限が切れました。');
      // エラー表示後、URLからクエリを消してリロードしてもエラーが出ないようにする
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password) {
      Cookies.set('simple-auth-password', password, { expires: 1 });
      router.push('/');
    } else {
      setError('パスワードを入力してください');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>ログイン</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          style={{ padding: '0.5rem' }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }}>
          入室する
        </button>
      </form>
    </div>
  );
}

// メインのページコンポーネント
export default function LoginPage() {
  // Suspenseでロジックコンポーネントを囲む
  // fallbackは、LoginFormの準備ができるまでに表示する内容（今回は何も表示しない）
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}