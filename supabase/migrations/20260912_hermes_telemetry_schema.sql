-- Schema Migration for Hermes Bot Telemetry & Operations

-- 1. Table: telemetry_error_logs
CREATE TABLE IF NOT EXISTS public.telemetry_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint TEXT NOT NULL,
    error_name TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    route TEXT,
    component_stack TEXT,
    environment TEXT NOT NULL DEFAULT 'production',
    git_commit_sha TEXT,
    occurrences INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    hermes_report JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_fingerprint ON public.telemetry_error_logs (fingerprint);
CREATE INDEX IF NOT EXISTS idx_telemetry_status ON public.telemetry_error_logs (status);

-- 2. Table: user_bug_reports
CREATE TABLE IF NOT EXISTS public.user_bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT,
    user_description TEXT NOT NULL,
    route TEXT NOT NULL,
    network_breadcrumbs JSONB DEFAULT '[]'::jsonb,
    screenshot_url TEXT,
    telemetry_log_id UUID REFERENCES public.telemetry_error_logs(id) ON DELETE SET NULL,
    hermes_instant_reply TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table: copilot_chat_sessions
CREATE TABLE IF NOT EXISTS public.copilot_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE public.telemetry_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated clients to report error logs
CREATE POLICY "Allow public insert into telemetry_error_logs"
    ON public.telemetry_error_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow service_role and admin to select/update telemetry_error_logs
CREATE POLICY "Allow service_role full access on telemetry_error_logs"
    ON public.telemetry_error_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to insert bug reports
CREATE POLICY "Allow authenticated insert into user_bug_reports"
    ON public.user_bug_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated view their own bug reports or admins"
    ON public.user_bug_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
