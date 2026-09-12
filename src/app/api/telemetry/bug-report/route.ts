import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Rate limiting in-memory map: key -> timestamps
const reportRateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REPORTS_PER_WINDOW = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (reportRateLimitMap.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REPORTS_PER_WINDOW) {
    reportRateLimitMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  reportRateLimitMap.set(key, timestamps);
  return false;
}

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { user_description, route, network_breadcrumbs, user_role, screenshot_url, user_id } = body;

    // 1. Validation
    if (!user_description || typeof user_description !== 'string') {
      return NextResponse.json({ error: 'Mô tả sự cố là bắt buộc' }, { status: 400 });
    }

    const trimmedDesc = user_description.trim();
    if (trimmedDesc.length < 5 || trimmedDesc.length > 2000) {
      return NextResponse.json(
        { error: 'Mô tả sự cố phải từ 5 đến 2000 ký tự' },
        { status: 400 }
      );
    }

    // 2. Rate limiting check
    const rateLimitKey = user_id || req.headers.get('x-forwarded-for') || 'anonymous_reporter';
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Bạn đã gửi quá nhiều báo cáo. Vui lòng chờ 1 phút trước khi thử lại.' },
        { status: 429 }
      );
    }

    // 3. Instant AI triage heuristic response
    let instantReply = 'Cảm ơn bạn đã báo cáo sự cố! Hermes đã ghi nhận ngữ cảnh và chuyển tới đội ngũ kỹ thuật xử lý.';
    const descLower = trimmedDesc.toLowerCase();
    if (descLower.includes('quay tròn') || descLower.includes('chậm') || descLower.includes('loading')) {
      instantReply = 'Hermes nhận thấy có thể do kết nối mạng tạm thời gián đoạn. Bạn thử kiểm tra lại wifi hoặc đợi 30 giây rồi thao tác lại nhé!';
    } else if (descLower.includes('không lưu được') || descLower.includes('lỗi lưu')) {
      instantReply = 'Hermes đã lưu thông tin phiên làm việc và danh sách lệnh gửi lên server. Bạn vui lòng không đóng tab để tránh mất dữ liệu nhập dở nhé!';
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate if user_id looks like a valid UUID, otherwise pass null
    const isValidUuid = typeof user_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id);

    const { data, error } = await supabase
      .from('user_bug_reports')
      .insert({
        user_id: isValidUuid ? user_id : null,
        user_description: trimmedDesc,
        route: route || '/',
        user_role: user_role || 'staff',
        network_breadcrumbs: Array.isArray(network_breadcrumbs) ? network_breadcrumbs : [],
        screenshot_url: screenshot_url || null,
        hermes_instant_reply: instantReply,
        status: 'open'
      })
      .select('id, hermes_instant_reply')
      .single();

    if (error) {
      console.error('[Bug Report] Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reportId: data.id, reply: data.hermes_instant_reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
