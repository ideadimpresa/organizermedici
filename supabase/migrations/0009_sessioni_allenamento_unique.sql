-- Idempotent re-sync: the same workout session can be pushed again by the
-- device/app before a new one starts, so dedupe on (patient_id, inizio).
alter table public.sessioni_allenamento
  add constraint sessioni_allenamento_patient_inizio_key unique (patient_id, inizio);
