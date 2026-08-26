"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleAppointment } from "@/app/dottore/agenda/actions";

export function RescheduleAppointment({ id, currentStartsAt }: { id: string; currentStartsAt: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const current = new Date(currentStartsAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const [date, setDate] = useState(`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`);
  const [time, setTime] = useState(`${pad(current.getHours())}:${pad(current.getMinutes())}`);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    const newStartsAtIso = new Date(`${date}T${time}`).toISOString();
    startTransition(async () => {
      try {
        await rescheduleAppointment(id, newStartsAtIso);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore imprevisto");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-button border border-border px-3 py-1 text-xs font-semibold hover:bg-surface-hover"
      >
        Sposta
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-border px-2 py-1 text-xs focus:border-brand focus:outline-none"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="rounded-lg border border-border px-2 py-1 text-xs focus:border-brand focus:outline-none"
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-button bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {isPending ? "Salvataggio…" : "Conferma"}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-secondary hover:text-foreground">
        Annulla
      </button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </div>
  );
}
