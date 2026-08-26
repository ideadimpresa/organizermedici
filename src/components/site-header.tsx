import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getCurrentUser();

  const dashboardHref =
    user?.role === "superadmin" ? "/admin" : user?.role === "doctor" || user?.role === "staff" ? "/dottore/agenda" : "/area-personale";

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/">
          <Image src="/logo-full.png" alt="VisitaUp" width={168} height={39} className="h-8 w-auto" priority />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dottori" className="hidden sm:inline hover:text-brand">
            Trova un nutrizionista
          </Link>
          {user ? (
            <Link
              href={dashboardHref}
              className="rounded-button bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
            >
              La mia area
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand">
                Accedi
              </Link>
              <Link
                href="/registrati"
                className="rounded-button bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
              >
                Registrati
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
