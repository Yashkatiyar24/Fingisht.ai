-- Core tables (uuid ids, clerk_user_id text)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name text not null,
  color text not null default '#8884d8',
  created_at timestamptz not null default now(),
  unique (clerk_user_id, name)
);

create table if not exists public.category_rules (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  keyword text not null,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (clerk_user_id, keyword)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  date timestamptz,
  description text not null default '',
  amount numeric not null,
  merchant text not null default '',
  currency text not null default 'INR',
  category_id uuid references public.categories(id) on delete set null,
  ai_suggested_category text,
  ai_confidence numeric,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.categories enable row level security;
alter table public.category_rules enable row level security;
alter table public.transactions enable row level security;

-- Policies: row ownership by clerk_user_id stored in the row.
-- Since browser won't hold a Supabase session, keep policies permissive and use backend to gate access.
-- Option A (safe w/ backend-only access): allow service role only, and skip client access.
-- Option B (if you really want client reads): use a custom JWT claim or fallback to read-none.

-- Minimal policies for now (backend will use service role, client won't be able to bypass):
create policy "no_client_select" on public.transactions for select using (false);
create policy "no_client_dml"    on public.transactions for all using (false) with check (false);

create policy "no_client_select_categories" on public.categories for select using (false);
create policy "no_client_dml_categories"    on public.categories for all using (false) with check (false);

create policy "no_client_select_rules" on public.category_rules for select using (false);
create policy "no_client_dml_rules"    on public.category_rules for all using (false) with check (false);
