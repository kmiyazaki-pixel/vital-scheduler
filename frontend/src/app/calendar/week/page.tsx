'use client';

import EventFormModal, {
  EMPTY_FORM,
  EventFormState,
  buildFormFromEvent,
} from '@/components/EventFormModal';
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

const FIXED_CALENDAR_ID = 1;

export default function CalendarWeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);

  const todayKey = formatLocalDateKey(new Date());

  const weekDays = useMemo(() => {
    const base = new Date(currentDate);
    const day = base.getDay();
    const sunday = new Date(base);
    sunday.setDate(base.getDate() - day);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const weekLabel = `${formatDateLabel(weekDays[0])} - ${formatDateLabel(weekDays[6])}`;

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const from = formatDateParam(weekDays[0]);
      const toDate = new Date(weekDays[6]);
      toDate.setDate(toDate.getDate() + 1);
      const to = formatDateParam(toDate);

      const data = await fetchEvents(FIXED_CALENDAR_ID, from, to);
      setEvents(data as EventItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
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

  const goToday = () => {
    setCurrentDate(new Date());
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

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof normalizedEvents>();

    for (const e of normalizedEvents) {
      const key = formatLocalDateKey(new Date(e.startAt as string));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }

    for (const list of map.values()) {
      list.sort((a, b) => {
        return (
          new Date(a.startAt as string).getTime() -
          new Date(b.startAt as string).getTime()
        );
      });
    }

    return map;
  }, [normalizedEvents]);

  const openCreateModal = (date?: Date) => {
    const baseDate = date ? new Date(date) : new Date();

    setForm({
      ...EMPTY_FORM,
      startDate: toDateInputValue(baseDate),
      startTime: '09:00',
      endDate: toDateInputValue(baseDate),
      endTime: '10:00',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (event: (typeof normalizedEvents)[number]) => {
    setForm(buildFormFromEvent(event));
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
      await loadEvents();
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
      await loadEvents();
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
            <button style={button} onClick={goToday}>
              今日
            </button>
          </div>

          <div style={toolbarRight}>
            <button style={primaryButton} onClick={() => openCreateModal()}>
              予定を追加
            </button>
          </div>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        {loading && <div style={loadingBox}>読み込み中...</div>}

        {!loading && (
          <div style={weekScrollWrap}>
            <div style={weekCard}>
              <div style={weekGrid}>
                {weekDays.map((date) => {
                  const key = formatLocalDateKey(date);
                  const dayEvents = eventsByDate.get(key) ?? [];
                  const dayType = getDayType(date);
                  const holidayName = getHolidayName(date);
                  const isToday = key === todayKey;

                  const headerStyle =
                    dayType === 'holiday' || dayType === 'sunday'
                      ? sundayHeader
                      : dayType === 'saturday'
                        ? saturdayHeader
                        : dayHeader;

                  const dayCardStyle =
                    dayType === 'holiday' || dayType === 'sunday'
                      ? sundayDayCard
                      : dayType === 'saturday'
                        ? saturdayDayCard
                        : dayCard;

                  const dateTextStyle =
                    dayType === 'holiday' || dayType === 'sunday'
                      ? sundayDateText
                      : dayType === 'saturday'
                        ? saturdayDateText
                        : normalDateText;

                  return (
                    <div key={key} style={dayColumn}>
                      <div style={headerStyle}>
                        <div style={weekdayText}>{formatWeekdayShort(date)}</div>
                        <div style={dateRow}>
                          <span
                            style={{
                              ...dateTextStyle,
                              ...(isToday ? todayDateText : {}),
                            }}
                          >
                            {date.getMonth() + 1}/{date.getDate()}
                          </span>

                          {holidayName ? (
                            <span style={holidayNameStyle}>{holidayName}</span>
                          ) : null}
                        </div>
                      </div>

                      <div style={dayCardStyle}>
                        <button style={addButton} onClick={() => openCreateModal(date)}>
                          ＋ この日に予定を追加
                        </button>

                        <div style={eventList}>
                          {dayEvents.length === 0 ? (
                            <div style={emptyText}>予定なし</div>
                          ) : (
                            dayEvents.map((e) => (
                              <button
  key={e.id}
  style={eventItem}
  onClick={() => openEditModal(e)}
  title={e.title}
>
  <span style={eventTime}>
    {e.allDay ? '終日' : formatTime(new Date(e.startAt as string))}
  </span>

  <span style={eventTitle}>
    {e.title}
  </span>

  {e.owner_name ? (
    <span style={eventOwner}>{e.owner_name}</span>
  ) : null}
</button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <EventFormModal
          open={modalOpen}
          saving={saving}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </SchedulerShell>
  );
}

function getDayType(date: Date) {
  const day = date.getDay();

  if (isHoliday(date)) return 'holiday';
  if (day === 0) return 'sunday';
  if (day === 6) return 'saturday';
  return 'weekday';
}

function getHolidayName(date: Date) {
  const holidays = between(date, date);
  return holidays.length > 0 ? holidays[0].name : '';
}

function buildLocalIso(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  return localDate.toISOString();
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

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWeekdayShort(date: Date) {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${weekdays[date.getDay()]}曜日`;
}

function formatDateLabel(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}/${m}/${d}`;
}

function formatTime(date: Date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
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
  flexWrap: 'wrap',
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

const weekScrollWrap: React.CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
};

const weekCard: React.CSSProperties = {
  minWidth: 980,
  background: 'linear-gradient(180deg, #ffffff 0%, #fffafb 100%)',
  borderRadius: 24,
  padding: 16,
  boxShadow: '0 14px 30px rgba(91, 98, 133, 0.10)',
};

const weekGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
  gap: 10,
};

const dayColumn: React.CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  minHeight: 520,
};

const dayHeader: React.CSSProperties = {
  background: 'linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%)',
  borderRadius: '16px 16px 0 0',
  padding: '12px 10px',
  display: 'grid',
  gap: 6,
  color: '#1d4ed8',
};

const sundayHeader: React.CSSProperties = {
  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
  borderRadius: '16px 16px 0 0',
  padding: '12px 10px',
  display: 'grid',
  gap: 6,
  color: '#dc2626',
};

const saturdayHeader: React.CSSProperties = {
  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  borderRadius: '16px 16px 0 0',
  padding: '12px 10px',
  display: 'grid',
  gap: 6,
  color: '#2563eb',
};

const weekdayText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
};

const dateRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
};

const normalDateText: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: '#1f2340',
};

const sundayDateText: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: '#dc2626',
};

const saturdayDateText: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: '#2563eb',
};

const todayDateText: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 42,
  height: 30,
  borderRadius: 999,
  border: '2px solid #111827',
  background: '#fff',
  color: '#111827',
};

const holidayNameStyle: React.CSSProperties = {
  minWidth: 0,
  fontSize: 10,
  fontWeight: 800,
  color: '#b91c1c',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const dayCard: React.CSSProperties = {
  background: '#fff',
  borderRadius: '0 0 16px 16px',
  padding: 10,
  display: 'grid',
  alignContent: 'start',
  gap: 10,
};

const sundayDayCard: React.CSSProperties = {
  background: 'linear-gradient(180deg, #fff7f7 0%, #fff1f2 100%)',
  borderRadius: '0 0 16px 16px',
  padding: 10,
  display: 'grid',
  alignContent: 'start',
  gap: 10,
};

const saturdayDayCard: React.CSSProperties = {
  background: 'linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)',
  borderRadius: '0 0 16px 16px',
  padding: 10,
  display: 'grid',
  alignContent: 'start',
  gap: 10,
};

const addButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 12,
  background: 'linear-gradient(135deg, #ecfdf3 0%, #d1fae5 100%)',
  color: '#166534',
  padding: '9px 8px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 12,
  textAlign: 'center',
};

const eventList: React.CSSProperties = {
  display: 'grid',
  gap: 8,
};

const emptyText: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: 12,
  fontWeight: 700,
  textAlign: 'center',
  padding: '16px 4px',
};

const eventItem: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  background: 'linear-gradient(90deg, #ede9fe 0%, #ddd6fe 100%)',
  color: '#1e1b4b',
  padding: '4px 8px',
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 28,
  width: '100%',
  overflow: 'hidden',
  boxShadow: 'none',
};

const eventTime: React.CSSProperties = {
  fontSize: 12,
  color: '#374151',
  fontWeight: 900,
  flexShrink: 0,
};

const eventTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 13,
  color: '#1e1b4b',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const eventOwner: React.CSSProperties = {
  fontSize: 12,
  color: '#1e1b4b',
  fontWeight: 900,
  flexShrink: 0,
};
