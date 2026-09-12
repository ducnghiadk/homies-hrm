-- Migration: Row Level Security policies for copilot_chat_sessions
-- Created to ensure Hermes Copilot chat history is protected per admin user

-- 1. Ensure RLS is active on copilot_chat_sessions
ALTER TABLE public.copilot_chat_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to view only their own copilot sessions
CREATE POLICY "Allow authenticated view own copilot sessions"
    ON public.copilot_chat_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = admin_id);

-- 3. Allow authenticated users to create their own copilot sessions
CREATE POLICY "Allow authenticated insert own copilot sessions"
    ON public.copilot_chat_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = admin_id);

-- 4. Allow authenticated users to update their own sessions
CREATE POLICY "Allow authenticated update own copilot sessions"
    ON public.copilot_chat_sessions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = admin_id)
    WITH CHECK (auth.uid() = admin_id);

-- 5. Service role has full administrative access
CREATE POLICY "Allow service_role full access on copilot_chat_sessions"
    ON public.copilot_chat_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
