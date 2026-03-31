'use client';

type WeekEvent = {
  id: number;
  title: string;
  category: string;
  dateKey: string;
  startHour: number;
  endHour: number;
};

type WeekCalendarProps = {
  weekStart: Date;
  events: WeekEvent[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onAdd: (dateKey?: string, hour?: number) => void;
  onEventClick: (eventId: number) => void;
};

export function WeekCalendar({
  weekStart,
  events,
  onPrevWeek,
  onNextWeek,
  onToday,
  onAdd,
  onEventClick
}: WeekCalendarProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={toolbar}>
        <div style={monthNav}>
          <button type="button" onClick={onPrevWeek} style={navButton}>‹</button>
          <span style={rangeLabel}>
            {formatDate(days[0])} 〜 {formatDate(days[6])}
          </span>
          <button type="button" onClick={onNextWeek} style={navButton}>›</button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onToday} style={subButton}>今週</button>
          <button type="button" onClick={() => onAdd()} style={mainButton}>＋ 予定を追加</button>
        </div>
      </div>

      <div style={panel}>
        <div style={weekHeader}>
          <div style={timeHeader}></div>
          {days.map((day) => {
            const dateKey = toDateKey(day);
            return (
              <div key={dateKey} style={dayHeader}>
                <div style={{ fontSize: 12, color: '#8f8a81' }}>
                  {['日', '月', '火', '水', '木', '金', '土'][day.getDay()]}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {day.getMonth() + 1}/{day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          {hours.map((hour) => (
            <div key={hour} style={hourRow}>
              <div style={timeCell}>{String(hour).padStart(2, '0')}:00</div>
              {days.map((day) => {
                const dateKey = toDateKey(day);
                const hourEvents = events.filter(
                  (event) => event.dateKey === dateKey && event.startHour === hour
                );

                return (
                  <button
                    key={`${dateKey}-${hour}`}
                    type="button"
                    onClick={() => onAdd(dateKey, hour)}
                    style={slotCell}
                  >
                    {hourEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event.id);
                        }}
                        style={{ ...weekCard, ...pillByCategory(event.category) }}
                      >
                        <div style={{ fontWeight: 700 }}>{event.title}</div>
                        <div style={{ fontSize: 11 }}>
                          {String(event.startHour).padStart(2, '0')}:00 - {String(event.endHour).padStart(2, '0')}:00
                        </div>
                      </button>
                    ))}
                  </button>
                );
              })}
            </div>
          ))}
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

function formatDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
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

const rangeLabel: React.CSSProperties = {
  minWidth: 180,
  textAlign: 'center',
  fontWeight: 700
};

const subButton: React.CSSProperties = { ...navButton };

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

const weekHeader: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '90px repeat(7, 1fr)',
  borderBottom: '1px solid rgba(0,0,0,0.08)'
};

const timeHeader: React.CSSProperties = {
  background: '#F7F5F1'
};

const dayHeader: React.CSSProperties = {
  padding: '10px 8px',
  background: '#F7F5F1',
  borderLeft: '1px solid rgba(0,0,0,0.08)'
};

const hourRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '90px repeat(7, 1fr)',
  minHeight: 72
};

const timeCell: React.CSSProperties = {
  padding: '10px 8px',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  color: '#8f8a81',
  fontSize: 12
};

const slotCell: React.CSSProperties = {
  border: 'none',
  borderLeft: '1px solid rgba(0,0,0,0.08)',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  background: 'transparent',
  textAlign: 'left',
  padding: 6,
  cursor: 'pointer'
};

const weekCard: React.CSSProperties = {
  border: 'none',
  width: '100%',
  textAlign: 'left',
  borderRadius: 10,
  padding: '8px 10px',
  fontSize: 12,
  display: 'grid',
  gap: 4,
  cursor: 'pointer'
};