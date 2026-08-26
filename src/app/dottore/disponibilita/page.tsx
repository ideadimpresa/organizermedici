import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addAddress, addAvailabilityRule, addClosure } from "./actions";
import { RuleDeleteButton } from "@/components/rule-delete-button";

const WEEKDAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

export default async function AvailabilityPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: addresses }, { data: rules }, { data: closures }] = await Promise.all([
    supabase.from("addresses").select("*").eq("doctor_id", user?.doctorId ?? ""),
    supabase.from("availability_rules").select("*").eq("doctor_id", user?.doctorId ?? "").order("weekday"),
    supabase
      .from("availability_exceptions")
      .select("*")
      .eq("doctor_id", user?.doctorId ?? "")
      .order("date", { ascending: true }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Disponibilità</h1>
        <p className="mt-1 text-secondary">Configura indirizzi, orari settimanali ricorrenti e chiusure straordinarie.</p>
      </div>

      <section>
        <h2 className="font-semibold">Indirizzi studio</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-2">
            {(addresses || []).map((a) => (
              <div key={a.id} className="rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-4">
                <p className="font-medium">{a.label}</p>
                <p className="text-sm text-secondary">{a.address_line}, {a.city}</p>
              </div>
            ))}
            {(!addresses || addresses.length === 0) && <p className="text-secondary">Nessun indirizzo configurato.</p>}
          </div>
          <form action={addAddress} className="space-y-3 rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-5">
            <input name="label" placeholder="Etichetta (es. Studio)" defaultValue="Studio" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="address_line" required placeholder="Indirizzo" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="city" required placeholder="Città" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="postal_code" placeholder="CAP" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Aggiungi indirizzo</button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Orari settimanali</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-2">
            {(rules || []).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-4">
                <p className="text-sm">
                  <span className="font-medium">{WEEKDAYS[r.weekday]}</span> · {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)} ·{" "}
                  {r.mode === "online" ? "Online" : "In studio"} · slot {r.slot_duration_minutes} min
                </p>
                <RuleDeleteButton id={r.id} />
              </div>
            ))}
            {(!rules || rules.length === 0) && <p className="text-secondary">Nessun orario configurato: la pagina di prenotazione non mostrerà slot.</p>}
          </div>
          <form action={addAvailabilityRule} className="space-y-3 rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-5">
            <select name="weekday" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input name="start_time" type="time" required defaultValue="09:00" className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input name="end_time" type="time" required defaultValue="13:00" className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            <select name="mode" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
              <option value="studio">In studio</option>
              <option value="online">Online</option>
            </select>
            {addresses && addresses.length > 0 && (
              <select name="address_id" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.city}
                  </option>
                ))}
              </select>
            )}
            <input name="slot_duration_minutes" type="number" min={5} step={5} defaultValue={30} placeholder="Durata slot (min)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Aggiungi orario</button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Chiusure straordinarie</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-2">
            {(closures || []).map((c) => (
              <div key={c.id} className="rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-4 text-sm">
                {new Date(c.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                {c.reason ? ` — ${c.reason}` : ""}
              </div>
            ))}
            {(!closures || closures.length === 0) && <p className="text-secondary">Nessuna chiusura programmata.</p>}
          </div>
          <form action={addClosure} className="space-y-3 rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-5">
            <input name="date" type="date" required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="reason" placeholder="Motivo (opzionale)" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">Blocca giornata</button>
          </form>
        </div>
      </section>
    </div>
  );
}
