"use client";

import { useState } from "react";

export function SubscribeButton({ plan, label }: { plan: "starter" | "pro"; label: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/subscription", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else alert(data.error || "Errore durante l'attivazione dell'abbonamento");
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-full bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
    >
      {loading ? "Attendere…" : label}
    </button>
  );
}
