import type { ReactNode } from "react";
import { splitByWeekHeadings } from "@/lib/meal-plan";

export function MealPlanCard({
  titolo,
  contentText,
  note,
  signedUrl,
  rangeLabel,
  actions,
}: {
  titolo: string;
  contentText: string | null;
  note: string | null;
  signedUrl: string | null;
  rangeLabel: string | null;
  actions?: ReactNode;
}) {
  const weeks = contentText ? splitByWeekHeadings(contentText) : null;

  return (
    <details className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-4 shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="font-medium">{titolo}</p>
          {rangeLabel && <p className="text-sm text-secondary">{rangeLabel}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {signedUrl && (
            <a href={signedUrl} target="_blank" className="text-sm text-brand hover:underline">
              Apri PDF
            </a>
          )}
          {actions}
        </div>
      </summary>
      {note && <p className="mt-3 text-sm text-secondary">{note}</p>}
      {weeks ? (
        <div className="mt-3 space-y-3">
          {weeks.map((w) => (
            <div key={w.label}>
              <p className="text-sm font-semibold text-navy">{w.label}</p>
              <pre className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-background p-3 text-xs text-secondary">{w.content}</pre>
            </div>
          ))}
        </div>
      ) : (
        contentText && (
          <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-background p-3 text-xs text-secondary">{contentText}</pre>
        )
      )}
    </details>
  );
}
