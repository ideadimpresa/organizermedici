import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { EntryDeleteButton } from "@/components/entry-delete-button";
import { WeightTrendChart } from "@/components/weight-trend-chart";
import { BiaValuesForm } from "@/components/bia-values-form";
import { RefertoBiaCard } from "@/components/referto-bia-card";
import { MealPlanCard } from "@/components/meal-plan-card";
import { MessageThread } from "@/components/message-thread";
import { StatTile } from "@/components/stat-tile";
import { sortPlansByDate, labelPlanRange } from "@/lib/meal-plan";
import { computeStreakDays, computeWeeklyAdherence } from "@/lib/adherence";
import { averageOverLastDays } from "@/lib/activity";
import {
  addMisurazione,
  deleteMisurazione,
  addDiarioEntry,
  deleteDiarioEntry,
  addAllergia,
  deleteAllergia,
  uploadPianoAlimentare,
  deletePianoAlimentare,
  uploadRefertoBia,
  deleteRefertoBia,
  sendMessaggioMedico,
  addAttivitaGiornaliera,
  deleteAttivitaGiornaliera,
  addPatientTag,
  removePatientTag,
} from "./actions";

const PASTO_LABEL: Record<string, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
  giornata: "Diario del giorno",
};

const DOCS_BUCKET = "documenti-pazienti";

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

  const [{ data: misurazioni }, { data: diario }, { data: allergie }, { data: piani }, { data: referti }, { data: messaggi }, { data: dispositivo }, { data: attivita }] =
    await Promise.all([
      supabase.from("misurazioni").select("*").eq("patient_id", id).order("data", { ascending: true }),
      supabase.from("diario_alimentare").select("*").eq("patient_id", id).order("data", { ascending: false }).limit(30),
      supabase.from("allergeni_intolleranze").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
      supabase.from("piani_alimentari").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
      supabase.from("referti_bia").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
      supabase.from("messaggi").select("*").eq("patient_id", id).order("created_at", { ascending: true }),
      supabase.from("dispositivi_wearable").select("*").eq("patient_id", id).maybeSingle(),
      supabase.from("attivita_giornaliera").select("*").eq("patient_id", id).order("data", { ascending: true }).limit(60),
    ]);

  const streakGiorni = computeStreakDays((diario || []).map((d) => d.data));
  const aderenzaSettimanale = computeWeeklyAdherence((diario || []).map((d) => ({ data: d.data, aderenza: d.aderenza })));

  const weightPoints = (misurazioni || [])
    .filter((m) => m.peso_kg != null)
    .map((m) => ({ data: m.data, value: m.peso_kg as number }));

  const stepsPoints = (attivita || []).filter((a) => a.passi != null).map((a) => ({ data: a.data, value: a.passi as number }));
  const passiMedi7gg = averageOverLastDays((attivita || []).map((a) => ({ data: a.data, value: a.passi })), 7);
  const calorieMedie7gg = averageOverLastDays((attivita || []).map((a) => ({ data: a.data, value: a.calorie_totali })), 7);

  const pianiWithUrl = await Promise.all(
    sortPlansByDate(piani || []).map(async (p) => {
      const { data } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(p.file_path, 3600);
      return { ...p, signedUrl: data?.signedUrl ?? null };
    })
  );

  const diarioFotoUrls = new Map<string, string>();
  await Promise.all(
    (diario || [])
      .filter((d) => d.foto_path)
      .map(async (d) => {
        const { data } = await supabase.storage.from("foto-diario").createSignedUrl(d.foto_path as string, 3600);
        if (data?.signedUrl) diarioFotoUrls.set(d.id, data.signedUrl);
      })
  );

  const misurazioniFileUrls = new Map<string, string>();
  await Promise.all(
    (misurazioni || [])
      .filter((m) => m.file_path)
      .map(async (m) => {
        const { data } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(m.file_path as string, 3600);
        if (data?.signedUrl) misurazioniFileUrls.set(m.id, data.signedUrl);
      })
  );

  const refertiWithUrls = await Promise.all(
    (referti || []).map(async (r) => {
      const [{ data: pdfData }, imageUrls] = await Promise.all([
        supabase.storage.from(DOCS_BUCKET).createSignedUrl(r.file_path, 3600),
        Promise.all(
          r.image_paths.map(async (p) => (await supabase.storage.from(DOCS_BUCKET).createSignedUrl(p, 3600)).data?.signedUrl ?? null)
        ),
      ]);
      return { ...r, pdfSignedUrl: pdfData?.signedUrl ?? null, imageSignedUrls: imageUrls.filter((u): u is string => !!u) };
    })
  );

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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(patient.tags || []).map((tag) => (
            <form key={tag} action={removePatientTag.bind(null, id, tag)} className="inline">
              <button className="flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark hover:bg-brand/20">
                {tag} <span aria-hidden>×</span>
              </button>
            </form>
          ))}
          {!(patient.tags || []).includes("GLP-1") && (
            <form action={addPatientTag.bind(null, id)} className="inline">
              <input type="hidden" name="tag" value="GLP-1" />
              <button className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-secondary hover:border-brand hover:text-brand">
                + Percorso GLP-1
              </button>
            </form>
          )}
          <form action={addPatientTag.bind(null, id)} className="inline-flex items-center gap-1">
            <input
              name="tag"
              placeholder="Altro tag…"
              className="w-28 rounded-full border border-border px-3 py-1 text-xs focus:border-brand focus:outline-none"
            />
            <button className="rounded-full border border-border px-2 py-1 text-xs text-secondary hover:bg-surface-hover">+</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <StatTile label="Streak diario" value={String(streakGiorni)} unit={streakGiorni === 1 ? "giorno" : "giorni"} />
        <StatTile
          label="Aderenza (7 gg)"
          value={aderenzaSettimanale != null ? String(aderenzaSettimanale) : "—"}
          unit={aderenzaSettimanale != null ? "%" : undefined}
          subtext={aderenzaSettimanale == null ? "Nessun dato recente" : undefined}
        />
      </div>

      <section>
        <h2 className="font-semibold">Messaggi</h2>
        <div className="mt-3 space-y-3">
          <MessageThread messaggi={messaggi || []} viewAs="medico" />
          <form action={sendMessaggioMedico.bind(null, id)} className="flex gap-2">
            <input
              name="testo"
              required
              placeholder="Scrivi un messaggio al paziente…"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <button className="shrink-0 rounded-button bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
              Invia
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Attività</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Passi medi (7gg)" value={passiMedi7gg != null ? String(passiMedi7gg) : "—"} />
          <StatTile label="Calorie medie (7gg)" value={calorieMedie7gg != null ? String(calorieMedie7gg) : "—"} unit={calorieMedie7gg != null ? "kcal" : undefined} />
          <StatTile
            label="Dispositivo"
            value={dispositivo ? (dispositivo.stato === "attivo" ? "Collegato" : "Inattivo") : "Nessuno"}
            subtext={dispositivo?.modello || undefined}
          />
          <StatTile
            label="Ultima sincronizzazione"
            value={dispositivo?.ultima_sincronizzazione ? new Date(dispositivo.ultima_sincronizzazione).toLocaleDateString("it-IT") : "—"}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
            <WeightTrendChart points={stepsPoints} label="Passi" unit="" />
          </div>
          <form action={addAttivitaGiornaliera.bind(null, id)} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="font-semibold">Inserimento manuale</h3>
            <p className="text-sm text-secondary">In attesa del braccialetto, puoi registrare l&apos;attività a mano.</p>
            <input
              name="data"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input name="passi" type="number" placeholder="Passi" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="distanza_km" type="number" step="0.1" placeholder="Distanza (km)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="calorie_totali" type="number" placeholder="Calorie totali" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="calorie_attive" type="number" placeholder="Calorie attive" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Salva giornata</button>
          </form>
        </div>

        {attivita && attivita.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-card border border-border bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background text-left text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Passi</th>
                  <th className="px-4 py-3 font-medium">Calorie</th>
                  <th className="px-4 py-3 font-medium">Fonte</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {[...attivita].reverse().slice(0, 14).map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{new Date(a.data).toLocaleDateString("it-IT")}</td>
                    <td className="px-4 py-3">{a.passi ?? "—"}</td>
                    <td className="px-4 py-3 text-secondary">{a.calorie_totali ?? "—"}</td>
                    <td className="px-4 py-3 text-secondary">{a.fonte}</td>
                    <td className="px-4 py-3 text-right">
                      <EntryDeleteButton action={deleteAttivitaGiornaliera.bind(null, a.id, id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Andamento peso</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
            <WeightTrendChart points={weightPoints} label="Peso" unit="kg" />
          </div>
          <div className="space-y-6">
            <form action={addMisurazione.bind(null, id)} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="font-semibold">Nuova misurazione manuale</h3>
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

            <BiaValuesForm patientId={id} />
          </div>
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
                    <td className="px-4 py-3 text-secondary">
                      {m.fonte}
                      {misurazioniFileUrls.has(m.id) && (
                        <>
                          {" · "}
                          <a href={misurazioniFileUrls.get(m.id)} target="_blank" className="text-brand hover:underline">
                            PDF
                          </a>
                        </>
                      )}
                    </td>
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
        <h2 className="font-semibold">Referti BIA</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {refertiWithUrls.map((r) => (
              <RefertoBiaCard
                key={r.id}
                dataEsame={r.data_esame}
                note={r.note}
                imageSignedUrls={r.imageSignedUrls}
                pdfSignedUrl={r.pdfSignedUrl}
                actions={<EntryDeleteButton action={deleteRefertoBia.bind(null, r.id, id, r.file_path, r.image_paths)} />}
              />
            ))}
            {refertiWithUrls.length === 0 && (
              <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
                Nessun referto caricato.
              </p>
            )}
          </div>
          <form action={uploadRefertoBia.bind(null, id)} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="font-semibold">Carica referto</h3>
            <p className="text-sm text-secondary">
              Il PDF viene mostrato come immagine, senza dover inserire alcun dato.
            </p>
            <input
              name="data_esame"
              type="date"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <input name="file" type="file" accept="application/pdf" required className="text-sm" />
            <textarea name="note" placeholder="Note" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Carica referto</button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Piani alimentari</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-2">
            {pianiWithUrl.map((p) => (
              <MealPlanCard
                key={p.id}
                titolo={p.titolo}
                contentText={p.content_text}
                note={p.note}
                signedUrl={p.signedUrl}
                rangeLabel={labelPlanRange(p)}
                actions={<EntryDeleteButton action={deletePianoAlimentare.bind(null, p.id, id, p.file_path)} />}
              />
            ))}
            {pianiWithUrl.length === 0 && (
              <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
                Nessun piano alimentare caricato.
              </p>
            )}
          </div>
          <form action={uploadPianoAlimentare.bind(null, id)} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="font-semibold">Carica piano alimentare</h3>
            <input name="titolo" required placeholder="Titolo (es. Dieta autunno 2026)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <div className="flex gap-2">
              <input name="data_inizio" type="date" className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="data_fine" type="date" className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            <input name="file" type="file" accept="application/pdf" required className="text-sm" />
            <textarea name="note" placeholder="Note" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Carica PDF</button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Diario alimentare</h2>
        {(patient.tags || []).includes("GLP-1") && (
          <p className="mt-2 rounded-card border border-border border-l-4 border-l-teal bg-brand-light px-4 py-2 text-xs text-brand-dark">
            Percorso GLP-1: monitora apporto proteico, sazietà precoce/nausea e idratazione nelle voci del paziente.
          </p>
        )}
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-2">
            {(diario || []).map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-3 rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
                <div className="flex gap-3">
                  {diarioFotoUrls.has(d.id) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={diarioFotoUrls.get(d.id)} alt="Foto del pasto" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-medium">
                      {new Date(d.data).toLocaleDateString("it-IT")} · {PASTO_LABEL[d.pasto]}
                    </p>
                    <p className="text-sm text-secondary">{d.contenuto}</p>
                    {d.aderenza && <p className="mt-1 text-xs text-muted">Aderenza: {d.aderenza}</p>}
                    {(d.calorie_stimate != null || d.proteine_g != null) && (
                      <p className="mt-1 text-xs text-muted">
                        Stima AI: {d.calorie_stimate != null ? `${d.calorie_stimate} kcal` : ""}
                        {d.proteine_g != null ? ` · ${d.proteine_g}g proteine` : ""}
                        {d.carboidrati_g != null ? ` · ${d.carboidrati_g}g carb.` : ""}
                        {d.grassi_g != null ? ` · ${d.grassi_g}g grassi` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <EntryDeleteButton action={deleteDiarioEntry.bind(null, d.id, id, d.foto_path)} />
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
            <textarea name="contenuto" placeholder="Cosa è stato mangiato (opzionale se carichi una foto)" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <div>
              <label className="block text-sm font-medium">Foto del pasto (opzionale)</label>
              <input name="foto" type="file" accept="image/*" className="mt-1 text-sm" />
              <p className="mt-1 text-xs text-muted">Se carichi una foto, l&apos;AI stima automaticamente calorie e macronutrienti.</p>
            </div>
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
