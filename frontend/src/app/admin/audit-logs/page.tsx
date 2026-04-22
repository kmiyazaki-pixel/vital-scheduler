'use client';

import SchedulerShell from '@/components/SchedulerShell';
import { fetchAuditLogs } from '@/lib/scheduler-db';
import { useEffect, useState } from 'react';

type AuditLogItem = {
  id: number;
  created_at: string;
  auth_user_id: string | null;
  user_name: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  detail: Record<string, unknown> | null;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs(showReload = false) {
    try {
      if (showReload) {
        setReloading(true);
      } else {
        setLoading(true);
      }

      setError(null);
      const data = await fetchAuditLogs();
      setLogs((data ?? []) as AuditLogItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '監査ログ取得に失敗しました');
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <SchedulerShell title="操作履歴">
      <div style={wrap}>
        <div style={toolbar}>
          <button
            type="button"
            onClick={() => loadLogs(true)}
            style={button}
            disabled={reloading}
          >
            {reloading ? '再読込中...' : '再読み込み'}
          </button>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        {loading ? (
          <div style={loadingBox}>読み込み中...</div>
        ) : (
          <div style={tableScrollWrap}>
            <div style={tableCard}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>日時</th>
                    <th style={th}>操作</th>
                    <th style={th}>対象</th>
                    <th style={th}>対象ID</th>
                    <th style={th}>実行者</th>
                    <th style={th}>詳細</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td style={emptyTd} colSpan={6}>
                        監査ログはまだありません
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td style={td}>{formatDateTime(log.created_at)}</td>
                        <td style={td}>
                          <span style={getActionBadgeStyle(log.action)}>
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td style={td}>{formatTargetType(log.target_type)}</td>
                        <td style={td}>{log.target_id ?? '-'}</td>
                        <td style={td}>{log.user_name ?? log.auth_user_id ?? '-'}</td>
                        <td style={detailTd}>
                          <pre style={pre}>{formatDetail(log.detail)}</pre>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SchedulerShell>
  );
}

function formatAction(action: string) {
  switch (action) {
    case 'event_create':
      return '予定作成';
    case 'event_update':
      return '予定更新';
    case 'event_delete':
      return '予定削除';
    default:
      return action;
  }
}

function formatTargetType(type: string) {
  switch (type) {
    case 'event':
      return '予定';
    default:
      return type;
  }
}

function formatCategory(category: string) {
  switch (category) {
    case 'other':
      return 'その他';
    case 'meeting':
      return '会議';
    case 'work':
      return '業務';
    case 'review':
      return 'レビュー';
    case 'personal':
      return '個人';
    case 'holiday':
      return '休暇';
    case 'visit':
      return '訪問';
    default:
      return category;
  }
}

function formatDateTime(value: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(
    date.getHours()
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(
    date.getSeconds()
  ).padStart(2, '0')}`;
}

function formatDetail(detail: Record<string, unknown> | null) {
  if (!detail) return '-';

  const lines: string[] = [];

  if (typeof detail.title === 'string' && detail.title) {
    lines.push(`タイトル：${detail.title}`);
  }

  if (typeof detail.start_at === 'string' && detail.start_at) {
    lines.push(`開始：${formatDateTime(detail.start_at)}`);
  }

  if (typeof detail.end_at === 'string' && detail.end_at) {
    lines.push(`終了：${formatDateTime(detail.end_at)}`);
  }

  if (typeof detail.category === 'string' && detail.category) {
    lines.push(`区分：${formatCategory(detail.category)}`);
  }

  if (typeof detail.owner_name === 'string' && detail.owner_name) {
    lines.push(`実行者：${detail.owner_name}`);
  }

  if (typeof detail.calendar_id === 'number' || typeof detail.calendar_id === 'string') {
    lines.push(`カレンダーID：${detail.calendar_id}`);
  }

  if (lines.length > 0) {
    return lines.join('\n');
  }

  try {
    return JSON.stringify(detail, null, 2);
  } catch {
    return String(detail);
  }
}

function getActionBadgeStyle(action: string): React.CSSProperties {
  switch (action) {
    case 'event_create':
      return {
        ...actionBadgeBase,
        color: '#1d4ed8',
        background: 'linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%)',
      };
    case 'event_update':
      return {
        ...actionBadgeBase,
        color: '#9a3412',
        background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
      };
    case 'event_delete':
      return {
        ...actionBadgeBase,
        color: '#b91c1c',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
      };
    default:
      return {
        ...actionBadgeBase,
        color: '#374151',
        background: '#f3f4f6',
      };
  }
}

const wrap: React.CSSProperties = {
  display: 'grid',
  gap: 16,
};

const toolbar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const button: React.CSSProperties = {
  border: '1px solid rgba(99,102,241,0.16)',
  borderRadius: 12,
  background: '#fff',
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
};

const errorBox: React.CSSProperties = {
  color: '#b42318',
  fontSize: 13,
  lineHeight: 1.5,
  background: '#FEF3F2',
  border: '1px solid rgba(180,35,24,0.15)',
  borderRadius: 12,
  padding: '12px 14px',
};

const loadingBox: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
};

const tableScrollWrap: React.CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

const tableCard: React.CSSProperties = {
  minWidth: 980,
  background: 'linear-gradient(180deg, #ffffff 0%, #fffafb 100%)',
  borderRadius: 24,
  padding: 16,
  boxShadow: '0 14px 30px rgba(91, 98, 133, 0.10)',
};

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '14px 12px',
  borderBottom: '1px solid rgba(99,102,241,0.12)',
  color: '#1f2340',
  fontSize: 14,
};

const td: React.CSSProperties = {
  padding: '14px 12px',
  borderBottom: '1px solid rgba(99,102,241,0.08)',
  verticalAlign: 'top',
  color: '#1f2340',
};

const detailTd: React.CSSProperties = {
  ...td,
  minWidth: 320,
};

const emptyTd: React.CSSProperties = {
  padding: '24px 12px',
  textAlign: 'center',
  color: '#5b6285',
};

const pre: React.CSSProperties = {
  margin: 0,
  fontFamily: 'inherit',
  whiteSpace: 'pre-wrap',
  lineHeight: 1.7,
  color: '#394067',
};

const actionBadgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};
