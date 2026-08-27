"use client";

import { useTransition } from "react";

export function EntryDeleteButton({ action }: { action: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => action())}
      className="text-xs font-medium text-error hover:underline disabled:opacity-50"
    >
      Rimuovi
    </button>
  );
}
