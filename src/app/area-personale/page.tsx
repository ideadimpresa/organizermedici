import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { StatTile } from "@/components/stat-tile";
import { WeightTrendChart } from "@/components/weight-trend-chart";

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

  const [{ data: nextAppointments }, { data: misurazioni }, { data: allergie }, { data: lastDiario }, { data: piani }] =
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
            .limit(1),
          supabase.from("piani_alimentari").select("id, titolo, data_inizio, data_fine").in("patient_id", patientIds).order("created_at", { ascending: false }).limit(1),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const weightPoints = (misurazioni || []).filter((m) => m.peso_kg != null).map((m) => ({ data: m.data, value: m.peso_kg as number }));
  const fatPercPoints = (misurazioni || []).filter((m) => m.massa_grassa_perc != null).map((m) => ({ data: m.data, value: m.massa_grassa_perc as number }));

  const latestWeight = weightPoints[weightPoints.length - 1];
  const latestFatPerc = fatPercPoints[fatPercPoints.length - 1];
  const nextAppointment = (nextAppointments || [])[0];
  const nextAppointmentDoctor = nextAppointment?.doctors as unknown as { display_name: string } | undefined;
  const lastDiarioEntry = (lastDiario || [])[0];
  const activePlan = (piani || [])[0];

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <StatTile
              label="Allergie e intolleranze"
              value={String((allergie || []).length)}
              subtext="registrate"
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
          </div>
        </>
      )}
    </div>
  );
}
