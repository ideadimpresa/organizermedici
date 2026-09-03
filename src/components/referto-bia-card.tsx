import type { ReactNode } from "react";

export function RefertoBiaCard({
  dataEsame,
  note,
  imageSignedUrls,
  pdfSignedUrl,
  actions,
}: {
  dataEsame: string | null;
  note: string | null;
  imageSignedUrls: string[];
  pdfSignedUrl: string | null;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {dataEsame ? `Referto del ${new Date(dataEsame).toLocaleDateString("it-IT")}` : "Referto BIA"}
          </p>
          {note && <p className="text-sm text-secondary">{note}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {pdfSignedUrl && (
            <a href={pdfSignedUrl} target="_blank" className="text-sm text-brand hover:underline">
              Scarica PDF
            </a>
          )}
          {actions}
        </div>
      </div>
      {imageSignedUrls.length > 0 && (
        <div className="mt-3 space-y-3">
          {imageSignedUrls.map((url, i) => (
            // Signed URLs are per-request and short-lived, so next/image's
            // optimizer/cache would fight the constantly-changing query
            // string for no benefit here.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={`Pagina ${i + 1} del referto BIA`} className="w-full rounded-lg border border-border" />
          ))}
        </div>
      )}
    </div>
  );
}
