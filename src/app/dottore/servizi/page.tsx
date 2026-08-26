import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addService } from "./actions";
import { ServiceRowActions } from "@/components/service-row-actions";

export default async function ServicesPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("doctor_id", user?.doctorId ?? "")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">Prestazioni</h1>
      <p className="mt-1 text-black/60">Definisci i servizi prenotabili, durata e prezzo.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {(services || []).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-black/60">
                  {s.duration_minutes} min · {s.price_cents > 0 ? `€${(s.price_cents / 100).toFixed(2)}` : "Gratuita"} ·{" "}
                  {s.mode === "both" ? "Studio + Online" : s.mode === "studio" ? "In studio" : "Online"}
                  {!s.is_active && " · Disattivata"}
                </p>
              </div>
              <ServiceRowActions id={s.id} isActive={s.is_active} />
            </div>
          ))}
          {(!services || services.length === 0) && (
            <p className="rounded-xl border border-dashed border-black/20 bg-white p-8 text-center text-black/50">
              Nessuna prestazione configurata.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h2 className="font-semibold">Nuova prestazione</h2>
          <form action={addService} className="mt-4 space-y-3">
            <input name="name" required placeholder="Nome prestazione" className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <textarea name="description" placeholder="Descrizione" rows={2} className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <div className="flex gap-2">
              <input name="duration_minutes" type="number" min={5} step={5} defaultValue={30} placeholder="Durata (min)" className="w-1/2 rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="price" type="number" min={0} step={0.5} placeholder="Prezzo (€)" className="w-1/2 rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            <select name="mode" className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none">
              <option value="both">In studio + Online</option>
              <option value="studio">Solo in studio</option>
              <option value="online">Solo online</option>
            </select>
            <button className="w-full rounded-full bg-brand py-2 text-sm font-medium text-white hover:bg-brand-dark">Aggiungi prestazione</button>
          </form>
        </div>
      </div>
    </div>
  );
}
