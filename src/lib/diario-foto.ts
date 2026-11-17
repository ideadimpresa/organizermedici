import type { createClient } from "@/lib/supabase/server";
import { analyzeFoodPhoto, isSupportedImageMime } from "@/lib/ai-food";

const FOTO_BUCKET = "foto-diario";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Uploads a diario meal photo and runs it through AI vision analysis, when
// a key is configured, to auto-estimate macros. Returns the fields to
// merge into the diario_alimentare insert/update.
export async function uploadDiarioFoto(supabase: SupabaseServerClient, patientId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type;
  const path = `${patientId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage.from(FOTO_BUCKET).upload(path, buffer, {
    contentType: mime || "application/octet-stream",
  });
  if (error) throw new Error(error.message);

  let analysis = null;
  if (isSupportedImageMime(mime)) {
    try {
      analysis = await analyzeFoodPhoto(buffer, mime);
    } catch (err) {
      console.error("analyzeFoodPhoto failed:", err);
    }
  }

  return {
    foto_path: path,
    analisi_ai: analysis?.descrizione || null,
    calorie_stimate: analysis?.calorieStimate ?? null,
    proteine_g: analysis?.proteineG ?? null,
    carboidrati_g: analysis?.carboidratiG ?? null,
    grassi_g: analysis?.grassiG ?? null,
  };
}
