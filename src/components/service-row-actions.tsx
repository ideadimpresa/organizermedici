"use client";

import { useTransition } from "react";
import { toggleService, deleteService } from "@/app/dottore/servizi/actions";

export function ServiceRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2 text-xs">
      <button
        disabled={isPending}
        onClick={() => startTransition(() => toggleService(id, !isActive))}
        className="rounded-button border border-border px-3 py-1 font-semibold hover:bg-surface-hover disabled:opacity-50"
      >
        {isActive ? "Disattiva" : "Attiva"}
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm("Eliminare questa prestazione?")) startTransition(() => deleteService(id));
        }}
        className="rounded-button border border-error/30 px-3 py-1 font-semibold text-error hover:bg-error-light disabled:opacity-50"
      >
        Elimina
      </button>
    </div>
  );
}
