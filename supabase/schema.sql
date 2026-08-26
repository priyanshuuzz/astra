-- ASTRA Supabase schema. Run in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'patient' check (role in ('patient', 'crew', 'doctor', 'family', 'staff', 'admin')),
  hospital_id uuid references public.hospitals(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('Public', 'Private', 'Teaching')),
  address text not null,
  phone text not null,
  latitude double precision not null,
  longitude double precision not null,
  readiness text not null default 'ready' check (readiness in ('ready', 'limited', 'unavailable', 'unknown')),
  icu_available integer not null default 0 check (icu_available >= 0),
  emergency_beds_available integer not null default 0 check (emergency_beds_available >= 0),
  general_beds_available integer not null default 0 check (general_beds_available >= 0),
  ventilators_available integer not null default 0 check (ventilators_available >= 0),
  specialties text[] not null default '{}',
  facilities text[] not null default '{}',
  ambulance_available boolean not null default false,
  traffic text not null default 'moderate' check (traffic in ('light', 'moderate', 'heavy')),
  data_source text not null default 'SUPABASE',
  is_verified boolean not null default false,
  data_last_updated timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.hospital_specialists (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  name text not null,
  specialty text not null,
  status text not null default 'unknown' check (status in ('available', 'on_call', 'busy', 'unavailable', 'unknown')),
  last_updated timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.emergencies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  status text not null default 'active',
  patient_latitude double precision,
  patient_longitude double precision,
  selected_hospital_id uuid references public.hospitals(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.ambulances (
  id uuid primary key default gen_random_uuid(),
  emergency_id uuid not null references public.emergencies(id) on delete cascade,
  vehicle_id text not null,
  status text not null default 'dispatched',
  latitude double precision,
  longitude double precision,
  eta_minutes integer not null default 0 check (eta_minutes >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.acceptance_requests (
  id uuid primary key default gen_random_uuid(),
  emergency_id uuid not null references public.emergencies(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'timeout', 'assigned_elsewhere')),
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  decline_reason text,
  decline_notes text,
  responder_id uuid references auth.users(id),
  responder_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.acceptance_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.acceptance_requests(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id),
  response text not null check (response in ('accepted', 'declined', 'timeout')),
  reason text,
  notes text,
  responder_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.hospitals enable row level security;
alter table public.hospital_specialists enable row level security;
alter table public.emergencies enable row level security;
alter table public.ambulances enable row level security;
alter table public.audit_events enable row level security;
alter table public.acceptance_requests enable row level security;
alter table public.acceptance_responses enable row level security;

create or replace function public.is_staff_or_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'));
$$;

create policy "profiles own row" on public.profiles for select using (id = auth.uid());
create policy "profiles own update" on public.profiles for update using (id = auth.uid());
create policy "authenticated users read hospitals" on public.hospitals for select to authenticated using (true);
create policy "staff update hospitals" on public.hospitals for update to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "authenticated users read specialists" on public.hospital_specialists for select to authenticated using (true);
create policy "staff manage specialists" on public.hospital_specialists for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "patients own emergencies" on public.emergencies for all to authenticated using (patient_id = auth.uid() or public.is_staff_or_admin()) with check (patient_id = auth.uid() or public.is_staff_or_admin());
create policy "related ambulance access" on public.ambulances for all to authenticated using (exists (select 1 from public.emergencies e where e.id = emergency_id and (e.patient_id = auth.uid() or public.is_staff_or_admin()))) with check (exists (select 1 from public.emergencies e where e.id = emergency_id and (e.patient_id = auth.uid() or public.is_staff_or_admin())));
create policy "staff audit insert" on public.audit_events for insert to authenticated with check (actor_id = auth.uid() and public.is_staff_or_admin());
create policy "staff audit read" on public.audit_events for select to authenticated using (actor_id = auth.uid() or public.is_staff_or_admin());
create policy "related acceptance request read" on public.acceptance_requests for select to authenticated using (exists (select 1 from public.emergencies e where e.id = emergency_id and (e.patient_id = auth.uid() or public.is_staff_or_admin())));
create policy "hospital coordinators update acceptance" on public.acceptance_requests for update to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "related acceptance response read" on public.acceptance_responses for select to authenticated using (responder_id = auth.uid() or public.is_staff_or_admin());
create policy "hospital coordinators insert response" on public.acceptance_responses for insert to authenticated with check (responder_id = auth.uid() and public.is_staff_or_admin());

-- Enable database change broadcasts for authenticated Realtime subscribers.
alter publication supabase_realtime add table public.acceptance_requests;
alter publication supabase_realtime add table public.acceptance_responses;

insert into public.hospitals (name, type, address, phone, latitude, longitude, readiness, icu_available, emergency_beds_available, specialties, facilities, ambulance_available, traffic, data_source, is_verified)
select 'Metro Trauma Institute', 'Teaching', '8 Civic Ring Road, Central District', '+91 00000 10001', 12.9785, 77.6040, 'ready', 4, 12, array['Trauma','Emergency Surgery','Anesthesia'], array['Level I Trauma Centre','CT','Blood Bank'], true, 'moderate', 'SUPABASE DEMO', true
where not exists (select 1 from public.hospitals where name = 'Metro Trauma Institute');
