"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function updateDoctorProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");

  const supabase = await createClient();
  const conditions = String(formData.get("conditions_treated") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("doctors")
    .update({
      display_name: String(formData.get("display_name") || ""),
      title: String(formData.get("title") || ""),
      bio: String(formData.get("bio") || "") || null,
      conditions_treated: conditions,
      phone: String(formData.get("phone") || "") || null,
      contact_email: String(formData.get("contact_email") || "") || null,
      social_instagram: String(formData.get("social_instagram") || "") || null,
      social_facebook: String(formData.get("social_facebook") || "") || null,
      social_tiktok: String(formData.get("social_tiktok") || "") || null,
    })
    .eq("id", user.doctorId);

  if (error) throw new Error(error.message);
  revalidatePath("/dottore/profilo");
}
