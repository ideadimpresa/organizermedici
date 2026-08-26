import { NextResponse } from "next/server";
import { addDays, formatISO, startOfDay } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeSlotsForDay } from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId");
  const mode = (searchParams.get("mode") || "studio") as "studio" | "online";
  const days = Math.min(Number(searchParams.get("days") || 4), 14);

  if (!doctorId) {
    return NextResponse.json({ error: "doctorId richiesto" }, { status: 400 });
  }

  const admin = createAdminClient();
  const today = startOfDay(new Date());
  const rangeEnd = addDays(today, days);

  const [{ data: rules }, { data: exceptions }, { data: appointments }] = await Promise.all([
    admin.from("availability_rules").select("*").eq("doctor_id", doctorId).eq("mode", mode).eq("is_active", true),
    admin
      .from("availability_exceptions")
      .select("*")
      .eq("doctor_id", doctorId)
      .gte("date", formatISO(today, { representation: "date" }))
      .lte("date", formatISO(rangeEnd, { representation: "date" })),
    admin
      .from("appointments")
      .select("starts_at, ends_at, status")
      .eq("doctor_id", doctorId)
      .neq("status", "cancelled")
      .gte("starts_at", today.toISOString())
      .lte("starts_at", rangeEnd.toISOString()),
  ]);

  const result: { date: string; slots: { start: string; end: string; addressId: string | null }[] }[] = [];

  for (let i = 0; i < days; i++) {
    const day = addDays(today, i);
    const slots = computeSlotsForDay({
      day,
      rules: rules || [],
      exceptions: exceptions || [],
      existingAppointments: appointments || [],
    });
    result.push({
      date: formatISO(day, { representation: "date" }),
      slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString(), addressId: s.addressId })),
    });
  }

  return NextResponse.json({ days: result });
}
