import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createArticle, saveSocialAccount } from "./actions";
import { PublishButton } from "@/components/publish-button";

export default async function ArticlesPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: articles }, { data: socialAccounts }] = await Promise.all([
    supabase.from("articles").select("*").eq("doctor_id", user?.doctorId ?? "").order("created_at", { ascending: false }),
    supabase.from("social_accounts").select("*").eq("doctor_id", user?.doctorId ?? ""),
  ]);

  const igAccount = socialAccounts?.find((a) => a.platform === "instagram");
  const fbAccount = socialAccounts?.find((a) => a.platform === "facebook");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Articoli & Social</h1>
        <p className="mt-1 text-black/60">
          Pubblica contenuti su stili di vita sani e condividili automaticamente sui tuoi profili social.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {(articles || []).map((a) => (
            <div key={a.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{a.title}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${a.status === "published" ? "bg-green-100 text-green-700" : "bg-black/10 text-black/60"}`}>
                  {a.status === "published" ? "Pubblicato" : "Bozza"}
                </span>
              </div>
              {a.excerpt && <p className="mt-1 text-sm text-black/60">{a.excerpt}</p>}
              <div className="mt-3 flex items-center gap-3">
                {a.status === "draft" && <PublishButton articleId={a.id} />}
                {a.auto_publish_social && <span className="text-xs text-black/40">Auto-pubblicazione social attiva</span>}
              </div>
            </div>
          ))}
          {(!articles || articles.length === 0) && (
            <p className="rounded-xl border border-dashed border-black/20 bg-white p-8 text-center text-black/50">
              Nessun articolo ancora. Scrivi il primo!
            </p>
          )}
        </div>

        <form action={createArticle} className="space-y-3 rounded-xl border border-black/10 bg-white p-5">
          <h2 className="font-semibold">Nuovo articolo</h2>
          <input name="title" required placeholder="Titolo" className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <input name="excerpt" placeholder="Riassunto breve" className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <textarea name="content" required rows={6} placeholder="Contenuto dell'articolo…" className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="publish_now" /> Pubblica subito
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="auto_publish_social" /> Condividi automaticamente sui social
          </label>
          <button className="w-full rounded-full bg-brand py-2 text-sm font-medium text-white hover:bg-brand-dark">Salva articolo</button>
        </form>
      </div>

      <section>
        <h2 className="font-semibold">Collega i tuoi profili social</h2>
        <p className="mt-1 text-sm text-black/60">
          Serve una Pagina Facebook e/o un account Instagram Business collegati a un&apos;app Meta, con un token di
          accesso a lunga durata. Guida:{" "}
          <a className="text-brand hover:underline" href="https://developers.facebook.com/docs/pages/access-tokens" target="_blank">
            developers.facebook.com
          </a>
        </p>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <form action={saveSocialAccount} className="space-y-3 rounded-xl border border-black/10 bg-white p-5">
            <input type="hidden" name="platform" value="facebook" />
            <h3 className="font-medium">Facebook</h3>
            <input name="external_account_id" defaultValue={fbAccount?.external_account_id} placeholder="Page ID" className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="access_token" defaultValue={fbAccount?.access_token} placeholder="Page Access Token" className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-full border border-brand py-2 text-sm font-medium text-brand hover:bg-brand-light">Salva</button>
          </form>
          <form action={saveSocialAccount} className="space-y-3 rounded-xl border border-black/10 bg-white p-5">
            <input type="hidden" name="platform" value="instagram" />
            <h3 className="font-medium">Instagram</h3>
            <input name="external_account_id" defaultValue={igAccount?.external_account_id} placeholder="Instagram Business Account ID" className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <input name="access_token" defaultValue={igAccount?.access_token} placeholder="Access Token" className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            <button className="w-full rounded-full border border-brand py-2 text-sm font-medium text-brand hover:bg-brand-light">Salva</button>
          </form>
        </div>
      </section>
    </div>
  );
}
