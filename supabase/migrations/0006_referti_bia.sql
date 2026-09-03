-- Real Akern reports are chart images with no extractable text (confirmed
-- against an actual export). This table stores each uploaded BIA report as
-- an image (rendered server-side from the PDF) so it can be viewed directly
-- in the app, independent of whether the doctor also transcribed numeric
-- values into misurazioni.
create table public.referti_bia (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  data_esame date,
  file_path text not null,
  image_paths text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);
create index referti_bia_patient_idx on public.referti_bia(patient_id);

alter table public.referti_bia enable row level security;

create policy "referti_bia_doctor_all" on public.referti_bia for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

create policy "referti_bia_patient_read" on public.referti_bia for select using (
  patient_id in (select id from public.patients where profile_id = auth.uid())
);
