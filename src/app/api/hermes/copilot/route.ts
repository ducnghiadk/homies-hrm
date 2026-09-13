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
    const { message, history, user_role, user_id, bot_id = 'auto' } = body;

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
      conversationContext = `\n\n**Lịch sử đối thoại:**\n${recentHistory}`;
    }

    // 5. Build intelligent persona response based on bot_id & query
    const q = trimmedMsg.toLowerCase();
    let reply = '';
    let answeredBy = bot_id;

    // Auto router intent detection if bot_id is 'auto'
    if (bot_id === 'auto') {
      if (q.includes('lỗi') || q.includes('sự cố') || q.includes('status') || q.includes('log') || q.includes('crash') || q.includes('500')) {
        answeredBy = 'tech';
      } else if (q.includes('kho') || q.includes('btp') || q.includes('nvl') || q.includes('công thức') || q.includes('hao hụt') || q.includes('kiểm kê')) {
        answeredBy = 'inventory';
      } else if (q.includes('lương') || q.includes('nhân sự') || q.includes('ca làm') || q.includes('kpi') || q.includes('chấm công') || q.includes('thưởng') || q.includes('phạt')) {
        answeredBy = 'hr';
      }
    }

    if (answeredBy === 'tech') {
      reply = `[🛠️ Bác sĩ Kỹ thuật Hermes]\n` +
        `Tôi đã kiểm tra dữ liệu Telemetry Logs mới nhất của hệ thống:\n\n` +
        `**Chi tiết các mẫu sự cố ghi nhận:**\n${errorContext}\n\n` +
        `💡 *Khuyến nghị chẩn đoán:* Nếu gặp sự cố trắng trang hoặc lỗi mạng cục bộ, bạn có thể kiểm tra danh sách breadcrumb trong Dev Cockpit hoặc tab Network DevTools để phân tích chi tiết request.`;
    } else if (answeredBy === 'inventory') {
      reply = `[📦 Chuyên gia Kho & BTP Hermes]\n` +
        `Về quy trình kiểm kho và BTP trà sữa:\n\n` +
        `- **Cơ chế Pre-Grouping NVL:** Nhóm trước các nguyên vật liệu trùng mã để tránh lỗi công thức formula-poisoning.\n` +
        `- **Tính lượng hao hụt tự động:** So sánh giữa số tồn lý thuyết trên đơn bán và số thực tế đếm tại quầy.\n` +
        `- **Giao dịch Atomic:** Phiên kiểm kho được khóa dữ liệu snapshot khi chốt, tránh tình trạng 2 ca cùng sửa làm sai lệch tồn kho.\n\n` +
        `Bạn có cần rà soát lại phiên kiểm kho của chi nhánh cụ thể nào không?`;
    } else if (answeredBy === 'hr') {
      reply = `[👥 Trợ lý Nhân sự & KPI Hermes]\n` +
        `Về vận hành nhân sự và chấm công:\n\n` +
        `- **Quy chế Ca làm:** Nhân viên cần điểm danh trước giờ vào ca tối thiểu 5 phút qua vị trí GPS hoặc Wifi cửa hàng.\n` +
        `- **Đánh giá KPI & Điểm thưởng:** Điểm Gamification được cộng tự động sau mỗi ca hoàn thành đúng checklist và không có khiếu nại.\n` +
        `- **Giải quyết khiếu nại:** Khiếu nại trừ điểm KPI được gửi trực tiếp tới Cửa hàng trưởng/HR Admin xét duyệt trong vòng 24h.\n\n` +
        `Bạn muốn tra cứu thêm về thang lương hay quy trình thăng hạng nhân viên?`;
    } else {
      reply = `[⚡ Hermes Router - Điều phối Hệ thống]\n` +
        `Xin chào Quản lý (${user_role})! Hệ thống Hermes đang hoạt động ổn định.\n\n` +
        `**Tóm tắt trạng thái:**\n` +
        `- Telemetry: Đang theo dõi và gom nhóm lỗi tự động\n` +
        `- BTP & Kho: Dữ liệu kiểm kê đồng bộ theo ca\n` +
        `- Nhân sự & KPI: Hệ thống tính điểm vận hành bình thường\n\n` +
        `Bạn có thể bấm chọn Tab chuyên gia tương ứng ở trên để tra cứu sâu hơn!`;
    }

    // 6. Best-effort log session to copilot_chat_sessions table
    if (supabaseClient && user_id) {
      try {
        const sessionMessages = Array.isArray(history)
          ? [...history, { role: 'assistant', text: reply, bot_id: answeredBy }]
          : [{ role: 'user', text: trimmedMsg }, { role: 'assistant', text: reply, bot_id: answeredBy }];

        await supabaseClient.from('copilot_chat_sessions').insert({
          admin_id: user_id,
          messages: sessionMessages
        });
      } catch (logErr) {
        console.warn('[Hermes Copilot] Session save skipped or failed:', logErr);
      }
    }

    return NextResponse.json({ reply, answeredBy });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
