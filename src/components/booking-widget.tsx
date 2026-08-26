"use client";

import { useEffect, useMemo, useState } from "react";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  mode: "studio" | "online" | "both";
}

interface Address {
  id: string;
  label: string;
  address_line: string;
  city: string;
}

interface DaySlots {
  date: string;
  slots: { start: string; end: string; addressId: string | null }[];
}

export function BookingWidget({
  doctorId,
  doctorName,
  services,
  addresses,
}: {
  doctorId: string;
  doctorName: string;
  services: Service[];
  addresses: Address[];
}) {
  const [tab, setTab] = useState<"studio" | "online">("studio");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [days, setDays] = useState<DaySlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; addressId: string | null } | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const availableServices = useMemo(
    () => services.filter((s) => s.mode === tab || s.mode === "both"),
    [services, tab]
  );

  const effectiveServiceId = availableServices.find((s) => s.id === serviceId)
    ? serviceId
    : (availableServices[0]?.id ?? "");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting selection/loading state when the doctor or tab changes, before the fetch below resolves
    setSelectedSlot(null);
    setLoadingSlots(true);
    fetch(`/api/availability?doctorId=${doctorId}&mode=${tab}&days=4`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDays(data.days || []);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, tab]);

  async function handleBook() {
    if (!selectedSlot || !effectiveServiceId) return;
    setSubmitting(true);
    setResult(null);

    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        doctorId,
        serviceId: effectiveServiceId,
        addressId: selectedSlot.addressId,
        mode: tab,
        startsAt: selectedSlot.start,
        patient: form,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setResult({ ok: false, message: data.error || "Errore durante la prenotazione" });
      return;
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    setResult({ ok: true, message: "Prenotazione confermata! Controlla la tua email." });
    setSelectedSlot(null);
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm">
      <div className="rounded-t-2xl bg-brand px-6 py-4 text-white">
        <h3 className="font-semibold">Prenota una visita</h3>
        <p className="text-sm text-white/80">e consulta {doctorName} nel modo che preferisci</p>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("studio")}
          className={`flex-1 py-3 text-sm font-medium ${tab === "studio" ? "border-b-2 border-brand text-brand" : "text-secondary"}`}
        >
          Visita in studio
        </button>
        <button
          onClick={() => setTab("online")}
          className={`flex-1 py-3 text-sm font-medium ${tab === "online" ? "border-b-2 border-brand text-brand" : "text-secondary"}`}
        >
          Consulenza online
        </button>
      </div>

      <div className="p-6">
        {tab === "studio" && addresses[0] && (
          <p className="mb-4 text-sm text-secondary">
            <span className="font-medium text-foreground">Indirizzo:</span> {addresses[0].address_line}, {addresses[0].city}
          </p>
        )}

        <label className="block text-sm font-medium">Prestazione</label>
        <select
          value={effectiveServiceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          {availableServices.length === 0 && <option value="">Nessuna prestazione disponibile</option>}
          {availableServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.duration_minutes} min{s.price_cents > 0 ? ` · €${(s.price_cents / 100).toFixed(2)}` : ""}
            </option>
          ))}
        </select>

        <div className="mt-5">
          {loadingSlots ? (
            <p className="text-sm text-secondary">Caricamento disponibilità…</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {days.map((day) => (
                <div key={day.date} className="text-center">
                  <p className="mb-2 text-xs font-medium text-secondary">
                    {new Date(day.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {day.slots.slice(0, 4).map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg px-2 py-1.5 text-xs font-medium ${
                          selectedSlot?.start === slot.start
                            ? "bg-brand text-white"
                            : "bg-brand-light text-brand-dark hover:bg-brand hover:text-white"
                        }`}
                      >
                        {new Date(slot.start).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </button>
                    ))}
                    {day.slots.length === 0 && <span className="text-xs text-muted">—</span>}
                  </div>
                </div>
              ))}
              {days.length === 0 && <p className="col-span-4 text-sm text-secondary">Nessuna disponibilità configurata.</p>}
            </div>
          )}
        </div>

        {selectedSlot && (
          <div className="mt-6 space-y-3 border-t border-border pt-5">
            <p className="text-sm font-medium">
              Slot selezionato:{" "}
              {new Date(selectedSlot.start).toLocaleString("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <input
              placeholder="Nome e cognome"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <input
              placeholder="Telefono (opzionale)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <button
              onClick={handleBook}
              disabled={submitting || !form.fullName || !form.email}
              className="w-full rounded-button bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {submitting ? "Prenotazione in corso…" : "Conferma prenotazione"}
            </button>
          </div>
        )}

        {result && (
          <p className={`mt-4 rounded-lg px-4 py-2 text-sm ${result.ok ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
            {result.message}
          </p>
        )}

        {!selectedSlot && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-secondary">Seleziona un&apos;opzione per prenotare una visita</p>
        )}
      </div>
    </div>
  );
}
