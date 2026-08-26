import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  cancelled: "Annullato",
  completed: "Completato",
  no_show: "Assente",
};

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string }>;
}) {
  const { doctorId } = await searchParams;
  const supabase = await createClient();

  const { data: doctors } = await supabase.from("doctors").select("id, display_name").order("display_name");

  let query = supabase
    .from("appointments")
    .select("id, starts_at, mode, status, doctors(display_name), patients(full_name), services(name)")
    .order("starts_at", { ascending: false })
    .limit(200);

  if (doctorId) query = query.eq("doctor_id", doctorId);

  const { data: appointments } = await query;

  return (
    <div>
      <h1 className="text-2xl font-bold">Agenda — tutti i dottori</h1>
      <p className="mt-1 text-secondary">
        Vista di sola supervisione. La gestione (conferma/annulla) resta nell&apos;agenda del singolo dottore.
      </p>

      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <select
          name="doctorId"
          defaultValue={doctorId || ""}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">Tutti i dottori</option>
          {(doctors || []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.display_name}
            </option>
          ))}
        </select>
        <button className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-hover">Filtra</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background text-left text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Dottore</th>
              <th className="px-4 py-3 font-medium">Paziente</th>
              <th className="px-4 py-3 font-medium">Prestazione</th>
              <th className="px-4 py-3 font-medium">Modalità</th>
              <th className="px-4 py-3 font-medium">Stato</th>
            </tr>
          </thead>
          <tbody>
            {(appointments || []).map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{new Date(a.starts_at).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-4 py-3">{(a.doctors as unknown as { display_name: string })?.display_name}</td>
                <td className="px-4 py-3">{(a.patients as unknown as { full_name: string })?.full_name}</td>
                <td className="px-4 py-3 text-secondary">{(a.services as unknown as { name: string })?.name}</td>
                <td className="px-4 py-3 text-secondary">{a.mode === "online" ? "Online" : "In studio"}</td>
                <td className="px-4 py-3 text-secondary">{STATUS_LABEL[a.status]}</td>
              </tr>
            ))}
            {(!appointments || appointments.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-secondary">
                  Nessun appuntamento trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
