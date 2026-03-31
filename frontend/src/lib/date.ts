export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfMonthGrid(base: Date): Date {
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const offset = first.getDay();
  first.setDate(first.getDate() - offset);
  first.setHours(0, 0, 0, 0);
  return first;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function rangeOfMonthGrid(base: Date): { from: string; to: string } {
  const start = startOfMonthGrid(base);
  const end = addDays(start, 41);
  return { from: formatDateKey(start), to: formatDateKey(end) };
}

export function rangeOfWeek(base: Date): { from: string; to: string } {
  const start = new Date(base);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 6);
  return { from: formatDateKey(start), to: formatDateKey(end) };
}
