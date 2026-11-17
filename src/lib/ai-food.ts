import Anthropic from "@anthropic-ai/sdk";
import { getPlatformSettings } from "@/lib/settings";

export interface FoodPhotoAnalysis {
  descrizione: string;
  calorieStimate: number | null;
  proteineG: number | null;
  carboidratiG: number | null;
  grassiG: number | null;
}

type SupportedImageMime = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const SUPPORTED_MIME_TYPES: SupportedImageMime[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function isSupportedImageMime(mime: string): mime is SupportedImageMime {
  return (SUPPORTED_MIME_TYPES as string[]).includes(mime);
}

const PROMPT = `Analizza questa foto di un pasto. Rispondi SOLO con un oggetto JSON valido, senza altro testo, nel formato:
{"descrizione": "breve descrizione in italiano di cosa c'è nel piatto", "calorie_stimate": numero o null, "proteine_g": numero o null, "carboidrati_g": numero o null, "grassi_g": numero o null}
Stima i valori nutrizionali al meglio delle tue capacità in base a quantità e ingredienti visibili. Se la foto non mostra cibo, imposta descrizione a "Nessun cibo rilevato nella foto" e gli altri valori a null.`;

// Centralized (not per-doctor) because this is a per-call cost the
// platform absorbs, same as the email/Stripe keys in platform_settings.
export async function analyzeFoodPhoto(buffer: Buffer, mimeType: SupportedImageMime): Promise<FoodPhotoAnalysis | null> {
  const { anthropicApiKey } = await getPlatformSettings();
  if (!anthropicApiKey) return null;

  const client = new Anthropic({ apiKey: anthropicApiKey });
  const message = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: buffer.toString("base64") } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  const text = message.content.find((c) => c.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      descrizione: typeof parsed.descrizione === "string" ? parsed.descrizione : "",
      calorieStimate: num(parsed.calorie_stimate),
      proteineG: num(parsed.proteine_g),
      carboidratiG: num(parsed.carboidrati_g),
      grassiG: num(parsed.grassi_g),
    };
  } catch {
    return null;
  }
}
