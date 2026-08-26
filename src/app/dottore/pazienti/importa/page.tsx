"use client";

import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";

const TARGET_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "full_name", label: "Nome e cognome", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefono" },
  { key: "fiscal_code", label: "Codice fiscale" },
  { key: "birth_date", label: "Data di nascita (YYYY-MM-DD)" },
  { key: "notes", label: "Note" },
];

export default function ImportPatientsPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields || [];
        setHeaders(fields);
        setRows(results.data);
        const autoMap: Record<string, string> = {};
        for (const target of TARGET_FIELDS) {
          const match = fields.find((f) => f.toLowerCase().includes(target.key.split("_")[0]));
          if (match) autoMap[target.key] = match;
        }
        setMapping(autoMap);
        setStatus(null);
      },
    });
  }

  async function handleImport() {
    if (!mapping.full_name) {
      setStatus({ ok: false, message: "Devi mappare almeno la colonna Nome e cognome" });
      return;
    }
    setSubmitting(true);
    const mappedRows = rows.map((row) => {
      const out: Record<string, string> = {};
      for (const target of TARGET_FIELDS) {
        const sourceCol = mapping[target.key];
        if (sourceCol) out[target.key] = row[sourceCol] ?? "";
      }
      return out;
    });

    const res = await fetch("/api/patients/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rows: mappedRows }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setStatus({ ok: false, message: data.error || "Errore durante l'importazione" });
      return;
    }
    setStatus({ ok: true, message: `${data.imported} pazienti importati con successo.` });
    setRows([]);
    setHeaders([]);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Importa pazienti</h1>
        <Link href="/dottore/pazienti" className="text-sm text-brand hover:underline">
          Torna alla lista
        </Link>
      </div>
      <p className="mt-1 text-secondary">Carica un file CSV esportato dal tuo gestionale, Excel o Google Contacts.</p>

      <div className="mt-6 rounded-xl border border-border bg-white p-6">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="text-sm"
        />

        {headers.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold">Associa le colonne</h2>
            <p className="text-sm text-secondary">Trovate {rows.length} righe nel file.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TARGET_FIELDS.map((target) => (
                <div key={target.key}>
                  <label className="block text-sm font-medium">
                    {target.label} {target.required && <span className="text-error">*</span>}
                  </label>
                  <select
                    value={mapping[target.key] || ""}
                    onChange={(e) => setMapping({ ...mapping, [target.key]: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  >
                    <option value="">— non importare —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button
              onClick={handleImport}
              disabled={submitting}
              className="mt-6 rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {submitting ? "Importazione in corso…" : `Importa ${rows.length} pazienti`}
            </button>
          </div>
        )}

        {status && (
          <p className={`mt-4 rounded-lg px-4 py-2 text-sm ${status.ok ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
