import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { updateDoctorProfile } from "./actions";

export default async function DoctorProfileSettingsPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: doctor } = await supabase.from("doctors").select("*").eq("id", user?.doctorId ?? "").single();

  if (!doctor) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Profilo pubblico</h1>
      <p className="mt-1 text-secondary">
        Questi dati sono visibili sulla tua pagina pubblica:{" "}
        <a className="text-brand hover:underline" href={`/dottori/${doctor.slug}`} target="_blank">
          visitaup.it/dottori/{doctor.slug}
        </a>
      </p>

      <form action={updateDoctorProfile} className="mt-6 max-w-2xl space-y-4 rounded-xl border border-border bg-white p-6">
        <div>
          <label className="block text-sm font-medium">Nome visualizzato</label>
          <input name="display_name" defaultValue={doctor.display_name} required className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium">Titolo professionale</label>
          <input name="title" defaultValue={doctor.title} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium">Biografia / Esperienze</label>
          <textarea name="bio" defaultValue={doctor.bio ?? ""} rows={5} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium">Patologie trattate (separate da virgola)</label>
          <input name="conditions_treated" defaultValue={doctor.conditions_treated?.join(", ")} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Telefono</label>
            <input name="phone" defaultValue={doctor.phone ?? ""} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email di contatto</label>
            <input name="contact_email" type="email" defaultValue={doctor.contact_email ?? ""} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">Instagram (URL)</label>
            <input name="social_instagram" defaultValue={doctor.social_instagram ?? ""} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium">Facebook (URL)</label>
            <input name="social_facebook" defaultValue={doctor.social_facebook ?? ""} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium">TikTok (URL)</label>
            <input name="social_tiktok" defaultValue={doctor.social_tiktok ?? ""} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>
        </div>
        <button className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Salva modifiche</button>
      </form>
    </div>
  );
}
