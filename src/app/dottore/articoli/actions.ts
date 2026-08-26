"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createArticle(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");

  const title = String(formData.get("title") || "");
  const autoPublishSocial = formData.get("auto_publish_social") === "on";
  const publishNow = formData.get("publish_now") === "on";

  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      doctor_id: user.doctorId,
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      excerpt: String(formData.get("excerpt") || "") || null,
      content: String(formData.get("content") || ""),
      status: publishNow ? "published" : "draft",
      auto_publish_social: autoPublishSocial,
      published_at: publishNow ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (publishNow && autoPublishSocial && article) {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/social/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ articleId: article.id }),
    }).catch(() => null);
  }

  revalidatePath("/dottore/articoli");
}

export async function publishArticle(articleId: string) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");

  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", articleId)
    .select("id, auto_publish_social")
    .single();

  if (error) throw new Error(error.message);

  if (article?.auto_publish_social) {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/social/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ articleId: article.id }),
    }).catch(() => null);
  }

  revalidatePath("/dottore/articoli");
}

export async function saveSocialAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");

  const supabase = await createClient();
  const platform = formData.get("platform") as "instagram" | "facebook";
  const { error } = await supabase.from("social_accounts").upsert(
    {
      doctor_id: user.doctorId,
      platform,
      external_account_id: String(formData.get("external_account_id") || ""),
      access_token: String(formData.get("access_token") || ""),
    },
    { onConflict: "doctor_id,platform" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/articoli");
}
