"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { extractPdfText } from "@/lib/pdf";
import { renderPdfToImages } from "@/lib/pdf-image";
import type { AllergiaTipo, PastoTipo } from "@/lib/types/database";

const DOCS_BUCKET = "documenti-pazienti";

async function requireDoctor() {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");
  return user.doctorId;
}

function readNumberOrNull(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function addMisurazione(patientId: string, formData: FormData) {
  const doctorId = await requireDoctor();
  const supabase = await createClient();

  const { error } = await supabase.from("misurazioni").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    data: String(formData.get("data") || ""),
    peso_kg: readNumberOrNull(formData, "peso_kg"),
    massa_grassa_kg: readNumberOrNull(formData, "massa_grassa_kg"),
    massa_grassa_perc: readNumberOrNull(formData, "massa_grassa_perc"),
    massa_magra_kg: readNumberOrNull(formData, "massa_magra_kg"),
    massa_muscolare_kg: readNumberOrNull(formData, "massa_muscolare_kg"),
    acqua_perc: readNumberOrNull(formData, "acqua_perc"),
    acqua_kg: readNumberOrNull(formData, "acqua_kg"),
    note: String(formData.get("note") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

export async function deleteMisurazione(id: string, patientId: string) {
  await requireDoctor();
  const supabase = await createClient();
  const { error } = await supabase.from("misurazioni").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

export async function addDiarioEntry(patientId: string, formData: FormData) {
  const doctorId = await requireDoctor();
  const supabase = await createClient();
  const { error } = await supabase.from("diario_alimentare").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    data: String(formData.get("data") || ""),
    pasto: formData.get("pasto") as PastoTipo,
    contenuto: String(formData.get("contenuto") || ""),
    aderenza: String(formData.get("aderenza") || "") || null,
    note: String(formData.get("note") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

export async function deleteDiarioEntry(id: string, patientId: string) {
  await requireDoctor();
  const supabase = await createClient();
  const { error } = await supabase.from("diario_alimentare").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

export async function addAllergia(patientId: string, formData: FormData) {
  const doctorId = await requireDoctor();
  const supabase = await createClient();
  const { error } = await supabase.from("allergeni_intolleranze").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    tipo: formData.get("tipo") as AllergiaTipo,
    sostanza: String(formData.get("sostanza") || ""),
    gravita: String(formData.get("gravita") || "") || null,
    note: String(formData.get("note") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

export async function deleteAllergia(id: string, patientId: string) {
  await requireDoctor();
  const supabase = await createClient();
  const { error } = await supabase.from("allergeni_intolleranze").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

export async function uploadPianoAlimentare(patientId: string, formData: FormData) {
  const doctorId = await requireDoctor();
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Seleziona un file PDF");

  const buffer = Buffer.from(await file.arrayBuffer());
  let contentText: string | null = null;
  try {
    contentText = await extractPdfText(buffer);
  } catch {
    contentText = null;
  }

  const path = `${doctorId}/${patientId}/piani/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(DOCS_BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
  });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("piani_alimentari").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    titolo: String(formData.get("titolo") || file.name),
    data_inizio: String(formData.get("data_inizio") || "") || null,
    data_fine: String(formData.get("data_fine") || "") || null,
    file_path: path,
    content_text: contentText,
    note: String(formData.get("note") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

export async function deletePianoAlimentare(id: string, patientId: string, filePath: string) {
  await requireDoctor();
  const supabase = await createClient();
  await supabase.storage.from(DOCS_BUCKET).remove([filePath]);
  const { error } = await supabase.from("piani_alimentari").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

function readNumberIndexed(formData: FormData, key: string, index: number) {
  return readNumberOrNull(formData, `${key}-${index}`);
}

// Real Akern report PDFs are chart images with no extractable text or
// structured data (confirmed against an actual export) — this is a purely
// optional, manual backfill for doctors who also want the numeric trend
// charts populated. It doesn't touch file storage at all; the report itself
// is uploaded separately via uploadRefertoBia below.
export async function importBiaRows(patientId: string, formData: FormData) {
  const doctorId = await requireDoctor();
  const supabase = await createClient();

  const rowsCount = Number(formData.get("rowsCount") || 0);
  const rows = [];
  for (let i = 0; i < rowsCount; i++) {
    const data = String(formData.get(`data-${i}`) || "");
    if (!data) continue;
    rows.push({
      doctor_id: doctorId,
      patient_id: patientId,
      data,
      peso_kg: readNumberIndexed(formData, "peso_kg", i),
      massa_grassa_kg: readNumberIndexed(formData, "massa_grassa_kg", i),
      massa_grassa_perc: readNumberIndexed(formData, "massa_grassa_perc", i),
      massa_magra_kg: readNumberIndexed(formData, "massa_magra_kg", i),
      massa_muscolare_kg: readNumberIndexed(formData, "massa_muscolare_kg", i),
      acqua_perc: readNumberIndexed(formData, "acqua_perc", i),
      acqua_kg: readNumberIndexed(formData, "acqua_kg", i),
      fonte: "akern" as const,
    });
  }
  if (rows.length === 0) throw new Error("Inserisci almeno una riga con la data compilata");

  const { error } = await supabase.from("misurazioni").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

// Uploads a BIA report PDF and renders it to image(s) so it's viewable
// directly in the app — no data entry required. The doctor can optionally
// also use importBiaRows above to backfill the numeric trend charts.
export async function uploadRefertoBia(patientId: string, formData: FormData) {
  const doctorId = await requireDoctor();
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Seleziona un file PDF");

  const buffer = Buffer.from(await file.arrayBuffer());
  const basePath = `${doctorId}/${patientId}/bia/${Date.now()}`;

  const { error: uploadError } = await supabase.storage.from(DOCS_BUCKET).upload(`${basePath}.pdf`, buffer, {
    contentType: "application/pdf",
  });
  if (uploadError) throw new Error(uploadError.message);

  // Rendering is a nice-to-have on top of the archived PDF, not a
  // precondition for saving it — never let a rendering failure (unusual
  // PDF, resource limits, ...) take down the whole upload.
  const imagePaths: string[] = [];
  try {
    const images = await renderPdfToImages(buffer);
    for (let i = 0; i < images.length; i++) {
      const imagePath = `${basePath}-p${i + 1}.png`;
      const { error: imgError } = await supabase.storage.from(DOCS_BUCKET).upload(imagePath, images[i], {
        contentType: "image/png",
      });
      if (imgError) throw new Error(imgError.message);
      imagePaths.push(imagePath);
    }
  } catch (err) {
    console.error("renderPdfToImages failed for referto BIA:", err);
  }

  const { error } = await supabase.from("referti_bia").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    data_esame: String(formData.get("data_esame") || "") || null,
    file_path: `${basePath}.pdf`,
    image_paths: imagePaths,
    note: String(formData.get("note") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

export async function deleteRefertoBia(id: string, patientId: string, filePath: string, imagePaths: string[]) {
  await requireDoctor();
  const supabase = await createClient();
  await supabase.storage.from(DOCS_BUCKET).remove([filePath, ...imagePaths]);
  const { error } = await supabase.from("referti_bia").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}
