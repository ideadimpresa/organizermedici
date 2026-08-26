"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, doctorInviteEmail } from "@/lib/email";
import { getCurrentUser } from "@/lib/auth/session";

export async function inviteDoctor(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") throw new Error("Non autorizzato");

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  if (!email) throw new Error("Email richiesta");

  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from("doctor_invites")
    .insert({ email, full_name: fullName || null, invited_by: user.id })
    .select("token")
    .single();

  if (error) throw new Error(error.message);

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invito/${invite.token}`;
  const { subject, html } = doctorInviteEmail({ inviteUrl, fullName });
  await sendEmail({ to: email, subject, html }).catch((err) => console.error("[invite] email error", err));

  revalidatePath("/admin/dottori");
}

export async function revokeInvite(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("doctor_invites").update({ status: "revoked" }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dottori");
}

export async function toggleDoctorActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("doctors").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dottori");
}
