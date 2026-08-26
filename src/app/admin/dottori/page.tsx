import { createClient } from "@/lib/supabase/server";
import { inviteDoctor } from "./actions";
import { DoctorActiveToggle } from "@/components/doctor-active-toggle";
import { RevokeInviteButton } from "@/components/revoke-invite-button";

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string; emailFailed?: string; inviteUrl?: string }>;
}) {
  const { invited, emailFailed, inviteUrl } = await searchParams;
  const supabase = await createClient();
  const [{ data: doctors }, { data: invites }] = await Promise.all([
    supabase.from("doctors").select("*").order("created_at", { ascending: false }),
    supabase.from("doctor_invites").select("*").eq("status", "pending").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Dottori</h1>
        <p className="mt-1 text-secondary">Attiva nuovi professionisti e gestisci i profili esistenti.</p>
      </div>

      {invited && (
        <p className="rounded-lg bg-success-light px-4 py-2 text-sm text-success">
          Invito creato e email inviata con successo.
        </p>
      )}
      {emailFailed && (
        <div className="rounded-lg bg-warning-light px-4 py-3 text-sm text-warning">
          <p className="font-medium">Invito creato, ma l&apos;email non è partita.</p>
          <p className="mt-1">
            Provider email non configurato o non funzionante — vai su{" "}
            <a href="/admin/impostazioni" className="underline">
              Impostazioni
            </a>{" "}
            per configurarlo. Nel frattempo puoi condividere questo link direttamente:
          </p>
          {inviteUrl && (
            <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-foreground">{inviteUrl}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {(doctors || []).map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
              <div>
                <p className="font-medium">{d.display_name}</p>
                <p className="text-sm text-secondary">
                  /{d.slug} · piano {d.plan} · {d.subscription_status}
                </p>
              </div>
              <DoctorActiveToggle id={d.id} isActive={d.is_active} />
            </div>
          ))}
          {(!doctors || doctors.length === 0) && <p className="text-secondary">Nessun dottore ancora registrato.</p>}

          {invites && invites.length > 0 && (
            <div className="mt-8">
              <h2 className="font-semibold">Inviti in attesa</h2>
              <div className="mt-3 space-y-2">
                {invites.map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-xl border border-border bg-white p-4 text-sm">
                    <span>
                      {i.email} {i.full_name ? `(${i.full_name})` : ""} — scade il{" "}
                      {new Date(i.expires_at).toLocaleDateString("it-IT")}
                    </span>
                    <RevokeInviteButton id={i.id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form action={inviteDoctor} className="space-y-3 rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold">Invita un dottore</h2>
          <input name="full_name" placeholder="Nome e cognome" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Invia invito</button>
        </form>
      </div>
    </div>
  );
}
