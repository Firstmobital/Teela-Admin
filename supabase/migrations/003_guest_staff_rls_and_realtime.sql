create or replace function public.current_guest_token()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      (current_setting('request.headers', true)::json ->> 'x-guest-token'),
      (current_setting('request.headers', true)::json ->> 'X-Guest-Token')
    ),
    ''
  );
$$;

-- Guests: can only read their own reservation via token header.
drop policy if exists reservations_guest_select_own on public.reservations;
create policy reservations_guest_select_own
on public.reservations
for select
to anon, authenticated
using (unique_token = public.current_guest_token());

-- Guests: can insert records only when reservation_id belongs to their token.
drop policy if exists guest_preferences_guest_insert_own on public.guest_preferences;
create policy guest_preferences_guest_insert_own
on public.guest_preferences
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.reservations r
    where r.id = reservation_id
      and r.unique_token = public.current_guest_token()
  )
);

drop policy if exists food_orders_guest_insert_own on public.food_orders;
create policy food_orders_guest_insert_own
on public.food_orders
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.reservations r
    where r.id = reservation_id
      and r.unique_token = public.current_guest_token()
  )
);

drop policy if exists activity_bookings_guest_insert_own on public.activity_bookings;
create policy activity_bookings_guest_insert_own
on public.activity_bookings
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.reservations r
    where r.id = reservation_id
      and r.unique_token = public.current_guest_token()
  )
);

drop policy if exists chat_messages_guest_insert_own on public.chat_messages;
create policy chat_messages_guest_insert_own
on public.chat_messages
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.reservations r
    where r.id = reservation_id
      and r.unique_token = public.current_guest_token()
  )
);

drop policy if exists sos_alerts_guest_insert_own on public.sos_alerts;
create policy sos_alerts_guest_insert_own
on public.sos_alerts
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.reservations r
    where r.id = reservation_id
      and r.unique_token = public.current_guest_token()
  )
);

-- Staff: authenticated users can select/update all rows in all tables.
drop policy if exists reservations_staff_select_all on public.reservations;
create policy reservations_staff_select_all
on public.reservations
for select
to authenticated
using (true);

drop policy if exists reservations_staff_update_all on public.reservations;
create policy reservations_staff_update_all
on public.reservations
for update
to authenticated
using (true)
with check (true);

drop policy if exists guest_preferences_staff_select_all on public.guest_preferences;
create policy guest_preferences_staff_select_all
on public.guest_preferences
for select
to authenticated
using (true);

drop policy if exists guest_preferences_staff_update_all on public.guest_preferences;
create policy guest_preferences_staff_update_all
on public.guest_preferences
for update
to authenticated
using (true)
with check (true);

drop policy if exists food_orders_staff_select_all on public.food_orders;
create policy food_orders_staff_select_all
on public.food_orders
for select
to authenticated
using (true);

drop policy if exists food_orders_staff_update_all on public.food_orders;
create policy food_orders_staff_update_all
on public.food_orders
for update
to authenticated
using (true)
with check (true);

drop policy if exists activity_bookings_staff_select_all on public.activity_bookings;
create policy activity_bookings_staff_select_all
on public.activity_bookings
for select
to authenticated
using (true);

drop policy if exists activity_bookings_staff_update_all on public.activity_bookings;
create policy activity_bookings_staff_update_all
on public.activity_bookings
for update
to authenticated
using (true)
with check (true);

drop policy if exists activities_staff_select_all on public.activities;
create policy activities_staff_select_all
on public.activities
for select
to authenticated
using (true);

drop policy if exists activities_staff_update_all on public.activities;
create policy activities_staff_update_all
on public.activities
for update
to authenticated
using (true)
with check (true);

drop policy if exists menu_items_staff_select_all on public.menu_items;
create policy menu_items_staff_select_all
on public.menu_items
for select
to authenticated
using (true);

drop policy if exists menu_items_staff_update_all on public.menu_items;
create policy menu_items_staff_update_all
on public.menu_items
for update
to authenticated
using (true)
with check (true);

drop policy if exists chat_messages_staff_select_all on public.chat_messages;
create policy chat_messages_staff_select_all
on public.chat_messages
for select
to authenticated
using (true);

drop policy if exists chat_messages_staff_update_all on public.chat_messages;
create policy chat_messages_staff_update_all
on public.chat_messages
for update
to authenticated
using (true)
with check (true);

drop policy if exists sos_alerts_staff_select_all on public.sos_alerts;
create policy sos_alerts_staff_select_all
on public.sos_alerts
for select
to authenticated
using (true);

drop policy if exists sos_alerts_staff_update_all on public.sos_alerts;
create policy sos_alerts_staff_update_all
on public.sos_alerts
for update
to authenticated
using (true)
with check (true);

-- Service role bypasses RLS automatically in Supabase (BYPASSRLS).

-- Enable Supabase Realtime for chat messages.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
end;
$$;
