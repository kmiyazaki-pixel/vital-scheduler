'use client';

import { useMemo, useState } from 'react';
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
  color: string;
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
  color: '#8b5cf6',
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
    color: event.color ?? '#8b5cf6',
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
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="未入力なら「新しい予定」で保存されます"
              style={input}
              disabled={saving}
            />
          </label>

          <label style={label}>
            <span>区分</span>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
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
            <DatePickerField
              label="開始日"
              value={form.startDate}
              disabled={saving}
              onChange={(value) => setForm((prev) => ({ ...prev, startDate: value }))}
            />

            <label style={halfLabel}>
              <span>開始時刻</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                style={input}
                disabled={saving || form.allDay}
              />
            </label>
          </div>

          <div style={dateTimeRow}>
            <DatePickerField
              label="終了日"
              value={form.endDate}
              disabled={saving}
              onChange={(value) => setForm((prev) => ({ ...prev, endDate: value }))}
            />

            <label style={halfLabel}>
              <span>終了時刻</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                style={input}
                disabled={saving || form.allDay}
              />
            </label>
          </div>

          <label style={checkLabel}>
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => setForm((prev) => ({ ...prev, allDay: e.target.checked }))}
              disabled={saving}
            />
            終日
          </label>

          <label style={label}>
            <span>メモ</span>
            <textarea
              value={form.memo}
              onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
              style={textarea}
              disabled={saving}
            />
          </label>
        </div>

        <div>
  <label style={label}>色</label>
  <div style={colorGrid}>
    {EVENT_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => setForm((prev) => ({ ...prev, color }))}
        style={{
          ...colorButton,
          background: color,
          outline: form.color === color ? '3px solid #111827' : 'none',
        }}
        aria-label={`色 ${color}`}
      />
    ))}
  </div>
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

function DatePickerField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return parseDateValue(value);
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const start = new Date(year, month, 1 - startDay);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, month]);

  const selectedKey = value;
  const weekday = value ? formatWeekdayJa(value) : '';

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectDate = (date: Date) => {
    onChange(toDateInputValue(date));
    setOpen(false);
  };

  return (
    <label style={halfLabel}>
      <span>{label}</span>

      <div style={datePickerWrap}>
        <button
          type="button"
          style={datePickerButton}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
        >
          <span>{value || '日付を選択'}</span>
          <span style={dateInlineWeekday}>{weekday}</span>
        </button>

        {open && (
          <div style={calendarPopup}>
            <div style={calendarPopupHeader}>
              <button type="button" style={smallNavButton} onClick={prevMonth}>
                前
              </button>
              <strong>
                {year}年{month + 1}月
              </strong>
              <button type="button" style={smallNavButton} onClick={nextMonth}>
                次
              </button>
            </div>

            <div style={weekdayGrid}>
              {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
                <div key={d} style={weekdayCell}>
                  {d}
                </div>
              ))}
            </div>

            <div style={calendarGrid}>
              {days.map((date) => {
                const key = toDateInputValue(date);
                const isCurrentMonth = date.getMonth() === month;
                const isSelected = key === selectedKey;
                const day = date.getDay();

                return (
                  <button
                    key={key}
                    type="button"
                    style={{
                      ...calendarDayButton,
                      opacity: isCurrentMonth ? 1 : 0.35,
                      color: day === 0 ? '#dc2626' : day === 6 ? '#2563eb' : '#1f2340',
                      ...(isSelected ? selectedDayButton : {}),
                    }}
                    onClick={() => selectDate(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
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

const datePickerWrap: React.CSSProperties = {
  position: 'relative',
};

const datePickerButton: React.CSSProperties = {
  width: '100%',
  minHeight: 36,
  border: '1px solid #d8dcef',
  borderRadius: 10,
  background: '#fff',
  padding: '7px 10px',
  boxSizing: 'border-box',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
  color: '#1f2340',
};

const dateInlineWeekday: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: '#5b6285',
  whiteSpace: 'nowrap',
};

const calendarPopup: React.CSSProperties = {
  position: 'absolute',
  top: 44,
  left: 0,
  zIndex: 80,
  width: 260,
  background: '#fff',
  border: '1px solid #d8dcef',
  borderRadius: 14,
  padding: 10,
  boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)',
};

const calendarPopupHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
  color: '#1f2340',
};

const smallNavButton: React.CSSProperties = {
  border: '1px solid #d8dcef',
  borderRadius: 9,
  background: '#fff',
  padding: '5px 8px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 12,
};

const weekdayGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
  marginBottom: 4,
};

const weekdayCell: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 900,
  color: '#5b6285',
};

const calendarGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
};

const calendarDayButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 9,
  background: '#f8fafc',
  height: 30,
  cursor: 'pointer',
  fontWeight: 800,
};

const selectedDayButton: React.CSSProperties = {
  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
  color: '#fff',
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

const EVENT_COLORS = [
  '#8b5cf6', // 紫
  '#2563eb', // 青
  '#06b6d4', // 水色
  '#16a34a', // 緑
  '#84cc16', // 黄緑
  '#f59e0b', // オレンジ
  '#ef4444', // 赤
  '#ec4899', // ピンク
  '#7c2d12', // 茶色
  '#475569', // グレー
  '#111827', // 黒
  '#14b8a6', // ティール
];

const colorGrid: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const colorButton: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  border: '2px solid #fff',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
};
