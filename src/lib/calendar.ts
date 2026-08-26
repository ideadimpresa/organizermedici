import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";

/**
 * Builds the flat list of days for a month-grid calendar (6 rows x 7 cols,
 * Monday-first), including the leading/trailing days from adjacent months
 * needed to fill the grid.
 */
export function buildMonthGrid(monthDate: Date): Date[] {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });

  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
