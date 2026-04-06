import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VitalArea Scheduler',
  description: '社内スケジューラー',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
