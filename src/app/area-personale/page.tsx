import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { StatTile } from "@/components/stat-tile";
import { WeightTrendChart } from "@/components/weight-trend-chart";
import { computeStreakDays, computeWeeklyAdherence } from "@/lib/adherence";
import { averageOverLastDays } from "@/lib/activity";

const PASTO_LABEL: Record<string, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
  giornata: "Diario del giorno",
};

export default async function PatientDashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patientRows } = await supabase.from("patients").select("id").eq("profile_id", user?.id ?? "");
  const patientIds = (patientRows || []).map((p) => p.id);

  const [{ data: nextAppointments }, { data: misurazioni }, { data: allergie }, { data: diarioRecent }, { data: piani }, { data: referti }, { data: lastMessaggio }, { data: attivitaRecent }] =
    patientIds.length
      ? await Promise.all([
          supabase
            .from("appointments")
            .select("id, starts_at, mode, meeting_link, doctors(display_name)")
            .in("patient_id", patientIds)
            .neq("status", "cancelled")
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
            .limit(10),
          supabase.from("misurazioni").select("*").in("patient_id", patientIds).order("data", { ascending: true }),
          supabase.from("allergeni_intolleranze").select("id").in("patient_id", patientIds),
          supabase
            .from("diario_alimentare")
            .select("*")
            .in("patient_id", patientIds)
            .order("data", { ascending: false })
            .limit(35),
          supabase.from("piani_alimentari").select("id, titolo, data_inizio, data_fine").in("patient_id", patientIds).order("created_at", { ascending: false }).limit(1),
          supabase.from("referti_bia").select("id, data_esame").in("patient_id", patientIds).order("created_at", { ascending: false }).limit(1),
          supabase.from("messaggi").select("*").in("patient_id", patientIds).order("created_at", { ascending: false }).limit(1),
          supabase.from("attivita_giornaliera").select("data, passi, calorie_totali").in("patient_id", patientIds).order("data", { ascending: false }).limit(7),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const weightPoints = (misurazioni || []).filter((m) => m.peso_kg != null).map((m) => ({ data: m.data, value: m.peso_kg as number }));
  const fatPercPoints = (misurazioni || []).filter((m) => m.massa_grassa_perc != null).map((m) => ({ data: m.data, value: m.massa_grassa_perc as number }));

  const latestWeight = weightPoints[weightPoints.length - 1];
  const latestFatPerc = fatPercPoints[fatPercPoints.length - 1];
  const nextAppointment = (nextAppointments || [])[0];
  const nextAppointmentDoctor = nextAppointment?.doctors as unknown as { display_name: string } | undefined;
  const lastDiarioEntry = (diarioRecent || [])[0];
  const activePlan = (piani || [])[0];
  const lastReferto = (referti || [])[0];
  const streakGiorni = computeStreakDays((diarioRecent || []).map((d) => d.data));
  const aderenzaSettimanale = computeWeeklyAdherence((diarioRecent || []).map((d) => ({ data: d.data, aderenza: d.aderenza })));
  const ultimoMessaggio = (lastMessaggio || [])[0];
  const passiMedi7gg = averageOverLastDays((attivitaRecent || []).map((a) => ({ data: a.data, value: a.passi })), 7);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Ciao{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}</h1>
        <p className="mt-1 text-secondary">Ecco il riepilogo del tuo percorso.</p>
      </div>

      {patientIds.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
          Nessun dato disponibile.{" "}
          <Link href="/dottori" className="text-brand hover:underline">
            Trova un nutrizionista
          </Link>
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatTile
              label="Peso attuale"
              value={latestWeight ? String(latestWeight.value) : "—"}
              unit={latestWeight ? "kg" : undefined}
              subtext={latestWeight ? new Date(latestWeight.data).toLocaleDateString("it-IT") : "Nessuna misurazione"}
              trend={weightPoints.slice(-8).map((p) => p.value)}
            />
            <StatTile
              label="Massa grassa"
              value={latestFatPerc ? String(latestFatPerc.value) : "—"}
              unit={latestFatPerc ? "%" : undefined}
              subtext={latestFatPerc ? new Date(latestFatPerc.data).toLocaleDateString("it-IT") : "Nessun dato"}
              trend={fatPercPoints.slice(-8).map((p) => p.value)}
            />
            <StatTile
              label="Prossimo appuntamento"
              value={nextAppointment ? new Date(nextAppointment.starts_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "—"}
              subtext={
                nextAppointment
                  ? `${nextAppointmentDoctor?.display_name ?? ""} · ${new Date(nextAppointment.starts_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`
                  : "Nessuno programmato"
              }
            />
            <StatTile label="Allergie e intolleranze" value={String((allergie || []).length)} subtext="registrate" />
            <StatTile
              label="Streak diario"
              value={String(streakGiorni)}
              unit={streakGiorni === 1 ? "giorno" : "giorni"}
              subtext={streakGiorni > 0 ? "di fila 🔥" : "inizia oggi"}
            />
            <StatTile
              label="Aderenza (7 gg)"
              value={aderenzaSettimanale != null ? String(aderenzaSettimanale) : "—"}
              unit={aderenzaSettimanale != null ? "%" : undefined}
              subtext={aderenzaSettimanale == null ? "Nessun dato recente" : undefined}
            />
            <StatTile
              label="Passi medi (7gg)"
              value={passiMedi7gg != null ? String(passiMedi7gg) : "—"}
              subtext={passiMedi7gg == null ? "Nessun braccialetto collegato" : undefined}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
              <h2 className="font-semibold">Andamento peso</h2>
              <div className="mt-3">
                <WeightTrendChart points={weightPoints} label="Peso" unit="kg" />
              </div>
            </div>
            <div className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
              <h2 className="font-semibold">Andamento massa grassa</h2>
              <div className="mt-3">
                <WeightTrendChart points={fatPercPoints} label="Massa grassa" unit="%" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold">Prossimi appuntamenti</h2>
            <div className="mt-3 space-y-2">
              {(nextAppointments || []).map((a) => {
                const doctor = a.doctors as unknown as { display_name: string };
                return (
                  <div key={a.id} className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
                    <p className="font-medium">
                      {new Date(a.starts_at).toLocaleString("it-IT", { dateStyle: "full", timeStyle: "short" })}
                    </p>
                    <p className="text-sm text-secondary">
                      {doctor.display_name} · {a.mode === "online" ? "Online" : "In studio"}
                    </p>
                    {a.mode === "online" && a.meeting_link && (
                      <a href={a.meeting_link} target="_blank" className="text-sm text-brand hover:underline">
                        Link videochiamata
                      </a>
                    )}
                  </div>
                );
              })}
              {(!nextAppointments || nextAppointments.length === 0) && (
                <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
                  Nessun appuntamento in programma.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <Link href="/area-personale/messaggi" className="rounded-card border border-border bg-surface p-5 shadow-card hover:shadow-md">
              <h2 className="font-semibold">Messaggi</h2>
              {ultimoMessaggio ? (
                <>
                  <p className="mt-2 text-sm text-secondary">{ultimoMessaggio.mittente === "medico" ? "Dal tuo nutrizionista" : "Inviato da te"}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground">{ultimoMessaggio.testo}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-secondary">Nessun messaggio ancora. Scrivi al tuo nutrizionista →</p>
              )}
            </Link>
            <Link href="/area-personale/attivita" className="rounded-card border border-border bg-surface p-5 shadow-card hover:shadow-md">
              <h2 className="font-semibold">Attività</h2>
              {passiMedi7gg != null ? (
                <p className="mt-2 text-sm text-secondary">{passiMedi7gg} passi medi (7gg)</p>
              ) : (
                <p className="mt-2 text-sm text-secondary">Nessun braccialetto collegato ancora.</p>
              )}
            </Link>
            <Link href="/area-personale/diario" className="rounded-card border border-border bg-surface p-5 shadow-card hover:shadow-md">
              <h2 className="font-semibold">Diario alimentare</h2>
              {lastDiarioEntry ? (
                <>
                  <p className="mt-2 text-sm text-secondary">
                    {new Date(lastDiarioEntry.data).toLocaleDateString("it-IT")} · {PASTO_LABEL[lastDiarioEntry.pasto]}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground">{lastDiarioEntry.contenuto}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-secondary">Nessuna voce ancora. Inizia a scrivere il tuo diario →</p>
              )}
            </Link>
            <Link href="/area-personale/piano" className="rounded-card border border-border bg-surface p-5 shadow-card hover:shadow-md">
              <h2 className="font-semibold">Piano alimentare</h2>
              {activePlan ? (
                <p className="mt-2 text-sm text-secondary">{activePlan.titolo}</p>
              ) : (
                <p className="mt-2 text-sm text-secondary">Nessun piano caricato dal tuo nutrizionista.</p>
              )}
            </Link>
            <Link href="/area-personale/referti" className="rounded-card border border-border bg-surface p-5 shadow-card hover:shadow-md">
              <h2 className="font-semibold">Referti BIA</h2>
              {lastReferto ? (
                <p className="mt-2 text-sm text-secondary">
                  {lastReferto.data_esame ? `Ultimo referto del ${new Date(lastReferto.data_esame).toLocaleDateString("it-IT")}` : "Ultimo referto caricato"}
                </p>
              ) : (
                <p className="mt-2 text-sm text-secondary">Nessun referto caricato dal tuo nutrizionista.</p>
              )}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
