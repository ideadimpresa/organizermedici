import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { MessageThread } from "@/components/message-thread";
import { sendMessaggioPaziente } from "../actions";

export default async function PatientMessagesPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patientRows } = await supabase.from("patients").select("id, doctors(display_name)").eq("profile_id", user?.id ?? "");
  const primaryPatient = (patientRows || [])[0];
  const doctorName = (primaryPatient?.doctors as unknown as { display_name: string } | null)?.display_name;

  const { data: messaggi } = primaryPatient
    ? await supabase.from("messaggi").select("*").eq("patient_id", primaryPatient.id).order("created_at", { ascending: true })
    : { data: [] };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Messaggi</h1>
        <p className="mt-1 text-secondary">{doctorName ? `La tua conversazione con ${doctorName}.` : "La tua conversazione con il tuo nutrizionista."}</p>
      </div>

      {primaryPatient ? (
        <div className="space-y-3">
          <MessageThread messaggi={messaggi || []} viewAs="paziente" />
          <form action={sendMessaggioPaziente.bind(null, primaryPatient.id)} className="flex gap-2">
            <input
              name="testo"
              required
              placeholder="Scrivi un messaggio…"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <button className="shrink-0 rounded-button bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
              Invia
            </button>
          </form>
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
          Nessun nutrizionista associato al tuo account.
        </p>
      )}
    </div>
  );
}
