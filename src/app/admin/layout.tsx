import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "@/app/(auth)/actions";
import { DashboardMobileNav } from "@/components/dashboard-mobile-nav";

const NAV = [
  { href: "/admin", label: "Panoramica" },
  { href: "/admin/dottori", label: "Dottori" },
  { href: "/admin/agenda", label: "Agenda (tutti)" },
  { href: "/admin/pazienti", label: "Pazienti (tutti)" },
  { href: "/admin/impostazioni", label: "Impostazioni" },
  { href: "/account/password", label: "Cambia password" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 bg-navy p-5 md:block">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="" width={28} height={25} className="h-7 w-auto" />
          <span className="text-lg font-bold text-white">
            Visita<span className="text-aqua">Up</span> <span className="text-xs font-normal text-white/50">admin</span>
          </span>
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
        <DashboardMobileNav nav={NAV} logoutAction={logout} badge="admin" />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
