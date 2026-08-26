"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { sendEmail, appointmentConfirmationEmail, appointmentRescheduledEmail } from "@/lib/email";
import type { AppointmentStatus } from "@/lib/types/database";

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/agenda");
}

export async function createAppointment(input: {
  patientId?: string;
  newPatient?: { fullName: string; email?: string; phone?: string };
  serviceId: string;
  startsAtIso: string;
  mode: "studio" | "online";
  addressId?: string | null;
  notes?: string;
}) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");
  const supabase = await createClient();

  let patientId = input.patientId;
  if (!patientId && input.newPatient?.fullName) {
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        doctor_id: user.doctorId,
        full_name: input.newPatient.fullName,
        email: input.newPatient.email || null,
        phone: input.newPatient.phone || null,
        source: "manual",
      })
      .select("id")
      .single();
    if (patientError || !patient) throw new Error(patientError?.message || "Impossibile creare il paziente");
    patientId = patient.id;
  }
  if (!patientId) throw new Error("Seleziona o crea un paziente");

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes, price_cents, name")
    .eq("id", input.serviceId)
    .single();
  if (serviceError || !service) throw new Error("Prestazione non trovata");

  const start = new Date(input.startsAtIso);
  const end = new Date(start.getTime() + service.duration_minutes * 60_000);

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      doctor_id: user.doctorId,
      patient_id: patientId,
      service_id: input.serviceId,
      address_id: input.mode === "studio" ? input.addressId ?? null : null,
      mode: input.mode,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: "confirmed",
      price_cents: service.price_cents,
      payment_status: "not_required",
      notes: input.notes || null,
    })
    .select("id, patients(full_name, email), doctors(display_name)")
    .single();

  if (error || !appointment) throw new Error(error?.message || "Impossibile creare l'appuntamento");

  const patient = appointment.patients as unknown as { full_name: string; email: string | null };
  const doctor = appointment.doctors as unknown as { display_name: string };
  if (patient?.email) {
    const { subject, html } = appointmentConfirmationEmail({
      patientName: patient.full_name,
      doctorName: doctor.display_name,
      startsAt: start,
      mode: input.mode,
    });
    await sendEmail({ to: patient.email, subject, html }).catch((err) => console.error("[agenda] email error", err));
  }

  revalidatePath("/dottore/agenda");
}

export async function rescheduleAppointment(appointmentId: string, newStartsAtIso: string) {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, mode, patients(full_name, email), doctors(display_name)")
    .eq("id", appointmentId)
    .single();
  if (fetchError || !existing) throw new Error(fetchError?.message || "Appuntamento non trovato");

  const durationMs = new Date(existing.ends_at).getTime() - new Date(existing.starts_at).getTime();
  const newStart = new Date(newStartsAtIso);
  const newEnd = new Date(newStart.getTime() + durationMs);

  const { error } = await supabase
    .from("appointments")
    .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() })
    .eq("id", appointmentId);
  if (error) throw new Error(error.message);

  const patient = existing.patients as unknown as { full_name: string; email: string | null };
  const doctor = existing.doctors as unknown as { display_name: string };
  if (patient?.email) {
    const { subject, html } = appointmentRescheduledEmail({
      patientName: patient.full_name,
      doctorName: doctor.display_name,
      startsAt: newStart,
      mode: existing.mode,
    });
    await sendEmail({ to: patient.email, subject, html }).catch((err) => console.error("[agenda] email error", err));
  }

  revalidatePath("/dottore/agenda");
}
