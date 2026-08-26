import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GRAPH_VERSION = "v21.0";

async function publishToFacebook(pageId: string, accessToken: string, message: string, link: string) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, link, access_token: accessToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Errore pubblicazione Facebook");
  return data.id as string;
}

async function publishToInstagram(igUserId: string, accessToken: string, imageUrl: string, caption: string) {
  const createRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(createData.error?.message || "Errore creazione media Instagram");

  const publishRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok) throw new Error(publishData.error?.message || "Errore pubblicazione Instagram");
  return publishData.id as string;
}

/**
 * Publishes an already-published article to the doctor's connected social accounts.
 * Requires the doctor to have configured social_accounts (Meta Graph API tokens).
 * Instagram publishing requires the article to have a cover image (Graph API needs an image_url).
 */
export async function POST(request: Request) {
  const { articleId } = await request.json();
  if (!articleId) return NextResponse.json({ error: "articleId richiesto" }, { status: 400 });

  const admin = createAdminClient();

  const { data: article } = await admin.from("articles").select("*").eq("id", articleId).single();
  if (!article) return NextResponse.json({ error: "Articolo non trovato" }, { status: 404 });

  const { data: accounts } = await admin
    .from("social_accounts")
    .select("*")
    .eq("doctor_id", article.doctor_id)
    .eq("is_active", true);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ skipped: true, reason: "Nessun account social collegato" });
  }

  const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/articoli/${article.slug}`;
  const caption = `${article.title}\n\n${article.excerpt || ""}\n${articleUrl}`;
  const results: { platform: string; ok: boolean; error?: string }[] = [];

  for (const account of accounts) {
    const { data: post } = await admin
      .from("social_posts")
      .insert({ article_id: article.id, doctor_id: article.doctor_id, platform: account.platform, status: "pending" })
      .select("id")
      .single();

    try {
      let externalId: string;
      if (account.platform === "facebook") {
        externalId = await publishToFacebook(account.external_account_id, account.access_token, caption, articleUrl);
      } else {
        if (!article.cover_url) throw new Error("Instagram richiede un'immagine di copertina per l'articolo");
        externalId = await publishToInstagram(account.external_account_id, account.access_token, article.cover_url, caption);
      }
      await admin
        .from("social_posts")
        .update({ status: "posted", external_post_id: externalId, posted_at: new Date().toISOString() })
        .eq("id", post!.id);
      results.push({ platform: account.platform, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore sconosciuto";
      await admin.from("social_posts").update({ status: "failed", error_message: message }).eq("id", post!.id);
      results.push({ platform: account.platform, ok: false, error: message });
    }
  }

  return NextResponse.json({ results });
}
