"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/app/dottore/agenda/actions";

interface Patient {
  id: string;
  full_name: string;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  mode: "studio" | "online" | "both";
}

interface Address {
  id: string;
  label: string;
  city: string;
}

export function NewAppointmentForm({
  patients,
  services,
  addresses,
  defaultDate,
}: {
  patients: Patient[];
  services: Service[];
  addresses: Address[];
  defaultDate?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [patientMode, setPatientMode] = useState<"existing" | "new">(patients.length ? "existing" : "new");
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [mode, setMode] = useState<"studio" | "online">("studio");
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate ?? "");
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !serviceId) {
      setResult({ ok: false, message: "Compila data e prestazione" });
      return;
    }
    setResult(null);
    const startsAtIso = new Date(`${date}T${time}`).toISOString();

    startTransition(async () => {
      try {
        await createAppointment({
          patientId: patientMode === "existing" ? patientId : undefined,
          newPatient: patientMode === "new" ? { fullName: newPatientName, email: newPatientEmail, phone: newPatientPhone } : undefined,
          serviceId,
          startsAtIso,
          mode,
          addressId: mode === "studio" ? addressId : null,
          notes,
        });
        setResult({ ok: true, message: "Appuntamento creato." });
        setNewPatientName("");
        setNewPatientEmail("");
        setNewPatientPhone("");
        setNotes("");
        router.refresh();
      } catch (err) {
        setResult({ ok: false, message: err instanceof Error ? err.message : "Errore imprevisto" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-white p-5">
      <h2 className="font-semibold">Nuovo appuntamento</h2>

      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPatientMode("existing")}
          className={`rounded-button px-3 py-1.5 font-medium ${patientMode === "existing" ? "bg-brand text-white" : "border border-border"}`}
        >
          Paziente esistente
        </button>
        <button
          type="button"
          onClick={() => setPatientMode("new")}
          className={`rounded-button px-3 py-1.5 font-medium ${patientMode === "new" ? "bg-brand text-white" : "border border-border"}`}
        >
          Nuovo paziente
        </button>
      </div>

      {patientMode === "existing" ? (
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          {patients.length === 0 && <option value="">Nessun paziente disponibile</option>}
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      ) : (
        <div className="space-y-2">
          <input
            required
            placeholder="Nome e cognome"
            value={newPatientName}
            onChange={(e) => setNewPatientName(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <input
            placeholder="Email (opzionale)"
            type="email"
            value={newPatientEmail}
            onChange={(e) => setNewPatientEmail(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <input
            placeholder="Telefono (opzionale)"
            value={newPatientPhone}
            onChange={(e) => setNewPatientPhone(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      )}

      <select
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
      >
        {services.length === 0 && <option value="">Nessuna prestazione configurata</option>}
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.duration_minutes} min
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <input
          required
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as "studio" | "online")}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
      >
        <option value="studio">In studio</option>
        <option value="online">Online</option>
      </select>

      {mode === "studio" && addresses.length > 0 && (
        <select
          value={addressId}
          onChange={(e) => setAddressId(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          {addresses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} — {a.city}
            </option>
          ))}
        </select>
      )}

      <textarea
        placeholder="Note (opzionale)"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-button bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {isPending ? "Creazione in corso…" : "Crea appuntamento"}
      </button>

      {result && (
        <p className={`rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
