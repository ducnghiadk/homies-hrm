import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let errorContext = 'Không có dữ liệu lỗi gần đây.';
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: recentErrors } = await supabase
        .from('telemetry_error_logs')
        .select('error_name, error_message, occurrences, status, route')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (recentErrors && recentErrors.length > 0) {
        errorContext = recentErrors
          .map((e) => `- [${e.status}] ${e.error_name} tại ${e.route || 'route'}: ${e.error_message} (${e.occurrences} lần)`)
          .join('\n');
      }
    }

    // Heuristic triage response for Admin/Manager
    let reply = `Chào Quản lý! Hermes đã kiểm tra trạng thái hệ thống:\n\n**Các sự cố ghi nhận gần đây:**\n${errorContext}\n\nHermes sẵn sàng hỗ trợ rà soát logic hoặc kiểm tra các báo cáo sự cố!`;

    const q = message.toLowerCase();
    if (q.includes('lỗi') || q.includes('sự cố') || q.includes('status')) {
      reply = `Hiện tại hệ thống đang theo dõi các mẫu lỗi sau:\n\n${errorContext}`;
    } else if (q.includes('kiểm kho') || q.includes('btp') || q.includes('nvl')) {
      reply = `Quy trình kiểm kho và BTP tuân theo cơ chế: pre-grouping NVL, tính lượng hao hụt tự động và ghi nhận phiên kiểm kho dạng atomic transaction. Nếu có dữ liệu lệch, vui lòng kiểm tra tab Lịch sử phiên kiểm kho.`;
    }

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
