"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { extractPdfText, parseBiaFields, type ParsedBiaFields } from "@/lib/pdf";
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

export interface BiaParseResult {
  filePath: string;
  parsed: ParsedBiaFields;
  textPreview: string;
}

// Step 1 of the BIA PDF import: extract text, best-effort parse the known
// fields, and store the PDF. Returns data for the doctor to review/correct —
// nothing is written to misurazioni until confirmBiaImport.
export async function parseBiaPdf(patientId: string, formData: FormData): Promise<BiaParseResult> {
  const doctorId = await requireDoctor();
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Seleziona un file PDF");

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractPdfText(buffer);
  const parsed = parseBiaFields(text);

  const path = `${doctorId}/${patientId}/bia/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(DOCS_BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
  });
  if (uploadError) throw new Error(uploadError.message);

  return { filePath: path, parsed, textPreview: text.slice(0, 4000) };
}

// Step 2: save the (possibly corrected) values as a misurazione, referencing
// the PDF already uploaded by parseBiaPdf.
export async function confirmBiaImport(patientId: string, filePath: string, formData: FormData) {
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
    fonte: "akern",
    file_path: filePath,
    note: String(formData.get("note") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dottore/pazienti/${patientId}`);
}

export async function discardBiaImport(filePath: string) {
  await requireDoctor();
  const supabase = await createClient();
  await supabase.storage.from(DOCS_BUCKET).remove([filePath]);
}
