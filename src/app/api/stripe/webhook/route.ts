import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, appointmentConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: `Webhook signature error: ${message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "payment" && session.metadata?.appointment_id) {
        const appointmentId = session.metadata.appointment_id;
        const { data: appointment } = await admin
          .from("appointments")
          .update({ status: "confirmed", payment_status: "paid" })
          .eq("id", appointmentId)
          .select("*, patients(full_name, email), doctors(display_name)")
          .single();

        if (appointment) {
          const patient = appointment.patients as unknown as { full_name: string; email: string };
          const doctor = appointment.doctors as unknown as { display_name: string };
          const { subject, html } = appointmentConfirmationEmail({
            patientName: patient.full_name,
            doctorName: doctor.display_name,
            startsAt: new Date(appointment.starts_at),
            mode: appointment.mode,
            meetingLink: appointment.meeting_link,
          });
          await sendEmail({ to: patient.email, subject, html }).catch(() => null);
        }
      }

      if (session.mode === "subscription" && session.metadata?.doctor_id) {
        await admin
          .from("doctors")
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: (session.metadata.plan as "starter" | "pro") || "starter",
            subscription_status: "active",
            is_active: true,
          })
          .eq("id", session.metadata.doctor_id);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : undefined;
      if (subscriptionId) {
        await admin.from("doctors").update({ subscription_status: "past_due" }).eq("stripe_subscription_id", subscriptionId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await admin
        .from("doctors")
        .update({ subscription_status: "canceled", plan: "trial" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
