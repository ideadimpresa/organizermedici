"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export function DashboardMobileNav({
  nav,
  logoutAction,
  badge,
}: {
  nav: { href: string; label: string }[];
  logoutAction: () => void | Promise<void>;
  badge?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-border bg-white px-4 py-3 md:hidden">
        <Link href="/">
          <Image src="/logo-full.png" alt="VisitaUp" width={130} height={30} className="h-7 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
          className="rounded-lg p-2 text-navy hover:bg-background"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M2 5h18M2 11h18M2 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-navy md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <Image src="/logo-icon.png" alt="" width={28} height={25} className="h-7 w-auto" />
              <span className="text-lg font-bold text-white">
                Visita<span className="text-aqua">Up</span>
                {badge && <span className="ml-1 text-xs font-normal text-white/50">{badge}</span>}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chiudi menu"
              className="rounded-lg p-2 text-white/70 hover:text-white"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="border-t border-white/10 px-4 py-4">
            <button type="submit" className="text-sm text-white/60 hover:text-white">
              Esci
            </button>
          </form>
        </div>
      )}
    </>
  );
}
