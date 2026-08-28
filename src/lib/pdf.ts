// pdf-parse (and the pdfjs-dist bundle it pulls in) is loaded lazily so that
// merely importing this module — e.g. transitively, via a server action file
// referenced from a page for its other exports — never pulls the parser into
// routes that don't actually handle a PDF upload.
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export interface ParsedBiaFields {
  peso_kg: number | null;
  massa_grassa_kg: number | null;
  massa_grassa_perc: number | null;
  massa_magra_kg: number | null;
  massa_muscolare_kg: number | null;
  acqua_perc: number | null;
  acqua_kg: number | null;
}

function extractNumberNear(text: string, labels: string[], unit?: "%" | "kg"): number | null {
  const regex = unit === "%" ? /(\d+(?:[.,]\d+)?)\s*%/ : unit === "kg" ? /(\d+(?:[.,]\d+)?)\s*kg/i : /(\d+(?:[.,]\d+)?)/;
  for (const line of text.split(/\n/)) {
    const lower = line.toLowerCase();
    if (labels.some((label) => lower.includes(label))) {
      const match = line.match(regex);
      if (match) return parseFloat(match[1].replace(",", "."));
    }
  }
  return null;
}

// Best-effort extraction of Akern/BIA report values from raw PDF text. The exact
// report layout varies by device/software, so this is intentionally lenient
// (label keyword + nearest number) — the caller must always let the doctor
// review and correct the values before saving, never save them unattended.
export function parseBiaFields(text: string): ParsedBiaFields {
  return {
    peso_kg: extractNumberNear(text, ["peso"], "kg") ?? extractNumberNear(text, ["peso"]),
    massa_grassa_kg: extractNumberNear(text, ["massa grassa", "fat mass"], "kg"),
    massa_grassa_perc: extractNumberNear(text, ["massa grassa", "fat mass", "grasso corporeo"], "%"),
    massa_magra_kg: extractNumberNear(text, ["massa magra", "fat free", "ffm"], "kg"),
    massa_muscolare_kg: extractNumberNear(text, ["massa muscolare", "massa cellulare", "bcm"], "kg"),
    acqua_perc: extractNumberNear(text, ["acqua corporea", "acqua totale", "tbw"], "%"),
    acqua_kg: extractNumberNear(text, ["acqua corporea", "acqua totale", "tbw"], "kg"),
  };
}
