'use client';

import SchedulerShell from '@/components/SchedulerShell';
import { fetchCalendars, fetchEvents } from '@/lib/api';
import { CalendarSummary, EventItem } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';

export default function CalendarMonthPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = `${year}年${month + 1}月`;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const startDate = new Date(year, month, 1 - startDay);

    return Array.from({ length: 35 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
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

        const from = new Date(year, month, 1).toISOString();
        const to = new Date(year, month + 1, 1).toISOString();

        const data = await fetchEvents(selectedCalendarId, from, to);
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '予定取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [selectedCalendarId, year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();

    for (const event of events) {
      const key = new Date(event.startAt).toISOString().slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }

    return map;
  }, [events]);

  return (
    <SchedulerShell title="月表示">
      <div style={wrap}>
        <div style={toolbar}>
          <button style={button} onClick={prevMonth}>前月</button>
          <h2 style={title}>{monthLabel}</h2>
          <button style={button} onClick={nextMonth}>次月</button>
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
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <div key={day} style={dayHeader}>
                {day}
              </div>
            ))}

            {calendarDays.map((date) => {
              const key = date.toISOString().slice(0, 10);
              const dayEvents = eventsByDate.get(key) ?? [];
              const isCurrentMonth = date.getMonth() === month;

              return (
                <div
                  key={key}
                  style={{
                    ...cell,
                    opacity: isCurrentMonth ? 1 : 0.45,
                  }}
                >
                  <div style={dateStyle}>{date.getDate()}</div>

                  <div style={eventList}>
                    {dayEvents.slice(0, 3).map((event) => (
                      <div key={event.id} style={eventItem}>
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SchedulerShell>
  );
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
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: 8,
};

const dayHeader: React.CSSProperties = {
  padding: 10,
  textAlign: 'center',
  fontWeight: 700,
  background: '#F5F3EE',
  borderRadius: 10,
};

const cell: React.CSSProperties = {
  minHeight: 120,
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  background: '#fff',
  padding: 8,
  display: 'grid',
  alignContent: 'start',
  gap: 8,
};

const dateStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
};

const eventList: React.CSSProperties = {
  display: 'grid',
  gap: 4,
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
