-- Piani alimentari (PDF upload + extracted text) and BIA PDF import support.
-- Docs uploaded by the doctor are stored in a private Storage bucket, keyed by
-- doctor_id/patient_id folders; patients get read-only access to their own.

-- ============ piani alimentari ============
create table public.piani_alimentari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  titolo text not null,
  data_inizio date,
  data_fine date,
  file_path text not null,
  content_text text,
  note text,
  created_at timestamptz not null default now()
);
create index piani_alimentari_patient_idx on public.piani_alimentari(patient_id);

-- misurazioni acquires an optional reference to the source PDF (BIA import)
alter table public.misurazioni add column file_path text;

alter table public.piani_alimentari enable row level security;

create policy "piani_alimentari_doctor_all" on public.piani_alimentari for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

create policy "piani_alimentari_patient_read" on public.piani_alimentari for select using (
  patient_id in (select id from public.patients where profile_id = auth.uid())
);

-- =========================================================
-- Storage: private bucket for patient documents
-- =========================================================
insert into storage.buckets (id, name, public)
values ('documenti-pazienti', 'documenti-pazienti', false)
on conflict (id) do nothing;

-- Path convention: {doctor_id}/{patient_id}/piani|bia/{filename}
create policy "documenti_pazienti_doctor_all" on storage.objects for all using (
  bucket_id = 'documenti-pazienti' and (storage.foldername(name))[1] = public.current_doctor_id()::text
) with check (
  bucket_id = 'documenti-pazienti' and (storage.foldername(name))[1] = public.current_doctor_id()::text
);

create policy "documenti_pazienti_superadmin_all" on storage.objects for all using (
  bucket_id = 'documenti-pazienti' and public.is_superadmin()
) with check (
  bucket_id = 'documenti-pazienti' and public.is_superadmin()
);

create policy "documenti_pazienti_patient_read" on storage.objects for select using (
  bucket_id = 'documenti-pazienti'
  and (storage.foldername(name))[2] in (select id::text from public.patients where profile_id = auth.uid())
);
