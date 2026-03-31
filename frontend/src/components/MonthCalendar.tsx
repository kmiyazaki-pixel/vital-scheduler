'use client';

type CalendarEvent = {
  id: number;
  title: string;
  category: string;
  dateKey: string;
};

type MonthCalendarProps = {
  currentMonth: Date;
  selectedDate: string;
  events: CalendarEvent[];
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onAdd: () => void;
  onEventClick: (eventId: number) => void;
};

export function MonthCalendar({
  currentMonth,
  selectedDate,
  events,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onAdd,
  onEventClick
}: MonthCalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = new Date(firstDay);
  start.setDate(start.getDate() - firstDay.getDay());

  const end = new Date(lastDay);
  end.setDate(end.getDate() + (6 - lastDay.getDay()));

  const cells: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const todayKey = toDateKey(new Date());

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={toolbar}>
        <div style={monthNav}>
          <button type="button" onClick={onPrevMonth} style={navButton}>‹</button>
          <span style={monthLabel}>
            {year}年 {month + 1}月
          </span>
          <button type="button" onClick={onNextMonth} style={navButton}>›</button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onToday} style={subButton}>今月</button>
          <button type="button" onClick={onAdd} style={mainButton}>＋ 予定を追加</button>
        </div>
      </div>

      <div style={panel}>
        <div style={dowRow}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div
              key={day}
              style={{
                ...dowCell,
                color: index === 0 ? '#C04A80' : index === 6 ? '#2D5BE3' : '#8f8a81'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        <div style={grid}>
          {cells.map((date) => {
            const dateKey = toDateKey(date);
            const isOtherMonth = date.getMonth() !== month;
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const dayEvents = events.filter((event) => event.dateKey === dateKey);
            const visible = dayEvents.slice(0, 3);

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => onSelectDate(dateKey)}
                style={{
                  ...dayCell,
                  opacity: isOtherMonth ? 0.35 : 1,
                  background: isSelected ? 'rgba(45,91,227,0.05)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <div
                    style={{
                      ...dayNum,
                      background: isToday ? '#1A1916' : isSelected ? 'rgba(45,91,227,0.12)' : 'transparent',
                      color: isToday ? '#fff' : isSelected ? '#2D5BE3' : '#6B6760'
                    }}
                  >
                    {date.getDate()}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  {visible.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event.id);
                      }}
                      style={{ ...pillButton, ...pillByCategory(event.category) }}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={moreText}>他 {dayEvents.length - 3} 件</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function pillByCategory(category: string): React.CSSProperties {
  switch (category) {
    case 'meeting':
      return { background: '#E9F0FF', color: '#2D5BE3' };
    case 'work':
      return { background: '#EEF4EA', color: '#4B7A2A' };
    case 'review':
      return { background: '#FFF3E4', color: '#B26A1D' };
    case 'personal':
      return { background: '#FCEBF2', color: '#C04A80' };
    default:
      return { background: '#F1F1F1', color: '#555' };
  }
}

const toolbar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap'
};

const monthNav: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10
};

const navButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fffdfa',
  borderRadius: 10,
  padding: '8px 12px',
  cursor: 'pointer'
};

const monthLabel: React.CSSProperties = {
  minWidth: 140,
  textAlign: 'center',
  fontWeight: 700
};

const subButton: React.CSSProperties = {
  ...navButton
};

const mainButton: React.CSSProperties = {
  border: 'none',
  background: '#1A1916',
  color: '#fff',
  borderRadius: 10,
  padding: '8px 14px',
  cursor: 'pointer'
};

const panel: React.CSSProperties = {
  background: '#FDFCFA',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 16,
  overflow: 'hidden'
};

const dowRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  borderBottom: '1px solid rgba(0,0,0,0.08)'
};

const dowCell: React.CSSProperties = {
  textAlign: 'center',
  padding: '10px 4px',
  fontSize: 12,
  background: '#F7F5F1'
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)'
};

const dayCell: React.CSSProperties = {
  minHeight: 118,
  borderRight: '1px solid rgba(0,0,0,0.08)',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  padding: 8,
  textAlign: 'left',
  cursor: 'pointer'
};

const dayNum: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  fontSize: 13
};

const pillButton: React.CSSProperties = {
  border: 'none',
  width: '100%',
  textAlign: 'left',
  fontSize: 11,
  borderRadius: 6,
  padding: '2px 6px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  cursor: 'pointer'
};

const moreText: React.CSSProperties = {
  fontSize: 11,
  color: '#8f8a81'
};