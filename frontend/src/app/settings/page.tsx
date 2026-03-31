'use client';

import { SchedulerShell } from '@/components/SchedulerShell';
import { changeMyPassword } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forcePasswordChange = searchParams.get('forcePasswordChange') === '1';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!currentPassword) {
      setError('現在のパスワードを入力してください');
      return;
    }

    if (!newPassword) {
      setError('新しいパスワードを入力してください');
      return;
    }

    if (newPassword.length < 8) {
      setError('新しいパスワードは8文字以上で入力してください');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError('新しいパスワードの確認が一致しません');
      return;
    }

    try {
      setLoading(true);
      await changeMyPassword({ currentPassword, newPassword });
      setMessage('パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');

      if (forcePasswordChange) {
        setTimeout(() => {
          router.replace('/calendar/month');
        }, 800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワード変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SchedulerShell title="設定">
      <div style={panel}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>パスワード変更</h2>

        {forcePasswordChange && (
          <div style={notice}>
            初回ログインのため、先にパスワード変更が必要です。
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, maxWidth: 480 }}>
          <div style={field}>
            <label>現在のパスワード</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={input}
              disabled={loading}
            />
          </div>

          <div style={field}>
            <label>新しいパスワード</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={input}
              disabled={loading}
            />
          </div>

          <div style={field}>
            <label>新しいパスワード（確認）</label>
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              style={input}
              disabled={loading}
            />
          </div>

          {message && <div style={successStyle}>{message}</div>}
          {error && <div style={errorStyle}>{error}</div>}

          <button type="submit" style={loading ? disabledButton : button} disabled={loading}>
            {loading ? '変更中...' : 'パスワードを変更'}
          </button>
        </form>
      </div>
    </SchedulerShell>
  );
}

const panel: React.CSSProperties = {
  background: '#FDFCFA',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 16,
  padding: 20
};

const notice: React.CSSProperties = {
  marginBottom: 16,
  padding: '12px 14px',
  borderRadius: 10,
  background: '#FFF4E5',
  color: '#9A6700',
  border: '1px solid rgba(154,103,0,0.2)'
};

const field: React.CSSProperties = {
  display: 'grid',
  gap: 6
};

const input: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 10,
  padding: '10px 12px',
  background: '#fffdfa'
};

const button: React.CSSProperties = {
  border: 'none',
  background: '#1A1916',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  width: 180
};

const disabledButton: React.CSSProperties = {
  ...button,
  opacity: 0.6,
  cursor: 'not-allowed'
};

const successStyle: React.CSSProperties = {
  color: '#067647',
  background: '#ECFDF3',
  border: '1px solid rgba(6,118,71,0.15)',
  borderRadius: 10,
  padding: '10px 12px'
};

const errorStyle: React.CSSProperties = {
  color: '#b42318',
  background: '#FEF3F2',
  border: '1px solid rgba(180,35,24,0.15)',
  borderRadius: 10,
  padding: '10px 12px'
};