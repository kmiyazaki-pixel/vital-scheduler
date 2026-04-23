'use client';

import SchedulerShell from '@/components/SchedulerShell';
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from '@/lib/scheduler-db';
import { EventItem } from '@/lib/types';
import { between, isHoliday } from 'holiday-jp-dayjs';
import { useEffect, useMemo, useState } from 'react';

type EventFormState = {
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

const EMPTY_FORM: EventFormState = {
  title: '',
  category: 'other',
  memo: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  allDay: false,
};

const FIXED_CALENDAR_ID = 1;

export default function CalendarWeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + diff);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekLabel = `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}`;
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const todayKey = formatLocalDateKey(new Date());

  const loadEvents = async (days: Date[]) => {
    try {
      setLoading(true);
      setError(null);

      const from = formatDateParam(days[0]);
      const to = formatDateParam(days[6]);
      const data = await fetchEvents(FIXED_CALENDAR_ID, from, to);

      setEvents(data as EventItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(weekDays);
  }, [weekDays]);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const normalizedEvents = useMemo<NormalizedEvent[]>(() => {
    return events.map((e) => ({
      ...e,
      calendarId: (e as any).calendarId ?? (e as any).calendar_id,
      startAt: (e as any).startAt ?? (e as any).start_at,
      endAt: (e as any).endAt ?? (e as any).end_at,
      allDay: (e as any).allDay ?? (e as any).is_all_day,
    }));
  }, [events]);

  const eventsByDayAndHour = useMemo(() => {
    const map = new Map<string, NormalizedEvent[]>();

    for (const e of normalizedEvents) {
      if (!e.startAt) continue;
      const start = new Date(e.startAt);
      const key = `${formatLocalDateKey(start)}-${start.getHours()}`;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }

    return map;
  }, [normalizedEvents]);

  const openCreateModal = (date?: Date, hour?: number) => {
    const baseDate = date ? new Date(date) : new Date(weekDays[0]);
    const baseHour = typeof hour === 'number' ? hour : 9;

    setForm({
      ...EMPTY_FORM,
      startDate: toDateInputValue(baseDate),
      startTime: `${String(baseHour).padStart(2, '0')}:00`,
      endDate: toDateInputValue(baseDate),
      endTime: `${String(Math.min(baseHour + 1, 23)).padStart(2, '0')}:00`,
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (event: NormalizedEvent) => {
    const start = new Date(event.startAt as string);
    const end = new Date(event.endAt as string);

    setForm({
      id: event.id,
      title: event.title,
      category: event.category,
      memo: event.memo ?? '',
      startDate: toDateInputValue(start),
      startTime: toTimeInputValue(start),
      endDate: toDateInputValue(end),
      endTime: toTimeInputValue(end),
      allDay: Boolean(event.allDay),
    });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    const missing: string[] = [];

    if (!form.startDate) missing.push('開始日');
    if (!form.startTime && !form.allDay) missing.push('開始時刻');
    if (!form.endDate) missing.push('終了日');
    if (!form.endTime && !form.allDay) missing.push('終了時刻');

    if (missing.length > 0) {
      setError(`${missing.join('、')}は必須です`);
      return;
    }

    const safeTitle = form.title.trim() || '新しい予定';
    const startAt = form.allDay
      ? buildLocalIso(form.startDate, '00:00')
      : buildLocalIso(form.startDate, form.startTime);
    const endAt = form.allDay
      ? buildLocalIso(form.endDate, '23:59')
      : buildLocalIso(form.endDate, form.endTime);

    if (new Date(startAt).getTime() > new Date(endAt).getTime()) {
      setError('終了は開始より後にしてください');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        calendar_id: FIXED_CALENDAR_ID,
        title: safeTitle,
        category: form.category,
        memo: form.memo,
        start_at: startAt,
        end_at: endAt,
        is_all_day: form.allDay,
      };

      if (form.id) {
        await updateEvent(form.id, payload);
      } else {
        await createEvent(payload);
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);
      await loadEvents(weekDays);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;

    try {
      setSaving(true);
      setError(null);
      await deleteEvent(form.id);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await loadEvents(weekDays);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SchedulerShell title="週表示">
      <div style={pageWrap}>
        <div style={toolbar}>
          <div style={weekNav}>
            <button onClick={prevWeek} style={navButton}>
              前週
            </button>
            <h2 style={weekTitle}>{weekLabel}</h2>
            <button onClick={nextWeek} style={navButton}>
              次週
            </button>
          </div>

          <button onClick={() => openCreateModal()} style={mainButton}>
            予定を追加
          </button>
        </div>

        {error && <div style={errorBox}>{error}</div>}
        {loading && <div style={loadingBox}>読み込み中...</div>}

        {!loading && (
          <div style={weekTable}>
            <div style={cornerCell} />

            {weekDays.map((day) => {
              const key = formatLocalDateKey(day);
              const dayType = getDayType(day);
              const holidayName = getHolidayName(day);

              const colorStyle =
                dayType === 'holiday' || dayType === 'sunday'
                  ? sundayText
                  : dayType === 'saturday'
                    ? saturdayText
                    : undefined;

              return (
                <div
                  key={key}
                  style={{
                    ...headerCell,
                    ...(key === todayKey ? todayHeaderCell : {}),
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openCreateModal(day, 9)}
                    style={headerDateButton}
                  >
                    <div style={{ ...headerWeekday, ...colorStyle }}>
                      {formatWeekdayShort(day)}
                    </div>
                    <div style={{ ...headerDate, ...colorStyle }}>
                      {day.getMonth() + 1}/{day.getDate()}
                    </div>
                  </button>

                  <div style={headerHolidayWrap}>
                    {holidayName ? (
                      <span style={headerHolidayText} title={holidayName}>
                        {holidayName}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {hours.map((hour) => (
              <FragmentRow
                key={hour}
                hour={hour}
                days={weekDays}
                eventsByDayAndHour={eventsByDayAndHour}
                onAdd={openCreateModal}
                onEdit={openEditModal}
              />
            ))}
          </div>
        )}

        {modalOpen && (
          <div style={overlay} onClick={closeModal}>
            <div style={modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={modalTitle}>{form.id ? '予定を編集' : '予定を追加'}</h3>

              <label style={field}>
                <span style={labelText}>タイトル</span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="未入力なら「新しい予定」で保存されます"
                  style={input}
                  disabled={saving}
                />
              </label>

              <label style={field}>
                <span style={labelText}>区分</span>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  style={input}
                  disabled={saving}
                >
                  <option value="other">その他</option>
                  <option value="meeting">会議</option>
                  <option value="work">業務</option>
                  <option value="review">レビュー</option>
                  <option value="personal">個人</option>
                  <option value="vacation">休暇</option>
                  <option value="visit">訪問</option>
                </select>
              </label>

              <div style={checkRow}>
                <label style={checkboxLabel}>
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
              </div>

              <div style={dateTimeGrid}>
                <label style={field}>
                  <span style={labelText}>開始日</span>
                  <div style={dateInlineWrap}>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      style={dateInlineInput}
                      disabled={saving}
                    />
                    <span style={weekdayInlineText}>
                      {form.startDate ? formatWeekdayJa(form.startDate) : ''}
                    </span>
                  </div>
                </label>

                <label style={field}>
                  <span style={labelText}>開始時刻</span>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    style={input}
                    disabled={saving || form.allDay}
                  />
                </label>

                <label style={field}>
                  <span style={labelText}>終了日</span>
                  <div style={dateInlineWrap}>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      style={dateInlineInput}
                      disabled={saving}
                    />
                    <span style={weekdayInlineText}>
                      {form.endDate ? formatWeekdayJa(form.endDate) : ''}
                    </span>
                  </div>
                </label>

                <label style={field}>
                  <span style={labelText}>終了時刻</span>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    style={input}
                    disabled={saving || form.allDay}
                  />
                </label>
              </div>

              <label style={field}>
                <span style={labelText}>メモ</span>
                <textarea
                  value={form.memo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, memo: e.target.value }))
                  }
                  style={textarea}
                  rows={4}
                  disabled={saving}
                />
              </label>

              <div style={modalActions}>
                <button onClick={closeModal} style={subButton} disabled={saving}>
                  キャンセル
                </button>

                {form.id ? (
                  <button
                    onClick={handleDelete}
                    style={dangerButton}
                    disabled={saving}
                  >
                    削除
                  </button>
                ) : null}

                <button onClick={handleSave} style={mainButton} disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SchedulerShell>
  );
}

function FragmentRow({
  hour,
  days,
  eventsByDayAndHour,
  onAdd,
  onEdit,
}: {
  hour: number;
  days: Date[];
  eventsByDayAndHour: Map<string, NormalizedEvent[]>;
  onAdd: (date?: Date, hour?: number) => void;
  onEdit: (event: NormalizedEvent) => void;
}) {
  return (
    <>
      <div style={timeCell}>{String(hour).padStart(2, '0')}:00</div>

      {days.map((day) => {
        const dateKey = formatLocalDateKey(day);
        const key = `${dateKey}-${hour}`;
        const slotEvents = eventsByDayAndHour.get(key) ?? [];
        const holidayName = getHolidayName(day);
        const isHolidayDay = Boolean(holidayName) || day.getDay() === 0;
        const isSaturday = day.getDay() === 6;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onAdd(day, hour)}
            style={{
              ...slotCell,
              ...(isHolidayDay
                ? holidaySlotCell
                : isSaturday
                  ? saturdaySlotCell
                  : {}),
            }}
          >
            <div style={slotEventsWrap}>
              {slotEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                  style={{
                    ...weekEventCard,
                    ...eventCategoryStyle(event.category),
                  }}
                >
                  <div style={weekEventTitle}>{event.title}</div>
                  <div style={weekEventTime}>
                    {formatEventTime(event.startAt)} - {formatEventTime(event.endAt)}
                  </div>
                </button>
              ))}
            </div>
          </button>
        );
      })}
    </>
  );
}

function getDayType(date: Date): 'weekday' | 'saturday' | 'sunday' | 'holiday' {
  if (isHoliday(date)) return 'holiday';
  if (date.getDay() === 0) return 'sunday';
  if (date.getDay() === 6) return 'saturday';
  return 'weekday';
}

function getHolidayName(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const holidays = between(start, end);
  return holidays[0]?.name ?? '';
}

function formatLocalDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateParam(date: Date) {
  return formatLocalDateKey(date);
}

function formatDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function toDateInputValue(date: Date) {
  return formatLocalDateKey(date);
}

function toTimeInputValue(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function buildLocalIso(dateStr: string, timeStr: string) {
  return `${dateStr}T${timeStr}:00`;
}

function formatWeekdayJa(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return `(${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`;
}

function formatWeekdayShort(date: Date) {
  return ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
}

function formatEventTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function eventCategoryStyle(category: string): React.CSSProperties {
  switch (category) {
    case 'meeting':
      return { background: '#e8f0ff', color: '#1d4ed8' };
    case 'work':
      return { background: '#ebf8ef', color: '#166534' };
    case 'review':
      return { background: '#fff4e5', color: '#b45309' };
    case 'personal':
      return { background: '#fdebf3', color: '#be185d' };
    case 'vacation':
      return { background: '#eef2ff', color: '#5b21b6' };
    case 'visit':
      return { background: '#ecfeff', color: '#0f766e' };
    default:
      return { background: '#f3f4f6', color: '#374151' };
  }
}

const pageWrap: React.CSSProperties = {
  display: 'grid',
  gap: 16,
};

const toolbar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

const weekNav: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

const weekTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: '#1f2937',
};

const navButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#ffffff',
  borderRadius: 12,
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
};

const subButton: React.CSSProperties = {
  ...navButton,
};

const mainButton: React.CSSProperties = {
  border: 'none',
  background: '#111827',
  color: '#fff',
  borderRadius: 12,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 800,
};

const dangerButton: React.CSSProperties = {
  border: 'none',
  background: '#dc2626',
  color: '#fff',
  borderRadius: 12,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 800,
};

const errorBox: React.CSSProperties = {
  background: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: 12,
  padding: '12px 14px',
  fontWeight: 700,
};

const loadingBox: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 12,
  padding: '18px',
  border: '1px solid rgba(0,0,0,0.08)',
};

const weekTable: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '84px repeat(7, minmax(0, 1fr))',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 16,
  overflow: 'hidden',
  background: '#fff',
};

const cornerCell: React.CSSProperties = {
  background: '#f8fafc',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
};

const headerCell: React.CSSProperties = {
  minHeight: 76,
  padding: '8px 6px',
  background: '#f8fafc',
  borderLeft: '1px solid rgba(0,0,0,0.08)',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  display: 'grid',
  justifyItems: 'center',
  alignContent: 'start',
  gap: 4,
};

const todayHeaderCell: React.CSSProperties = {
  background: '#eff6ff',
};

const headerDateButton: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'center',
};

const headerWeekday: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#6b7280',
};

const headerDate: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#111827',
};

const headerHolidayWrap: React.CSSProperties = {
  minHeight: 16,
  textAlign: 'center',
};

const headerHolidayText: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: '#dc2626',
  lineHeight: 1.2,
};

