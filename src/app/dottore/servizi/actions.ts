"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function addService(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");

  const supabase = await createClient();
  const priceEuro = Number(formData.get("price") || 0);
  const { error } = await supabase.from("services").insert({
    doctor_id: user.doctorId,
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || "") || null,
    duration_minutes: Number(formData.get("duration_minutes") || 30),
    price_cents: Math.round(priceEuro * 100),
    mode: formData.get("mode") as "studio" | "online" | "both",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/servizi");
}

export async function toggleService(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/servizi");
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/servizi");
}
