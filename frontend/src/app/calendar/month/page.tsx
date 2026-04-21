'use client';

import SchedulerShell from '@/components/SchedulerShell';
import {
  createEvent,
  deleteEvent,
  fetchCalendars,
  fetchEvents,
  updateEvent,
} from '@/lib/scheduler-db';
import { CalendarSummary, EventItem } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';

type EventFormState = {
  id?: number;
  calendarId: number;
  title: string;
  category: string;
  memo: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
};

const EMPTY_FORM: EventFormState = {
  calendarId: 0,
  title: '',
  category: 'other',
  memo: '',
  startAt: '',
  endAt: '',
  allDay: false,
};

export default function CalendarMonthPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = `${year}年${month + 1}月`;
  const todayKey = formatLocalDateKey(new Date());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const startDate = new Date(year, month, 1 - startDay);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  }, [year, month]);

  useEffect(() => {
    const loadCalendars = async () => {
      try {
        setError(null);
        const data = await fetchCalendars();
        setCalendars(data as CalendarSummary[]);

        if (data.length > 0) {
          setSelectedCalendarId((prev) => prev ?? data[0].id);
        } else {
          setSelectedCalendarId(null);
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'カレンダー取得に失敗しました');
        setLoading(false);
      }
    };

    loadCalendars();
  }, []);

  const loadEvents = async (calendarId: number, y: number, m: number) => {
    try {
      setLoading(true);
      setError(null);

      const from = formatDateParam(new Date(y, m, 1));
      const to = formatDateParam(new Date(y, m + 1, 1));
      const data = await fetchEvents(calendarId, from, to);

      setEvents(data as EventItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCalendarId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    loadEvents(selectedCalendarId, year, month);
  }, [selectedCalendarId, year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const normalizedEvents = useMemo(() => {
    return events.map((e) => ({
      ...e,
      calendarId: e.calendarId ?? e.calendar_id,
      startAt: e.startAt ?? e.start_at,
      endAt: e.endAt ?? e.end_at,
      allDay: e.allDay ?? e.is_all_day,
    }));
  }, [events]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof normalizedEvents>();

    for (const e of normalizedEvents) {
      const key = formatLocalDateKey(new Date(e.startAt as string));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }

    return map;
  }, [normalizedEvents]);

  const openCreateModal = (date?: Date) => {
    const baseCalendarId = selectedCalendarId ?? calendars[0]?.id ?? 0;
    const start = date ? toLocalDateTimeInput(date, 9, 0) : '';
    const end = date ? toLocalDateTimeInput(date, 10, 0) : '';

    setForm({
      ...EMPTY_FORM,
      calendarId: baseCalendarId,
      startAt: start,
      endAt: end,
    });
    setModalOpen(true);
  };

  const openEditModal = (event: (typeof normalizedEvents)[number]) => {
    setForm({
      id: event.id,
      calendarId: event.calendarId ?? event.calendar_id,
      title: event.title,
      category: event.category,
      memo: event.memo ?? '',
      startAt: toInputValue(event.startAt as string),
      endAt: toInputValue(event.endAt as string),
      allDay: Boolean(event.allDay),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.calendarId || !form.title.trim() || !form.startAt || !form.endAt) {
      setError('タイトル、開始、終了は必須です');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        calendar_id: form.calendarId,
        title: form.title.trim(),
        category: form.category,
        memo: form.memo,
        start_at: new Date(form.startAt).toISOString(),
        end_at: new Date(form.endAt).toISOString(),
        is_all_day: form.allDay,
      };

      if (form.id) {
        await updateEvent(form.id, payload);
      } else {
        await createEvent(payload);
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);

      if (selectedCalendarId) {
        await loadEvents(selectedCalendarId, year, month);
      }
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

      if (selectedCalendarId) {
        await loadEvents(selectedCalendarId, year, month);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SchedulerShell title="月表示">
      <div style={wrap}>
        <div style={toolbar}>
          <div style={toolbarLeft}>
            <button style={button} onClick={prevMonth}>
              前月
            </button>
            <h2 style={title}>{monthLabel}</h2>
            <button style={button} onClick={nextMonth}>
              次月
            </button>
          </div>

          <div style={toolbarRight}>
            <select
              value={selectedCalendarId ?? ''}
              onChange={(e) => setSelectedCalendarId(Number(e.target.value))}
              style={select}
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button style={primaryButton} onClick={() => openCreateModal()}>
              予定を追加
            </button>
          </div>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        {loading && <div style={loadingBox}>読み込み中...</div>}

        {!loading && (
          <div style={calendarCard}>
            <div style={grid}>
              {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
                <div key={d} style={dayHeader}>
                  {d}
                </div>
              ))}

              {calendarDays.map((date) => {
                const key = formatLocalDateKey(date);
                const dayEvents = eventsByDate.get(key) ?? [];
                const isCurrent = date.getMonth() === month;
                const isToday = key === todayKey;

                return (
                  <div
                    key={key}
                    style={{
                      ...cell,
                      ...(isToday ? todayCell : {}),
                      opacity: isCurrent ? 1 : 0.45,
                    }}
                  >
                    <div style={cellHeader}>
                      <span
                        style={{
                          ...dateStyle,
                          ...(isToday ? todayDateStyle : {}),
                        }}
                      >
                        {date.getDate()}
                      </span>

                      <button style={miniButton} onClick={() => openCreateModal(date)}>
                        ＋
                      </button>
                    </div>

                    <div style={eventList}>
                      {dayEvents.map((e) => (
                        <button
                          key={e.id}
                          style={eventItem}
                          onClick={() => openEditModal(e)}
                          title={e.title}
                        >
                          <div style={eventTitle}>{e.title}</div>
                          {e.owner_name ? <div style={eventOwner}>担当: {e.owner_name}</div> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {modalOpen && (
          <div style={overlay} onClick={closeModal}>
            <div style={modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={modalTitle}>{form.id ? '予定を編集' : '予定を追加'}</h3>

              <div style={formGrid}>
                <label style={label}>
                  <span>カレンダー</span>
                  <select
                    value={form.calendarId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        calendarId: Number(e.target.value),
                      }))
                    }
                    style={input}
                    disabled={saving}
                  >
                    {calendars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

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

                <label style={label}>
                  <span>開始</span>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startAt: e.target.value,
                      }))
                    }
                    style={input}
                    disabled={saving}
                  />
                </label>

                <label style={label}>
                  <span>終了</span>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        endAt: e.target.value,
                      }))
                    }
                    style={input}
                    disabled={saving}
                  />
                </label>

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
                <button style={button} onClick={closeModal} disabled={saving}>
                  キャンセル
                </button>

                {form.id && (
                  <button style={dangerButton} onClick={handleDelete} disabled={saving}>
                    削除
                  </button>
                )}

                <button style={primaryButton} onClick={handleSave} disabled={saving}>
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

function formatDateParam(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatLocalDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toInputValue(iso: string) {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function toLocalDateTimeInput(date: Date, hour: number, minute: number) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  return `${y}-${m}-${day}T${hh}:${mm}`;
}

const wrap: React.CSSProperties = {
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

const toolbarLeft: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const toolbarRight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: '#1f2340',
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

const select: React.CSSProperties = {
  minWidth: 220,
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(99,102,241,0.16)',
  background: '#fff',
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
  padding: '20px',
};

const calendarCard: React.CSSProperties = {
  background: 'linear-gradient(180deg, #ffffff 0%, #fffafb 100%)',
  borderRadius: 24,
  padding: 16,
  boxShadow: '0 14px 30px rgba(91, 98, 133, 0.10)',
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 1,
  background: 'rgba(99,102,241,0.08)',
  borderRadius: 16,
  overflow: 'hidden',
};

const dayHeader: React.CSSProperties = {
  background: 'linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%)',
  padding: '12px 8px',
  textAlign: 'center',
  fontWeight: 800,
  color: '#1d4ed8',
};

const cell: React.CSSProperties = {
  minHeight: 130,
  background: '#fff',
  padding: 10,
  display: 'grid',
  gap: 8,
};

const todayCell: React.CSSProperties = {
  background: 'linear-gradient(180deg, #fff8fb 0%, #fdf2f8 100%)',
};

const cellHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const dateStyle: React.CSSProperties = {
  fontWeight: 800,
  color: '#5b6285',
};

const todayDateStyle: React.CSSProperties = {
  color: '#be185d',
};

const miniButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 10,
  background: 'linear-gradient(135deg, #ecfdf3 0%, #d1fae5 100%)',
  color: '#166534',
  width: 28,
  height: 28,
  cursor: 'pointer',
  fontWeight: 800,
};

const eventList: React.CSSProperties = {
  display: 'grid',
  gap: 6,
};

const eventItem: React.CSSProperties = {
  border: 'none',
  borderRadius: 12,
  background: 'linear-gradient(135deg, #eef2ff 0%, #e9d5ff 100%)',
  color: '#312e81',
  padding: '8px 10px',
  cursor: 'pointer',
  textAlign: 'left',
  display: 'grid',
  gap: 2,
};

const eventTitle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 13,
};

const eventOwner: React.CSSProperties = {
  fontSize: 11,
  color: '#5b6285',
  fontWeight: 700,
};

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.35)',
  display: 'grid',
  placeItems: 'center',
  padding: 20,
  zIndex: 50,
};

const modal: React.CSSProperties = {
  width: '100%',
  maxWidth: 720,
  background: 'linear-gradient(180deg, #ffffff 0%, #fffafb 100%)',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.20)',
};

const modalTitle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 24,
  color: '#1f2340',
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gap: 14,
};

const label: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  fontWeight: 700,
  color: '#394067',
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #d8dcef',
  borderRadius: 14,
  fontSize: 16,
  boxSizing: 'border-box',
  background: '#fff',
};

const textarea: React.CSSProperties = {
  width: '100%',
  minHeight: 100,
  padding: '12px 14px',
  border: '1px solid #d8dcef',
  borderRadius: 14,
  fontSize: 16,
  boxSizing: 'border-box',
  background: '#fff',
  resize: 'vertical',
};

const checkLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 700,
  color: '#394067',
};

const modalActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  marginTop: 18,
  flexWrap: 'wrap',
};
