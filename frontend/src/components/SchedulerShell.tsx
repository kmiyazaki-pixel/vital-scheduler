'use client';

import Link from 'next/link';
import { fetchMe, logout } from '@/lib/api';
import { UserSummary } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren, useEffect, useState } from 'react';

type SchedulerShellProps = PropsWithChildren<{
  title: string;
}>;

export function SchedulerShell({ title, children }: SchedulerShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [me, setMe] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMe = async () => {
      try {
        const user = await fetchMe();

        if (!active) return;

        setMe(user);

        if (user.passwordChangeRequired && pathname !== '/settings') {
          router.replace('/settings?forcePasswordChange=1');
          return;
        }
      } catch {
        if (!active) return;
        router.replace(`/login?next=${encodeURIComponent(pathname || '/calendar/month')}`);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadMe();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  if (loading) {
    return (
      <div style={loadingWrap}>
        <div>読み込み中...</div>
      </div>
    );
  }

  if (!me) {
    return null;
  }

  return (
    <div style={page}>
      <header style={header}>
        <div>
          <div style={brand}>VitalArea Scheduler</div>
          <h1 style={titleStyle}>{title}</h1>
        </div>

        <div style={headerRight}>
          <nav style={nav}>
            <Link href="/calendar/month" style={navButton}>月表示</Link>
            <Link href="/calendar/week" style={navButton}>週表示</Link>
            {me.role === 'admin' && <Link href="/admin/users" style={navButton}>ユーザー管理</Link>}
            <Link href="/admin/audit-logs" style={navButton}>監査ログ</Link>
            <Link href="/settings" style={navButton}>設定</Link>
          </nav>

          <div style={userBlock}>
            <div style={{ fontSize: 13, color: '#6B6760' }}>{me.name}</div>
            <div style={{ fontSize: 12, color: '#8f8a81' }}>{me.email}</div>
          </div>

          <button type="button" onClick={handleLogout} style={logoutButton}>
            ログアウト
          </button>
        </div>
      </header>

      <main style={main}>{children}</main>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F5F3EE',
  color: '#1A1916'
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  padding: '24px 28px',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  background: '#FDFCFA'
};

const brand: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#8f8a81',
  marginBottom: 6
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28
};

const headerRight: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  justifyItems: 'end'
};

const nav: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end'
};

const navButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fffdfa',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  textDecoration: 'none',
  color: '#1A1916'
};

const userBlock: React.CSSProperties = {
  textAlign: 'right'
};

const logoutButton: React.CSSProperties = {
  border: 'none',
  background: '#1A1916',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer'
};

const main: React.CSSProperties = {
  padding: 24
};

const loadingWrap: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: '#F5F3EE'
};