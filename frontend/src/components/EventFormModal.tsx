'use client';

import { EventItem } from '@/lib/types';

export type EventFormState = {
  id?: number;
  title: string;
  category: string;
  memo: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
};

type NormalizedEvent = EventItem & {
  calendarId?: number;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
};

type Props = {
  open: boolean;
  saving: boolean;
  form: EventFormState;
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export const EMPTY_FORM: EventFormState = {
  title: '',
  category: 'other',
  memo: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  allDay: false,
};

export function buildFormFromEvent(event: NormalizedEvent): EventFormState {
  const start = new Date(event.startAt as string);
  const end = new Date(event.endAt as string);

  return {
    id: event.id,
    title: event.title,
    category: event.category,
    memo: event.memo ?? '',
    startDate: toDateInputValue(start),
    startTime: toTimeInputValue(start),
    endDate: toDateInputValue(end),
    endTime: toTimeInputValue(end),
    allDay: Boolean(event.allDay),
  };
}

export default function EventFormModal({
  open,
  saving,
  form,
  setForm,
  onClose,
  onSave,
  onDelete,
}: Props) {
  if (!open) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={modalTitle}>{form.id ? '予定を編集' : '予定を追加'}</h3>

        <div style={formGrid}>
          <label style={label}>
            <span>タイトル</span>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              placeholder="未入力なら「新しい予定」で保存されます"
              style={input}
              disabled={saving}
            />
          </label>

          <label style={label}>
            <span>区分</span>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              style={input}
              disabled={saving}
            >
              <option value="other">その他</option>
              <option value="meeting">会議</option>
              <option value="work">業務</option>
              <option value="review">レビュー</option>
              <option value="personal">個人</option>
              <option value="holiday">休暇</option>
              <option value="visit">訪問</option>
            </select>
          </label>

          <div style={dateTimeRow}>
            <label style={halfLabel}>
              <span>開始日</span>
              <div style={dateInlineBox}>
                <input
  type="text"
  inputMode="numeric"
  placeholder="2026-04-24"
  value={form.startDate}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      startDate: e.target.value,
    }))
  }
  style={dateInlineInput}
  disabled={saving}
/>
                <span style={dateInlineWeekday}>
                  {form.startDate ? formatWeekdayJa(form.startDate) : ''}
                </span>
              </div>
            </label>

            <label style={halfLabel}>
              <span>開始時刻</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                style={input}
                disabled={saving || form.allDay}
              />
            </label>
          </div>

          <div style={dateTimeRow}>
            <label style={halfLabel}>
              <span>終了日</span>
              <div style={dateInlineBox}>
                <input
  type="text"
  inputMode="numeric"
  placeholder="2026-04-24"
  value={form.endDate}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      endDate: e.target.value,
    }))
  }
  style={dateInlineInput}
  disabled={saving}
/>
                <span style={dateInlineWeekday}>
                  {form.endDate ? formatWeekdayJa(form.endDate) : ''}
                </span>
              </div>
            </label>

            <label style={halfLabel}>
              <span>終了時刻</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    endTime: e.target.value,
                  }))
                }
                style={input}
                disabled={saving || form.allDay}
              />
            </label>
          </div>

          <label style={checkLabel}>
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  allDay: e.target.checked,
                }))
              }
              disabled={saving}
            />
            終日
          </label>

          <label style={label}>
            <span>メモ</span>
            <textarea
              value={form.memo}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  memo: e.target.value,
                }))
              }
              style={textarea}
              disabled={saving}
            />
          </label>
        </div>

        <div style={modalActions}>
          <button style={button} onClick={onClose} disabled={saving}>
            キャンセル
          </button>

          {form.id && (
            <button style={dangerButton} onClick={onDelete} disabled={saving}>
              削除
            </button>
          )}

          <button style={primaryButton} onClick={onSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toTimeInputValue(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatWeekdayJa(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  return weekdays[d.getDay()];
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.35)',
  display: 'grid',
  placeItems: 'center',
  padding: 16,
  zIndex: 50,
};

const modal: React.CSSProperties = {
  width: '100%',
  maxWidth: 560,
  background: 'linear-gradient(180deg, #ffffff 0%, #fffafb 100%)',
  borderRadius: 19,
  padding: 20,
  boxShadow: '0 16px 32px rgba(15, 23, 42, 0.20)',
};

const modalTitle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 18,
  fontWeight: 800,
  color: '#2d3355',
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gap: 9,
};

const label: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  fontWeight: 700,
  color: '#394067',
};

const halfLabel: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  fontWeight: 700,
  color: '#394067',
  width: 260,
  minWidth: 0,
};

const dateTimeRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '260px 260px',
  gap: 16,
  alignItems: 'start',
};

const dateInlineBox: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #d8dcef',
  borderRadius: 10,
  boxSizing: 'border-box',
  background: '#fff',
  minHeight: 56,
};

const dateInlineInput: React.CSSProperties = {
  width: '100%',
  minWidth: 140,
  border: 'none',
  outline: 'none',
  fontSize: 13,
  background: 'transparent',
  padding: 0,
  boxSizing: 'border-box',
};

const dateInlineWeekday: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: '#5b6285',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid #d8dcef',
  borderRadius: 10,
  fontSize: 13,
  boxSizing: 'border-box',
  background: '#fff',
  minHeight: 36,
};

const textarea: React.CSSProperties = {
  width: '100%',
  minHeight: 150,
  padding: '10px 11px',
  border: '1px solid #d8dcef',
  borderRadius: 11,
  fontSize: 14,
  boxSizing: 'border-box',
  background: '#fff',
  resize: 'vertical',
};

const checkLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontWeight: 700,
  color: '#394067',
};

const modalActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 10,
  flexWrap: 'wrap',
};

const button: React.CSSProperties = {
  border: '1px solid rgba(99,102,241,0.16)',
  borderRadius: 12,
  background: '#fff',
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
};

const primaryButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 12,
  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
  color: '#fff',
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 800,
  boxShadow: '0 8px 18px rgba(99, 102, 241, 0.22)',
};

const dangerButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 12,
  background: 'linear-gradient(90deg, #ef4444, #dc2626)',
  color: '#fff',
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 800,
};
