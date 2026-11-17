-- Phase 5: AI-based photo food logging. A patient (or doctor on their
-- behalf) can attach a meal photo to a diario_alimentare entry; the photo
-- is analyzed by a vision model to estimate macros and auto-fill a
-- description when the patient doesn't want to type one.

alter table public.diario_alimentare add column foto_path text;
alter table public.diario_alimentare add column analisi_ai text;
alter table public.diario_alimentare add column calorie_stimate numeric;
alter table public.diario_alimentare add column proteine_g numeric;
alter table public.diario_alimentare add column carboidrati_g numeric;
alter table public.diario_alimentare add column grassi_g numeric;

-- Platform-wide AI key (vision analysis cost is per-call, so it's
-- centralized like the email/Stripe keys rather than per-doctor).
alter table public.platform_settings add column anthropic_api_key_encrypted text;

-- =========================================================
-- Storage: private bucket for diario meal photos.
-- Path convention: {patient_id}/{filename} — unlike documenti-pazienti,
-- the patient themselves is the primary uploader here.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('foto-diario', 'foto-diario', false)
on conflict (id) do nothing;

create policy "foto_diario_doctor_all" on storage.objects for all using (
  bucket_id = 'foto-diario'
  and (storage.foldername(name))[1] in (select id::text from public.patients where doctor_id = public.current_doctor_id())
) with check (
  bucket_id = 'foto-diario'
  and (storage.foldername(name))[1] in (select id::text from public.patients where doctor_id = public.current_doctor_id())
);

create policy "foto_diario_superadmin_all" on storage.objects for all using (
  bucket_id = 'foto-diario' and public.is_superadmin()
) with check (
  bucket_id = 'foto-diario' and public.is_superadmin()
);

create policy "foto_diario_patient_all" on storage.objects for all using (
  bucket_id = 'foto-diario'
  and (storage.foldername(name))[1] in (select id::text from public.patients where profile_id = auth.uid())
) with check (
  bucket_id = 'foto-diario'
  and (storage.foldername(name))[1] in (select id::text from public.patients where profile_id = auth.uid())
);
