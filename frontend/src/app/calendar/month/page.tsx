'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CalendarMonthPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (cancelled) return;

        if (!res.ok) {
          router.replace('/login');
          return;
        }

        setReady(true);
      } catch {
        if (!cancelled) {
          router.replace('/login');
        }
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <div>読み込み中...</div>;
  }

  return (
    <div>
      月カレンダー本体
    </div>
  );
}
