"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { updatePlatformSettings } from "@/lib/settings";

export async function saveSettings(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") throw new Error("Non autorizzato");

  const str = (key: string) => {
    const value = String(formData.get(key) || "").trim();
    return value.length > 0 ? value : undefined;
  };

  await updatePlatformSettings({
    emailProvider: str("email_provider") as "resend" | "brevo" | undefined,
    emailFromName: str("email_from_name"),
    emailFromAddress: str("email_from_address"),
    resendApiKey: str("resend_api_key"),
    brevoApiKey: str("brevo_api_key"),
    stripePublishableKey: str("stripe_publishable_key"),
    stripePriceStarter: str("stripe_price_starter"),
    stripePricePro: str("stripe_price_pro"),
    stripeSecretKey: str("stripe_secret_key"),
    stripeWebhookSecret: str("stripe_webhook_secret"),
  });

  redirect("/admin/impostazioni?saved=1");
}
