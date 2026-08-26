import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  const { token, password, fullName } = await request.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin
    .from("doctor_invites")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invito non valido o già utilizzato" }, { status: 404 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invito scaduto" }, { status: 410 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || invite.full_name, role: "doctor" },
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || "Impossibile creare l'utente" }, { status: 400 });
  }

  const baseSlug = slugify(fullName || invite.full_name || invite.email.split("@")[0]);
  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 5) {
    const { data: existing } = await admin.from("doctors").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const { error: doctorError } = await admin.from("doctors").insert({
    profile_id: created.user.id,
    slug,
    display_name: fullName || invite.full_name || invite.email,
    contact_email: invite.email,
    plan: "trial",
    subscription_status: "trialing",
    is_active: true,
  });

  if (doctorError) {
    return NextResponse.json({ error: doctorError.message }, { status: 400 });
  }

  await admin.from("doctor_invites").update({ status: "accepted" }).eq("id", invite.id);

  return NextResponse.json({ ok: true, email: invite.email });
}
