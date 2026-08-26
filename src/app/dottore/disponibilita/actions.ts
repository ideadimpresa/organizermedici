"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function addAddress(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");
  const supabase = await createClient();
  const { error } = await supabase.from("addresses").insert({
    doctor_id: user.doctorId,
    label: String(formData.get("label") || "Studio"),
    address_line: String(formData.get("address_line") || ""),
    city: String(formData.get("city") || ""),
    postal_code: String(formData.get("postal_code") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/disponibilita");
}

export async function addAvailabilityRule(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");
  const supabase = await createClient();
  const mode = formData.get("mode") as "studio" | "online";
  const { error } = await supabase.from("availability_rules").insert({
    doctor_id: user.doctorId,
    mode,
    address_id: mode === "studio" ? (String(formData.get("address_id") || "") || null) : null,
    weekday: Number(formData.get("weekday")),
    start_time: String(formData.get("start_time")),
    end_time: String(formData.get("end_time")),
    slot_duration_minutes: Number(formData.get("slot_duration_minutes") || 30),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/disponibilita");
}

export async function deleteAvailabilityRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("availability_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/disponibilita");
}

export async function addClosure(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.doctorId) throw new Error("Non autorizzato");
  const supabase = await createClient();
  const { error } = await supabase.from("availability_exceptions").insert({
    doctor_id: user.doctorId,
    date: String(formData.get("date")),
    is_blocked: true,
    reason: String(formData.get("reason") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dottore/disponibilita");
}
