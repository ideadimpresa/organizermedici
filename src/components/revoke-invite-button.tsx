"use client";

import { useTransition } from "react";
import { revokeInvite } from "@/app/admin/dottori/actions";

export function RevokeInviteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => revokeInvite(id))}
      className="text-xs font-medium text-error hover:underline disabled:opacity-50"
    >
      Revoca
    </button>
  );
}
