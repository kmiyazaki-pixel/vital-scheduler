'use client';

import { useEffect } from 'react';

const TUNAG_APP_URL =
  process.env.NEXT_PUBLIC_TUNAG_APP_URL || 'https://tunag.vercel.app';

const SCHEDULER_APP_URL =
  process.env.NEXT_PUBLIC_SCHEDULER_APP_URL || '';

export default function LoginPage() {
  useEffect(() => {
    const next =
      typeof window !== 'undefined'
        ? SCHEDULER_APP_URL || window.location.origin
        : '';

    const url = next
      ? `${TUNAG_APP_URL}/login?next=${encodeURIComponent(next)}`
      : `${TUNAG_APP_URL}/login`;

    window.location.replace(url);
  }, []);

  return <div> Tunag のログイン画面へ移動しています... </div>;
}
