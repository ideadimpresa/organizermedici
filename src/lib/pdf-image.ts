const MAX_PAGES = 10;
const SCALE = 2;

// mupdf is a ~14MB WASM module — loaded lazily (dynamic import) so merely
// importing this file never pulls it into a route that doesn't render a
// PDF, same reasoning as the lazy pdf-parse import in lib/pdf.ts. Unlike
// pdf-parse/pdfjs-dist, mupdf ships as pure WASM with no native binary, so
// it doesn't carry the same platform-mismatch crash risk on Vercel.
export async function renderPdfToImages(buffer: Buffer): Promise<Buffer[]> {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  const pageCount = Math.min(doc.countPages(), MAX_PAGES);
  const matrix = mupdf.Matrix.scale(SCALE, SCALE);

  const images: Buffer[] = [];
  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false);
    images.push(Buffer.from(pixmap.asPNG()));
  }
  return images;
}
