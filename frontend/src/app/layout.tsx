import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VitalArea Scheduler',
  description: '社内スケジュール共有アプリ'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
