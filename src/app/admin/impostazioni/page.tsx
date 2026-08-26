import { createAdminClient } from "@/lib/supabase/admin";
import { saveSettings } from "./actions";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const admin = createAdminClient();
  const { data: settings } = await admin.from("platform_settings").select("*").eq("id", true).maybeSingle();

  const configuredLabel = (isSet: boolean) => (isSet ? "già configurata — lascia vuoto per non modificarla" : "non configurata");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Impostazioni piattaforma</h1>
      <p className="mt-1 text-secondary">
        Email e pagamenti sono centralizzati qui: valgono per tutti i dottori della piattaforma. Le chiavi
        vengono salvate cifrate e non sono mai rivisualizzabili dopo il salvataggio.
      </p>

      {saved && <p className="mt-4 rounded-lg bg-success-light px-4 py-2 text-sm text-success">Impostazioni salvate.</p>}

      <form action={saveSettings} className="mt-6 space-y-8">
        <section className="rounded-xl border border-border bg-white p-6">
          <h2 className="font-semibold">Email transazionali</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium">Provider</label>
              <select
                name="email_provider"
                defaultValue={settings?.email_provider || "resend"}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="resend">Resend</option>
                <option value="brevo">Brevo</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Nome mittente</label>
                <input
                  name="email_from_name"
                  defaultValue={settings?.email_from_name || "VisitaUp"}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email mittente</label>
                <input
                  name="email_from_address"
                  type="email"
                  defaultValue={settings?.email_from_address || ""}
                  placeholder="no-reply@tuodominio.it"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Resend API key</label>
              <input
                name="resend_api_key"
                type="password"
                placeholder={configuredLabel(!!settings?.resend_api_key_encrypted)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Brevo API key</label>
              <input
                name="brevo_api_key"
                type="password"
                placeholder={configuredLabel(!!settings?.brevo_api_key_encrypted)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-6">
          <h2 className="font-semibold">Pagamenti (Stripe)</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium">Publishable key</label>
              <input
                name="stripe_publishable_key"
                defaultValue={settings?.stripe_publishable_key || ""}
                placeholder="pk_live_…"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Secret key</label>
              <input
                name="stripe_secret_key"
                type="password"
                placeholder={configuredLabel(!!settings?.stripe_secret_key_encrypted)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Webhook signing secret</label>
              <input
                name="stripe_webhook_secret"
                type="password"
                placeholder={configuredLabel(!!settings?.stripe_webhook_secret_encrypted)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">
                Configura l&apos;endpoint {" "}
                <code>https://visitaup.vercel.app/api/stripe/webhook</code> nel tuo account Stripe e incolla qui il
                signing secret generato.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Price ID piano Starter</label>
                <input
                  name="stripe_price_starter"
                  defaultValue={settings?.stripe_price_starter || ""}
                  placeholder="price_…"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Price ID piano Pro</label>
                <input
                  name="stripe_price_pro"
                  defaultValue={settings?.stripe_price_pro || ""}
                  placeholder="price_…"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        <button className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Salva impostazioni
        </button>
      </form>
    </div>
  );
}
