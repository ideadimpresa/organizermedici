"use client";

import { useState, useTransition } from "react";
import { importBiaRows } from "@/app/dottore/pazienti/[id]/actions";

interface Row {
  id: number;
  data: string;
  peso_kg: string;
  massa_grassa_kg: string;
  massa_grassa_perc: string;
  massa_magra_kg: string;
  massa_muscolare_kg: string;
  acqua_perc: string;
  acqua_kg: string;
}

const FIELD_KEYS = [
  "peso_kg",
  "massa_grassa_kg",
  "massa_grassa_perc",
  "massa_magra_kg",
  "massa_muscolare_kg",
  "acqua_perc",
  "acqua_kg",
] as const;

const COLUMN_LABEL: Record<(typeof FIELD_KEYS)[number], string> = {
  peso_kg: "Peso (kg)",
  massa_grassa_kg: "M. grassa (kg)",
  massa_grassa_perc: "M. grassa (%)",
  massa_magra_kg: "M. magra (kg)",
  massa_muscolare_kg: "M. muscolare (kg)",
  acqua_perc: "Acqua (%)",
  acqua_kg: "Acqua (kg)",
};

let rowIdCounter = 0;
function emptyRow(): Row {
  return {
    id: rowIdCounter++,
    data: "",
    peso_kg: "",
    massa_grassa_kg: "",
    massa_grassa_perc: "",
    massa_magra_kg: "",
    massa_muscolare_kg: "",
    acqua_perc: "",
    acqua_kg: "",
  };
}

export function BiaValuesForm({ patientId }: { patientId: string }) {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateRow(id: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validRows = rows.filter((r) => r.data);
    if (validRows.length === 0) {
      setError("Compila almeno una riga con la data dell'esame");
      return;
    }

    const fd = new FormData();
    fd.set("rowsCount", String(validRows.length));
    validRows.forEach((r, i) => {
      fd.set(`data-${i}`, r.data);
      for (const key of FIELD_KEYS) fd.set(`${key}-${i}`, r[key]);
    });

    startTransition(async () => {
      try {
        await importBiaRows(patientId, fd);
        setSuccess(true);
        setRows([emptyRow()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore durante il salvataggio");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="font-semibold">Aggiorna i grafici (facoltativo)</h3>
      <p className="text-sm text-secondary">
        Per far comparire l&apos;andamento nel tempo nei grafici, trascrivi qui i valori che leggi in un referto —
        una riga per data di esame. Non è necessario per archiviare il referto: puoi caricarlo come immagine qui
        sotto anche senza compilare questa tabella.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-secondary">
              <th className="pb-1 pr-2 font-medium">Data</th>
              {FIELD_KEYS.map((key) => (
                <th key={key} className="pb-1 pr-2 font-medium">
                  {COLUMN_LABEL[key]}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="pb-1.5 pr-2">
                  <input
                    type="date"
                    value={r.data}
                    onChange={(e) => updateRow(r.id, "data", e.target.value)}
                    className="w-32 rounded-lg border border-border px-1.5 py-1 text-xs focus:border-brand focus:outline-none"
                  />
                </td>
                {FIELD_KEYS.map((key) => (
                  <td key={key} className="pb-1.5 pr-2">
                    <input
                      type="number"
                      step="0.1"
                      value={r[key]}
                      onChange={(e) => updateRow(r.id, key, e.target.value)}
                      className="w-16 rounded-lg border border-border px-1.5 py-1 text-xs focus:border-brand focus:outline-none"
                    />
                  </td>
                ))}
                <td className="pb-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(r.id)}
                    aria-label="Rimuovi riga"
                    className="text-error hover:underline"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={addRow} className="text-xs font-medium text-brand hover:underline">
        + Aggiungi riga
      </button>

      {error && <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">{error}</p>}
      {success && <p className="rounded-lg bg-success-light px-3 py-2 text-sm text-success">Misurazioni salvate.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-button border border-brand py-2 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : "Salva valori"}
      </button>
    </form>
  );
}
