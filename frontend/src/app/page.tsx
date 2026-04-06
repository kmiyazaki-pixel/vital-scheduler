'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const go = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (cancelled) return;

        if (res.ok) {
          router.replace('/calendar/month');
          return;
        }

        router.replace('/login');
      } catch {
        if (!cancelled) {
          router.replace('/login');
        }
      }
    };

    go();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <p>カレンダーへ移動しています...</p>
      <p style={{ marginTop: '12px' }}>
        開かない場合は <Link href="/login">こちら</Link>
      </p>
    </main>
  );
}
