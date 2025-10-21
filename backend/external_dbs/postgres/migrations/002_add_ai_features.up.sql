-- Enable pgvector extension for embedding similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add AI categorization columns to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS ai_category text,
ADD COLUMN IF NOT EXISTS ai_confidence double precision,
ADD COLUMN IF NOT EXISTS ai_explanation text,
ADD COLUMN IF NOT EXISTS model_version text,
ADD COLUMN IF NOT EXISTS merchant text,
ADD COLUMN IF NOT EXISTS is_manual_category boolean DEFAULT false;

-- Create merchants table for embedding-based matching
CREATE TABLE IF NOT EXISTS public.merchants (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id text NOT NULL,
    name text NOT NULL,
    normalized_name text NOT NULL,
    category text,
    embedding vector(384),
    transaction_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Create index for fast merchant lookups
CREATE INDEX IF NOT EXISTS idx_merchants_org_name ON public.merchants(organization_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_merchants_embedding ON public.merchants USING ivfflat (embedding vector_cosine_ops);

-- Create anomalies table for tracking spending anomalies
CREATE TABLE IF NOT EXISTS public.anomalies (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id text NOT NULL,
    transaction_id text,
    date timestamp without time zone NOT NULL,
    amount double precision NOT NULL,
    z_score double precision,
    mad_score double precision,
    type text NOT NULL,
    severity text NOT NULL,
    acknowledged boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_org_date ON public.anomalies(organization_id, date DESC);

-- Create insights table for AI-generated monthly insights
CREATE TABLE IF NOT EXISTS public.insights (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id text NOT NULL,
    period_start timestamp without time zone NOT NULL,
    period_end timestamp without time zone NOT NULL,
    bullets jsonb NOT NULL,
    summary text NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_org_period ON public.insights(organization_id, period_start DESC);

-- Create settings table for user preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id text PRIMARY KEY,
    organization_id text NOT NULL,
    ai_insights_enabled boolean DEFAULT true,
    ai_categorization_enabled boolean DEFAULT true,
    share_merchant_names boolean DEFAULT true,
    privacy_mode boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Create categorization rules table (enhanced version)
CREATE TABLE IF NOT EXISTS public.categorization_rules (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id text NOT NULL,
    merchant_pattern text NOT NULL,
    category text NOT NULL,
    confidence double precision DEFAULT 1.0,
    rule_type text DEFAULT 'manual',
    created_by text,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cat_rules_org ON public.categorization_rules(organization_id);
