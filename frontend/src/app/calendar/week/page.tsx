'use client';

import SchedulerShell from '@/components/SchedulerShell';

export default function CalendarWeekPage() {
  const days = ['月', '火', '水', '木', '金', '土', '日'];
  const times = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`);

  return (
    <SchedulerShell title="週表示">
      <div style={wrap}>
        <div style={toolbar}>
          <button style={button}>前週</button>
          <h2 style={title}>2026/04/06 - 2026/04/12</h2>
          <button style={button}>次週</button>
        </div>

        <div style={grid}>
          <div style={timeHeader} />
          {days.map((day) => (
            <div key={day} style={dayHeader}>
              {day}
            </div>
          ))}

          {times.map((time) => (
            <div key={time} style={{ display: 'contents' }}>
              <div style={timeCell}>{time}</div>
              {days.map((day) => (
                <div key={`${day}-${time}`} style={cell} />
              ))}
            </div>
          ))}
        </div>
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
};

const timeCell: React.CSSProperties = {
  padding: '10px 8px',
  fontSize: 12,
  color: '#6B6760',
};

const cell: React.CSSProperties = {
  minHeight: 56,
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 10,
  background: '#fff',
};
