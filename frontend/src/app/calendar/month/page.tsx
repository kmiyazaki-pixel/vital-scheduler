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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const FIXED_CALENDAR_ID = 1;

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────
function formatLocalDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toDateInputValue(date: Date) {
  return formatLocalDateKey(date);
}

function formatDateParam(date: Date) {
  return formatLocalDateKey(date);
}

function buildLocalIso(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function formatTime(date: Date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getDayType(date: Date): 'sunday' | 'saturday' | 'holiday' | 'weekday' {
  if (isHoliday(date)) return 'holiday';
  const day = date.getDay();
  if (day === 0) return 'sunday';
  if (day === 6) return 'saturday';
  return 'weekday';
}

function getHolidayName(date: Date) {
  const holidays = between(date, date);
  return holidays.length > 0 ? holidays[0].name : '';
}

/** keyA <= keyB の順に並べた [start, end] を返す */
function sortKeys(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

// ─────────────────────────────────────────────
// component
// ─────────────────────────────────────────────
export default function CalendarMonthPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);

  // drag-range selection
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragConfirmed = useRef(false); // mouseup → modal opened?

  const todayKey = formatLocalDateKey(new Date());

  // ── calendar grid ──────────────────────────
  const { year, month } = useMemo(() => {
    return { year: currentDate.getFullYear(), month: currentDate.getMonth() };
  }, [currentDate]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // pad with days from prev month
    const startPad = firstDay.getDay(); // 0=Sun
    const endPad = 6 - lastDay.getDay();

    const days: Date[] = [];
    for (let i = startPad; i > 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    for (let i = 1; i <= endPad; i++) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [year, month]);

  // ── load events ────────────────────────────
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const from = formatDateParam(calendarDays[0]);
      const toDate = new Date(calendarDays[calendarDays.length - 1]);
      toDate.setDate(toDate.getDate() + 1);
      const to = formatDateParam(toDate);
      const data = await fetchEvents(FIXED_CALENDAR_ID, from, to);
      setEvents(data as EventItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [calendarDays]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ── normalize events ───────────────────────
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
      list.sort(
        (a, b) =>
          new Date(a.startAt as string).getTime() -
          new Date(b.startAt as string).getTime(),
      );
    }
    return map;
  }, [normalizedEvents]);

  // ── nav ────────────────────────────────────
  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  // ── drag range selection ───────────────────
  const selectionRange = useMemo<[string, string] | null>(() => {
    if (!dragStart || !dragEnd) return null;
    return sortKeys(dragStart, dragEnd);
  }, [dragStart, dragEnd]);

  const isInRange = useCallback(
    (key: string) => {
      if (!selectionRange) return false;
      const [s, e] = selectionRange;
      return key >= s && key <= e;
    },
    [selectionRange],
  );
  const isRangeStart = (key: string) => selectionRange?.[0] === key;
  const isRangeEnd = (key: string) => selectionRange?.[1] === key;

  const handleDayMouseDown = (key: string, e: React.MouseEvent) => {
    // only primary button
    if (e.button !== 0) return;
    e.preventDefault();
    dragConfirmed.current = false;
    setDragStart(key);
    setDragEnd(key);
    setIsDragging(true);
  };

  const handleDayMouseEnter = (key: string) => {
    if (!isDragging) return;
    setDragEnd(key);
  };

  // Global mouseup: finalize drag
  useEffect(() => {
    const onMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);

      if (dragStart && dragEnd && !dragConfirmed.current) {
        dragConfirmed.current = true;
        const [start, end] = sortKeys(dragStart, dragEnd);
        openCreateModalRange(start, end);
      }
    };

    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [isDragging, dragStart, dragEnd]);

  // ── modal open helpers ─────────────────────
  const openCreateModalRange = (startKey: string, endKey: string) => {
    setForm({
      ...EMPTY_FORM,
      startDate: startKey,
      startTime: '09:00',
      endDate: endKey,
      endTime: '10:00',
      allDay: startKey !== endKey, // multi-day → 終日にする
    });
    setError(null);
    setModalOpen(true);
  };

  const openCreateModal = (date?: Date) => {
    const base = date ? new Date(date) : new Date();
    setForm({
      ...EMPTY_FORM,
      startDate: toDateInputValue(base),
      startTime: '09:00',
      endDate: toDateInputValue(base),
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
    setDragStart(null);
    setDragEnd(null);
  };

  // ── save / delete ──────────────────────────
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

    if (new Date(startAt) > new Date(endAt)) {
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
      setDragStart(null);
      setDragEnd(null);
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
      setDragStart(null);
      setDragEnd(null);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予定削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // ── render ─────────────────────────────────
  const weekHeaders = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <SchedulerShell title="月表示">
      <div style={wrap}>
        {/* toolbar */}
        <div style={toolbar}>
          <div style={toolbarLeft}>
            <button style={button} onClick={prevMonth}>前月</button>
            <h2 style={titleStyle}>
              {year}年{month + 1}月
            </h2>
            <button style={button} onClick={nextMonth}>次月</button>
            <button style={button} onClick={goToday}>今日</button>
          </div>
          <div style={toolbarRight}>
            <span style={dragHintText}>
              📅 日付をドラッグして期間選択
            </span>
            <button style={primaryButton} onClick={() => openCreateModal()}>
              予定を追加
            </button>
          </div>
        </div>

        {error && <div style={errorBox}>{error}</div>}
        {loading && <div style={loadingBox}>読み込み中...</div>}

        {!loading && (
          <div style={calendarCard}>
            {/* week header row */}
            <div style={gridHeader}>
              {weekHeaders.map((w, i) => (
                <div
                  key={w}
                  style={{
                    ...weekHeaderCell,
                    color: i === 0 ? '#dc2626' : i === 6 ? '#2563eb' : '#64748b',
                  }}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* day grid */}
            <div
              style={calendarGrid}
              // prevent text selection during drag
              onMouseDown={(e) => { if (e.button === 0) e.preventDefault(); }}
            >
              {calendarDays.map((date) => {
                const key = formatLocalDateKey(date);
                const dayEvents = eventsByDate.get(key) ?? [];
                const isCurrentMonth = date.getMonth() === month;
                const dayType = getDayType(date);
                const holidayName = getHolidayName(date);
                const isToday = key === todayKey;
                const inRange = isInRange(key);
                const isStart = isRangeStart(key);
                const isEnd = isRangeEnd(key);

                return (
                  <div
                    key={key}
                    style={getDayStyle({
                      isCurrentMonth,
                      dayType,
                      isToday,
                      inRange,
                      isDragging,
                    })}
                    onMouseDown={(e) => handleDayMouseDown(key, e)}
                    onMouseEnter={() => handleDayMouseEnter(key)}
                  >
                    {/* range selection highlight overlay */}
                    {inRange && (
                      <div
                        style={getRangeOverlay(isStart, isEnd, dragStart === dragEnd)}
                      />
                    )}

                    {/* date number */}
                    <div style={dateNumberRow}>
                      <span
                        style={getDateNumberStyle(
                          isToday,
                          dayType,
                          isCurrentMonth,
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {holidayName && isCurrentMonth && (
                        <span style={holidayLabel}>{holidayName}</span>
                      )}
                    </div>

                    {/* events */}
                    <div style={eventListStyle}>
                      {dayEvents.slice(0, 3).map((e) => (
                        <button
                          key={e.id}
                          style={eventChip}
                          onMouseDown={(ev) => ev.stopPropagation()}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openEditModal(e);
                          }}
                          title={e.title}
                        >
                          <span style={eventChipTime}>
                            {e.allDay
                              ? '終日'
                              : formatTime(new Date(e.startAt as string))}
                          </span>
                          <span style={eventChipTitle}>{e.title}</span>
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <div style={moreLabel}>
                          +{dayEvents.length - 3}件
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* range selection indicator */}
        {isDragging && dragStart && dragEnd && dragStart !== dragEnd && (
          <div style={selectionIndicator}>
            {(() => {
              const [s, e] = sortKeys(dragStart, dragEnd);
              return `${s} 〜 ${e} を選択中`;
            })()}
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

// ─────────────────────────────────────────────
// dynamic style helpers
// ─────────────────────────────────────────────
function getDayStyle({
  isCurrentMonth,
  dayType,
  isToday,
  inRange,
  isDragging,
}: {
  isCurrentMonth: boolean;
  dayType: string;
  isToday: boolean;
  inRange: boolean;
  isDragging: boolean;
}): React.CSSProperties {
  let bg = '#fff';
  if (!isCurrentMonth) bg = '#f8fafc';
  else if (dayType === 'sunday' || dayType === 'holiday') bg = '#fff7f7';
  else if (dayType === 'saturday') bg = '#f8fbff';

  return {
    position: 'relative',
    minHeight: 110,
    background: bg,
    borderRadius: 10,
    padding: '6px 6px 4px',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    gap: 4,
    cursor: isDragging ? 'cell' : 'default',
    userSelect: 'none',
    transition: 'box-shadow 0.1s',
    boxShadow: isToday && !inRange
      ? '0 0 0 2px #6366f1 inset'
      : inRange
        ? '0 0 0 1.5px rgba(99,102,241,0.4) inset'
        : '0 0 0 1px rgba(0,0,0,0.05) inset',
  };
}

function getRangeOverlay(
  isStart: boolean,
  isEnd: boolean,
  isSingle: boolean,
): React.CSSProperties {
  return {
    position: 'absolute',
    inset: isSingle ? 0 : isStart ? '0 0 0 0' : isEnd ? '0 0 0 0' : 0,
    borderRadius: isSingle
      ? 10
      : isStart
        ? '10px 0 0 10px'
        : isEnd
          ? '0 10px 10px 0'
          : 0,
    background: 'rgba(99,102,241,0.15)',
    border: isSingle || isStart || isEnd
      ? '2px solid rgba(99,102,241,0.55)'
      : 'none',
    borderLeft: isEnd && !isSingle ? 'none' : undefined,
    borderRight: isStart && !isSingle ? 'none' : undefined,
    pointerEvents: 'none',
    zIndex: 0,
  };
}

function getDateNumberStyle(
  isToday: boolean,
  dayType: string,
  isCurrentMonth: boolean,
): React.CSSProperties {
  let color = isCurrentMonth ? '#1f2340' : '#cbd5e1';
  if (dayType === 'sunday' || dayType === 'holiday') color = isCurrentMonth ? '#dc2626' : '#fca5a5';
  else if (dayType === 'saturday') color = isCurrentMonth ? '#2563eb' : '#93c5fd';

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    color,
    background: isToday ? '#6366f1' : 'transparent',
    ...(isToday ? { color: '#fff' } : {}),
    position: 'relative',
    zIndex: 1,
  };
}

// ─────────────────────────────────────────────
// static styles
// ─────────────────────────────────────────────
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

const titleStyle: React.CSSProperties = {
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

const dragHintText: React.CSSProperties = {
  fontSize: 12,
  color: '#6366f1',
  fontWeight: 700,
  background: 'rgba(99,102,241,0.07)',
  borderRadius: 8,
  padding: '6px 10px',
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
  display: 'grid',
  gap: 8,
};

const gridHeader: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
};

const weekHeaderCell: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 12,
  fontWeight: 900,
  padding: '4px 0 8px',
};

const calendarGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
};

const dateNumberRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  position: 'relative',
  zIndex: 1,
};

const holidayLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  color: '#b91c1c',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 60,
};

const eventListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 2,
  alignContent: 'start',
  position: 'relative',
  zIndex: 1,
};

const eventChip: React.CSSProperties = {
  border: 'none',
  borderRadius: 6,
  background: 'linear-gradient(135deg, #eef2ff 0%, #e9d5ff 100%)',
  color: '#312e81',
  padding: '3px 6px',
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  overflow: 'hidden',
  width: '100%',
};

const eventChipTime: React.CSSProperties = {
  fontSize: 10,
  color: '#5b6285',
  fontWeight: 800,
  flexShrink: 0,
};

const eventChipTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const moreLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: '#6366f1',
  paddingLeft: 4,
};

const selectionIndicator: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(99,102,241,0.92)',
  color: '#fff',
  borderRadius: 999,
  padding: '10px 20px',
  fontSize: 13,
  fontWeight: 800,
  boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
  pointerEvents: 'none',
  zIndex: 9999,
  backdropFilter: 'blur(4px)',
};
