"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function addPatient(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");

  const supabase = await createClient();
  const { error } = await supabase.from("patients").insert({
    doctor_id: user.doctorId,
    full_name: String(formData.get("full_name") || ""),
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    fiscal_code: String(formData.get("fiscal_code") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    source: "manual",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/pazienti");
}
