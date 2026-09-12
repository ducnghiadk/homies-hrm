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
    const { user_description, route, network_breadcrumbs, user_role, screenshot_url } = body;

    if (!user_description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // AI triage heuristic response to instantly guide the employee
    let instantReply = 'Cảm ơn bạn đã báo cáo sự cố! Hermes đã ghi nhận ngữ cảnh và chuyển tới đội ngũ kỹ thuật xử lý.';
    const descLower = user_description.toLowerCase();
    if (descLower.includes('quay tròn') || descLower.includes('chậm') || descLower.includes('loading')) {
      instantReply = 'Hermes nhận thấy có thể do kết nối mạng tạm thời gián đoạn. Bạn thử kiểm tra lại wifi hoặc đợi 30 giây rồi thao tác lại nhé!';
    } else if (descLower.includes('không lưu được') || descLower.includes('lỗi lưu')) {
      instantReply = 'Hermes đã lưu thông tin phiên làm việc và danh sách lệnh gửi lên server. Bạn vui lòng không đóng tab để tránh mất dữ liệu nhập dở nhé!';
    }

    const { data, error } = await supabase
      .from('user_bug_reports')
      .insert({
        user_description,
        route: route || '/',
        user_role: user_role || 'staff',
        network_breadcrumbs: network_breadcrumbs || [],
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
