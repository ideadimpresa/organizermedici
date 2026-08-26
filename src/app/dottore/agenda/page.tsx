import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AppointmentActions } from "@/components/appointment-actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  cancelled: "Annullato",
  completed: "Completato",
  no_show: "Assente",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-black/10 text-black/60",
  no_show: "bg-red-100 text-red-700",
};

export default async function AgendaPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, mode, status, meeting_link, patients(full_name, email, phone), services(name)")
    .eq("doctor_id", user?.doctorId ?? "")
    .order("starts_at", { ascending: true })
    .gte("starts_at", subDays(new Date(), 1).toISOString())
    .limit(100);

  const grouped = new Map<string, typeof appointments>();
  for (const appt of appointments || []) {
    const day = new Date(appt.starts_at).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(appt);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Agenda</h1>
      <p className="mt-1 text-black/60">I tuoi prossimi appuntamenti</p>

      <div className="mt-6 space-y-8">
        {grouped.size === 0 && (
          <p className="rounded-xl border border-dashed border-black/20 bg-white p-8 text-center text-black/50">
            Nessun appuntamento in programma.
          </p>
        )}
        {Array.from(grouped.entries()).map(([day, appts]) => (
          <div key={day}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50">{day}</h2>
            <div className="space-y-3">
              {(appts || []).map((appt) => (
                <div key={appt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                  <div>
                    <p className="font-medium">
                      {new Date(appt.starts_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                      {(appt.patients as unknown as { full_name: string })?.full_name}
                    </p>
                    <p className="text-sm text-black/60">
                      {(appt.services as unknown as { name: string })?.name} ·{" "}
                      {appt.mode === "online" ? "Consulenza online" : "In studio"}
                    </p>
                    {appt.mode === "online" && appt.meeting_link && (
                      <a href={appt.meeting_link} target="_blank" className="text-sm text-brand hover:underline">
                        Link videochiamata
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[appt.status]}`}>
                      {STATUS_LABEL[appt.status]}
                    </span>
                    <AppointmentActions id={appt.id} status={appt.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
