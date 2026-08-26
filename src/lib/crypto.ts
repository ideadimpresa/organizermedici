import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM encryption for platform secrets stored in the database
 * (Brevo/Resend/Stripe keys), so the superadmin can manage them from
 * an in-app settings page instead of Vercel environment variables.
 * SETTINGS_ENCRYPTION_KEY is the one master secret that still lives in
 * Vercel env vars — generate with: openssl rand -base64 32
 */
function getKey(): Buffer {
  const key = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!key) throw new Error("SETTINGS_ENCRYPTION_KEY non configurata");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) throw new Error("SETTINGS_ENCRYPTION_KEY deve essere una chiave AES-256 (32 byte) in base64");
  return buf;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(ciphertext: string): string {
  const raw = Buffer.from(ciphertext, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
