'use client';

import SchedulerShell from '@/components/SchedulerShell';
import { createEvent, deleteEvent, fetchCalendars, fetchEvents, updateEvent } from '@/lib/scheduler-db';
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

export default function CalendarWeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);
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
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

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

  const loadEvents = async (calendarId: number, days: Date[]) => {
    try {
      setLoading(true);
      setError(null);

      const from = formatDateParam(days[0]);
      const to = formatDateParam(days[6]);

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

    loadEvents(selectedCalendarId, weekDays);
  }, [selectedCalendarId, weekDays]);

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

  const normalizedEvents = useMemo(() => {
    return events.map((e) => ({
      ...e,
      calendarId: e.calendarId ?? e.calendar_id,
      startAt: e.startAt ?? e.start_at,
      endAt: e.endAt ?? e.end_at,
      allDay: e.allDay ?? e.is_all_day,
    }));
  }, [events]);

  const eventsByDayAndHour = useMemo(() => {
    const map = new Map<string, typeof normalizedEvents>();

    for (const e of normalizedEvents) {
      const start = new Date(e.startAt as string);
      const key = `${start.toISOString().slice(0, 10)}-${start.getHours()}`;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }

    return map;
  }, [normalizedEvents]);

  const openCreateModal = (date?: Date, hour?: number) => {
    const baseCalendarId = selectedCalendarId ?? calendars[0]?.id ?? 0;
    const start = date && typeof hour === 'number' ? toLocalDateTimeInput(date, hour, 0) : '';
    const end = date && typeof hour === 'number' ? toLocalDateTimeInput(date, hour + 1, 0) : '';

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
        await loadEvents(selectedCalendarId, weekDays);
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
        await loadEvents(selectedCalendarId, weekDays);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SchedulerShell title="週表示">
      <div style={wrap}>
        <div style={toolbar}>
          <div style={toolbarLeft}>
            <button style={button} onClick={prevWeek}>
              前週
            </button>
            <h2 style={title}>{weekLabel}</h2>
            <button style={button} onClick={nextWeek}>
              次週
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
              <div style={timeHeader} />
              {weekDays.map((day) => (
                <div key={day.toISOString()} style={dayHeader}>
                  <div style={dayDate}>{`${day.getMonth() + 1}/${day.getDate()}`}</div>
                  <div style={dayWeek}>{['日', '月', '火', '水', '木', '金', '土'][day.getDay()]}</div>
                </div>
              ))}

              {hours.map((hour) => (
                <div key={hour} style={{ display: 'contents' }}>
                  <div style={timeCell}>{`${hour}:00`}</div>
                  {weekDays.map((day) => {
                    const key = `${day.toISOString().slice(0, 10)}-${hour}`;
                    const dayEvents = eventsByDayAndHour.get(key) ?? [];

                    return (
                      <div key={key} style={cell}>
                        <div style={cellTop}>
                          <button style={miniButton} onClick={() => openCreateModal(day, hour)}>
                            ＋
                          </button>
                        </div>

                        {dayEvents.map((event) => (
                          <button
                            key={event.id}
                            style={eventItem}
                            onClick={() => openEditModal(event)}
                            title={event.title}
                          >
                            <div style={eventTitle}>{event.title}</div>
                            <div style={eventTime}>
                              {formatTime(event.startAt as string)} - {formatTime(event.endAt as string)}
                            </div>
                            {event.owner_name ? <div style={eventOwner}>担当: {event.owner_name}</div> : null}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {modalOpen && (
          <div style={overlay}>
            <div style={modal}>
              <h3 style={modalTitle}>{form.id ? '予定を編集' : '予定を追加'}</h3>

              <div style={formGrid}>
                <label style={label}>
                  カレンダー
                  <select
                    value={form.calendarId}
                    onChange={(e) => setForm((prev) => ({ ...prev, calendarId: Number(e.target.value) }))}
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
                  タイトル
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    style={input}
                    disabled={saving}
                  />
                </label>

                <label style={label}>
                  区分
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

                <label style={label}>
                  開始
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, startAt: e.target.value }))}
                    style={input}
                    disabled={saving}
                  />
                </label>

                <label style={label}>
                  終了
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, endAt: e.target.value }))}
                    style={input}
                    disabled={saving}
                  />
                </label>

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
                  メモ
                  <textarea
                    value={form.memo}
                    onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
                    style={textarea}
                    disabled={saving}
                  />
                </label>
              </div>

              <div style={modalActions}>
                <button style={button} onClick={closeModal} disabled={saving}>キャンセル</button>
                {form.id && (
                  <button style={dangerButton} onClick={handleDelete} disabled={saving}>削除</button>
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

function formatDate(date: Date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateParam(date: Date) {
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

function formatTime(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const wrap: React.CSSProperties = {
  display: 'grid',
  gap: 16,
};

const toolbar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
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
  gridTemplateColumns: '90px repeat(7, 1fr)',
  background: 'rgba(99,102,241,0.08)',
  borderRadius: 16,
  overflow: 'hidden',
};

const timeHeader: React.CSSProperties = {
  background: 'linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%)',
};

const dayHeader: React.CSSProperties = {
  padding: '12px 8px',
  background: 'linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%)',
  borderLeft: '1px solid rgba(99,102,241,0.08)',
  textAlign: 'center',
};

const dayDate: React.CSSProperties = {
  fontWeight: 800,
  color: '#1f2340',
};

const dayWeek: React.CSSProperties = {
  fontSize: 12,
  color: '#5b6285',
  fontWeight: 700,
};

const timeCell: React.CSSProperties = {
  padding: '10px 8px',
  borderBottom: '1px solid rgba(99,102,241,0.08)',
  color: '#5b6285',
  fontSize: 12,
  background: '#fff',
  fontWeight: 700,
};

const cell: React.CSSProperties = {
  borderLeft: '1px solid rgba(99,102,241,0.08)',
  borderBottom: '1px solid rgba(99,102,241,0.08)',
  background: '#fff',
  textAlign: 'left',
  padding: 6,
  minHeight: 76,
};

const cellTop: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: 6,
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

const eventItem: React.CSSProperties = {
  border: 'none',
  width: '100%',
  textAlign: 'left',
  borderRadius: 12,
  padding: '8px 10px',
  fontSize: 12,
  display: 'grid',
  gap: 3,
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #eef2ff 0%, #e9d5ff 100%)',
  color: '#312e81',
  marginBottom: 6,
};

const eventTitle: React.CSSProperties = {
  fontWeight: 800,
};

const eventTime: React.CSSProperties = {
  fontSize: 11,
  color: '#5b6285',
  fontWeight: 700,
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
