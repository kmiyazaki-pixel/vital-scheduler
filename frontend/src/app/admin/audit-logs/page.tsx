'use client';

import  SchedulerShell  from '@/components/SchedulerShell';
import { fetchAuditLogs } from '@/lib/api';
import { AuditLogItem } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '監査ログ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <SchedulerShell title="監査ログ">
      <div style={panel}>
        <div style={headerRow}>
          <h2 style={{ margin: 0 }}>操作履歴</h2>
          <button type="button" onClick={() => void load()} style={button}>
            再読み込み
          </button>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {loading ? (
          <div>読み込み中...</div>
        ) : logs.length === 0 ? (
          <div>監査ログはまだありません。</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={th}>日時</th>
                  <th style={th}>操作</th>
                  <th style={th}>対象</th>
                  <th style={th}>対象ID</th>
                  <th style={th}>実行者ID</th>
                  <th style={th}>詳細</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={td}>{formatDateTime(log.createdAt)}</td>
                    <td style={td}>{formatAction(log.action)}</td>
                    <td style={td}>{formatEntityType(log.entityType)}</td>
                    <td style={td}>{log.entityId ?? '-'}</td>
                    <td style={td}>{log.userId ?? '-'}</td>
                    <td style={detailTd}>
                      <pre style={pre}>{prettyJson(log.detail)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SchedulerShell>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ja-JP');
}

function formatAction(action: string) {
  switch (action) {
    case 'EVENT_CREATED':
      return '予定作成';
    case 'EVENT_UPDATED':
      return '予定更新';
    case 'EVENT_DELETED':
      return '予定削除';
    case 'USER_CREATED':
      return 'ユーザー作成';
    case 'USER_UPDATED':
      return 'ユーザー更新';
    case 'USER_STATUS_UPDATED':
      return 'ユーザー状態変更';
    case 'PASSWORD_CHANGED':
      return 'パスワード変更';
    default:
      return action;
  }
}

function formatEntityType(entityType: string) {
  switch (entityType) {
    case 'event':
      return '予定';
    case 'user':
      return 'ユーザー';
    default:
      return entityType;
  }
}

function prettyJson(value: string | null) {
  if (!value) return '-';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

const panel: React.CSSProperties = {
  background: '#FDFCFA',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 16,
  padding: 20
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16
};

const button: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fffdfa',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer'
};

const errorStyle: React.CSSProperties = {
  color: '#b42318',
  background: '#FEF3F2',
  border: '1px solid rgba(180,35,24,0.15)',
  borderRadius: 10,
  padding: '10px 12px',
  marginBottom: 12
};

const th: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '1px solid rgba(0,0,0,0.12)',
  padding: '10px 8px',
  verticalAlign: 'top'
};

const td: React.CSSProperties = {
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  padding: '10px 8px',
  verticalAlign: 'top'
};

const detailTd: React.CSSProperties = {
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  padding: '10px 8px',
  verticalAlign: 'top',
  maxWidth: 360
};

const pre: React.CSSProperties = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: 12,
  lineHeight: 1.5
};
