import Link from "next/link";
import { addDays, addWeeks, format, parseISO, startOfWeek, subWeeks } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AppointmentActions } from "@/components/appointment-actions";
import { RescheduleAppointment } from "@/components/reschedule-appointment";
import { AgendaCalendar } from "@/components/agenda-calendar";
import { NewAppointmentForm } from "@/components/new-appointment-form";
import { buildMonthGrid, formatDateKey } from "@/lib/calendar";

const STATUS_LABEL: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  cancelled: "Annullato",
  completed: "Completato",
  no_show: "Assente",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-warning-light text-warning",
  confirmed: "bg-success-light text-success",
  cancelled: "bg-error-light text-error",
  completed: "bg-border text-secondary",
  no_show: "bg-error-light text-error",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; week?: string; date?: string }>;
}) {
  const { month, week, date } = await searchParams;
  const user = await getCurrentUser();
  const supabase = await createClient();

  const monthDate = month ? parseISO(`${month}-01`) : new Date();
  const selectedDate = date ? parseISO(date) : new Date();
  const weekStart = week ? parseISO(week) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  const gridDays = buildMonthGrid(monthDate);
  const gridStart = gridDays[0];
  const gridEnd = addDays(gridDays[gridDays.length - 1], 1);

  const [{ data: monthAppointments }, { data: weekAppointments }, { data: patients }, { data: services }, { data: addresses }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("starts_at")
        .eq("doctor_id", user?.doctorId ?? "")
        .neq("status", "cancelled")
        .gte("starts_at", gridStart.toISOString())
        .lt("starts_at", gridEnd.toISOString()),
      supabase
        .from("appointments")
        .select("id, starts_at, mode, status, meeting_link, patients(full_name, email, phone), services(name)")
        .eq("doctor_id", user?.doctorId ?? "")
        .gte("starts_at", weekStart.toISOString())
        .lt("starts_at", weekEnd.toISOString())
        .order("starts_at", { ascending: true }),
      supabase.from("patients").select("id, full_name").eq("doctor_id", user?.doctorId ?? "").order("full_name"),
      supabase.from("services").select("id, name, duration_minutes, mode").eq("doctor_id", user?.doctorId ?? "").eq("is_active", true),
      supabase.from("addresses").select("id, label, city").eq("doctor_id", user?.doctorId ?? "").eq("is_active", true),
    ]);

  const countsByDay = new Map<string, number>();
  for (const appt of monthAppointments || []) {
    const key = formatDateKey(new Date(appt.starts_at));
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const grouped = new Map<string, typeof weekAppointments>();
  for (const appt of weekAppointments || []) {
    const day = format(new Date(appt.starts_at), "EEEE d MMMM", { locale: it });
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(appt);
  }

  const prevWeek = format(subWeeks(weekStart, 1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(weekStart, 1), "yyyy-MM-dd");
  const currentMonthParam = format(monthDate, "yyyy-MM");

  return (
    <div>
      <h1 className="text-2xl font-bold">Agenda</h1>
      <p className="mt-1 text-secondary">Calendario, nuovi appuntamenti e riepilogo settimanale</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgendaCalendar monthDate={monthDate} countsByDay={countsByDay} selectedDate={selectedDate} />
        </div>
        <NewAppointmentForm
          patients={patients || []}
          services={services || []}
          addresses={addresses || []}
          defaultDate={date}
        />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Settimana del {format(weekStart, "d MMMM", { locale: it })} – {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: it })}
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/dottore/agenda?month=${currentMonthParam}&week=${prevWeek}`}
              className="rounded-button border border-border px-3 py-1.5 text-sm hover:bg-surface-hover"
            >
              ‹ Settimana prec.
            </Link>
            <Link
              href={`/dottore/agenda?month=${currentMonthParam}&week=${nextWeek}`}
              className="rounded-button border border-border px-3 py-1.5 text-sm hover:bg-surface-hover"
            >
              Settimana succ. ›
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-8">
          {grouped.size === 0 && (
            <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
              Nessun appuntamento questa settimana.
            </p>
          )}
          {Array.from(grouped.entries()).map(([day, appts]) => (
            <div key={day}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">{day}</h3>
              <div className="space-y-3">
                {(appts || []).map((appt) => (
                  <div key={appt.id} className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
                    <div>
                      <p className="font-medium">
                        {new Date(appt.starts_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                        {(appt.patients as unknown as { full_name: string })?.full_name}
                      </p>
                      <p className="text-sm text-secondary">
                        {(appt.services as unknown as { name: string })?.name} ·{" "}
                        {appt.mode === "online" ? "Consulenza online" : "In studio"}
                      </p>
                      {appt.mode === "online" && appt.meeting_link && (
                        <a href={appt.meeting_link} target="_blank" className="text-sm text-brand hover:underline">
                          Link videochiamata
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[appt.status]}`}>
                        {STATUS_LABEL[appt.status]}
                      </span>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {appt.status !== "cancelled" && appt.status !== "completed" && (
                          <RescheduleAppointment id={appt.id} currentStartsAt={appt.starts_at} />
                        )}
                        <AppointmentActions id={appt.id} status={appt.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
