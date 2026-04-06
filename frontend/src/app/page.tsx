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

  return <div>カレンダーへ移動しています...</div>;
}
