import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { RefertoBiaCard } from "@/components/referto-bia-card";

const DOCS_BUCKET = "documenti-pazienti";

export default async function PatientRefertiPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: patientRows } = await supabase.from("patients").select("id").eq("profile_id", user?.id ?? "");
  const patientIds = (patientRows || []).map((p) => p.id);

  const { data: referti } = patientIds.length
    ? await supabase.from("referti_bia").select("*").in("patient_id", patientIds).order("created_at", { ascending: false })
    : { data: [] };

  const refertiWithUrls = await Promise.all(
    (referti || []).map(async (r) => {
      const [{ data: pdfData }, imageUrls] = await Promise.all([
        supabase.storage.from(DOCS_BUCKET).createSignedUrl(r.file_path, 3600),
        Promise.all(
          r.image_paths.map(async (p) => (await supabase.storage.from(DOCS_BUCKET).createSignedUrl(p, 3600)).data?.signedUrl ?? null)
        ),
      ]);
      return { ...r, pdfSignedUrl: pdfData?.signedUrl ?? null, imageSignedUrls: imageUrls.filter((u): u is string => !!u) };
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Referti BIA</h1>
        <p className="mt-1 text-secondary">I referti di impedenziometria caricati dal tuo nutrizionista.</p>
      </div>

      <div className="space-y-3">
        {refertiWithUrls.map((r) => (
          <RefertoBiaCard
            key={r.id}
            dataEsame={r.data_esame}
            note={r.note}
            imageSignedUrls={r.imageSignedUrls}
            pdfSignedUrl={r.pdfSignedUrl}
          />
        ))}
        {refertiWithUrls.length === 0 && (
          <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-secondary">
            Nessun referto caricato dal tuo nutrizionista.
          </p>
        )}
      </div>
    </div>
  );
}
