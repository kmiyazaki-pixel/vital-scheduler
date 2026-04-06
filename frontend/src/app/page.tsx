'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });

        // 未ログインならログインへ
        if (!res.ok) {
          window.location.href = '/login';
          return;
        }

        // ログイン済みならカレンダーへ
        window.location.href = '/calendar/month';
      } catch {
        window.location.href = '/login';
      }
    };

    run();
  }, []);

  return <div>カレンダーへ移動しています...</div>;
}
