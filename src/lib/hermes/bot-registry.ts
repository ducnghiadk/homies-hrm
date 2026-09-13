export type HermesBotId = 'auto' | 'tech' | 'inventory' | 'hr';

export interface HermesBotConfig {
  id: HermesBotId;
  name: string;
  badge: string;
  roleDescription: string;
  greeting: string;
  promptSuggestions: string[];
}

export const HERMES_BOT_REGISTRY: Record<HermesBotId, HermesBotConfig> = {
  auto: {
    id: 'auto',
    name: 'Hermes Router',
    badge: '⚡ Tự động',
    roleDescription: 'Trợ lý Tổng hợp - Tự động nhận diện nhu cầu',
    greeting: 'Xin chào Quản trị viên! Tôi là Hermes Router. Bạn có thể hỏi tôi bất kỳ vấn đề gì (lỗi hệ thống, kiểm kho BTP hay nhân sự), tôi sẽ tự động điều phối chuyên gia xử lý.',
    promptSuggestions: [
      'Kiểm tra lỗi hệ thống gần đây',
      'Công thức kiểm kho BTP tính thế nào?',
      'Chính sách tính KPI và thưởng phạt'
    ]
  },
  tech: {
    id: 'tech',
    name: 'Bác sĩ Kỹ thuật',
    badge: '🛠️ Kỹ thuật',
    roleDescription: 'Chuyên gia Chẩn đoán Lỗi, Log & Telemetry',
    greeting: 'Chào bạn! Tôi là Bác sĩ Kỹ thuật của Hermes. Tôi có thể soi chiếu telemetry error logs, phân tích stack trace và kiểm tra trạng thái các API.',
    promptSuggestions: [
      'Có lỗi nào nghiêm trọng trong 24h qua không?',
      'Kiểm tra lỗi trắng màn hình gần nhất',
      'Trạng thái các API endpoints hiện tại'
    ]
  },
  inventory: {
    id: 'inventory',
    name: 'Chuyên gia Kho & BTP',
    badge: '📦 Kho & BTP',
    roleDescription: 'Chuyên gia BTP, Định mức NVL & Kiểm kê',
    greeting: 'Chào Quản lý! Tôi là Hermes BTP & Kho. Tôi nắm rõ quy trình pre-grouping NVL, định mức hao hụt nguyên vật liệu và cơ chế phiên kiểm kê atomic.',
    promptSuggestions: [
      'Giải thích cơ chế tính hao hụt BTP',
      'Tại sao số tồn kho bị lệch sau chốt ca?',
      'Quy trình lập phiên kiểm kê chi nhánh'
    ]
  },
  hr: {
    id: 'hr',
    name: 'Trợ lý Nhân sự & KPI',
    badge: '👥 Nhân sự',
    roleDescription: 'Chuyên gia Quy chế Ca làm, Lương & KPI',
    greeting: 'Chào bạn! Tôi là Hermes HR Copilot. Tôi sẵn sàng hỗ trợ tra cứu quy định chấm công, khiếu nại KPI, tính giờ làm ngoài giờ và điểm thưởng gamification.',
    promptSuggestions: [
      'Quy định tính điểm thưởng Gamification',
      'Cách xử lý đơn khiếu nại vi phạm KPI',
      'Chính sách chấm công ca gãy và OT'
    ]
  }
};
