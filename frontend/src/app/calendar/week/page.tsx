'use client';

import SchedulerShell from '@/components/SchedulerShell';
import { createEvent, deleteEvent, fetchEvents, updateEvent } from '@/lib/scheduler-db';
import { EventItem } from '@/lib/types';
import { between, isHoliday } from 'holiday-jp-dayjs';
import { useEffect, useMemo, useState } from 'react';

type EventFormState = {
  id?: number;
  title: string;
  category: string;
  memo: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
};

const EMPTY_FORM: EventFormState = {
  title: '',
  category: 'other',
  memo: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  allDay: false,
};

const FIXED_CALENDAR_ID = 1;

export default function CalendarWeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const todayKey = formatDateParam(new Date());
  const weekLabel = `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}`;
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const loadEvents = async (days: Date[]) => {
    try {
      setLoading(true);
      setError(null);

      const from = formatDateParam(days[0]);
      const to = formatDateParam(days[6]);
      const data = await fetchEvents(FIXED_CALENDAR_ID, from, to);

      setEvents(data as EventItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(weekDays);
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
    const baseDate = date ? new Date(date) : new Date(weekDays[0]);
    const baseHour = typeof hour === 'number' ? hour : 9;

    setForm({
      ...EMPTY_FORM,
      startDate: toDateInputValue(baseDate),
      startTime: `${String(baseHour).padStart(2, '0')}:00`,
      endDate: toDateInputValue(baseDate),
      endTime: `${String(Math.min(baseHour + 1, 23)).padStart(2, '0')}:00`,
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (event: (typeof normalizedEvents)[number]) => {
    const start = new Date(event.startAt as string);
    const end = new Date(event.endAt as string);

    setForm({
      id: event.id,
      title: event.title,
      category: event.category,
      memo: event.memo ?? '',
      startDate: toDateInputValue(start),
      startTime: toTimeInputValue(start),
      endDate: toDateInputValue(end),
      endTime: toTimeInputValue(end),
      allDay: Boolean(event.allDay),
    });
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
      await loadEvents(weekDays);
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
      await loadEvents(weekDays);
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
            <button style={primaryButton} onClick={() => openCreateModal()}>
              予定を追加
            </button>
          </div>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        {loading && <div style={loadingBox}>読み込み中...</div>}

        {!loading && (
          <div style={weekScrollWrap}>
            <div style={calendarCard}>
              <div style={grid}>
                <div style={timeHeader} />
                {weekDays.map((day) => {
                  const dayType = getDayType(day);
                  const holidayName = getHolidayName(day);
                  const isToday = formatDateParam(day) === todayKey;

                  const headerStyle =
                    dayType === 'holiday' || dayType === 'sunday'
                      ? sundayHeader
                      : dayType === 'saturday'
                        ? saturdayHeader
                        : dayHeader;

                  const dateTextStyle =
                    dayType === 'holiday' || dayType === 'sunday'
                      ? sundayDateStyle
                      : dayType === 'saturday'
                        ? saturdayDateStyle
                        : dayDate;

                  const weekTextStyle =
                    dayType === 'holiday' || dayType === 'sunday'
                      ? sundayWeekStyle
                      : dayType === 'saturday'
                        ? saturdayWeekStyle
                        : dayWeek;

                  return (
                    <div key={day.toISOString()} style={headerStyle}>
                      <div style={weekHeaderTop}>
                        <div
                          style={{
                            ...dateTextStyle,
                            ...(isToday ? todayWeekDateStyle : {}),
                          }}
                        >
                          {`${day.getMonth() + 1}/${day.getDate()}`}
                        </div>
                        {holidayName ? <span style={weekHolidayInline}>{holidayName}</span> : null}
                      </div>
                      <div style={weekTextStyle}>{['日', '月', '火', '水', '木', '金', '土'][day.getDay()]}</div>
                    </div>
                  );
                })}

                {hours.map((hour) => (
                  <div key={hour} style={{ display: 'contents' }}>
                    <div style={timeCell}>{`${String(hour).padStart(2, '0')}:00`}</div>
                    {weekDays.map((day) => {
                      const key = `${day.toISOString().slice(0, 10)}-${hour}`;
                      const dayEvents = eventsByDayAndHour.get(key) ?? [];
                      const dayType = getDayType(day);

                      const cellStyle =
                        dayType === 'holiday' || dayType === 'sunday'
                          ? sundayCell
                          : dayType === 'saturday'
                            ? saturdayCell
                            : {};

                      return (
                        <div key={key} style={{ ...cell, ...cellStyle }}>
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
          </div>
        )}

        {modalOpen && (
          <div style={overlay}>
            <div style={modal}>
              <h3 style={modalTitle}>{form.id ? '予定を編集' : '予定を追加'}</h3>

              <div style={formGrid}>
                <label style={label}>
                  タイトル
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="未入力なら「新しい予定」で保存されます"
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

                <div style={dateTimeRow}>
                  <label style={halfLabel}>
                    <span>開始日</span>
                    <div style={dateInlineBox}>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                        style={dateInlineInput}
                        disabled={saving}
                      />
                      <span style={dateInlineWeekday}>
                        {form.startDate ? formatWeekdayJa(form.startDate) : ''}
                      </span>
                    </div>
                  </label>

                  <label style={halfLabel}>
                    <span>開始時刻</span>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      style={input}
                      disabled={saving || form.allDay}
                    />
                  </label>
                </div>

                <div style={dateTimeRow}>
                  <label style={halfLabel}>
                    <span>終了日</span>
                    <div style={dateInlineBox}>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                        style={dateInlineInput}
                        disabled={saving}
                      />
                      <span style={dateInlineWeekday}>
                        {form.endDate ? formatWeekdayJa(form.endDate) : ''}
                      </span>
                    </div>
                  </label>

                  <label style={halfLabel}>
                    <span>終了時刻</span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                      style={input}
                      disabled={saving || form.allDay}
                    />
                  </label>
                </div>

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

function formatDate(date: Date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateParam(date: Date) {
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

function toTimeInputValue(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatWeekdayJa(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  return weekdays[d.getDay()];
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
  maxHeight: 'calc(100vh - 220px)',
  overflowX: 'auto',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
};

const calendarCard: React.CSSProperties = {
  minWidth: 1100,
  background: 'linear-gradient(180deg, #ffffff 0%, #fffafb 100%)',
  borderRadius: 24,
  padding: 16,
  boxShadow: '0 14px 30px rgba(91, 98, 133, 0.10)',
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '90px repeat(7, minmax(140px, 1fr))',
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

const sundayHeader: React.CSSProperties = {
  padding: '12px 8px',
  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
  borderLeft: '1px solid rgba(99,102,241,0.08)',
  textAlign: 'center',
};

const saturdayHeader: React.CSSProperties = {
  padding: '12px 8px',
  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  borderLeft: '1px solid rgba(99,102,241,0.08)',
  textAlign: 'center',
};

const weekHeaderTop: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  minWidth: 0,
};

const dayDate: React.CSSProperties = {
  fontWeight: 800,
  color: '#1f2340',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 28,
  padding: '0 8px',
  borderRadius: 999,
};

const dayWeek: React.CSSProperties = {
  fontSize: 12,
  color: '#5b6285',
  fontWeight: 700,
};

const sundayDateStyle: React.CSSProperties = {
  fontWeight: 800,
  color: '#dc2626',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 28,
  padding: '0 8px',
  borderRadius: 999,
};

const saturdayDateStyle: React.CSSProperties = {
  fontWeight: 800,
  color: '#2563eb',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 28,
  padding: '0 8px',
  borderRadius: 999,
};

const todayWeekDateStyle: React.CSSProperties = {
  color: '#111827',
  border: '2px solid #111827',
  background: '#ffffff',
};

const weekHolidayInline: React.CSSProperties = {
  minWidth: 0,
  fontSize: 10,
  fontWeight: 800,
  color: '#b91c1c',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const sundayWeekStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#dc2626',
  fontWeight: 700,
};

const saturdayWeekStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#2563eb',
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

const sundayCell: React.CSSProperties = {
  background: 'linear-gradient(180deg, #fff7f7 0%, #fff1f2 100%)',
};

const saturdayCell: React.CSSProperties = {
  background: 'linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)',
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
  padding: 16,
  zIndex: 50,
};

const modal: React.CSSProperties = {
  width: '100%',
  maxWidth: 576,
  background: 'linear-gradient(180deg, #ffffff 0%, #fffafb 100%)',
  borderRadius: 19,
  padding: 19,
  boxShadow: '0 16px 32px rgba(15, 23, 42, 0.20)',
};

const modalTitle: React.CSSProperties = {
  margin: '0 0 13px',
  fontSize: 19,
  color: '#1f2340',
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gap: 11,
};

const label: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  fontWeight: 700,
  color: '#394067',
};

const halfLabel: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  fontWeight: 700,
  color: '#394067',
  flex: 1,
  minWidth: 0,
};

const dateTimeRow: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const dateInlineBox: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '0 11px',
  border: '1px solid #d8dcef',
  borderRadius: 11,
  boxSizing: 'border-box',
  background: '#fff',
  minHeight: 42,
};

const dateInlineInput: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  fontSize: 14,
  background: 'transparent',
  padding: '9px 0',
  boxSizing: 'border-box',
};

const dateInlineWeekday: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#5b6285',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  border: '1px solid #d8dcef',
  borderRadius: 11,
  fontSize: 14,
  boxSizing: 'border-box',
  background: '#fff',
  minHeight: 42,
};

const textarea: React.CSSProperties = {
  width: '100%',
  minHeight: 80,
  padding: '9px 11px',
  border: '1px solid #d8dcef',
  borderRadius: 11,
  fontSize: 14,
  boxSizing: 'border-box',
  background: '#fff',
  resize: 'vertical',
};

const checkLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontWeight: 700,
  color: '#394067',
};

const modalActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 14,
  flexWrap: 'wrap',
};
