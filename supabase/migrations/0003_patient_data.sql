-- Patient body-composition measurements, food diary, and allergies/intolerances.
-- Scope: docs/VisitaUp_brief_dati_paziente.md (sections 1-2, settled parts only:
-- misurazioni, diario_alimentare, allergeni_intolleranze). Circonferenze,
-- piani_alimentari and CSV/Akern import are deferred pending client decisions.

-- ============ misurazioni (peso / massa / BIA) ============
create table public.misurazioni (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  data date not null,
  peso_kg numeric,
  massa_grassa_kg numeric,
  massa_grassa_perc numeric,
  massa_magra_kg numeric,
  massa_muscolare_kg numeric,
  acqua_perc numeric,
  acqua_kg numeric,
  fonte text not null default 'manuale' check (fonte in ('manuale', 'csv_bia', 'akern')),
  note text,
  created_at timestamptz not null default now()
);
create index misurazioni_patient_idx on public.misurazioni(patient_id, data);

-- ============ diario alimentare ============
create table public.diario_alimentare (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  data date not null,
  pasto text not null check (pasto in ('colazione', 'pranzo', 'cena', 'spuntino')),
  contenuto text not null,
  aderenza text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index diario_alimentare_patient_idx on public.diario_alimentare(patient_id, data);

-- ============ allergeni e intolleranze ============
create table public.allergeni_intolleranze (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  tipo text not null check (tipo in ('allergene', 'intolleranza')),
  sostanza text not null,
  gravita text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index allergeni_intolleranze_patient_idx on public.allergeni_intolleranze(patient_id);

-- =========================================================
-- RLS
-- =========================================================
alter table public.misurazioni enable row level security;
alter table public.diario_alimentare enable row level security;
alter table public.allergeni_intolleranze enable row level security;

-- misurazioni: doctor manages, patient reads their own only (manual entry is doctor-side for now)
create policy "misurazioni_doctor_all" on public.misurazioni for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

create policy "misurazioni_patient_read" on public.misurazioni for select using (
  patient_id in (select id from public.patients where profile_id = auth.uid())
);

-- diario_alimentare: doctor and patient can both manage their own
create policy "diario_alimentare_doctor_all" on public.diario_alimentare for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

create policy "diario_alimentare_patient_all" on public.diario_alimentare for all using (
  patient_id in (select id from public.patients where profile_id = auth.uid())
) with check (
  patient_id in (select id from public.patients where profile_id = auth.uid())
  and doctor_id = (select doctor_id from public.patients where id = patient_id)
);

-- allergeni_intolleranze: doctor and patient can both manage their own
create policy "allergeni_intolleranze_doctor_all" on public.allergeni_intolleranze for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

create policy "allergeni_intolleranze_patient_all" on public.allergeni_intolleranze for all using (
  patient_id in (select id from public.patients where profile_id = auth.uid())
) with check (
  patient_id in (select id from public.patients where profile_id = auth.uid())
  and doctor_id = (select doctor_id from public.patients where id = patient_id)
);
