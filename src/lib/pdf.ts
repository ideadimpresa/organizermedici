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
