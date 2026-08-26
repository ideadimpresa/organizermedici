-- VisitaUp initial schema
-- Roles: superadmin, doctor, staff, patient

create extension if not exists "pgcrypto";

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'patient' check (role in ('superadmin','doctor','staff','patient')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'role', 'patient'), new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ doctors ============
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  slug text unique not null,
  display_name text not null,
  title text not null default 'Biologa Nutrizionista',
  bio text,
  specializations text[] not null default '{}',
  conditions_treated text[] not null default '{}',
  phone text,
  contact_email text,
  avatar_url text,
  cover_url text,
  social_instagram text,
  social_facebook text,
  social_tiktok text,
  plan text not null default 'trial' check (plan in ('trial','starter','pro')),
  subscription_status text not null default 'inactive' check (subscription_status in ('inactive','trialing','active','past_due','canceled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ doctor invites (superadmin activates doctors) ============
create table public.doctor_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  invited_by uuid references public.profiles(id),
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

-- ============ addresses (studio locations) ============
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  label text not null default 'Studio',
  address_line text not null,
  city text not null,
  postal_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ services ============
create table public.services (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes int not null default 30,
  price_cents int not null default 0,
  mode text not null default 'both' check (mode in ('studio','online','both')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ availability rules (weekly recurring) ============
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  address_id uuid references public.addresses(id) on delete cascade,
  mode text not null default 'studio' check (mode in ('studio','online')),
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_duration_minutes int not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ availability exceptions (closures / one-off openings) ============
create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  is_blocked boolean not null default true,
  reason text,
  created_at timestamptz not null default now()
);

-- ============ patients (CRM) ============
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  fiscal_code text,
  birth_date date,
  notes text,
  tags text[] not null default '{}',
  source text not null default 'manual' check (source in ('manual','import','booking')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index patients_doctor_idx on public.patients(doctor_id);
create index patients_email_idx on public.patients(doctor_id, lower(email));

-- ============ appointments ============
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  address_id uuid references public.addresses(id) on delete set null,
  mode text not null default 'studio' check (mode in ('studio','online')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed','no_show')),
  meeting_link text,
  notes text,
  price_cents int not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded','not_required')),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index appointments_doctor_time_idx on public.appointments(doctor_id, starts_at);
create index appointments_patient_idx on public.appointments(patient_id);

-- ============ payments ledger ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  amount_cents int not null,
  currency text not null default 'eur',
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending','succeeded','failed','refunded')),
  created_at timestamptz not null default now()
);

-- ============ articles (blog / lifestyle content) ============
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  title text not null,
  slug text not null,
  excerpt text,
  content text not null,
  cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  auto_publish_social boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(doctor_id, slug)
);

-- ============ social accounts (per-doctor Meta credentials) ============
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  platform text not null check (platform in ('instagram','facebook')),
  external_account_id text not null,
  access_token text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(doctor_id, platform)
);

-- ============ social posts queue ============
create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  platform text not null check (platform in ('instagram','facebook')),
  status text not null default 'pending' check (status in ('pending','posted','failed')),
  external_post_id text,
  error_message text,
  created_at timestamptz not null default now(),
  posted_at timestamptz
);

-- ============ reminders log (avoid duplicate emails) ============
create table public.reminders_log (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  channel text not null default 'email',
  kind text not null check (kind in ('confirmation','reminder_24h','cancellation')),
  sent_at timestamptz not null default now(),
  unique(appointment_id, kind)
);

-- =========================================================
-- Helper functions for RLS
-- =========================================================
create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'superadmin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.current_doctor_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.doctors where profile_id = auth.uid();
$$;

-- =========================================================
-- RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_invites enable row level security;
alter table public.addresses enable row level security;
alter table public.services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.articles enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_accounts enable row level security;
alter table public.reminders_log enable row level security;

-- profiles
create policy "profiles_self_select" on public.profiles for select using (id = auth.uid() or public.is_superadmin());
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid() or public.is_superadmin());
create policy "profiles_superadmin_insert" on public.profiles for insert with check (true);

-- doctors
create policy "doctors_public_read_active" on public.doctors for select using (is_active = true or profile_id = auth.uid() or public.is_superadmin());
create policy "doctors_self_update" on public.doctors for update using (profile_id = auth.uid() or public.is_superadmin());
create policy "doctors_superadmin_insert" on public.doctors for insert with check (public.is_superadmin());
create policy "doctors_superadmin_delete" on public.doctors for delete using (public.is_superadmin());

-- doctor_invites (superadmin only)
create policy "invites_superadmin_all" on public.doctor_invites for all using (public.is_superadmin()) with check (public.is_superadmin());

-- addresses
create policy "addresses_public_read" on public.addresses for select using (
  is_active = true or doctor_id = public.current_doctor_id() or public.is_superadmin()
);
create policy "addresses_doctor_write" on public.addresses for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

-- services
create policy "services_public_read" on public.services for select using (
  is_active = true or doctor_id = public.current_doctor_id() or public.is_superadmin()
);
create policy "services_doctor_write" on public.services for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

-- availability_rules
create policy "availability_rules_public_read" on public.availability_rules for select using (true);
create policy "availability_rules_doctor_write" on public.availability_rules for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

-- availability_exceptions
create policy "availability_exceptions_public_read" on public.availability_exceptions for select using (true);
create policy "availability_exceptions_doctor_write" on public.availability_exceptions for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

-- patients
create policy "patients_doctor_all" on public.patients for all using (
  doctor_id = public.current_doctor_id() or profile_id = auth.uid() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

-- appointments
create policy "appointments_doctor_all" on public.appointments for all using (
  doctor_id = public.current_doctor_id()
  or public.is_superadmin()
  or patient_id in (select id from public.patients where profile_id = auth.uid())
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

-- payments
create policy "payments_doctor_read" on public.payments for select using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
);

-- articles
create policy "articles_public_read_published" on public.articles for select using (
  status = 'published' or doctor_id = public.current_doctor_id() or public.is_superadmin()
);
create policy "articles_doctor_write" on public.articles for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

-- social_posts
create policy "social_posts_doctor_read" on public.social_posts for select using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
);

-- social_accounts (credentials, doctor manages own; never exposed publicly)
create policy "social_accounts_doctor_all" on public.social_accounts for all using (
  doctor_id = public.current_doctor_id() or public.is_superadmin()
) with check (doctor_id = public.current_doctor_id() or public.is_superadmin());

-- reminders_log: backend only (service role bypasses RLS), no client policy needed beyond doctor visibility
create policy "reminders_log_doctor_read" on public.reminders_log for select using (
  appointment_id in (select id from public.appointments where doctor_id = public.current_doctor_id())
  or public.is_superadmin()
);

-- =========================================================
-- Seed: bootstrap first superadmin by email (run manually after first signup)
-- update public.profiles set role = 'superadmin' where id = '<uuid-of-first-user>';
-- =========================================================
