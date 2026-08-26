"use client";

import { useTransition } from "react";
import { publishArticle } from "@/app/dottore/articoli/actions";

export function PublishButton({ articleId }: { articleId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => publishArticle(articleId))}
      className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
    >
      {isPending ? "Pubblicazione…" : "Pubblica"}
    </button>
  );
}
