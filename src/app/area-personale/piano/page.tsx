import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { MealPlanCard } from "@/components/meal-plan-card";
import { sortPlansByDate, labelPlanRange } from "@/lib/meal-plan";

const DOCS_BUCKET = "documenti-pazienti";

export default async function PatientMealPlanPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patientRows } = await supabase.from("patients").select("id").eq("profile_id", user?.id ?? "");
  const patientIds = (patientRows || []).map((p) => p.id);

  const { data: piani } = patientIds.length
    ? await supabase.from("piani_alimentari").select("*").in("patient_id", patientIds)
    : { data: [] };

  const pianiWithUrl = await Promise.all(
    sortPlansByDate(piani || []).map(async (p) => {
      const { data } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(p.file_path, 3600);
      return { ...p, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Piano alimentare</h1>
        <p className="mt-1 text-secondary">
          I piani caricati dal tuo nutrizionista, organizzati per settimana. Apri una voce per leggerne il contenuto.
        </p>
      </div>

      <div className="space-y-3">
        {pianiWithUrl.map((p) => (
          <MealPlanCard
            key={p.id}
            titolo={p.titolo}
            contentText={p.content_text}
            note={p.note}
            signedUrl={p.signedUrl}
            rangeLabel={labelPlanRange(p)}
          />
        ))}
        {pianiWithUrl.length === 0 && (
          <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
            Nessun piano alimentare caricato dal tuo nutrizionista.
          </p>
        )}
      </div>
    </div>
  );
}
