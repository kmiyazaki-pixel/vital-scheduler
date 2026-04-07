'use client';

import SchedulerShell from '@/components/SchedulerShell';

export default function CalendarMonthPage() {
  return (
    <SchedulerShell title="月表示">
      <div style={wrap}>
        <div style={toolbar}>
          <button style={button}>前月</button>
          <h2 style={title}>2026年4月</h2>
          <button style={button}>次月</button>
        </div>

        <div style={grid}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <div key={day} style={dayHeader}>
              {day}
            </div>
          ))}

          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} style={cell}>
              <div style={date}>{i + 1 <= 30 ? i + 1 : ''}</div>
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
  minHeight: 110,
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  background: '#fff',
  padding: 8,
};

const date: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
};
