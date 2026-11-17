import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { StatTile } from "@/components/stat-tile";
import { WeightTrendChart } from "@/components/weight-trend-chart";
import { averageOverLastDays } from "@/lib/activity";

export default async function PatientActivityPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patientRows } = await supabase.from("patients").select("id").eq("profile_id", user?.id ?? "");
  const patientIds = (patientRows || []).map((p) => p.id);

  const [{ data: dispositivo }, { data: attivita }] = patientIds.length
    ? await Promise.all([
        supabase.from("dispositivi_wearable").select("*").in("patient_id", patientIds).maybeSingle(),
        supabase.from("attivita_giornaliera").select("*").in("patient_id", patientIds).order("data", { ascending: true }).limit(60),
      ])
    : [{ data: null }, { data: [] }];

  const stepsPoints = (attivita || []).filter((a) => a.passi != null).map((a) => ({ data: a.data, value: a.passi as number }));
  const caloriePoints = (attivita || []).filter((a) => a.calorie_totali != null).map((a) => ({ data: a.data, value: a.calorie_totali as number }));
  const passiMedi7gg = averageOverLastDays((attivita || []).map((a) => ({ data: a.data, value: a.passi })), 7);
  const calorieMedie7gg = averageOverLastDays((attivita || []).map((a) => ({ data: a.data, value: a.calorie_totali })), 7);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Attività</h1>
        <p className="mt-1 text-secondary">Passi e calorie rilevati dal tuo braccialetto VisitaUp Band.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Andamento passi</h2>
          <div className="mt-3">
            <WeightTrendChart points={stepsPoints} label="Passi" unit="" />
          </div>
        </div>
        <div className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Andamento calorie</h2>
          <div className="mt-3">
            <WeightTrendChart points={caloriePoints} label="Calorie" unit="kcal" />
          </div>
        </div>
      </div>

      {!dispositivo && (
        <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
          Nessun braccialetto ancora collegato al tuo account. Il tuo nutrizionista ti aggiornerà quando sarà disponibile.
        </p>
      )}
    </div>
  );
}
