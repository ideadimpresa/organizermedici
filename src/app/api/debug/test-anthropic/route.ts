import { NextResponse } from "next/server";
import { analyzeFoodPhoto } from "@/lib/ai-food";
import { getPlatformSettings } from "@/lib/settings";

// TEMPORARY diagnostic route to verify the ANTHROPIC_API_KEY env var works
// in production. Remove after use — see conversation that added it.
const DEBUG_TOKEN = "vuai-7f2c9e4a1b6d4e3f8a2c0d9b5e7f1a3c";

// A valid 1x1 transparent PNG — content doesn't matter, this only checks
// that the API key authenticates and the SDK call succeeds end to end.
const TEST_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== DEBUG_TOKEN) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { anthropicApiKey } = await getPlatformSettings();

  try {
    const result = await analyzeFoodPhoto(Buffer.from(TEST_PNG_BASE64, "base64"), "image/png");
    return NextResponse.json({
      keyConfigured: !!anthropicApiKey,
      ok: result !== null,
      result,
    });
  } catch (err) {
    return NextResponse.json({
      keyConfigured: !!anthropicApiKey,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
