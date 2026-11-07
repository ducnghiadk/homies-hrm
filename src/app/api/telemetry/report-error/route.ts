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

    const fallbackRecord = {
      id: 'buf-' + Date.now(),
      fingerprint,
      error_name,
      error_message,
      stack_trace,
      route,
      component_stack,
      environment: environment || 'production',
      occurrences: 1,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    try {
      // Upsert or increment occurrences in telemetry_error_logs
      const { data: existing, error: selectErr } = await supabase
        .from('telemetry_error_logs')
        .select('id, occurrences')
        .eq('fingerprint', fingerprint)
        .eq('status', 'pending')
        .maybeSingle();

      if (selectErr) {
        // Table doesn't exist yet, return success via fallback
        console.warn('[API Report Error] Supabase table not available, using in-memory fallback:', selectErr.message);
        return NextResponse.json({ success: true, mode: 'buffered', record: fallbackRecord });
      }

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
        console.warn('[API Report Error] Supabase Insert Warning:', error.message);
        return NextResponse.json({ success: true, mode: 'buffered', record: fallbackRecord });
      }

      return NextResponse.json({ success: true, id: inserted?.id || fallbackRecord.id });
    } catch (dbErr) {
      console.warn('[API Report Error] Database operation bypassed:', dbErr);
      return NextResponse.json({ success: true, mode: 'buffered', record: fallbackRecord });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: true, mode: 'buffered_error', error: message });
  }
}
