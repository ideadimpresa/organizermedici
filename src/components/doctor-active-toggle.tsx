"use client";

import { useTransition } from "react";
import { toggleDoctorActive } from "@/app/admin/dottori/actions";

export function DoctorActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleDoctorActive(id, !isActive))}
      className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
        isActive ? "border border-red-200 text-red-600 hover:bg-red-50" : "bg-brand text-white hover:bg-brand-dark"
      }`}
    >
      {isActive ? "Disattiva" : "Attiva"}
    </button>
  );
}
