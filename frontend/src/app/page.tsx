'use client';

import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    window.location.replace('/calendar/month');
  }, []);

  return <div>カレンダーへ移動しています...</div>;
}
