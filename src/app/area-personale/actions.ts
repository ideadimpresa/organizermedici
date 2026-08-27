"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { AllergiaTipo, PastoTipo } from "@/lib/types/database";

async function ownPatientDoctorId(patientId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorizzato");
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("doctor_id")
    .eq("id", patientId)
    .eq("profile_id", user.id)
    .single();
  if (!patient) throw new Error("Non autorizzato");
  return { supabase, doctorId: patient.doctor_id };
}

export async function addOwnDiarioEntry(patientId: string, formData: FormData) {
  const { supabase, doctorId } = await ownPatientDoctorId(patientId);
  const { error } = await supabase.from("diario_alimentare").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    data: String(formData.get("data") || ""),
    pasto: formData.get("pasto") as PastoTipo,
    contenuto: String(formData.get("contenuto") || ""),
    aderenza: String(formData.get("aderenza") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/area-personale");
}

export async function deleteOwnDiarioEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("diario_alimentare").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/area-personale");
}

export async function addOwnAllergia(patientId: string, formData: FormData) {
  const { supabase, doctorId } = await ownPatientDoctorId(patientId);
  const { error } = await supabase.from("allergeni_intolleranze").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    tipo: formData.get("tipo") as AllergiaTipo,
    sostanza: String(formData.get("sostanza") || ""),
    gravita: String(formData.get("gravita") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/area-personale");
}

export async function deleteOwnAllergia(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("allergeni_intolleranze").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/area-personale");
}
