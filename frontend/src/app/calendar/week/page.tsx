'use client';

import SchedulerShell from '@/components/SchedulerShell';
import { fetchCalendars, fetchEvents } from '@/lib/api';
import { CalendarSummary, EventItem } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';

export default function CalendarWeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'カレンダー取得に失敗しました');
      }
    };

    loadCalendars();
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedCalendarId) {
        setEvents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const from = new Date(weekDays[0]);
        from.setHours(0, 0, 0, 0);

        const to = new Date(weekDays[6]);
        to.setHours(23, 59, 59, 999);

        const data = await fetchEvents(
          selectedCalendarId,
          from.toISOString(),
          to.toISOString()
        );
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '予定取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
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

  return (
    <SchedulerShell title="週表示">
      <div style={wrap}>
        <div style={toolbar}>
          <button style={button} onClick={prevWeek}>前週</button>
          <h2 style={title}>{weekLabel}</h2>
          <button style={button} onClick={nextWeek}>次週</button>
        </div>

        <div style={topBar}>
          <label style={label}>
            カレンダー
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
          </label>
        </div>

        {error && <div style={errorBox}>{error}</div>}
        {loading && <div>読み込み中...</div>}

        {!loading && (
          <div style={grid}>
            <div style={timeHeader} />
            {weekDays.map((day) => (
              <div key={day.toISOString()} style={dayHeader}>
                {`${day.getMonth() + 1}/${day.getDate()}`} ({['日', '月', '火', '水', '木', '金', '土'][day.getDay()]})
              </div>
            ))}

            {hours.map((hour) => (
              <FragmentRow
                key={hour}
                hour={hour}
                weekDays={weekDays}
                eventsByDayAndHour={eventsByDayAndHour}
              />
            ))}
          </div>
        )}
      </div>
    </SchedulerShell>
  );
}

function FragmentRow({
  hour,
  weekDays,
  eventsByDayAndHour,
}: {
  hour: number;
  weekDays: Date[];
  eventsByDayAndHour: Map<string, EventItem[]>;
}) {
  return (
    <>
      <div style={timeCell}>{`${hour}:00`}</div>
      {weekDays.map((day) => {
        const key = `${day.toISOString().slice(0, 10)}-${hour}`;
        const dayEvents = eventsByDayAndHour.get(key) ?? [];

        return (
          <div key={key} style={cell}>
            {dayEvents.map((event) => (
              <div key={event.id} style={eventItem}>
                {event.title}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function formatDate(date: Date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
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
};

const topBar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const label: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 14,
};

const select: React.CSSProperties = {
  minWidth: 220,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
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
  minHeight: 64,
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 10,
  background: '#fff',
  padding: 6,
  display: 'grid',
  gap: 4,
  alignContent: 'start',
};

const eventItem: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 6px',
  borderRadius: 8,
  background: '#F5F3EE',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
