"use client";

import { useState, useTransition } from "react";
import {
  parseBiaPdf,
  confirmBiaImport,
  discardBiaImport,
  type BiaParseResult,
} from "@/app/dottore/pazienti/[id]/actions";

export function BiaImportForm({ patientId }: { patientId: string }) {
  const [result, setResult] = useState<BiaParseResult | null>(null);
  const [showText, setShowText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, startParsing] = useTransition();
  const [confirming, startConfirming] = useTransition();

  function handleFile(file: File) {
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startParsing(async () => {
      try {
        setResult(await parseBiaPdf(patientId, fd));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore durante l'analisi del PDF");
      }
    });
  }

  function handleConfirm(formData: FormData) {
    if (!result) return;
    startConfirming(async () => {
      try {
        await confirmBiaImport(patientId, result.filePath, formData);
        setResult(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore durante il salvataggio");
      }
    });
  }

  function handleCancel() {
    if (result) discardBiaImport(result.filePath);
    setResult(null);
    setError(null);
  }

  if (!result) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
        <h3 className="font-semibold">Importa referto BIA (PDF Akern)</h3>
        <p className="text-sm text-secondary">
          I valori vengono letti automaticamente dal PDF: potrai correggerli prima di salvare.
        </p>
        <input
          type="file"
          accept="application/pdf"
          disabled={parsing}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="text-sm"
        />
        {parsing && <p className="text-sm text-secondary">Analisi del PDF in corso…</p>}
        {error && <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">{error}</p>}
      </div>
    );
  }

  const { parsed } = result;

  return (
    <form action={handleConfirm} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="font-semibold">Conferma valori BIA</h3>
      <p className="text-sm text-secondary">Verifica e correggi i valori letti dal PDF prima di salvare.</p>
      <input
        name="data"
        type="date"
        required
        defaultValue={new Date().toISOString().slice(0, 10)}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <input name="peso_kg" type="number" step="0.1" defaultValue={parsed.peso_kg ?? ""} placeholder="Peso (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        <input name="massa_grassa_perc" type="number" step="0.1" defaultValue={parsed.massa_grassa_perc ?? ""} placeholder="Massa grassa (%)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        <input name="massa_grassa_kg" type="number" step="0.1" defaultValue={parsed.massa_grassa_kg ?? ""} placeholder="Massa grassa (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        <input name="massa_magra_kg" type="number" step="0.1" defaultValue={parsed.massa_magra_kg ?? ""} placeholder="Massa magra (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        <input name="massa_muscolare_kg" type="number" step="0.1" defaultValue={parsed.massa_muscolare_kg ?? ""} placeholder="Massa muscolare (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        <input name="acqua_perc" type="number" step="0.1" defaultValue={parsed.acqua_perc ?? ""} placeholder="Acqua (%)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        <input name="acqua_kg" type="number" step="0.1" defaultValue={parsed.acqua_kg ?? ""} placeholder="Acqua (kg)" className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
      </div>
      <textarea name="note" placeholder="Note" rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />

      <button type="button" onClick={() => setShowText((v) => !v)} className="text-xs font-medium text-brand hover:underline">
        {showText ? "Nascondi" : "Mostra"} testo estratto dal PDF
      </button>
      {showText && (
        <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-background p-3 text-xs text-secondary">{result.textPreview}</pre>
      )}

      {error && <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={handleCancel} className="flex-1 rounded-button border border-border py-2 text-sm font-semibold hover:bg-surface-hover">
          Annulla
        </button>
        <button type="submit" disabled={confirming} className="flex-1 rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
          {confirming ? "Salvataggio…" : "Salva misurazione"}
        </button>
      </div>
    </form>
  );
}
