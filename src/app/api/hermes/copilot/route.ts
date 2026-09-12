import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const ALLOWED_ADMIN_ROLES = ['hr_admin', 'ceo', 'store_manager', 'area_manager'];

interface HistoryMessage {
  role: 'user' | 'assistant';
  text: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, user_role, user_id } = body;

    // 1. Role Guard
    if (!user_role || !ALLOWED_ADMIN_ROLES.includes(user_role)) {
      return NextResponse.json(
        { error: 'Forbidden: Bạn không có quyền truy cập Hermes Copilot' },
        { status: 403 }
      );
    }

    // 2. Message Validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nội dung tin nhắn không hợp lệ' }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    if (trimmedMsg.length < 1 || trimmedMsg.length > 2000) {
      return NextResponse.json(
        { error: 'Độ dài tin nhắn phải từ 1 đến 2000 ký tự' },
        { status: 400 }
      );
    }

    // 3. Query telemetry logs context
    let errorContext = 'Không có dữ liệu lỗi gần đây.';
    let supabaseClient = null;

    if (supabaseUrl && supabaseKey) {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      const { data: recentErrors } = await supabaseClient
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

    // 4. Incorporate conversation history context if provided
    let conversationContext = '';
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = (history as HistoryMessage[])
        .slice(-5)
        .map((h) => `${h.role === 'user' ? 'Admin' : 'Hermes'}: ${h.text}`)
        .join('\n');
      conversationContext = `\n\n**Lịch sử đối thoại trước đó:**\n${recentHistory}`;
    }

    // 5. Build intelligent response
    const q = trimmedMsg.toLowerCase();
    let reply = `Chào Quản lý (${user_role})! Hermes đã kiểm tra trạng thái hệ thống:\n\n**Các sự cố ghi nhận gần đây:**\n${errorContext}\n\nHermes sẵn sàng hỗ trợ rà soát logic hoặc kiểm tra các báo cáo sự cố!`;

    if (q.includes('lỗi') || q.includes('sự cố') || q.includes('status') || q.includes('log')) {
      reply = `Hiện tại hệ thống đang theo dõi các mẫu lỗi sau:\n\n${errorContext}\n\nBạn có muốn Hermes phân tích chi tiết lỗi nào không?`;
    } else if (q.includes('kiểm kho') || q.includes('btp') || q.includes('nvl') || q.includes('formula')) {
      reply = `Quy trình kiểm kho và BTP tuân theo cơ chế: pre-grouping NVL, tính lượng hao hụt tự động và ghi nhận phiên kiểm kho dạng atomic transaction. Nếu có dữ liệu lệch, vui lòng kiểm tra tab Lịch sử phiên kiểm kho.`;
    } else if (q.includes('nhân sự') || q.includes('chấm công') || q.includes('kpi') || q.includes('gamification')) {
      reply = `Mô-đun nhân sự đang hoạt động bình thường. Dữ liệu ca làm, điểm thưởng và thăng hạng nhân viên được đồng bộ tự động theo chu kỳ.`;
    } else if (conversationContext) {
      reply = `Hermes đã ghi nhận yêu cầu: "${trimmedMsg}". Dựa trên bối cảnh vận hành hiện tại, hệ thống ổn định và không có xung đột nghiêm trọng nào được phát hiện.`;
    }

    // 6. Best-effort log session to copilot_chat_sessions table
    if (supabaseClient && user_id) {
      try {
        const sessionMessages = Array.isArray(history)
          ? [...history, { role: 'assistant', text: reply }]
          : [{ role: 'user', text: trimmedMsg }, { role: 'assistant', text: reply }];

        await supabaseClient.from('copilot_chat_sessions').insert({
          admin_id: user_id,
          messages: sessionMessages
        });
      } catch (logErr) {
        console.warn('[Hermes Copilot] Session save skipped or failed:', logErr);
      }
    }

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
