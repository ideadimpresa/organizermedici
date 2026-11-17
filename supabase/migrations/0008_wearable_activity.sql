-- Wearable device registry + activity data (Phase 2: groundwork for the
-- VisitaUp Band integration). Field shapes are drawn from what Staranb and
-- Joint Corp confirmed their SDKs return (steps, distance, calories,
-- per-workout sport/start/end/duration) — this part doesn't depend on which
-- vendor's SDK ships first, only the native mobile app side does.

-- ============ dispositivi wearable (registro / whitelist) ============
create table public.dispositivi_wearable (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  device_id text not null,
  modello text,
  produttore text,
  stato text not null default 'attivo' check (stato in ('attivo', 'inattivo')),
  ultima_sincronizzazione timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (device_id)
);
create index dispositivi_wearable_patient_idx on public.dispositivi_wearable(patient_id);

-- ============ attivita giornaliera (aggregato per giorno) ============
create table public.attivita_giornaliera (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  data date not null,
  passi int,
  distanza_km numeric,
  calorie_totali numeric,
  calorie_attive numeric,
  fonte text not null default 'manuale',
  created_at timestamptz not null default now(),
  unique (patient_id, data)
);
create index attivita_giornaliera_patient_idx on public.attivita_giornaliera(patient_id, data);

-- ============ sessioni di allenamento (singoli workout) ============
create table public.sessioni_allenamento (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  sport_type text,
  inizio timestamptz not null,
  fine timestamptz,
  durata_minuti int,
  passi int,
  distanza_km numeric,
  calorie numeric,
  frequenza_cardiaca_media int,
  fonte text not null default 'manuale',
  created_at timestamptz not null default now()
);
create index sessioni_allenamento_patient_idx on public.sessioni_allenamento(patient_id, inizio);

-- =========================================================
-- RLS — same dual doctor_all + patient_all pattern as diario_alimentare,
-- since the patient's own (future) app is the primary writer and the
-- doctor needs full read/manage access too.
-- =========================================================
alter table public.dispositivi_wearable enable row level security;
alter table public.attivita_giornaliera enable row level security;
alter table public.sessioni_allenamento enable row level security;

create policy "dispositivi_wearable_doctor_all" on public.dispositivi_wearable for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

create policy "dispositivi_wearable_patient_all" on public.dispositivi_wearable for all using (
  patient_id in (select id from public.patients where profile_id = auth.uid())
) with check (
  patient_id in (select id from public.patients where profile_id = auth.uid())
  and doctor_id = (select doctor_id from public.patients where id = patient_id)
);

create policy "attivita_giornaliera_doctor_all" on public.attivita_giornaliera for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

create policy "attivita_giornaliera_patient_all" on public.attivita_giornaliera for all using (
  patient_id in (select id from public.patients where profile_id = auth.uid())
) with check (
  patient_id in (select id from public.patients where profile_id = auth.uid())
  and doctor_id = (select doctor_id from public.patients where id = patient_id)
);

create policy "sessioni_allenamento_doctor_all" on public.sessioni_allenamento for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

create policy "sessioni_allenamento_patient_all" on public.sessioni_allenamento for all using (
  patient_id in (select id from public.patients where profile_id = auth.uid())
) with check (
  patient_id in (select id from public.patients where profile_id = auth.uid())
  and doctor_id = (select doctor_id from public.patients where id = patient_id)
);
