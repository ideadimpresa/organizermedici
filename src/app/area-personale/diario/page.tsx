import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { EntryDeleteButton } from "@/components/entry-delete-button";
import { addOwnDiarioEntry, deleteOwnDiarioEntry } from "../actions";

const PASTO_LABEL: Record<string, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
  giornata: "Diario del giorno",
};

export default async function PatientDiaryPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patientRows } = await supabase.from("patients").select("id").eq("profile_id", user?.id ?? "");
  const patientIds = (patientRows || []).map((p) => p.id);
  const primaryPatientId = patientIds[0];

  const { data: diario } = patientIds.length
    ? await supabase.from("diario_alimentare").select("*").in("patient_id", patientIds).order("data", { ascending: false }).limit(60)
    : { data: [] };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Diario alimentare</h1>
        <p className="mt-1 text-secondary">Il tuo diario personale: annota come è andata la giornata a livello nutrizionale.</p>
      </div>

      {primaryPatientId && (
        <form action={addOwnDiarioEntry.bind(null, primaryPatientId)} className="space-y-3 rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Com&apos;è andata oggi?</h2>
          <input
            name="data"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <input type="hidden" name="pasto" value="giornata" />
          <textarea
            name="contenuto"
            required
            rows={4}
            placeholder="Racconta la tua giornata a tavola: cosa hai mangiato, come ti sei sentito/a, eventuali difficoltà…"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <div>
            <label className="block text-sm font-medium">Come valuti l&apos;aderenza al piano oggi?</label>
            <select name="aderenza" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
              <option value="">— non specificato —</option>
              <option value="Ottima">Ottima</option>
              <option value="Buona">Buona</option>
              <option value="Così così">Così così</option>
              <option value="Difficile">Difficile</option>
            </select>
          </div>
          <button className="w-full rounded-button bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Salva nel diario</button>
        </form>
      )}

      {primaryPatientId && (
        <form action={addOwnDiarioEntry.bind(null, primaryPatientId)} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
          <h3 className="text-sm font-semibold">Aggiungi un pasto specifico (opzionale)</h3>
          <div className="flex gap-2">
            <input
              name="data"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <select name="pasto" required className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
              <option value="colazione">Colazione</option>
              <option value="pranzo">Pranzo</option>
              <option value="cena">Cena</option>
              <option value="spuntino">Spuntino</option>
            </select>
          </div>
          <textarea name="contenuto" required rows={2} placeholder="Cosa hai mangiato" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <button className="w-full rounded-button border border-brand py-2 text-sm font-semibold text-brand hover:bg-brand-light">Aggiungi pasto</button>
        </form>
      )}

      <div className="space-y-3">
        {(diario || []).map((d) => (
          <div
            key={d.id}
            className={`rounded-card border border-border p-4 shadow-card ${d.pasto === "giornata" ? "border-l-4 border-l-teal bg-surface" : "bg-background"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {new Date(d.data).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                  {d.pasto !== "giornata" && <span className="ml-2 text-xs font-normal text-secondary">{PASTO_LABEL[d.pasto]}</span>}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">{d.contenuto}</p>
                {d.aderenza && <p className="mt-2 inline-block rounded-full bg-brand-light px-3 py-1 text-xs text-brand-dark">Aderenza: {d.aderenza}</p>}
              </div>
              <EntryDeleteButton action={deleteOwnDiarioEntry.bind(null, d.id)} />
            </div>
          </div>
        ))}
        {(!diario || diario.length === 0) && (
          <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
            Il tuo diario è vuoto. Scrivi la tua prima voce!
          </p>
        )}
      </div>
    </div>
  );
}
