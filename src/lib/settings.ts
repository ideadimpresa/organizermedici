import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import type { Database } from "@/lib/types/database";

type PlatformSettingsRow = Database["public"]["Tables"]["platform_settings"]["Update"];

export interface ResolvedPlatformSettings {
  emailProvider: "resend" | "brevo";
  emailFromName: string;
  emailFromAddress: string | null;
  resendApiKey: string | null;
  brevoApiKey: string | null;
  stripePublishableKey: string | null;
  stripePriceStarter: string | null;
  stripePricePro: string | null;
  stripeSecretKey: string | null;
  stripeWebhookSecret: string | null;
}

/**
 * Loads platform-wide integration settings (email + Stripe), preferring
 * values configured by the superadmin in /admin/impostazioni (encrypted
 * in the database) and falling back to environment variables so the
 * app keeps working before the admin has configured anything.
 */
export async function getPlatformSettings(): Promise<ResolvedPlatformSettings> {
  const admin = createAdminClient();
  const { data: row } = await admin.from("platform_settings").select("*").eq("id", true).maybeSingle();

  return {
    emailProvider: row?.email_provider || (process.env.EMAIL_PROVIDER as "resend" | "brevo") || "resend",
    emailFromName: row?.email_from_name || process.env.EMAIL_FROM_NAME || "VisitaUp",
    emailFromAddress: row?.email_from_address || process.env.EMAIL_FROM_ADDRESS || null,
    resendApiKey: row?.resend_api_key_encrypted ? decryptSecret(row.resend_api_key_encrypted) : process.env.RESEND_API_KEY || null,
    brevoApiKey: row?.brevo_api_key_encrypted ? decryptSecret(row.brevo_api_key_encrypted) : process.env.BREVO_API_KEY || null,
    stripePublishableKey: row?.stripe_publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
    stripePriceStarter: row?.stripe_price_starter || process.env.STRIPE_PRICE_STARTER || null,
    stripePricePro: row?.stripe_price_pro || process.env.STRIPE_PRICE_PRO || null,
    stripeSecretKey: row?.stripe_secret_key_encrypted ? decryptSecret(row.stripe_secret_key_encrypted) : process.env.STRIPE_SECRET_KEY || null,
    stripeWebhookSecret: row?.stripe_webhook_secret_encrypted
      ? decryptSecret(row.stripe_webhook_secret_encrypted)
      : process.env.STRIPE_WEBHOOK_SECRET || null,
  };
}

export interface PlatformSettingsUpdate {
  emailProvider?: "resend" | "brevo";
  emailFromName?: string;
  emailFromAddress?: string;
  resendApiKey?: string;
  brevoApiKey?: string;
  stripePublishableKey?: string;
  stripePriceStarter?: string;
  stripePricePro?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
}

/**
 * Updates only the fields provided. Secret fields are re-encrypted and
 * overwritten only when a new, non-empty value is submitted, so leaving
 * a "already configured" field blank in the form keeps the existing key.
 */
export async function updatePlatformSettings(update: PlatformSettingsUpdate) {
  const admin = createAdminClient();
  const patch: PlatformSettingsRow = {};

  if (update.emailProvider) patch.email_provider = update.emailProvider;
  if (update.emailFromName) patch.email_from_name = update.emailFromName;
  if (update.emailFromAddress) patch.email_from_address = update.emailFromAddress;
  if (update.stripePublishableKey) patch.stripe_publishable_key = update.stripePublishableKey;
  if (update.stripePriceStarter) patch.stripe_price_starter = update.stripePriceStarter;
  if (update.stripePricePro) patch.stripe_price_pro = update.stripePricePro;
  if (update.resendApiKey) patch.resend_api_key_encrypted = encryptSecret(update.resendApiKey);
  if (update.brevoApiKey) patch.brevo_api_key_encrypted = encryptSecret(update.brevoApiKey);
  if (update.stripeSecretKey) patch.stripe_secret_key_encrypted = encryptSecret(update.stripeSecretKey);
  if (update.stripeWebhookSecret) patch.stripe_webhook_secret_encrypted = encryptSecret(update.stripeWebhookSecret);

  const { error } = await admin.from("platform_settings").update(patch).eq("id", true);
  if (error) throw new Error(error.message);
}
