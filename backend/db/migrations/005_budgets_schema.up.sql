-- Budgets table to store user-defined budgets for each category
CREATE TABLE budgets (
  id uuid PRIMARY KEY default gen_random_uuid(),
  user_id uuid not null,
  category_id uuid not null,
  amount numeric(14,2) not null,
  period text check (period in ('monthly', 'weekly', 'yearly')) not null default 'monthly',
  created_at timestamptz default now(),
  constraint fk_user foreign key (user_id) references profiles(id) on delete cascade,
  constraint fk_category foreign key (category_id) references categories(id) on delete cascade,
  unique(user_id, category_id, period)
);

-- Indexes to improve query performance
CREATE INDEX ON budgets(user_id, period);

-- Enable Row Level Security (RLS) for the budgets table
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies to ensure users can only access their own data
CREATE POLICY "budgets by owner" ON budgets
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
