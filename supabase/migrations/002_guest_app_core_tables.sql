create extension if not exists pgcrypto;

-- Replace scaffold tables with the requested production-oriented schema.
drop table if exists public.sos_alerts cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.activity_bookings cascade;
drop table if exists public.food_orders cascade;
drop table if exists public.guest_preferences cascade;
drop table if exists public.reservations cascade;
drop table if exists public.activities cascade;
drop table if exists public.menu_items cascade;

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  ezee_reservation_id text unique not null,
  guest_name text not null,
  mobile text not null,
  room_number text not null,
  room_type text,
  checkin_date date,
  checkout_date date,
  checkin_status text default 'PENDING' check (checkin_status in ('PENDING','CHECKED_IN','CHECKED_OUT')),
  unique_token text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.guest_preferences (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id),
  pillow_preference text,
  wakeup_time text,
  dietary_tags text[],
  special_requests text,
  submitted_at timestamptz default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer,
  max_capacity integer,
  price_per_person numeric(10,2),
  is_free boolean default false,
  image_url text,
  is_active boolean default true,
  available_slots jsonb,
  created_at timestamptz default now()
);

create table public.food_orders (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id),
  room_number text,
  status text default 'PLACED' check (status in ('PLACED','KOT_SENT','READY','DELIVERED')),
  items jsonb not null,
  total_amount numeric(10,2),
  ezee_folio_charge_id text,
  kot_id text,
  ordered_at timestamptz default now(),
  ready_at timestamptz
);

create table public.activity_bookings (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id),
  activity_id uuid references public.activities(id),
  booking_date date,
  time_slot text,
  num_guests integer,
  amount numeric(10,2),
  ezee_folio_charge_id text,
  status text default 'CONFIRMED',
  created_at timestamptz default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  description text,
  price numeric(10,2),
  is_active boolean default true,
  display_order integer default 0
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id),
  sender_type text check (sender_type in ('GUEST','STAFF')),
  sender_name text,
  message_text text not null,
  sent_at timestamptz default now(),
  read_at timestamptz
);

create table public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id),
  room_number text,
  guest_name text,
  triggered_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by text,
  notes text
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reservations_set_updated_at on public.reservations;
create trigger trg_reservations_set_updated_at
before update on public.reservations
for each row
execute function public.set_updated_at();

alter table public.reservations enable row level security;
alter table public.guest_preferences enable row level security;
alter table public.food_orders enable row level security;
alter table public.activity_bookings enable row level security;
alter table public.activities enable row level security;
alter table public.menu_items enable row level security;
alter table public.chat_messages enable row level security;
alter table public.sos_alerts enable row level security;
