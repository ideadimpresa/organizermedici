import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { EntryDeleteButton } from "@/components/entry-delete-button";
import { addOwnAllergia, deleteOwnAllergia } from "../actions";

export default async function PatientAllergiesPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patientRows } = await supabase.from("patients").select("id").eq("profile_id", user?.id ?? "");
  const patientIds = (patientRows || []).map((p) => p.id);
  const primaryPatientId = patientIds[0];

  const { data: allergie } = patientIds.length
    ? await supabase.from("allergeni_intolleranze").select("*").in("patient_id", patientIds).order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Allergie e intolleranze</h1>
        <p className="mt-1 text-secondary">Tieni aggiornato il tuo nutrizionista su allergie e intolleranze note.</p>
      </div>

      <div className="space-y-2">
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

      {primaryPatientId && (
        <form action={addOwnAllergia.bind(null, primaryPatientId)} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Aggiungi voce</h2>
          <select name="tipo" required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
            <option value="allergene">Allergene</option>
            <option value="intolleranza">Intolleranza</option>
          </select>
          <input name="sostanza" required placeholder="Sostanza (es. lattosio)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <input name="gravita" placeholder="Gravità (opzionale)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Aggiungi voce</button>
        </form>
      )}
    </div>
  );
}
