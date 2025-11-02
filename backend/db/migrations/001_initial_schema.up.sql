-- Profiles table to store user-specific information
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Categories table for users to classify their transactions
CREATE TABLE categories (
  id uuid PRIMARY KEY default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  color text,
  icon text,
  created_at timestamptz default now(),
  constraint fk_user foreign key (user_id) references profiles(id) on delete cascade
);

-- Import batches to track file uploads
CREATE TABLE import_batches (
  id uuid PRIMARY KEY default gen_random_uuid(),
  user_id uuid not null,
  filename text,
  checksum text,
  row_count int,
  created_at timestamptz default now(),
  constraint fk_user foreign key (user_id) references profiles(id) on delete cascade
);

-- Transactions table to store all financial transactions
CREATE TABLE transactions (
  id uuid PRIMARY KEY default gen_random_uuid(),
  user_id uuid not null,
  occurred_at date not null,
  merchant text,
  description text,
  amount numeric(14,2) not null,
  type text check (type in ('debit','credit')) not null,
  category_id uuid null references categories(id) on delete set null,
  raw_category text null,
  import_batch_id uuid null references import_batches(id) on delete set null,
  row_hash text unique,
  created_at timestamptz default now(),
  constraint fk_user foreign key (user_id) references profiles(id) on delete cascade
);

-- Indexes to improve query performance
CREATE INDEX ON transactions(user_id, occurred_at desc);
CREATE UNIQUE INDEX ON transactions(row_hash);
CREATE INDEX ON transactions(user_id, category_id);

-- Enable Row Level Security (RLS) for all relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies to ensure users can only access their own data
CREATE POLICY "profiles self" ON profiles
FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "categories by owner" on categories
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions by owner" on transactions
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "batches by owner" on import_batches
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
