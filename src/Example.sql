-- Create extensions + helper trigger
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles (optional; links to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  locale text,
  currency text DEFAULT 'TRY',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER profiles_set_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- entry_group (groups)
CREATE TABLE IF NOT EXISTS public.entry_group (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entry_group_user ON public.entry_group(user_id);

CREATE TRIGGER entry_group_set_timestamp
BEFORE UPDATE ON public.entry_group
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- entry (main records)
CREATE TABLE IF NOT EXISTS public.entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.entry_group(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'TRY',
  type text, -- e.g. 'expense'|'income'|'transfer'
  description text,
  occurred_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entry_user ON public.entry(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_group ON public.entry(group_id);
CREATE INDEX IF NOT EXISTS idx_entry_occurred ON public.entry(occurred_at);

CREATE TRIGGER entry_set_timestamp
BEFORE UPDATE ON public.entry
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- recurring_config (scheduled rules)
CREATE TABLE IF NOT EXISTS public.recurring_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.entry_group(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  currency text DEFAULT 'TRY',
  interval text NOT NULL, -- 'daily','weekly','monthly','yearly' or cron-like
  start_date date NOT NULL DEFAULT now(),
  end_date date,
  next_run timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring_config(user_id);

CREATE TRIGGER recurring_config_set_timestamp
BEFORE UPDATE ON public.recurring_config
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- exclusion (exceptions for recurring rules)
CREATE TABLE IF NOT EXISTS public.exclusion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_id uuid NOT NULL REFERENCES public.recurring_config(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  excluded_date date NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exclusion_user ON public.exclusion(user_id);
CREATE INDEX IF NOT EXISTS idx_exclusion_recurring ON public.exclusion(recurring_id);

-- optional: attachments table (if code uploads files)
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES public.entry(id) ON DELETE CASCADE,
  url text NOT NULL,
  file_name text,
  file_size bigint,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_user ON public.attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_entry ON public.attachments(entry_id);

-- Enable RLS and create basic policies
DO $$
BEGIN
  ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.entry_group ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.entry ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.recurring_config ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.exclusion ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.attachments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- policies: allow owners to operate on their rows
CREATE POLICY IF NOT EXISTS "profiles_owner" ON public.profiles
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );

CREATE POLICY IF NOT EXISTS "entry_group_user_only" ON public.entry_group
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY IF NOT EXISTS "entry_user_only" ON public.entry
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY IF NOT EXISTS "recurring_user_only" ON public.recurring_config
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY IF NOT EXISTS "exclusion_user_only" ON public.exclusion
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY IF NOT EXISTS "attachments_user_only" ON public.attachments
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- Optional: seed a few global groups/categories (if desired)
INSERT INTO public.entry_group (id, user_id, name)
VALUES (gen_random_uuid(), NULL, 'Default')
ON CONFLICT DO NOTHING;