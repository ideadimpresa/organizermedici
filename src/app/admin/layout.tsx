import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "@/app/(auth)/actions";

const NAV = [
  { href: "/admin", label: "Panoramica" },
  { href: "/admin/dottori", label: "Dottori" },
  { href: "/admin/agenda", label: "Agenda (tutti)" },
  { href: "/admin/pazienti", label: "Pazienti (tutti)" },
  { href: "/admin/impostazioni", label: "Impostazioni" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-white p-5 md:block">
        <Link href="/" className="text-lg font-bold text-brand">
          VisitaUp <span className="text-xs font-normal text-black/40">admin</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-black/70 hover:bg-brand-light hover:text-brand-dark">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-8">
          <button className="text-sm text-black/50 hover:text-black">Esci</button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
