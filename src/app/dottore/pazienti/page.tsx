import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addPatient } from "./actions";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const supabase = await createClient();

  let query = supabase
    .from("patients")
    .select("id, full_name, email, phone, source, created_at")
    .eq("doctor_id", user?.doctorId ?? "")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("full_name", `%${q}%`);

  const { data: patients } = await query.limit(200);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pazienti</h1>
        <Link href="/dottore/pazienti/importa" className="rounded-button border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light">
          Importa da file
        </Link>
      </div>

      <form className="mt-4 flex gap-2" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cerca per nome…"
          className="w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <button className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-hover">Cerca</button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background text-left text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Contatti</th>
                <th className="px-4 py-3 font-medium">Origine</th>
              </tr>
            </thead>
            <tbody>
              {(patients || []).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{p.full_name}</td>
                  <td className="px-4 py-3 text-secondary">
                    {p.email}
                    {p.phone ? ` · ${p.phone}` : ""}
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {p.source === "manual" ? "Manuale" : p.source === "import" ? "Import" : "Prenotazione"}
                  </td>
                </tr>
              ))}
              {(!patients || patients.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-secondary">
                    Nessun paziente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold">Aggiungi paziente</h2>
          <form action={addPatient} className="mt-4 space-y-3">
            <input name="full_name" required placeholder="Nome e cognome" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="email" type="email" placeholder="Email" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="phone" placeholder="Telefono" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="fiscal_code" placeholder="Codice fiscale (opzionale)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <textarea name="notes" placeholder="Note" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Aggiungi</button>
          </form>
        </div>
      </div>
    </div>
  );
}
