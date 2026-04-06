'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <p>トップページです。</p>
      <p style={{ marginTop: '12px' }}>
        <Link href="/login">ログイン画面へ</Link>
      </p>
    </main>
  );
}
