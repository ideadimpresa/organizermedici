import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getCurrentUser();

  const dashboardHref =
    user?.role === "superadmin" ? "/admin" : user?.role === "doctor" || user?.role === "staff" ? "/dottore/agenda" : "/area-personale";

  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-brand">
          VisitaUp
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dottori" className="hidden sm:inline hover:text-brand">
            Trova un nutrizionista
          </Link>
          {user ? (
            <Link
              href={dashboardHref}
              className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
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
                className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
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
