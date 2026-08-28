import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "@/app/(auth)/actions";
import { EntryDeleteButton } from "@/components/entry-delete-button";
import { WeightTrendChart } from "@/components/weight-trend-chart";
import { addOwnDiarioEntry, deleteOwnDiarioEntry, addOwnAllergia, deleteOwnAllergia } from "./actions";

const PASTO_LABEL: Record<string, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
};

const DOCS_BUCKET = "documenti-pazienti";

export default async function PatientAreaPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patientRows } = await supabase.from("patients").select("id").eq("profile_id", user?.id ?? "");
  const patientIds = (patientRows || []).map((p) => p.id);
  const primaryPatientId = patientIds[0];

  const [{ data: appointments }, { data: misurazioni }, { data: diario }, { data: allergie }, { data: piani }] = patientIds.length
    ? await Promise.all([
        supabase
          .from("appointments")
          .select("id, starts_at, mode, status, meeting_link, doctors(display_name, slug), services(name)")
          .in("patient_id", patientIds)
          .order("starts_at", { ascending: true }),
        supabase.from("misurazioni").select("*").in("patient_id", patientIds).order("data", { ascending: true }),
        supabase.from("diario_alimentare").select("*").in("patient_id", patientIds).order("data", { ascending: false }).limit(30),
        supabase.from("allergeni_intolleranze").select("*").in("patient_id", patientIds).order("created_at", { ascending: false }),
        supabase.from("piani_alimentari").select("*").in("patient_id", patientIds).order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const weightPoints = (misurazioni || [])
    .filter((m) => m.peso_kg != null)
    .map((m) => ({ data: m.data, value: m.peso_kg as number }));

  const pianiWithUrl = await Promise.all(
    (piani || []).map(async (p) => {
      const { data } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(p.file_path, 3600);
      return { ...p, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">La mia area</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/account/password" className="text-secondary hover:text-foreground">
            Cambia password
          </Link>
          <form action={logout}>
            <button className="text-secondary hover:text-foreground">Esci</button>
          </form>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold">Appuntamenti</h2>
        <div className="mt-3 space-y-3">
          {(appointments || []).map((a) => {
            const doctor = a.doctors as unknown as { display_name: string; slug: string };
            const service = a.services as unknown as { name: string } | null;
            return (
              <div key={a.id} className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
                <p className="font-medium">
                  {new Date(a.starts_at).toLocaleString("it-IT", { dateStyle: "full", timeStyle: "short" })}
                </p>
                <p className="text-sm text-secondary">
                  {doctor.display_name} · {service?.name} · {a.mode === "online" ? "Online" : "In studio"}
                </p>
                {a.mode === "online" && a.meeting_link && (
                  <a href={a.meeting_link} target="_blank" className="text-sm text-brand hover:underline">
                    Link videochiamata
                  </a>
                )}
              </div>
            );
          })}
          {(!appointments || appointments.length === 0) && (
            <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
              Nessun appuntamento prenotato.{" "}
              <Link href="/dottori" className="text-brand hover:underline">
                Trova un nutrizionista
              </Link>
            </p>
          )}
        </div>
      </section>

      {primaryPatientId && (
        <>
          <section className="mt-10">
            <h2 className="font-semibold">Andamento peso</h2>
            <div className="mt-3 rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
              <WeightTrendChart points={weightPoints} label="Peso" unit="kg" />
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-semibold">Piani alimentari</h2>
            <div className="mt-3 space-y-2">
              {pianiWithUrl.map((p) => (
                <details key={p.id} className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{p.titolo}</p>
                      <p className="text-sm text-secondary">
                        {p.data_inizio ? new Date(p.data_inizio).toLocaleDateString("it-IT") : "—"}
                        {p.data_fine ? ` – ${new Date(p.data_fine).toLocaleDateString("it-IT")}` : ""}
                      </p>
                    </div>
                    {p.signedUrl && (
                      <a href={p.signedUrl} target="_blank" className="shrink-0 text-sm text-brand hover:underline">
                        Apri PDF
                      </a>
                    )}
                  </summary>
                  {p.note && <p className="mt-3 text-sm text-secondary">{p.note}</p>}
                  {p.content_text && (
                    <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-background p-3 text-xs text-secondary">{p.content_text}</pre>
                  )}
                </details>
              ))}
              {pianiWithUrl.length === 0 && (
                <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
                  Nessun piano alimentare caricato dal tuo nutrizionista.
                </p>
              )}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-semibold">Diario alimentare</h2>
            <div className="mt-3 space-y-2">
              {(diario || []).map((d) => (
                <div key={d.id} className="flex items-start justify-between gap-3 rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
                  <div>
                    <p className="font-medium">
                      {new Date(d.data).toLocaleDateString("it-IT")} · {PASTO_LABEL[d.pasto]}
                    </p>
                    <p className="text-sm text-secondary">{d.contenuto}</p>
                    {d.aderenza && <p className="mt-1 text-xs text-muted">Aderenza: {d.aderenza}</p>}
                  </div>
                  <EntryDeleteButton action={deleteOwnDiarioEntry.bind(null, d.id)} />
                </div>
              ))}
              {(!diario || diario.length === 0) && (
                <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
                  Nessuna voce nel diario alimentare.
                </p>
              )}
            </div>
            <form action={addOwnDiarioEntry.bind(null, primaryPatientId)} className="mt-4 space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="font-semibold">Aggiungi voce</h3>
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
              <textarea name="contenuto" required placeholder="Cosa hai mangiato" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="aderenza" placeholder="Aderenza (es. buona, parziale)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Aggiungi voce</button>
            </form>
          </section>

          <section className="mt-10">
            <h2 className="font-semibold">Allergie e intolleranze</h2>
            <div className="mt-3 space-y-2">
              {(allergie || []).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
                  <div>
                    <p className="font-medium">
                      {a.sostanza} <span className="text-xs font-normal text-secondary">({a.tipo === "allergene" ? "allergene" : "intolleranza"})</span>
                    </p>
                    {a.gravita && <p className="text-sm text-secondary">Gravità: {a.gravita}</p>}
                  </div>
                  <EntryDeleteButton action={deleteOwnAllergia.bind(null, a.id)} />
                </div>
              ))}
              {(!allergie || allergie.length === 0) && (
                <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
                  Nessuna allergia o intolleranza registrata.
                </p>
              )}
            </div>
            <form action={addOwnAllergia.bind(null, primaryPatientId)} className="mt-4 space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="font-semibold">Aggiungi voce</h3>
              <select name="tipo" required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
                <option value="allergene">Allergene</option>
                <option value="intolleranza">Intolleranza</option>
              </select>
              <input name="sostanza" required placeholder="Sostanza (es. lattosio)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="gravita" placeholder="Gravità (opzionale)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Aggiungi voce</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
