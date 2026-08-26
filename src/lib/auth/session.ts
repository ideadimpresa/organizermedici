import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types/database";

export interface CurrentUser {
  id: string;
  email: string | null;
  role: Role;
  fullName: string | null;
  doctorId: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  let doctorId: string | null = null;
  if (profile?.role === "doctor" || profile?.role === "staff") {
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    doctorId = doctor?.id ?? null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: (profile?.role as Role) ?? "patient",
    fullName: profile?.full_name ?? null,
    doctorId,
  };
}
