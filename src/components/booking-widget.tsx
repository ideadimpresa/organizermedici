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

const STEPS = ["Modalità", "Prestazione", "Data e ora", "I tuoi dati"];

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
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"studio" | "online">("studio");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [days, setDays] = useState<DaySlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; addressId: string | null } | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const availableServices = useMemo(() => services.filter((s) => s.mode === mode || s.mode === "both"), [services, mode]);
  const effectiveServiceId = availableServices.find((s) => s.id === serviceId) ? serviceId : (availableServices[0]?.id ?? "");
  const selectedService = availableServices.find((s) => s.id === effectiveServiceId);

  useEffect(() => {
    if (!open || step !== 2) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the fetch triggered by entering this step / changing mode
    setLoadingSlots(true);
    fetch(`/api/availability?doctorId=${doctorId}&mode=${mode}&days=4`)
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
  }, [open, step, doctorId, mode]);

  function reset() {
    setStep(0);
    setSelectedSlot(null);
    setResult(null);
    setForm({ fullName: "", email: "", phone: "" });
  }

  function closeModal() {
    setOpen(false);
    reset();
  }

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
        mode,
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
  }

  const canGoNext = step === 0 || (step === 1 && !!effectiveServiceId) || (step === 2 && !!selectedSlot);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{doctorName}</p>
            <p className="text-xs text-secondary">Prenota una visita in pochi passaggi</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-button bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Prenota una visita
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 sm:items-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white sm:max-w-md sm:rounded-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                {!result?.ok && (
                  <p className="text-xs font-medium text-secondary">
                    Passo {step + 1} di {STEPS.length}
                  </p>
                )}
                <h3 className="font-semibold">{result?.ok ? "Prenotazione confermata" : STEPS[step]}</h3>
              </div>
              <button onClick={closeModal} aria-label="Chiudi" className="rounded-button p-1.5 text-secondary hover:bg-surface-hover">
                ✕
              </button>
            </div>

            {!result?.ok && (
              <div className="flex gap-1.5 px-5 pt-4">
                {STEPS.map((label, i) => (
                  <span key={label} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-teal" : "bg-border"}`} />
                ))}
              </div>
            )}

            <div className="p-5">
              {result?.ok ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-foreground">{result.message}</p>
                  <button
                    onClick={closeModal}
                    className="mt-5 w-full rounded-button bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    Chiudi
                  </button>
                </div>
              ) : (
                <>
                  {step === 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => setMode("studio")}
                        className={`rounded-card border p-4 text-left ${mode === "studio" ? "border-brand bg-brand-light" : "border-border"}`}
                      >
                        <p className="font-semibold">In studio</p>
                        <p className="mt-1 text-sm text-secondary">
                          {addresses[0] ? `${addresses[0].address_line}, ${addresses[0].city}` : "Visita in presenza"}
                        </p>
                      </button>
                      <button
                        onClick={() => setMode("online")}
                        className={`rounded-card border p-4 text-left ${mode === "online" ? "border-brand bg-brand-light" : "border-border"}`}
                      >
                        <p className="font-semibold">Online</p>
                        <p className="mt-1 text-sm text-secondary">Videoconsulenza da qualsiasi luogo</p>
                      </button>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-2">
                      {availableServices.length === 0 && (
                        <p className="text-sm text-secondary">Nessuna prestazione disponibile per questa modalità.</p>
                      )}
                      {availableServices.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setServiceId(s.id)}
                          className={`w-full rounded-card border p-4 text-left ${effectiveServiceId === s.id ? "border-brand bg-brand-light" : "border-border"}`}
                        >
                          <p className="font-medium">{s.name}</p>
                          <p className="mt-0.5 text-sm text-secondary">
                            {s.duration_minutes} min{s.price_cents > 0 ? ` · €${(s.price_cents / 100).toFixed(2)}` : ""}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 2 &&
                    (loadingSlots ? (
                      <p className="text-sm text-secondary">Caricamento disponibilità…</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                        {days.length === 0 && <p className="col-span-full text-sm text-secondary">Nessuna disponibilità configurata.</p>}
                      </div>
                    ))}

                  {step === 3 && (
                    <div className="space-y-3">
                      {selectedSlot && selectedService && (
                        <div className="rounded-card border border-border bg-background p-3 text-sm">
                          <p className="font-medium">{selectedService.name}</p>
                          <p className="text-secondary">
                            {new Date(selectedSlot.start).toLocaleString("it-IT", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      )}
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
                      {result && !result.ok && (
                        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">{result.message}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {!result?.ok && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="rounded-button px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-hover disabled:opacity-40"
                >
                  Indietro
                </button>
                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => Math.min(3, s + 1))}
                    disabled={!canGoNext}
                    className="rounded-button bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                  >
                    Avanti
                  </button>
                ) : (
                  <button
                    onClick={handleBook}
                    disabled={submitting || !form.fullName || !form.email}
                    className="rounded-button bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                  >
                    {submitting ? "Prenotazione in corso…" : "Conferma prenotazione"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
