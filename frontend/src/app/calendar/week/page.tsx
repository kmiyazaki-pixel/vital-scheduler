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
        setCalendars(data);

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
      setEvents(data);
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

  const eventsByDayAndHour = useMemo(() => {
    const map = new Map<string, EventItem[]>();

    for (const event of events) {
      const start = new Date(event.startAt);
      const key = `${start.toISOString().slice(0, 10)}-${start.getHours()}`;
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }

    return map;
  }, [events]);

  const openCreateModal = (date?: Date, hour?: number) => {
    const baseCalendarId = selectedCalendarId ?? calendars[0]?.id ?? 0;
    const start = date ? toLocalDateTimeInput(date, hour ?? 9, 0) : '';
    const end = date ? toLocalDateTimeInput(date, (hour ?? 9) + 1, 0) : '';

    setForm({
      ...EMPTY_FORM,
      calendarId: baseCalendarId,
      startAt: start,
      endAt: end,
    });
    setModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setForm({
      id: event.id,
      calendarId: event.calendarId,
      title: event.title,
      category: event.category,
      memo: event.memo ?? '',
      startAt: toInputValue(event.startAt),
      endAt: toInputValue(event.endAt),
      allDay: event.allDay,
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
        calendarId: form.calendarId,
        title: form.title.trim(),
        category: form.category,
        memo: form.memo,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        allDay: form.allDay,
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
            <button style={button} onClick={prevWeek}>前週</button>
            <h2 style={title}>{weekLabel}</h2>
            <button style={button} onClick={nextWeek}>次週</button>
          </div>

          <div style={toolbarRight}>
            <select
              value={selectedCalendarId ?? ''}
              onChange={(e) => setSelectedCalendarId(Number(e.target.value))}
              style={select}
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>

            <button style={primaryButton} onClick={() => openCreateModal()}>
              予定を追加
            </button>
          </div>
        </div>

        {error && <div style={errorBox}>{error}</div>}
        {loading && <div>読み込み中...</div>}

        {!loading && (
          <div style={grid}>
            <div style={timeHeader} />
            {weekDays.map((day) => (
              <div key={day.toISOString()} style={dayHeader}>
                <div>{`${day.getMonth() + 1}/${day.getDate()}`}</div>
                <div>{['日', '月', '火', '水', '木', '金', '土'][day.getDay()]}</div>
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
                        <button
                          style={miniButton}
                          onClick={() => openCreateModal(day, hour)}
                        >
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
                          {event.title}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
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
  fontSize: 20,
};

const button: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 10,
  background: '#fff',
  padding: '8px 12px',
  cursor: 'pointer',
};

const primaryButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 10,
  background: '#1A1916',
  color: '#F5F3EE',
  padding: '10px 14px',
  cursor: 'pointer',
};

const dangerButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 10,
  background: '#b42318',
  color: '#fff',
  padding: '10px 14px',
  cursor: 'pointer',
};

const select: React.CSSProperties = {
  minWidth: 220,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
};

const errorBox: React.CSSProperties = {
  color: '#b42318',
  fontSize: 13,
  lineHeight: 1.5,
  background: '#FEF3F2',
  border: '1px solid rgba(180,35,24,0.15)',
  borderRadius: 10,
  padding: '10px 12px',
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '80px repeat(7, minmax(0, 1fr))',
  gap: 6,
};

const timeHeader: React.CSSProperties = {
  background: 'transparent',
};

const dayHeader: React.CSSProperties = {
  padding: 10,
  textAlign: 'center',
  fontWeight: 700,
  background: '#F5F3EE',
  borderRadius: 10,
  fontSize: 13,
};

const timeCell: React.CSSProperties = {
  padding: '10px 8px',
  fontSize: 12,
  color: '#6B6760',
};

const cell: React.CSSProperties = {
  minHeight: 72,
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 10,
  background: '#fff',
  padding: 6,
  display: 'grid',
  gap: 4,
  alignContent: 'start',
};

const cellTop: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const miniButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 8,
  background: '#fff',
  width: 24,
  height: 24,
  cursor: 'pointer',
};

const eventItem: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 6px',
  borderRadius: 8,
  background: '#F5F3EE',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
};

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  width: '100%',
  maxWidth: 560,
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
  display: 'grid',
  gap: 16,
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gap: 12,
};

const label: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 14,
};

const checkLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
};

const textarea: React.CSSProperties = {
  width: '100%',
  minHeight: 100,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  resize: 'vertical',
};

const modalActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
};
