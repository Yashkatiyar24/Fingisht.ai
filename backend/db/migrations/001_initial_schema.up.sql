-- Users table (for future multi-user support)
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6EE7F9',
  icon TEXT,
  parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Category rules for auto-categorization
CREATE TABLE category_rules (
  id BIGSERIAL PRIMARY KEY,
  pattern TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  merchant TEXT NOT NULL,
  description TEXT,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT,
  tags TEXT[],
  notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  upload_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  alert_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Uploads tracking
CREATE TABLE uploads (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  total_rows INTEGER,
  errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, color, icon, is_system) VALUES
  ('Food & Dining', '#10B981', 'utensils', true),
  ('Transportation', '#6EE7F9', 'car', true),
  ('Shopping', '#C084FC', 'shopping-bag', true),
  ('Entertainment', '#F59E0B', 'film', true),
  ('Bills & Utilities', '#EF4444', 'receipt', true),
  ('Healthcare', '#EC4899', 'heart-pulse', true),
  ('Education', '#3B82F6', 'graduation-cap', true),
  ('Travel', '#8B5CF6', 'plane', true),
  ('Groceries', '#22C55E', 'shopping-cart', true),
  ('Other', '#6B7280', 'more-horizontal', true);

-- Create indexes
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_merchant ON transactions(merchant);
CREATE INDEX idx_category_rules_pattern ON category_rules(pattern);
