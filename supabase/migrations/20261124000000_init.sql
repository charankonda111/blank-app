-- Lost2Med schema: per-user app data, Stripe subscription state, and AI usage limits.

-- ── App data ────────────────────────────────────────────────────────────────
-- The whole app state (courses, exams, journal, wellness) is one JSON document per user.
create table public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_data_size check (pg_column_size(data) < 2000000)
);

alter table public.user_data enable row level security;

create policy "Users read their own data" on public.user_data
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert their own data" on public.user_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their own data" on public.user_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their own data" on public.user_data
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── Subscriptions ───────────────────────────────────────────────────────────
-- Written only by Edge Functions (service role) from Stripe webhooks. Users can read their own row.
create table public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text not null unique,
  stripe_subscription_id text unique,
  status                 text not null default 'none', -- none | trialing | active | past_due | canceled | unpaid | incomplete | ...
  plan                   text,                          -- monthly | yearly
  price_id               text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users read their own subscription" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- ── AI usage (daily limit per user) ─────────────────────────────────────────
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default current_date,
  count   integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security; -- no policies: service role only

-- Atomically counts one AI request. Returns false when the user is over the daily limit.
create or replace function public.consume_ai_credit(p_user uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage as u (user_id, day, count)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update
    set count = u.count + 1
    where u.count < p_limit
  returning u.count into new_count;
  return new_count is not null;
end;
$$;

-- ── API access ──────────────────────────────────────────────────────────────
-- Explicit grants, so the app works even when the project was created with
-- "Grant API access to new tables automatically" turned off. RLS above still
-- limits each user to their own rows.
grant select, insert, update, delete on public.user_data to authenticated;
grant select on public.subscriptions to authenticated;
revoke all on public.user_data, public.subscriptions, public.ai_usage from anon;
revoke all on public.ai_usage from authenticated;
grant all on public.user_data, public.subscriptions, public.ai_usage to service_role;

revoke all on function public.consume_ai_credit(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid, integer) to service_role;
