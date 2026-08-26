"use client";

import { useTransition } from "react";
import { deleteAvailabilityRule } from "@/app/dottore/disponibilita/actions";

export function RuleDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => deleteAvailabilityRule(id))}
      className="text-xs font-medium text-error hover:underline disabled:opacity-50"
    >
      Rimuovi
    </button>
  );
}
