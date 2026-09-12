import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { fingerprint, error_name, error_message, stack_trace, route, component_stack, environment } = body;

    if (!fingerprint || !error_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert or increment occurrences in telemetry_error_logs
    const { data: existing } = await supabase
      .from('telemetry_error_logs')
      .select('id, occurrences')
      .eq('fingerprint', fingerprint)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('telemetry_error_logs')
        .update({
          occurrences: (existing.occurrences || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      return NextResponse.json({ success: true, updated: existing.id });
    }

    const { data: inserted, error } = await supabase
      .from('telemetry_error_logs')
      .insert({
        fingerprint,
        error_name,
        error_message,
        stack_trace,
        route,
        component_stack,
        environment: environment || 'production',
        git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || null,
        occurrences: 1,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('[API Report Error] Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
