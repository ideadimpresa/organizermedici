import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("*, doctors(display_name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!article) notFound();
  const doctor = article.doctors as unknown as { display_name: string; slug: string };

  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <Link href={`/dottori/${doctor.slug}`} className="text-sm text-brand hover:underline">
        {doctor.display_name}
      </Link>
      <h1 className="mt-2 text-3xl font-bold">{article.title}</h1>
      <p className="mt-4 whitespace-pre-line text-foreground">{article.content}</p>
    </article>
  );
}
