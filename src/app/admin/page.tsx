import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminOverviewPage() {
  const admin = createAdminClient();
  const [{ count: doctorsCount }, { count: patientsCount }, { count: appointmentsCount }, { count: activeSubs }] =
    await Promise.all([
      admin.from("doctors").select("*", { count: "exact", head: true }),
      admin.from("patients").select("*", { count: "exact", head: true }),
      admin.from("appointments").select("*", { count: "exact", head: true }),
      admin.from("doctors").select("*", { count: "exact", head: true }).eq("subscription_status", "active"),
    ]);

  const stats = [
    { label: "Dottori", value: doctorsCount ?? 0 },
    { label: "Pazienti", value: patientsCount ?? 0 },
    { label: "Appuntamenti", value: appointmentsCount ?? 0 },
    { label: "Abbonamenti attivi", value: activeSubs ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Panoramica piattaforma</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-5">
            <p className="text-2xl font-bold text-brand">{s.value}</p>
            <p className="text-sm text-secondary">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
