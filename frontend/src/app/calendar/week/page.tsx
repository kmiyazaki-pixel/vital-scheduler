'use client';

import { useEffect, useState } from 'react';

export default function CalendarWeekPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (cancelled) return;

        if (!res.ok) {
          window.location.replace('/login');
          return;
        }

        setReady(true);
      } catch {
        if (!cancelled) {
          window.location.replace('/login');
        }
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <div>読み込み中...</div>;
  }

  return <div>週カレンダー本体</div>;
}
