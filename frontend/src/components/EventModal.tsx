'use client';

import { useEffect, useMemo, useState } from 'react';

import { Category } from '@/lib/types';

type EventFormValue = {
  title: string;
  category: Category;
  memo: string;
  date: string;
  startHour: number;
  endHour: number;
};

type EventModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialDate: string;
  initialValue?: Partial<EventFormValue>;
  loading?: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onSubmit: (value: EventFormValue) => Promise<void> | void;
};

const categoryOptions: { value: Category; label: string }[] = [
  { value: 'meeting', label: '会議' },
  { value: 'work', label: '作業' },
  { value: 'review', label: '確認' },
  { value: 'personal', label: '個人' },
  { value: 'other', label: 'その他' }
];

export function EventModal({
  open,
  mode,
  initialDate,
  initialValue,
  loading = false,
  onClose,
  onDelete,
  onSubmit
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('work');
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(initialDate);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(10);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialValue?.title ?? '');
    setCategory(initialValue?.category ?? 'work');
    setMemo(initialValue?.memo ?? '');
    setDate(initialValue?.date ?? initialDate);
    setStartHour(initialValue?.startHour ?? 9);
    setEndHour(initialValue?.endHour ?? 10);
    setError(null);
  }, [open, initialDate, initialValue]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  if (!open) return null;

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    if (!date) {
      setError('日付を選択してください');
      return;
    }

    if (endHour <= startHour) {
      setError('終了時間は開始時間より後にしてください');
      return;
    }

    await onSubmit({
      title: title.trim(),
      category,
      memo: memo.trim(),
      date,
      startHour,
      endHour
    });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <h3 style={{ margin: 0 }}>{mode === 'create' ? '予定を追加' : '予定を編集'}</h3>
          <button type="button" onClick={onClose} style={closeButton}>
            ×
          </button>
        </div>

        <div style={field}>
          <label style={label}>タイトル</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：週次ミーティング"
            style={input}
            disabled={loading}
          />
        </div>

        <div style={field}>
          <label style={label}>カテゴリ</label>
          <div style={categoryGrid}>
            {categoryOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                style={item.value === category ? selectedCategoryButton : categoryButton}
                disabled={loading}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={field}>
          <label style={label}>日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={input}
            disabled={loading}
          />
        </div>

        <div style={timeGrid}>
          <div style={field}>
            <label style={label}>開始</label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              style={input}
              disabled={loading}
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <div style={field}>
            <label style={label}>終了</label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              style={input}
              disabled={loading}
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={field}>
          <label style={label}>メモ（任意）</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="備考など"
            style={textarea}
            disabled={loading}
          />
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <div style={footer}>
          <div>
            {mode === 'edit' && onDelete && (
              <button type="button" onClick={onDelete} style={dangerButton} disabled={loading}>
                削除
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={ghostButton} disabled={loading}>
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              style={loading ? disabledButton : primaryButton}
              disabled={loading}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.32)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 50,
  padding: 16
};

const modal: React.CSSProperties = {
  width: '100%',
  maxWidth: 560,
  background: '#FDFCFA',
  borderRadius: 18,
  border: '1px solid rgba(0,0,0,0.12)',
  padding: 20,
  boxShadow: '0 18px 48px rgba(0,0,0,0.12)'
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16
};

const closeButton: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 24,
  lineHeight: 1,
  cursor: 'pointer',
  color: '#6B6760'
};

const field: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  marginBottom: 12
};

const label: React.CSSProperties = {
  fontSize: 13,
  color: '#6B6760'
};

const input: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 10,
  padding: '10px 12px',
  background: '#fffdfa'
};

const textarea: React.CSSProperties = {
  ...input,
  minHeight: 92,
  resize: 'vertical'
};

const categoryGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 8
};

const categoryButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 10,
  background: '#fffdfa',
  padding: '10px 8px',
  cursor: 'pointer'
};

const selectedCategoryButton: React.CSSProperties = {
  ...categoryButton,
  border: '1px solid #1A1916',
  background: '#F5F3EE',
  fontWeight: 700
};

const timeGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12
};

const errorBox: React.CSSProperties = {
  color: '#b42318',
  background: '#FEF3F2',
  border: '1px solid rgba(180,35,24,0.15)',
  borderRadius: 10,
  padding: '10px 12px',
  marginBottom: 12
};

const footer: React.CSSProperties = {
  marginTop: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const ghostButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fffdfa',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer'
};

const primaryButton: React.CSSProperties = {
  border: 'none',
  background: '#1A1916',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 16px',
  cursor: 'pointer'
};

const disabledButton: React.CSSProperties = {
  ...primaryButton,
  opacity: 0.6,
  cursor: 'not-allowed'
};

const dangerButton: React.CSSProperties = {
  border: '1px solid #F3C7C7',
  background: '#FFF8F8',
  color: '#B42318',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer'
};
