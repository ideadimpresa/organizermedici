"use client";

import { useTransition } from "react";
import { toggleDoctorActive } from "@/app/admin/dottori/actions";

export function DoctorActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleDoctorActive(id, !isActive))}
      className={`rounded-button px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
        isActive ? "border border-error/30 text-error hover:bg-error-light" : "bg-brand text-white hover:bg-brand-dark"
      }`}
    >
      {isActive ? "Disattiva" : "Attiva"}
    </button>
  );
}
