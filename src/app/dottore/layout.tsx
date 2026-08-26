import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "@/app/(auth)/actions";

const NAV = [
  { href: "/dottore/agenda", label: "Agenda" },
  { href: "/dottore/pazienti", label: "Pazienti" },
  { href: "/dottore/servizi", label: "Prestazioni" },
  { href: "/dottore/disponibilita", label: "Disponibilità" },
  { href: "/dottore/articoli", label: "Articoli & Social" },
  { href: "/dottore/abbonamento", label: "Abbonamento" },
  { href: "/dottore/profilo", label: "Profilo pubblico" },
];

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "doctor" && user.role !== "staff" && user.role !== "superadmin")) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 bg-navy p-5 md:block">
        <Link href="/" className="text-lg font-bold text-white">
          Visita<span className="text-aqua">Up</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-8">
          <button className="text-sm text-white/50 hover:text-white">Esci</button>
        </form>
      </aside>
      <div className="flex-1 bg-background">
        <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4 md:hidden">
          <Link href="/" className="text-lg font-bold text-navy">
            Visita<span className="text-teal">Up</span>
          </Link>
          <form action={logout}>
            <button className="text-sm text-secondary">Esci</button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
