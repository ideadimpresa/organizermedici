import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

interface SyncDevice {
  deviceId: string;
  modello?: string;
  produttore?: string;
}

interface SyncDailyEntry {
  data: string;
  passi?: number;
  distanzaKm?: number;
  calorieTotali?: number;
  calorieAttive?: number;
  fonte?: string;
}

interface SyncSessionEntry {
  sportType?: string;
  inizio: string;
  fine?: string;
  durataMinuti?: number;
  passi?: number;
  distanzaKm?: number;
  calorie?: number;
  frequenzaCardiacaMedia?: number;
  fonte?: string;
}

interface SyncPayload {
  patientId?: string;
  device?: SyncDevice;
  daily?: SyncDailyEntry[];
  sessions?: SyncSessionEntry[];
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const payload = (await request.json()) as SyncPayload;
  const supabase = await createClient();

  let patientId: string;
  let doctorId: string;

  if (user.role === "patient") {
    const { data: patient } = await supabase
      .from("patients")
      .select("id, doctor_id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!patient) {
      return NextResponse.json({ error: "Nessun paziente associato" }, { status: 403 });
    }
    patientId = patient.id;
    doctorId = patient.doctor_id;
  } else {
    if (!payload.patientId) {
      return NextResponse.json({ error: "patientId richiesto" }, { status: 400 });
    }
    const { data: patient } = await supabase
      .from("patients")
      .select("id, doctor_id")
      .eq("id", payload.patientId)
      .maybeSingle();
    if (!patient) {
      return NextResponse.json({ error: "Paziente non trovato" }, { status: 404 });
    }
    patientId = patient.id;
    doctorId = patient.doctor_id;
  }

  let deviceRow = null;
  if (payload.device?.deviceId) {
    const { data, error } = await supabase
      .from("dispositivi_wearable")
      .upsert(
        {
          doctor_id: doctorId,
          patient_id: patientId,
          device_id: payload.device.deviceId,
          modello: payload.device.modello || null,
          produttore: payload.device.produttore || null,
          stato: "attivo",
          ultima_sincronizzazione: new Date().toISOString(),
        },
        { onConflict: "device_id" }
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    deviceRow = data;
  }

  let dailyUpserted = 0;
  if (payload.daily?.length) {
    const rows = payload.daily.map((d) => ({
      doctor_id: doctorId,
      patient_id: patientId,
      data: d.data,
      passi: d.passi ?? null,
      distanza_km: d.distanzaKm ?? null,
      calorie_totali: d.calorieTotali ?? null,
      calorie_attive: d.calorieAttive ?? null,
      fonte: d.fonte || "wearable",
    }));
    const { error, count } = await supabase
      .from("attivita_giornaliera")
      .upsert(rows, { onConflict: "patient_id,data", count: "exact" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    dailyUpserted = count ?? rows.length;
  }

  let sessionsUpserted = 0;
  if (payload.sessions?.length) {
    const rows = payload.sessions.map((s) => ({
      doctor_id: doctorId,
      patient_id: patientId,
      sport_type: s.sportType || null,
      inizio: s.inizio,
      fine: s.fine || null,
      durata_minuti: s.durataMinuti ?? null,
      passi: s.passi ?? null,
      distanza_km: s.distanzaKm ?? null,
      calorie: s.calorie ?? null,
      frequenza_cardiaca_media: s.frequenzaCardiacaMedia ?? null,
      fonte: s.fonte || "wearable",
    }));
    const { error, count } = await supabase
      .from("sessioni_allenamento")
      .upsert(rows, { onConflict: "patient_id,inizio", count: "exact" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    sessionsUpserted = count ?? rows.length;
  }

  return NextResponse.json({ ok: true, device: deviceRow, dailyUpserted, sessionsUpserted });
}
