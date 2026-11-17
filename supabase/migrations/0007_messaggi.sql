-- Direct doctor <-> patient messaging thread (Phase 1: adoption baseline feature
-- already standard in competing practice-management tools).
create table public.messaggi (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  mittente text not null check (mittente in ('medico', 'paziente')),
  testo text not null,
  created_at timestamptz not null default now()
);
create index messaggi_patient_idx on public.messaggi(patient_id, created_at);

alter table public.messaggi enable row level security;

create policy "messaggi_doctor_all" on public.messaggi for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

create policy "messaggi_patient_all" on public.messaggi for all using (
  patient_id in (select id from public.patients where profile_id = auth.uid())
) with check (
  patient_id in (select id from public.patients where profile_id = auth.uid())
  and doctor_id = (select doctor_id from public.patients where id = patient_id)
);
