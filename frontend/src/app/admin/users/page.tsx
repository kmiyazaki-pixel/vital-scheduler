'use client';

import { SchedulerShell } from '@/components/SchedulerShell';
import { createUser, fetchUsers, updateUserStatus } from '@/lib/api';
import { UserSummary } from '@/lib/types';
import { useEffect, useState } from 'react';

const COMPANY_DOMAIN = '@vital-area.com';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    loginId: '',
    password: '',
    role: 'member' as const
  });

  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await fetchUsers());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const normalizedLoginId = form.loginId.trim().toLowerCase();

    if (!form.name.trim()) {
      setError('名前を入力してください');
      return;
    }

    if (!normalizedLoginId) {
      setError('ログインIDを入力してください');
      return;
    }

    if (normalizedLoginId.includes('@')) {
      setError('@以降は入力しないでください');
      return;
    }

    if (!form.password.trim()) {
      setError('初期パスワードを入力してください');
      return;
    }

    if (form.password.length < 8) {
      setError('初期パスワードは8文字以上で入力してください');
      return;
    }

    try {
      setSubmitting(true);

      await createUser({
        name: form.name.trim(),
        email: `${normalizedLoginId}${COMPANY_DOMAIN}`,
        password: form.password,
        role: form.role
      });

      setForm({
        name: '',
        loginId: '',
        password: '',
        role: 'member'
      });

      setMessage('ユーザーを追加しました');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user: UserSummary) => {
    setError(null);
    setMessage(null);

    const nextActive = !user.active;
    const ok = window.confirm(
      nextActive
        ? `${user.name} を有効にします。よろしいですか？`
        : `${user.name} を無効にします。よろしいですか？`
    );

    if (!ok) return;

    try {
      const updated = await updateUserStatus(user.id, nextActive);
      setUsers((current) => current.map((item) => (item.id === user.id ? updated : item)));
      setMessage(nextActive ? 'ユーザーを有効にしました' : 'ユーザーを無効にしました');
    } catch (err) {
      setError(err instanceof Error ? err.message : '状態更新に失敗しました');
    }
  };

  return (
    <SchedulerShell title="ユーザー管理">
      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(320px, 380px) 1fr' }}>
        <form onSubmit={handleCreate} style={panel}>
          <h2 style={{ marginTop: 0 }}>ユーザー追加</h2>

          <div style={field}>
            <span>名前</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={input}
              required
              disabled={submitting}
            />
          </div>

          <div style={field}>
            <span>ログインID</span>
            <div style={loginIdWrapStyle}>
              <input
                value={form.loginId}
                onChange={(e) => setForm({ ...form, loginId: e.target.value })}
                style={loginIdInputStyle}
                placeholder="yamada"
                required
                disabled={submitting}
              />
              <span style={domainStyle}>{COMPANY_DOMAIN}</span>
            </div>
          </div>

          <div style={field}>
            <span>初期パスワード</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={input}
              required
              disabled={submitting}
            />
          </div>

          <div style={field}>
            <span>権限</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'member' })}
              style={input}
              disabled={submitting}
            >
              <option value="admin">admin</option>
              <option value="member">member</option>
            </select>
          </div>

          {message && <div style={successStyle}>{message}</div>}
          {error && <div style={errorStyle}>{error}</div>}

          <button type="submit" style={submitting ? disabledButton : button} disabled={submitting}>
            {submitting ? '追加中...' : 'ユーザーを追加'}
          </button>
        </form>

        <div style={panel}>
          <h2 style={{ marginTop: 0 }}>一覧</h2>

          {loading ? (
            <div>読み込み中...</div>
          ) : users.length === 0 ? (
            <div>ユーザーはまだ登録されていません。</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>名前</th>
                  <th style={th}>メール</th>
                  <th style={th}>権限</th>
                  <th style={th}>状態</th>
                  <th style={th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={td}>{user.name}</td>
                    <td style={{ ...td, minWidth: 220 }}>{user.email}</td>
                    <td style={td}>{user.role}</td>
                    <td style={td}>
                      <span style={user.active ? activeBadge : inactiveBadge}>
                        {user.active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td style={td}>
                      <button type="button" onClick={() => toggleActive(user)} style={statusButton}>
                        {user.active ? '無効にする' : '有効にする'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

const field: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  marginBottom: 12
};

const input: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 10,
  padding: '10px 12px',
  background: '#fffdfa'
};

const loginIdWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fffdfa',
  overflow: 'hidden'
};

const loginIdInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  padding: '10px 12px',
  background: 'transparent'
};

const domainStyle: React.CSSProperties = {
  padding: '0 12px',
  color: '#6B6760',
  borderLeft: '1px solid rgba(0,0,0,0.08)',
  whiteSpace: 'nowrap'
};

const button: React.CSSProperties = {
  border: 'none',
  background: '#1A1916',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer'
};

const disabledButton: React.CSSProperties = {
  ...button,
  opacity: 0.6,
  cursor: 'not-allowed'
};

const statusButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fffdfa',
  borderRadius: 10,
  padding: '8px 12px',
  cursor: 'pointer'
};

const th: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '1px solid rgba(0,0,0,0.12)',
  padding: '10px 8px'
};

const td: React.CSSProperties = {
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  padding: '10px 8px',
  verticalAlign: 'middle'
};

const activeBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 999,
  background: '#ECFDF3',
  color: '#067647',
  fontSize: 12
};

const inactiveBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 999,
  background: '#FEF3F2',
  color: '#b42318',
  fontSize: 12
};

const successStyle: React.CSSProperties = {
  color: '#067647',
  background: '#ECFDF3',
  border: '1px solid rgba(6,118,71,0.15)',
  borderRadius: 10,
  padding: '10px 12px',
  marginBottom: 12
};

const errorStyle: React.CSSProperties = {
  color: '#b42318',
  background: '#FEF3F2',
  border: '1px solid rgba(180,35,24,0.15)',
  borderRadius: 10,
  padding: '10px 12px',
  marginBottom: 12
};