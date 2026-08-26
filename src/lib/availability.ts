import { addMinutes, isBefore, setHours, setMinutes, setSeconds, startOfDay } from "date-fns";
import type { Database } from "@/lib/types/database";

type Rule = Database["public"]["Tables"]["availability_rules"]["Row"];
type Exception = Database["public"]["Tables"]["availability_exceptions"]["Row"];
type Appointment = Pick<Database["public"]["Tables"]["appointments"]["Row"], "starts_at" | "ends_at" | "status">;

export interface Slot {
  start: Date;
  end: Date;
  mode: "studio" | "online";
  addressId: string | null;
}

function timeToDate(day: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  return setSeconds(setMinutes(setHours(startOfDay(day), h), m), 0);
}

/**
 * Computes bookable slots for a given day from weekly rules, minus
 * one-off exceptions (closures) and already-booked appointments.
 */
export function computeSlotsForDay(params: {
  day: Date;
  rules: Rule[];
  exceptions: Exception[];
  existingAppointments: Appointment[];
  now?: Date;
}): Slot[] {
  const { day, rules, exceptions, existingAppointments } = params;
  const now = params.now ?? new Date();
  const weekday = day.getDay();

  const dayIsFullyBlocked = exceptions.some(
    (e) => e.is_blocked && e.date === formatDate(day) && !e.start_time && !e.end_time
  );
  if (dayIsFullyBlocked) return [];

  const dayRules = rules.filter((r) => r.is_active && r.weekday === weekday);
  const slots: Slot[] = [];

  for (const rule of dayRules) {
    let cursor = timeToDate(day, rule.start_time);
    const ruleEnd = timeToDate(day, rule.end_time);

    while (isBefore(addMinutes(cursor, rule.slot_duration_minutes), addMinutes(ruleEnd, 1))) {
      const slotStart = cursor;
      const slotEnd = addMinutes(cursor, rule.slot_duration_minutes);

      const blockedByException = exceptions.some((e) => {
        if (e.date !== formatDate(day) || !e.is_blocked || !e.start_time || !e.end_time) return false;
        const exStart = timeToDate(day, e.start_time);
        const exEnd = timeToDate(day, e.end_time);
        return slotStart < exEnd && slotEnd > exStart;
      });

      const overlapsAppointment = existingAppointments.some((a) => {
        if (a.status === "cancelled") return false;
        const aStart = new Date(a.starts_at);
        const aEnd = new Date(a.ends_at);
        return slotStart < aEnd && slotEnd > aStart;
      });

      if (!blockedByException && !overlapsAppointment && isBefore(now, slotStart)) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          mode: rule.mode,
          addressId: rule.address_id,
        });
      }

      cursor = slotEnd;
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
