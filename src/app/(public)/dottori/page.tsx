import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DoctorsDirectoryPage() {
  const supabase = await createClient();
  const { data: doctors } = await supabase
    .from("doctors")
    .select("slug, display_name, title, bio, specializations")
    .eq("is_active", true)
    .order("display_name");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold">Trova un nutrizionista</h1>
      <div className="mt-6 space-y-4">
        {doctors && doctors.length > 0 ? (
          doctors.map((d) => (
            <Link
              key={d.slug}
              href={`/dottori/${d.slug}`}
              className="flex items-start gap-4 rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card transition hover:shadow-md"
            >
              <div className="h-16 w-16 shrink-0 rounded-card bg-brand-light" />
              <div>
                <h2 className="font-semibold">{d.display_name}</h2>
                <p className="text-sm text-secondary">{d.title}</p>
                {d.bio && <p className="mt-1 line-clamp-2 text-sm text-foreground">{d.bio}</p>}
              </div>
            </Link>
          ))
        ) : (
          <p className="text-secondary">Nessun professionista disponibile al momento.</p>
        )}
      </div>
    </div>
  );
}
