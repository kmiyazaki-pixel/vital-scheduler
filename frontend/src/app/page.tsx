'use client';

import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.ok) {
          window.location.replace('/calendar/month');
          return;
        }

        window.location.replace('/login');
      } catch {
        window.location.replace('/login');
      }
    };

    run();
  }, []);

  return (
    <main style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <p>カレンダーへ移動しています...</p>
      <p style={{ marginTop: '12px' }}>開かない場合は /login を開いてください。</p>
    </main>
  );
}
