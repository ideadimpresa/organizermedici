import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, getDoctorPlanPriceIds } from "@/lib/stripe";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.doctorId) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { plan } = (await request.json()) as { plan: "starter" | "pro" };
  const priceIds = await getDoctorPlanPriceIds();
  const priceId = priceIds[plan];
  if (!priceId) {
    return NextResponse.json({ error: "Piano non configurato" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: doctor } = await admin.from("doctors").select("*").eq("id", user.doctorId).single();
  if (!doctor) return NextResponse.json({ error: "Profilo non trovato" }, { status: 404 });

  const stripe = await getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: doctor.stripe_customer_id || undefined,
    customer_email: doctor.stripe_customer_id ? undefined : doctor.contact_email || user.email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { doctor_id: doctor.id, plan },
    subscription_data: { metadata: { doctor_id: doctor.id, plan } },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dottore/abbonamento?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dottore/abbonamento`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