const sundayText: React.CSSProperties = {
  color: '#dc2626',
};

const saturdayText: React.CSSProperties = {
  color: '#2563eb',
};

const timeCell: React.CSSProperties = {
  minHeight: 68,
  padding: '10px 8px',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  background: '#ffffff',
  color: '#6b7280',
  fontSize: 12,
  fontWeight: 700,
};

const slotCell: React.CSSProperties = {
  border: 'none',
  borderLeft: '1px solid rgba(0,0,0,0.08)',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  background: '#ffffff',
  minHeight: 68,
  padding: 6,
  textAlign: 'left',
  cursor: 'pointer',
};

const holidaySlotCell: React.CSSProperties = {
  background: '#fff8f8',
};

const saturdaySlotCell: React.CSSProperties = {
  background: '#f8fbff',
};

const slotEventsWrap: React.CSSProperties = {
  display: 'grid',
  gap: 6,
};

const weekEventCard: React.CSSProperties = {
  border: 'none',
  width: '100%',
  textAlign: 'left',
  borderRadius: 10,
  padding: '8px 10px',
  cursor: 'pointer',
  display: 'grid',
  gap: 4,
};

const weekEventTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.3,
};

const weekEventTime: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.8,
};

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'grid',
  placeItems: 'center',
  padding: 20,
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  width: 'min(720px, 100%)',
  background: '#fff',
  borderRadius: 20,
  padding: 20,
  display: 'grid',
  gap: 16,
  boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
};

const field: React.CSSProperties = {
  display: 'grid',
  gap: 8,
};

const labelText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: '#374151',
};

const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 14,
  background: '#fff',
};

const textarea: React.CSSProperties = {
  ...input,
  resize: 'vertical',
  minHeight: 110,
};

const checkRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const checkboxLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 700,
};

const dateTimeGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
};

const dateInlineWrap: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
};

const dateInlineInput: React.CSSProperties = {
  ...input,
  width: 'auto',
};

const weekdayInlineText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: '#6b7280',
};

const modalActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  flexWrap: 'wrap',
};
