-- Centralized platform settings (email + payments), managed by superadmin only.
-- Secret values (API keys) are stored AES-256-GCM encrypted by the app layer
-- (see src/lib/crypto.ts) — this table only ever holds ciphertext for those columns.

create table public.platform_settings (
  id boolean primary key default true,
  email_provider text not null default 'resend' check (email_provider in ('resend','brevo')),
  email_from_name text not null default 'VisitaUp',
  email_from_address text,
  resend_api_key_encrypted text,
  brevo_api_key_encrypted text,
  stripe_publishable_key text,
  stripe_price_starter text,
  stripe_price_pro text,
  stripe_secret_key_encrypted text,
  stripe_webhook_secret_encrypted text,
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton check (id)
);

insert into public.platform_settings (id) values (true);

alter table public.platform_settings enable row level security;

create policy "platform_settings_superadmin_all" on public.platform_settings
  for all using (public.is_superadmin()) with check (public.is_superadmin());
