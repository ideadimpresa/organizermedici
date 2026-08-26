import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addMinutes } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { bookingSchema } from "@/lib/validations/booking";
import { sendEmail, appointmentConfirmationEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";
import { getPlatformSettings } from "@/lib/settings";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dati di prenotazione non validi" }, { status: 400 });
  }

  const { doctorId, serviceId, addressId, mode, startsAt, patient } = parsed.data;
  const admin = createAdminClient();

  const { data: doctor } = await admin
    .from("doctors")
    .select("id, display_name, is_active")
    .eq("id", doctorId)
    .single();
  if (!doctor || !doctor.is_active) {
    return NextResponse.json({ error: "Professionista non disponibile" }, { status: 404 });
  }

  const { data: service } = await admin
    .from("services")
    .select("id, duration_minutes, price_cents, mode, is_active, name")
    .eq("id", serviceId)
    .eq("doctor_id", doctorId)
    .single();
  if (!service || !service.is_active) {
    return NextResponse.json({ error: "Prestazione non disponibile" }, { status: 404 });
  }

  const start = new Date(startsAt);
  const end = addMinutes(start, service.duration_minutes);

  // Re-check for conflicting appointments (race-condition guard).
  const { data: conflicts } = await admin
    .from("appointments")
    .select("id")
    .eq("doctor_id", doctorId)
    .neq("status", "cancelled")
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString());
  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: "Questo slot è stato appena prenotato, scegline un altro" }, { status: 409 });
  }

  // Link to authenticated patient profile if present.
  let profileId: string | null = null;
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    profileId = user?.id ?? null;
  } catch {
    profileId = null;
  }

  let patientId: string;
  const { data: existingPatient } = await admin
    .from("patients")
    .select("id")
    .eq("doctor_id", doctorId)
    .ilike("email", patient.email)
    .maybeSingle();

  if (existingPatient) {
    patientId = existingPatient.id;
    if (profileId) {
      await admin.from("patients").update({ profile_id: profileId }).eq("id", patientId);
    }
  } else {
    const { data: newPatient, error: patientError } = await admin
      .from("patients")
      .insert({
        doctor_id: doctorId,
        profile_id: profileId,
        full_name: patient.fullName,
        email: patient.email,
        phone: patient.phone || null,
        source: "booking",
      })
      .select("id")
      .single();
    if (patientError || !newPatient) {
      return NextResponse.json({ error: "Impossibile registrare i dati del paziente" }, { status: 500 });
    }
    patientId = newPatient.id;
  }

  const meetingLink = mode === "online" ? `https://meet.jit.si/visitaup-${randomUUID()}` : null;
  const platformSettings = await getPlatformSettings();
  const requiresPayment = service.price_cents > 0 && !!platformSettings.stripeSecretKey;

  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .insert({
      doctor_id: doctorId,
      patient_id: patientId,
      service_id: serviceId,
      address_id: mode === "studio" ? addressId ?? null : null,
      mode,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: requiresPayment ? "pending" : "confirmed",
      meeting_link: meetingLink,
      price_cents: service.price_cents,
      payment_status: requiresPayment ? "unpaid" : "not_required",
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) {
    return NextResponse.json({ error: "Impossibile creare l'appuntamento" }, { status: 500 });
  }

  if (requiresPayment) {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: patient.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: service.name },
            unit_amount: service.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: { appointment_id: appointment.id, doctor_id: doctorId },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/prenota/conferma?appointment_id=${appointment.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dottori`,
    });
    await admin.from("appointments").update({ stripe_payment_intent_id: session.id }).eq("id", appointment.id);
    return NextResponse.json({ appointmentId: appointment.id, checkoutUrl: session.url });
  }

  const { subject, html } = appointmentConfirmationEmail({
    patientName: patient.fullName,
    doctorName: doctor.display_name,
    startsAt: start,
    mode,
    meetingLink,
  });
  await sendEmail({ to: patient.email, subject, html }).catch((err) => console.error("[booking] email error", err));
  await admin.from("reminders_log").insert({ appointment_id: appointment.id, kind: "confirmation" }).select();

  return NextResponse.json({ appointmentId: appointment.id, checkoutUrl: null });
}
