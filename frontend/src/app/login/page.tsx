'use client';

import { login } from '@/lib/api';
import { useEffect, useState } from 'react';

const COMPANY_DOMAIN = '@vital-area.com';

export default function LoginPage() {
  const [nextPath, setNextPath] = useState('/calendar/month');
  const [loginId, setLoginId] = useState('yamada');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get('next') || '/calendar/month');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedLoginId = loginId.trim().toLowerCase();

    if (!normalizedLoginId) {
      setError('ログインIDを入力してください');
      setLoading(false);
      return;
    }

    if (normalizedLoginId.includes('@')) {
      setError('@以降は入力しないでください');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('パスワードを入力してください');
      setLoading(false);
      return;
    }

    try {
      const email = `${normalizedLoginId}${COMPANY_DOMAIN}`;
      const result = await login({ email, password });

      if (result.passwordChangeRequired) {
        window.location.replace('/settings?forcePasswordChange=1');
        return;
      }

      window.location.replace(nextPath || '/calendar/month');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={brand}>VitalArea Scheduler</div>
        <h1 style={title}>ログイン</h1>
        <p style={description}>
          ログインIDだけ入力してください。ドメインは {COMPANY_DOMAIN} 固定です。
        </p>

        <form style={{ display: 'grid', gap: 14 }} onSubmit={handleSubmit}>
          <div style={field}>
            <label style={labelStyle}>ログインID</label>
            <div style={loginIdWrapStyle}>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="yamada"
                style={loginIdInputStyle}
                disabled={loading}
              />
              <span style={domainStyle}>{COMPANY_DOMAIN}</span>
            </div>
          </div>

          <div style={field}>
            <label style={labelStyle}>パスワード</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              type="password"
              style={inputStyle}
              disabled={loading}
            />
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <button
            type="submit"
            style={loading ? disabledButtonStyle : buttonStyle}
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: '#F5F3EE'
};

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: '#FDFCFA',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 12px 32px rgba(0,0,0,0.04)'
};

const brand: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#8f8a81',
  marginBottom: 8
};

const title: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 8,
  fontSize: 28
};

const description: React.CSSProperties = {
  color: '#6B6760',
  marginTop: 0,
  marginBottom: 18,
  lineHeight: 1.6,
  fontSize: 14
};

const field: React.CSSProperties = {
  display: 'grid',
  gap: 6
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6B6760'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#F5F3EE'
};

const loginIdWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#F5F3EE',
  overflow: 'hidden'
};

const loginIdInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 14px',
  border: 'none',
  outline: 'none',
  background: 'transparent'
};

const domainStyle: React.CSSProperties = {
  padding: '0 14px',
  color: '#6B6760',
  fontSize: 14,
  whiteSpace: 'nowrap',
  borderLeft: '1px solid rgba(0,0,0,0.08)'
};

const errorStyle: React.CSSProperties = {
  color: '#b42318',
  fontSize: 13,
  lineHeight: 1.5,
  background: '#FEF3F2',
  border: '1px solid rgba(180,35,24,0.15)',
  borderRadius: 10,
  padding: '10px 12px'
};

const buttonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 10,
  background: '#1A1916',
  color: '#F5F3EE',
  padding: '12px 14px',
  cursor: 'pointer'
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.6,
  cursor: 'not-allowed'
};
