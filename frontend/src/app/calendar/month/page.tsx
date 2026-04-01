'use client';

import { SchedulerShell } from '@/components/SchedulerShell';
import { MonthCalendar } from '@/components/MonthCalendar';
import { EventModal } from '@/components/EventModal';
import { createEvent, deleteEvent, fetchCalendars, fetchEvents, updateEvent } from '@/lib/api';
import { CalendarSummary,　Category, EventItem } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';

type MonthEventView = {
  id: number;
  title: string;
  category: string;
  dateKey: string;
};

type EventFormValue = {
  title: string;
  category: Category;
  memo: string;
  date: string;
  startHour: number;
  endHour: number;
};

export default function MonthPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleCalendars = useMemo(() => calendars, [calendars]);

  const editingEvent = useMemo(
    () => events.find((event) => event.id === editingEventId) ?? null,
    [events, editingEventId]
  );

  const modalInitialValue = useMemo(() => {
    if (!editingEvent) return undefined;
    const start = new Date(editingEvent.startAt);
    const end = new Date(editingEvent.endAt);

    return {
      title: editingEvent.title,
      category: editingEvent.category,
      memo: editingEvent.memo ?? '',
      date: editingEvent.startAt.slice(0, 10),
      startHour: start.getHours(),
      endHour: end.getHours()
    };
  }, [editingEvent]);

  const monthRange = useMemo(() => {
    const from = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const to = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return {
      from: toDateKey(from),
      to: toDateKey(to)
    };
  }, [currentMonth]);

  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => event.startAt.slice(0, 10) === selectedDate);
  }, [events, selectedDate]);

  const monthEvents: MonthEventView[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      dateKey: event.startAt.slice(0, 10)
    }));
  }, [events]);

  useEffect(() => {
    const loadCalendars = async () => {
      try {
        const data = await fetchCalendars();
        setCalendars(data);

        if (data.length > 0) {
          setSelectedCalendarId((prev) => prev ?? data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'カレンダー取得に失敗しました');
      }
    };

    void loadCalendars();
  }, []);

  useEffect(() => {
    if (!selectedCalendarId) return;

    const loadEvents = async () => {
      try {
        setLoading(true);
        const data = await fetchEvents(selectedCalendarId, monthRange.from, monthRange.to);
        setEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '予定取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    void loadEvents();
  }, [selectedCalendarId, monthRange.from, monthRange.to]);

  const reloadEvents = async () => {
    if (!selectedCalendarId) return;
    const data = await fetchEvents(selectedCalendarId, monthRange.from, monthRange.to);
    setEvents(data);
  };

  const openCreateModal = () => {
    setEditingEventId(null);
    setModalOpen(true);
  };

  const openEditModal = (eventId: number) => {
    const target = events.find((event) => event.id === eventId);
    if (!target) return;
    setSelectedDate(target.startAt.slice(0, 10));
    setEditingEventId(eventId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEventId(null);
  };

  const handleSubmit = async (value: EventFormValue) => {
    if (!selectedCalendarId) {
      setError('カレンダーを選択してください');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const startAt = toOffsetDateTime(value.date, value.startHour);
      const endAt = toOffsetDateTime(value.date, value.endHour);

      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          calendarId: selectedCalendarId,
          title: value.title,
          category: value.category,
          memo: value.memo,
          startAt,
          endAt,
          allDay: false
        });
        setMessage('予定を更新しました');
      } else {
        await createEvent({
          calendarId: selectedCalendarId,
          title: value.title,
          category: value.category,
          memo: value.memo,
          startAt,
          endAt,
          allDay: false
        });
        setMessage('予定を保存しました');
      }

      await reloadEvents();
      setSelectedDate(value.date);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;

    const ok = window.confirm('この予定を削除します。よろしいですか？');
    if (!ok) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await deleteEvent(editingEvent.id);
      await reloadEvents();
      closeModal();
      setMessage('予定を削除しました');
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定の削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SchedulerShell title="月表示">
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={topBar}>
          <div style={leftTools}>
            <label style={label}>カレンダー</label>
            <select
              value={selectedCalendarId ?? ''}
              onChange={(e) => setSelectedCalendarId(Number(e.target.value))}
              style={select}
            >
              {visibleCalendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && <div style={successStyle}>{message}</div>}
        {error && <div style={errorStyle}>{error}</div>}

        {loading ? (
          <div style={panel}>読み込み中...</div>
        ) : (
          <MonthCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            events={monthEvents}
            onSelectDate={(dateKey) => setSelectedDate(dateKey)}
            onPrevMonth={() =>
              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
            }
            onNextMonth={() =>
              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
            }
            onToday={() => {
              const today = new Date();
              setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelectedDate(toDateKey(today));
            }}
            onAdd={openCreateModal}
            onEventClick={openEditModal}
          />
        )}

        <div style={panel}>
          <div style={sideHeader}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{formatSelectedDate(selectedDate)}</h2>
          </div>

          {selectedDateEvents.length === 0 ? (
            <div style={{ color: '#8f8a81' }}>この日の予定はありません。</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {selectedDateEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openEditModal(event.id)}
                  style={eventCardButton}
                >
                  <div style={eventCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontWeight: 700 }}>{event.title}</div>
                      <div style={{ color: '#8f8a81', fontSize: 13 }}>
                        {formatTime(event.startAt)} - {formatTime(event.endAt)}
                      </div>
                    </div>
                    <div style={{ color: '#6B6760', fontSize: 13 }}>
                      {formatCategory(event.category)}
                    </div>
                    {event.memo && <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{event.memo}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <EventModal
        open={modalOpen}
        mode={editingEvent ? 'edit' : 'create'}
        initialDate={editingEvent ? editingEvent.startAt.slice(0, 10) : selectedDate}
        initialValue={modalInitialValue}
        loading={saving}
        onClose={closeModal}
        onDelete={editingEvent ? handleDelete : undefined}
        onSubmit={handleSubmit}
      />
    </SchedulerShell>
  );
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toOffsetDateTime(date: string, hour: number) {
  return `${date}T${String(hour).padStart(2, '0')}:00:00+09:00`;
}

function formatSelectedDate(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCategory(category: string) {
  switch (category) {
    case 'meeting':
      return '会議';
    case 'work':
      return '作業';
    case 'review':
      return '確認';
    case 'personal':
      return '個人';
    default:
      return 'その他';
  }
}

const topBar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap'
};

const leftTools: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const label: React.CSSProperties = {
  fontSize: 13,
  color: '#6B6760'
};

const select: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 10,
  padding: '10px 12px',
  background: '#fffdfa',
  minWidth: 220
};

const panel: React.CSSProperties = {
  background: '#FDFCFA',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 16,
  padding: 16
};

const sideHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12
};

const eventCardButton: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer'
};

const eventCard: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  padding: 12,
  background: '#fffdfa',
  display: 'grid',
  gap: 6
};

const successStyle: React.CSSProperties = {
  color: '#067647',
  background: '#ECFDF3',
  border: '1px solid rgba(6,118,71,0.15)',
  borderRadius: 10,
  padding: '10px 12px'
};

const errorStyle: React.CSSProperties = {
  color: '#b42318',
  background: '#FEF3F2',
  border: '1px solid rgba(180,35,24,0.15)',
  borderRadius: 10,
  padding: '10px 12px'
};
