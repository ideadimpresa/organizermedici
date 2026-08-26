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
        className="rounded-full border border-black/20 px-3 py-1 font-medium hover:bg-black/5 disabled:opacity-50"
      >
        {isActive ? "Disattiva" : "Attiva"}
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm("Eliminare questa prestazione?")) startTransition(() => deleteService(id));
        }}
        className="rounded-full border border-red-200 px-3 py-1 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Elimina
      </button>
    </div>
  );
}
