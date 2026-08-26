import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

interface ImportRow {
  full_name: string;
  email?: string;
  phone?: string;
  fiscal_code?: string;
  birth_date?: string;
  notes?: string;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.doctorId) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { rows } = (await request.json()) as { rows: ImportRow[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Nessuna riga da importare" }, { status: 400 });
  }

  const supabase = await createClient();
  const payload = rows
    .filter((r) => r.full_name?.trim())
    .map((r) => ({
      doctor_id: user.doctorId!,
      full_name: r.full_name.trim(),
      email: r.email?.trim() || null,
      phone: r.phone?.trim() || null,
      fiscal_code: r.fiscal_code?.trim() || null,
      birth_date: r.birth_date?.trim() || null,
      notes: r.notes?.trim() || null,
      source: "import" as const,
    }));

  const { error, count } = await supabase.from("patients").insert(payload, { count: "exact" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ imported: count ?? payload.length });
}
