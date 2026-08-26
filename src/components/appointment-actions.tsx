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
          className="rounded-full bg-brand px-3 py-1 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Conferma
        </button>
      )}
      {(status === "pending" || status === "confirmed") && (
        <>
          <button
            disabled={isPending}
            onClick={() => set("completed")}
            className="rounded-full border border-black/20 px-3 py-1 font-medium hover:bg-black/5 disabled:opacity-50"
          >
            Completata
          </button>
          <button
            disabled={isPending}
            onClick={() => set("cancelled")}
            className="rounded-full border border-red-200 px-3 py-1 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Annulla
          </button>
        </>
      )}
    </div>
  );
}
