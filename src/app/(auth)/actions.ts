"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next || "/");
}

export async function signupPatient(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: "patient" } },
  });

  if (error) {
    redirect(`/registrati?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/registrati/controlla-email");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent("/account/password?reset=1")}`,
  });

  // Always redirect to the same confirmation page, whether or not the email
  // exists, so this form can't be used to enumerate registered accounts.
  redirect("/password-dimenticata/controlla-email");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) {
    redirect("/account/password?error=" + encodeURIComponent("La password deve avere almeno 8 caratteri"));
  }
  if (password !== confirm) {
    redirect("/account/password?error=" + encodeURIComponent("Le password non coincidono"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/account/password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account/password?success=1");
}
