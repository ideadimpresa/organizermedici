"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { AllergiaTipo, PastoTipo } from "@/lib/types/database";

async function requireDoctor() {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");
  return user.doctorId;
}

export async function addMisurazione(patientId: string, formData: FormData) {
  const doctorId = await requireDoctor();
  const supabase = await createClient();

  const numberOrNull = (key: string) => {
    const raw = formData.get(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const { error } = await supabase.from("misurazioni").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    data: String(formData.get("data") || ""),
    peso_kg: numberOrNull("peso_kg"),
    massa_grassa_kg: numberOrNull("massa_grassa_kg"),
    massa_grassa_perc: numberOrNull("massa_grassa_perc"),
    massa_magra_kg: numberOrNull("massa_magra_kg"),
    massa_muscolare_kg: numberOrNull("massa_muscolare_kg"),
    acqua_perc: numberOrNull("acqua_perc"),
    acqua_kg: numberOrNull("acqua_kg"),
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
