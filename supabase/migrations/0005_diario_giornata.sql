-- The patient-facing diary is a personal journal ("how did today go?"), not
-- only per-meal entries: add a whole-day entry type alongside the existing
-- meal-specific ones.
alter table public.diario_alimentare drop constraint diario_alimentare_pasto_check;
alter table public.diario_alimentare add constraint diario_alimentare_pasto_check
  check (pasto in ('colazione', 'pranzo', 'cena', 'spuntino', 'giornata'));
