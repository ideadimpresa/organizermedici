import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { SubscribeButton } from "@/components/subscribe-button";

const PLAN_LABEL: Record<string, string> = { trial: "Prova gratuita", starter: "Starter", pro: "Pro" };
const STATUS_LABEL: Record<string, string> = {
  inactive: "Non attivo",
  trialing: "In prova",
  active: "Attivo",
  past_due: "Pagamento in ritardo",
  canceled: "Annullato",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: doctor } = await supabase.from("doctors").select("*").eq("id", user?.doctorId ?? "").single();

  return (
    <div>
      <h1 className="text-2xl font-bold">Abbonamento</h1>
      {success && <p className="mt-4 rounded-lg bg-success-light px-4 py-2 text-sm text-success">Abbonamento attivato con successo!</p>}

      <div className="mt-4 rounded-xl border border-border bg-white p-5">
        <p className="text-sm text-secondary">Piano attuale</p>
        <p className="text-lg font-semibold">{PLAN_LABEL[doctor?.plan || "trial"]}</p>
        <p className="text-sm text-secondary">Stato: {STATUS_LABEL[doctor?.subscription_status || "inactive"]}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="font-semibold">Starter</h2>
          <p className="mt-1 text-sm text-secondary">Agenda, CRM pazienti, promemoria email.</p>
          <SubscribeButton plan="starter" label="Passa a Starter" />
        </div>
        <div className="rounded-xl border-2 border-brand bg-white p-6">
          <h2 className="font-semibold">Pro</h2>
          <p className="mt-1 text-sm text-secondary">Tutto Starter + pagamenti online e pubblicazione social automatica.</p>
          <SubscribeButton plan="pro" label="Passa a Pro" />
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        I prezzi dei piani sono configurati su Stripe. Se i pulsanti non funzionano, verifica che
        STRIPE_PRICE_STARTER e STRIPE_PRICE_PRO siano impostati nelle variabili d&apos;ambiente.
      </p>
    </div>
  );
}
