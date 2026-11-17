import type { createClient } from "@/lib/supabase/server";
import { analyzeFoodPhoto, isSupportedImageMime } from "@/lib/ai-food";

const FOTO_BUCKET = "foto-diario";

// 5 AI analyses per patient per day — mapped to the 5 expected daily meal
// slots (colazione, pranzo, cena, 2 spuntini), to cap the per-call AI cost.
// The photo itself is never blocked by this: past the limit, it's still
// uploaded and saved, just without an AI macro estimate.
const DAILY_AI_LIMIT = 5;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface DiarioFotoResult {
  fields: {
    foto_path: string;
    analisi_ai: string | null;
    calorie_stimate: number | null;
    proteine_g: number | null;
    carboidrati_g: number | null;
    grassi_g: number | null;
  };
  limitReached: boolean;
}

// Uploads a diario meal photo and, within the daily AI-analysis limit, runs
// it through vision analysis to auto-estimate macros. `data` is the entry's
// diary date (not necessarily "today"), since the limit tracks against the
// day being logged. Returns the fields to merge into the diario_alimentare
// insert/update.
export async function uploadDiarioFoto(
  supabase: SupabaseServerClient,
  patientId: string,
  data: string,
  file: File
): Promise<DiarioFotoResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type;
  const path = `${patientId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage.from(FOTO_BUCKET).upload(path, buffer, {
    contentType: mime || "application/octet-stream",
  });
  if (error) throw new Error(error.message);

  const { count } = await supabase
    .from("diario_alimentare")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .eq("data", data)
    .not("foto_path", "is", null);

  const limitReached = (count ?? 0) >= DAILY_AI_LIMIT;

  let analysis = null;
  if (!limitReached && isSupportedImageMime(mime)) {
    try {
      analysis = await analyzeFoodPhoto(buffer, mime);
    } catch (err) {
      console.error("analyzeFoodPhoto failed:", err);
    }
  }

  return {
    fields: {
      foto_path: path,
      analisi_ai: analysis?.descrizione || null,
      calorie_stimate: analysis?.calorieStimate ?? null,
      proteine_g: analysis?.proteineG ?? null,
      carboidrati_g: analysis?.carboidratiG ?? null,
      grassi_g: analysis?.grassiG ?? null,
    },
    limitReached,
  };
}
