import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { EntryDeleteButton } from "@/components/entry-delete-button";
import { WeightTrendChart } from "@/components/weight-trend-chart";
import { addMisurazione, deleteMisurazione, addDiarioEntry, deleteDiarioEntry, addAllergia, deleteAllergia } from "./actions";

const PASTO_LABEL: Record<string, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
};

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("doctor_id", user?.doctorId ?? "")
    .single();
  if (!patient) notFound();

  const [{ data: misurazioni }, { data: diario }, { data: allergie }] = await Promise.all([
    supabase.from("misurazioni").select("*").eq("patient_id", id).order("data", { ascending: true }),
    supabase.from("diario_alimentare").select("*").eq("patient_id", id).order("data", { ascending: false }).limit(30),
    supabase.from("allergeni_intolleranze").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
  ]);

  const weightPoints = (misurazioni || [])
    .filter((m) => m.peso_kg != null)
    .map((m) => ({ data: m.data, value: m.peso_kg as number }));

  return (
    <div className="space-y-10 pb-10">
      <div>
        <Link href="/dottore/pazienti" className="text-sm text-brand hover:underline">
          ‹ Torna alla lista pazienti
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{patient.full_name}</h1>
        <p className="mt-1 text-secondary">
          {patient.email}
          {patient.phone ? ` · ${patient.phone}` : ""}
        </p>
      </div>

      <section>
        <h2 className="font-semibold">Andamento peso</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
            <WeightTrendChart points={weightPoints} label="Peso" unit="kg" />
          </div>
          <form action={addMisurazione.bind(null, id)} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="font-semibold">Nuova misurazione</h3>
            <input
              name="data"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input name="peso_kg" type="number" step="0.1" placeholder="Peso (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="massa_grassa_perc" type="number" step="0.1" placeholder="Massa grassa (%)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="massa_grassa_kg" type="number" step="0.1" placeholder="Massa grassa (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="massa_magra_kg" type="number" step="0.1" placeholder="Massa magra (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="massa_muscolare_kg" type="number" step="0.1" placeholder="Massa muscolare (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="acqua_perc" type="number" step="0.1" placeholder="Acqua (%)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="acqua_kg" type="number" step="0.1" placeholder="Acqua (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            <textarea name="note" placeholder="Note" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Salva misurazione</button>
          </form>
        </div>

        {misurazioni && misurazioni.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-card border border-border bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background text-left text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Peso</th>
                  <th className="px-4 py-3 font-medium">Massa grassa</th>
                  <th className="px-4 py-3 font-medium">Massa magra</th>
                  <th className="px-4 py-3 font-medium">Fonte</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {[...misurazioni].reverse().map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{new Date(m.data).toLocaleDateString("it-IT")}</td>
                    <td className="px-4 py-3">{m.peso_kg != null ? `${m.peso_kg} kg` : "—"}</td>
                    <td className="px-4 py-3 text-secondary">
                      {m.massa_grassa_kg != null ? `${m.massa_grassa_kg} kg` : m.massa_grassa_perc != null ? `${m.massa_grassa_perc}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-secondary">{m.massa_magra_kg != null ? `${m.massa_magra_kg} kg` : "—"}</td>
                    <td className="px-4 py-3 text-secondary">{m.fonte}</td>
                    <td className="px-4 py-3 text-right">
                      <EntryDeleteButton action={deleteMisurazione.bind(null, m.id, id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Diario alimentare</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-2">
            {(diario || []).map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-3 rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
                <div>
                  <p className="font-medium">
                    {new Date(d.data).toLocaleDateString("it-IT")} · {PASTO_LABEL[d.pasto]}
                  </p>
                  <p className="text-sm text-secondary">{d.contenuto}</p>
                  {d.aderenza && <p className="mt-1 text-xs text-muted">Aderenza: {d.aderenza}</p>}
                </div>
                <EntryDeleteButton action={deleteDiarioEntry.bind(null, d.id, id)} />
              </div>
            ))}
            {(!diario || diario.length === 0) && (
              <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
                Nessuna voce nel diario alimentare.
              </p>
            )}
          </div>
          <form action={addDiarioEntry.bind(null, id)} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="font-semibold">Nuova voce</h3>
            <input
              name="data"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <select name="pasto" required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
              <option value="colazione">Colazione</option>
              <option value="pranzo">Pranzo</option>
              <option value="cena">Cena</option>
              <option value="spuntino">Spuntino</option>
            </select>
            <textarea name="contenuto" required placeholder="Cosa è stato mangiato" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="aderenza" placeholder="Aderenza (es. buona, parziale)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <textarea name="note" placeholder="Note" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Aggiungi voce</button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Allergie e intolleranze</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-2">
            {(allergie || []).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
                <div>
                  <p className="font-medium">
                    {a.sostanza} <span className="text-xs font-normal text-secondary">({a.tipo === "allergene" ? "allergene" : "intolleranza"})</span>
                  </p>
                  {a.gravita && <p className="text-sm text-secondary">Gravità: {a.gravita}</p>}
                </div>
                <EntryDeleteButton action={deleteAllergia.bind(null, a.id, id)} />
              </div>
            ))}
            {(!allergie || allergie.length === 0) && (
              <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
                Nessuna allergia o intolleranza registrata.
              </p>
            )}
          </div>
          <form action={addAllergia.bind(null, id)} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="font-semibold">Nuova voce</h3>
            <select name="tipo" required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
              <option value="allergene">Allergene</option>
              <option value="intolleranza">Intolleranza</option>
            </select>
            <input name="sostanza" required placeholder="Sostanza (es. lattosio)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="gravita" placeholder="Gravità (opzionale)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <textarea name="note" placeholder="Note" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Aggiungi voce</button>
          </form>
        </div>
      </section>
    </div>
  );
}
