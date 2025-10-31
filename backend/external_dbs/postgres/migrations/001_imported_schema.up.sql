CREATE SCHEMA supabase_migrations;
CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE TABLE public.accounts (
    id text NOT NULL,
    user_id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    access_token text,
    refresh_token text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.api_keys (
    id text NOT NULL,
    organization_id text NOT NULL,
    name text NOT NULL,
    key text NOT NULL,
    last_used timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.batches (
    id text NOT NULL,
    organization_id text NOT NULL,
    file_name text NOT NULL,
    file_size integer,
    total_transactions integer DEFAULT 0,
    processed_transactions integer DEFAULT 0,
    status text DEFAULT 'processing'::text,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);
CREATE TABLE public.invoices (
    id text NOT NULL,
    organization_id text NOT NULL,
    subscription_id text,
    amount real NOT NULL,
    currency text DEFAULT 'USD'::text,
    status text NOT NULL,
    stripe_invoice_id text,
    invoice_date timestamp without time zone NOT NULL,
    paid_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.kv_store_76933ba8 (
    key text NOT NULL,
    value jsonb NOT NULL
);
CREATE TABLE public.organization_members (
    id text NOT NULL,
    organization_id text NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.organizations (
    id text NOT NULL,
    name text NOT NULL,
    owner_id text NOT NULL,
    currency text DEFAULT 'USD'::text,
    timezone text DEFAULT 'UTC'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.rules (
    id text NOT NULL,
    organization_id text NOT NULL,
    name text NOT NULL,
    enabled boolean DEFAULT true,
    condition_field text NOT NULL,
    condition_operator text NOT NULL,
    condition_value text NOT NULL,
    action_type text NOT NULL,
    action_value text NOT NULL,
    priority integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.sessions (
    id text NOT NULL,
    user_id text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    ip_address text,
    user_agent text
);
CREATE TABLE public.subscriptions (
    id text NOT NULL,
    organization_id text NOT NULL,
    plan text NOT NULL,
    status text NOT NULL,
    current_period_start timestamp without time zone,
    current_period_end timestamp without time zone,
    cancel_at_period_end boolean DEFAULT false,
    stripe_customer_id text,
    stripe_subscription_id text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.transactions (
    id text NOT NULL,
    organization_id text NOT NULL,
    date timestamp without time zone NOT NULL,
    description text NOT NULL,
    amount real NOT NULL,
    balance real,
    category text,
    gst_rate text,
    gst_amount real,
    confidence integer,
    batch_id text,
    status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    email_verified boolean DEFAULT false,
    image text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.your_table (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text,
    created_by text,
    idempotency_key text
);