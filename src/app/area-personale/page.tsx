import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "@/app/(auth)/actions";

export default async function PatientAreaPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patientRows } = await supabase.from("patients").select("id").eq("profile_id", user?.id ?? "");
  const patientIds = (patientRows || []).map((p) => p.id);

  const { data: appointments } = patientIds.length
    ? await supabase
        .from("appointments")
        .select("id, starts_at, mode, status, meeting_link, doctors(display_name, slug), services(name)")
        .in("patient_id", patientIds)
        .order("starts_at", { ascending: true })
    : { data: [] };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">I miei appuntamenti</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/account/password" className="text-secondary hover:text-foreground">
            Cambia password
          </Link>
          <form action={logout}>
            <button className="text-secondary hover:text-foreground">Esci</button>
          </form>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {(appointments || []).map((a) => {
          const doctor = a.doctors as unknown as { display_name: string; slug: string };
          const service = a.services as unknown as { name: string } | null;
          return (
            <div key={a.id} className="rounded-xl border border-border bg-white p-4">
              <p className="font-medium">
                {new Date(a.starts_at).toLocaleString("it-IT", { dateStyle: "full", timeStyle: "short" })}
              </p>
              <p className="text-sm text-secondary">
                {doctor.display_name} · {service?.name} · {a.mode === "online" ? "Online" : "In studio"}
              </p>
              {a.mode === "online" && a.meeting_link && (
                <a href={a.meeting_link} target="_blank" className="text-sm text-brand hover:underline">
                  Link videochiamata
                </a>
              )}
            </div>
          );
        })}
        {(!appointments || appointments.length === 0) && (
          <p className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-secondary">
            Nessun appuntamento prenotato.{" "}
            <Link href="/dottori" className="text-brand hover:underline">
              Trova un nutrizionista
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
