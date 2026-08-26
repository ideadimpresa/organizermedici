import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, appointmentReminderEmail } from "@/lib/email";

/**
 * Sends 24h-ahead email reminders for confirmed appointments.
 * Triggered hourly by Vercel Cron (see vercel.json), protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const windowStart = addHours(now, 23);
  const windowEnd = addHours(now, 25);

  const { data: appointments } = await admin
    .from("appointments")
    .select("id, starts_at, mode, meeting_link, patients(full_name, email), doctors(display_name)")
    .eq("status", "confirmed")
    .gte("starts_at", windowStart.toISOString())
    .lte("starts_at", windowEnd.toISOString());

  let sent = 0;
  for (const appt of appointments || []) {
    const { data: alreadySent } = await admin
      .from("reminders_log")
      .select("id")
      .eq("appointment_id", appt.id)
      .eq("kind", "reminder_24h")
      .maybeSingle();
    if (alreadySent) continue;

    const patient = appt.patients as unknown as { full_name: string; email: string };
    const doctor = appt.doctors as unknown as { display_name: string };
    if (!patient?.email) continue;

    const { subject, html } = appointmentReminderEmail({
      patientName: patient.full_name,
      doctorName: doctor.display_name,
      startsAt: new Date(appt.starts_at),
      mode: appt.mode,
      meetingLink: appt.meeting_link,
    });

    await sendEmail({ to: patient.email, subject, html });
    await admin.from("reminders_log").insert({ appointment_id: appt.id, kind: "reminder_24h" });
    sent += 1;
  }

  return NextResponse.json({ checked: appointments?.length ?? 0, sent });
}
