'use client';

import Link from 'next/link';
import { logout } from '@/lib/api';
import { useState } from 'react';

type SchedulerShellProps = {
  title?: string;
  children: React.ReactNode;
};

export default function SchedulerShell({
  title = 'VitalArea Scheduler',
  children,
}: SchedulerShellProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch {
      //
    } finally {
      window.location.replace('/login');
    }
  };

  return (
    <div style={page}>
      <aside style={sidebar}>
        <div style={brand}>VitalArea Scheduler</div>

        <nav style={nav}>
          <Link href="/calendar/month" style={navLink}>
            月表示
          </Link>
          <Link href="/calendar/week" style={navLink}>
            週表示
          </Link>
          <Link href="/settings" style={navLink}>
            設定
          </Link>
          <Link href="/admin/users" style={navLink}>
            ユーザー管理
          </Link>
          <Link href="/admin/audit-logs" style={navLink}>
            監査ログ
          </Link>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          style={loggingOut ? disabledLogoutButton : logoutButton}
        >
          {loggingOut ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </aside>

      <main style={main}>
        <header style={header}>
          <h1 style={titleStyle}>{title}</h1>
        </header>

        <section style={content}>{children}</section>
      </main>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '240px 1fr',
  background: '#F5F3EE',
};

const sidebar: React.CSSProperties = {
  borderRight: '1px solid rgba(0,0,0,0.08)',
  background: '#FDFCFA',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const brand: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.04em',
};

const nav: React.CSSProperties = {
  display: 'grid',
  gap: 8,
};

const navLink: React.CSSProperties = {
  display: 'block',
  padding: '10px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  color: '#1A1916',
  background: '#F5F3EE',
};

const logoutButton: React.CSSProperties = {
  marginTop: 'auto',
  border: 'none',
  borderRadius: 10,
  background: '#1A1916',
  color: '#F5F3EE',
  padding: '12px 14px',
  cursor: 'pointer',
};

const disabledLogoutButton: React.CSSProperties = {
  ...logoutButton,
  opacity: 0.6,
  cursor: 'not-allowed',
};

const main: React.CSSProperties = {
  minWidth: 0,
  padding: 24,
};

const header: React.CSSProperties = {
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
};

const content: React.CSSProperties = {
  background: '#FDFCFA',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 16,
  padding: 20,
  minHeight: 'calc(100vh - 120px)',
};
