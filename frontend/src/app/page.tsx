'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (cancelled) return;

        if (res.ok) {
          router.replace('/calendar/month');
        } else {
          router.replace('/login');
        }
      } catch {
        if (!cancelled) {
          router.replace('/login');
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <div>カレンダーへ移動しています...</div>;
}
