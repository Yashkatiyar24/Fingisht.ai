-- Categorization rules to allow users to define their own categorization logic
CREATE TABLE categorization_rules (
  id uuid PRIMARY KEY default gen_random_uuid(),
  user_id uuid not null,
  merchant_pattern text not null,
  category_id uuid not null,
  priority int default 0,
  usage_count int default 0,
  created_at timestamptz default now(),
  constraint fk_user foreign key (user_id) references profiles(id) on delete cascade,
  constraint fk_category foreign key (category_id) references categories(id) on delete cascade
);

-- Merchants table to store known merchants and their categories
CREATE TABLE merchants (
  id uuid PRIMARY KEY default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  normalized_name text not null,
  category_id uuid null,
  created_at timestamptz default now(),
  constraint fk_user foreign key (user_id) references profiles(id) on delete cascade,
  constraint fk_category foreign key (category_id) references categories(id) on delete set null
);

-- Indexes to improve query performance
CREATE INDEX ON categorization_rules(user_id, merchant_pattern);
CREATE INDEX ON merchants(user_id, normalized_name);

-- Enable Row Level Security (RLS) for the new tables
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- RLS Policies to ensure users can only access their own data
CREATE POLICY "rules by owner" ON categorization_rules
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "merchants by owner" ON merchants
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
