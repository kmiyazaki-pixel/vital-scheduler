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
          setSelectedCalendarId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'カレンダー取得に失敗しました');
      }
    };

    loadCalendars();
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedCalendarId) return;

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

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();

    for (const e of events) {
      const key = new Date(e.startAt).toISOString().slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(e);
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
        </div>

        {error && <div style={errorBox}>{error}</div>}
        {loading && <div>読み込み中...</div>}

        {!loading && (
          <div style={grid}>
            {['日','月','火','水','木','金','土'].map((d) => (
              <div key={d} style={dayHeader}>{d}</div>
            ))}

            {calendarDays.map((date) => {
              const key = date.toISOString().slice(0, 10);
              const dayEvents = eventsByDate.get(key) ?? [];
              const isCurrent = date.getMonth() === month;

              return (
                <div key={key} style={{ ...cell, opacity: isCurrent ? 1 : 0.4 }}>
                  <div style={dateStyle}>{date.getDate()}</div>

                  <div style={eventList}>
                    {dayEvents.map((e) => (
                      <div key={e.id} style={eventItem}>
                        {e.title}
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

const wrap = { display: 'grid', gap: 16 };
const toolbar = { display: 'flex', justifyContent: 'space-between' };
const title = { margin: 0 };
const button = { padding: 8 };
const topBar = { display: 'flex', justifyContent: 'flex-end' };
const select = { padding: 8 };
const errorBox = { color: 'red' };

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7,1fr)',
  gap: 6
};

const dayHeader = {
  textAlign: 'center',
  fontWeight: 'bold'
};

const cell = {
  minHeight: 110,
  border: '1px solid #ddd',
  padding: 6
};

const dateStyle = {
  fontWeight: 'bold'
};

const eventList = {
  fontSize: 12
};

const eventItem = {
  background: '#eee',
  marginTop: 2,
  padding: 2,
  borderRadius: 4
};
