"use client";

import { useTransition } from "react";
import { updateAppointmentStatus } from "@/app/dottore/agenda/actions";
import type { AppointmentStatus } from "@/lib/types/database";

export function AppointmentActions({ id, status }: { id: string; status: AppointmentStatus }) {
  const [isPending, startTransition] = useTransition();

  function set(next: AppointmentStatus) {
    startTransition(() => updateAppointmentStatus(id, next));
  }

  return (
    <div className="flex gap-2 text-xs">
      {status === "pending" && (
        <button
          disabled={isPending}
          onClick={() => set("confirmed")}
          className="rounded-button bg-brand px-3 py-1 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Conferma
        </button>
      )}
      {(status === "pending" || status === "confirmed") && (
        <>
          <button
            disabled={isPending}
            onClick={() => set("completed")}
            className="rounded-button border border-border px-3 py-1 font-semibold hover:bg-surface-hover disabled:opacity-50"
          >
            Completata
          </button>
          <button
            disabled={isPending}
            onClick={() => set("cancelled")}
            className="rounded-button border border-error/30 px-3 py-1 font-semibold text-error hover:bg-error-light disabled:opacity-50"
          >
            Annulla
          </button>
        </>
      )}
    </div>
  );
}
