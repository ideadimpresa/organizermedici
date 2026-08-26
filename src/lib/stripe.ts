import Stripe from "stripe";
import { getPlatformSettings } from "@/lib/settings";

/**
 * Stripe client built from platform_settings (configured by the superadmin
 * in /admin/impostazioni), falling back to env vars if not configured there.
 */
export async function getStripe(): Promise<Stripe> {
  const settings = await getPlatformSettings();
  if (!settings.stripeSecretKey) {
    throw new Error("Stripe non configurato: imposta la chiave segreta in /admin/impostazioni");
  }
  return new Stripe(settings.stripeSecretKey);
}

export async function getDoctorPlanPriceIds(): Promise<Record<"starter" | "pro", string | null>> {
  const settings = await getPlatformSettings();
  return { starter: settings.stripePriceStarter, pro: settings.stripePricePro };
}
