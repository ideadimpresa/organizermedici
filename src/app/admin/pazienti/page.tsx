import { createClient } from "@/lib/supabase/server";

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string }>;
}) {
  const { doctorId } = await searchParams;
  const supabase = await createClient();

  const { data: doctors } = await supabase.from("doctors").select("id, display_name").order("display_name");

  let query = supabase
    .from("patients")
    .select("id, full_name, email, phone, source, created_at, doctors(display_name)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (doctorId) query = query.eq("doctor_id", doctorId);

  const { data: patients } = await query;

  return (
    <div>
      <h1 className="text-2xl font-bold">Pazienti — tutti i dottori</h1>
      <p className="mt-1 text-black/60">
        Vista di supervisione per assistenza e controllo qualità. Ogni dottore resta titolare dei dati dei propri
        pazienti: questi dati non vanno condivisi con terzi al di fuori dell&apos;erogazione del servizio.
      </p>

      <form className="mt-4 flex gap-2" method="get">
        <select
          name="doctorId"
          defaultValue={doctorId || ""}
          className="rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">Tutti i dottori</option>
          {(doctors || []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.display_name}
            </option>
          ))}
        </select>
        <button className="rounded-lg border border-black/20 px-4 py-2 text-sm hover:bg-black/5">Filtra</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-black/10 bg-black/[0.02] text-left text-black/50">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Contatti</th>
              <th className="px-4 py-3 font-medium">Dottore</th>
              <th className="px-4 py-3 font-medium">Origine</th>
              <th className="px-4 py-3 font-medium">Creato il</th>
            </tr>
          </thead>
          <tbody>
            {(patients || []).map((p) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium">{p.full_name}</td>
                <td className="px-4 py-3 text-black/60">
                  {p.email}
                  {p.phone ? ` · ${p.phone}` : ""}
                </td>
                <td className="px-4 py-3 text-black/60">{(p.doctors as unknown as { display_name: string })?.display_name}</td>
                <td className="px-4 py-3 text-black/50">
                  {p.source === "manual" ? "Manuale" : p.source === "import" ? "Import" : "Prenotazione"}
                </td>
                <td className="px-4 py-3 text-black/50">{new Date(p.created_at).toLocaleDateString("it-IT")}</td>
              </tr>
            ))}
            {(!patients || patients.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-black/50">
                  Nessun paziente trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
