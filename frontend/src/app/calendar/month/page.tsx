'use client';

import SchedulerShell from '@/components/SchedulerShell';
import {
  createEvent,
  deleteEvent,
  fetchCalendars,
  fetchEvents,
  updateEvent,
} from '@/lib/api';
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

  const loadEvents = async (calendarId: number, y: number, m: number) => {
    try {
      setLoading(true);
      setError(null);

      const from = formatDateParam(new Date(y, m, 1));
      const to = formatDateParam(new Date(y, m + 1, 1));
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

    loadEvents(selectedCalendarId, year, month);
  }, [selectedCalendarId, year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();

    for (const e of events) {
      const key = formatLocalDateKey(new Date(e.startAt));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }

    return map;
  }, [events]);

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
    <SchedulerShell>
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

        {loading && <div>読み込み中...</div>}

        {!loading && (
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
                        {e.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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
                    <option value="vacation">休暇</option>
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
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  minWidth: 220,
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
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 6,
};

const dayHeader: React.CSSProperties = {
  textAlign: 'center',
  fontWeight: 700,
  padding: 10,
  background: '#F5F3EE',
  borderRadius: 10,
};

const cell: React.CSSProperties = {
  minHeight: 120,
  border: '1px solid #ddd',
  padding: 6,
  background: '#fff',
  borderRadius: 12,
};

const todayCell: React.CSSProperties = {
  border: '2px solid #1A1916',
  background: '#FFF7E8',
};

const cellHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const dateStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
};

const todayDateStyle: React.CSSProperties = {
  color: '#b45309',
};

const miniButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 8,
  background: '#fff',
  width: 24,
  height: 24,
  cursor: 'pointer',
};

const eventList: React.CSSProperties = {
  fontSize: 12,
  display: 'grid',
  gap: 4,
  marginTop: 6,
};

const eventItem: React.CSSProperties = {
  background: '#eee',
  padding: '4px 6px',
  borderRadius: 4,
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
