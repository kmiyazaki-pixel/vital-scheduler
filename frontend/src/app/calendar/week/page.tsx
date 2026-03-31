'use client';

import { SchedulerShell } from '@/components/SchedulerShell';
import { WeekCalendar } from '@/components/WeekCalendar';
import { EventModal } from '@/components/EventModal';
import { createEvent, deleteEvent, fetchCalendars, fetchEvents, updateEvent } from '@/lib/api';
import { CalendarSummary, EventItem } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';

type WeekEventView = {
  id: number;
  title: string;
  category: string;
  dateKey: string;
  startHour: number;
  endHour: number;
};

type EventFormValue = {
  title: string;
  category: string;
  memo: string;
  date: string;
  startHour: number;
  endHour: number;
};

export default function WeekPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [defaultStartHour, setDefaultStartHour] = useState(9);

  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleCalendars = useMemo(
    () => calendars.filter((calendar) => calendar.type !== 'department'),
    [calendars]
  );

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

  const weekRange = useMemo(() => {
    const from = new Date(weekStart);
    const to = new Date(weekStart);
    to.setDate(to.getDate() + 6);
    return {
      from: toDateKey(from),
      to: toDateKey(to)
    };
  }, [weekStart]);

  const weekEvents: WeekEventView[] = useMemo(() => {
    return events.map((event) => {
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);
      return {
        id: event.id,
        title: event.title,
        category: event.category,
        dateKey: event.startAt.slice(0, 10),
        startHour: start.getHours(),
        endHour: end.getHours()
      };
    });
  }, [events]);

  useEffect(() => {
    const loadCalendars = async () => {
      try {
        const data = await fetchCalendars();
        setCalendars(data);

        const filtered = data.filter((calendar) => calendar.type !== 'department');
        if (filtered.length > 0) {
          setSelectedCalendarId((prev) => prev ?? filtered[0].id);
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
        const data = await fetchEvents(selectedCalendarId, weekRange.from, weekRange.to);
        setEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '予定取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    void loadEvents();
  }, [selectedCalendarId, weekRange.from, weekRange.to]);

  const reloadEvents = async () => {
    if (!selectedCalendarId) return;
    const data = await fetchEvents(selectedCalendarId, weekRange.from, weekRange.to);
    setEvents(data);
  };

  const openCreateModal = (dateKey?: string, hour?: number) => {
    setEditingEventId(null);
    if (dateKey) setSelectedDate(dateKey);
    if (typeof hour === 'number') setDefaultStartHour(hour);
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
    <SchedulerShell title="週表示">
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
          <WeekCalendar
            weekStart={weekStart}
            events={weekEvents}
            onPrevWeek={() => {
              const prev = new Date(weekStart);
              prev.setDate(prev.getDate() - 7);
              setWeekStart(prev);
            }}
            onNextWeek={() => {
              const next = new Date(weekStart);
              next.setDate(next.getDate() + 7);
              setWeekStart(next);
            }}
            onToday={() => {
              const today = new Date();
              setWeekStart(getWeekStart(today));
              setSelectedDate(toDateKey(today));
            }}
            onAdd={openCreateModal}
            onEventClick={openEditModal}
          />
        )}
      </div>

      <EventModal
        open={modalOpen}
        mode={editingEvent ? 'edit' : 'create'}
        initialDate={editingEvent ? editingEvent.startAt.slice(0, 10) : selectedDate}
        initialValue={
          editingEvent
            ? modalInitialValue
            : {
                date: selectedDate,
                startHour: defaultStartHour,
                endHour: defaultStartHour + 1
              }
        }
        loading={saving}
        onClose={closeModal}
        onDelete={editingEvent ? handleDelete : undefined}
        onSubmit={handleSubmit}
      />
    </SchedulerShell>
  );
}

function getWeekStart(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day);
  return result;
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