import Link from "next/link";
import { addMonths, format, isSameDay, isSameMonth, startOfWeek, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { buildMonthGrid, formatDateKey } from "@/lib/calendar";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function AgendaCalendar({
  monthDate,
  countsByDay,
  selectedDate,
}: {
  monthDate: Date;
  countsByDay: Map<string, number>;
  selectedDate: Date;
}) {
  const days = buildMonthGrid(monthDate);
  const today = new Date();
  const prevMonth = format(subMonths(monthDate, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");

  return (
    <div className="rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold capitalize">{format(monthDate, "MMMM yyyy", { locale: it })}</h2>
        <div className="flex gap-1">
          <Link
            href={`/dottore/agenda?month=${prevMonth}`}
            className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface-hover"
            aria-label="Mese precedente"
          >
            ‹
          </Link>
          <Link
            href={`/dottore/agenda?month=${nextMonth}`}
            className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface-hover"
            aria-label="Mese successivo"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-secondary">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = formatDateKey(day);
          const count = countsByDay.get(key) ?? 0;
          const weekStart = format(startOfWeek(day, { weekStartsOn: 1 }), "yyyy-MM-dd");
          const inCurrentMonth = isSameMonth(day, monthDate);
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <Link
              key={key}
              href={`/dottore/agenda?month=${format(monthDate, "yyyy-MM")}&week=${weekStart}&date=${key}`}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm ${
                isSelected
                  ? "bg-brand text-white"
                  : isToday
                    ? "bg-brand-light text-brand-dark font-semibold"
                    : inCurrentMonth
                      ? "text-foreground hover:bg-surface-hover"
                      : "text-muted hover:bg-surface-hover"
              }`}
            >
              <span>{day.getDate()}</span>
              {count > 0 && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-teal"}`}
                  aria-label={`${count} appuntamenti`}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
