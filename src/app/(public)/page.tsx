import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: doctors } = await supabase
    .from("doctors")
    .select("slug, display_name, title, avatar_url, city:addresses(city)")
    .eq("is_active", true)
    .limit(6);

  return (
    <div>
      <section className="bg-brand-light/40">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-navy sm:text-5xl">
            Prenota il tuo nutrizionista, quando vuoi
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground">
            Agenda online, consulenze in studio o a distanza, promemoria automatici.
            Tutto in un&apos;unica piattaforma pensata per professionisti della nutrizione.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dottori"
              className="rounded-button bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
            >
              Trova un nutrizionista
            </Link>
            <Link
              href="/per-professionisti"
              className="rounded-button border border-brand px-6 py-3 font-semibold text-brand hover:bg-white"
            >
              Sei un professionista? Scoprilo
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold">Professionisti disponibili</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctors && doctors.length > 0 ? (
            doctors.map((d) => (
              <Link
                key={d.slug}
                href={`/dottori/${d.slug}`}
                className="rounded-xl border border-border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="h-12 w-12 rounded-full bg-brand-light" />
                <h3 className="mt-3 font-semibold">{d.display_name}</h3>
                <p className="text-sm text-secondary">{d.title}</p>
              </Link>
            ))
          ) : (
            <p className="text-secondary">Nessun profilo pubblicato ancora. Torna presto!</p>
          )}
        </div>
      </section>
    </div>
  );
}
