/**
 * Gợi ý theo "Homies Master Career Path Playbook V7".
 * Mặc định hệ thống để trống mọi con số; CEO/HR bấm "Điền gợi ý theo Playbook V7"
 * để điền các số dưới đây vào bản nháp rồi tự sửa trước khi lưu.
 */
import type {
  CareerGradeCode,
  CareerGradeRequirement,
  CareerPathSettings,
  CareerPositionCode,
  CareerSkillConfig,
  CareerSkillGroup,
} from './settings.ts'

const skill = (
  code: string,
  name: string,
  position: CareerPositionCode | null,
  group: CareerSkillGroup,
  standard: string,
): CareerSkillConfig => ({ code, name, position, group, standard, active: true })

/** Danh mục kỹ năng (chữ, không phải con số) — dùng sẵn làm danh mục mặc định. */
export const PLAYBOOK_V7_SKILLS: CareerSkillConfig[] = [
  skill('CS01', 'Menu, tư vấn', 'cashier', 'core', 'Giải thích đúng món, tùy chọn, ưu đãi'),
  skill('CS02', 'POS', 'cashier', 'core', 'Nhập đúng món, số lượng, yêu cầu'),
  skill('CS03', 'Thanh toán', 'cashier', 'core', 'Đúng phương thức, xác nhận giao dịch'),
  skill('CS04', 'Food App', 'cashier', 'core', 'Nhận, theo dõi, xử lý đơn thông thường'),
  skill('CS05', 'Theo dõi đơn', 'cashier', 'core', 'Không bỏ sót hoặc trùng đơn'),
  skill('CS06', 'QC đơn', 'cashier', 'core', 'Đúng món, đủ ly, phụ kiện'),
  skill('CS07', 'Đóng gói', 'cashier', 'core', 'Đúng quy cách'),
  skill('CS08', 'Giao đơn', 'cashier', 'core', 'Đúng mã và người nhận'),
  skill('CS09', 'SOP, vật tư', 'cashier', 'core', 'Mở / trong / đóng ca đúng phạm vi'),
  skill('CS10', 'Xử lý tình huống', 'cashier', 'core', 'Xử lý hoặc báo đúng quyền'),
  skill('BR01', 'Nguyên liệu', 'barista', 'core', 'Nhận diện và sử dụng đúng'),
  skill('BR02', 'Thiết bị', 'barista', 'core', 'Sử dụng an toàn, đúng cách'),
  skill('BR03', 'Tem ly', 'barista', 'core', 'Đọc đúng size, đường, đá, topping'),
  skill('BR04', 'Trà sữa', 'barista', 'core', 'Toàn nhóm món đang bán'),
  skill('BR05', 'Trà trái cây', 'barista', 'core', 'Toàn nhóm món đang bán'),
  skill('BR06', 'Topping', 'barista', 'core', 'Đúng loại, định lượng'),
  skill('BR07', 'Bán thành phẩm', 'barista', 'core', 'Đúng SOP được giao'),
  skill('BR08', 'Date, bảo quản', 'barista', 'core', 'Kiểm tra hạn và điều kiện bảo quản'),
  skill('BR09', 'QC sản phẩm', 'barista', 'core', 'Đúng công thức và ngoại quan'),
  skill('BR10', 'Năng suất, SOP', 'barista', 'core', 'Tổ chức tem, thao tác, vệ sinh khu vực'),
  skill('SB01', 'Đọc tem, chuẩn bị ly/dụng cụ', 'barista', 'support', 'Thu ngân hỗ trợ Pha chế'),
  skill('SB02', 'Chuẩn bị topping đã học', 'barista', 'support', 'Thu ngân hỗ trợ Pha chế'),
  skill('SB03', 'Bổ sung vật tư pha chế', 'barista', 'support', 'Thu ngân hỗ trợ Pha chế'),
  skill('SC01', 'Đọc mã đơn, kiểm tra đủ ly', 'cashier', 'support', 'Pha chế hỗ trợ Thu ngân'),
  skill('SC02', 'Đóng gói đúng quy cách', 'cashier', 'support', 'Pha chế hỗ trợ Thu ngân'),
  skill('SC03', 'Giao đúng đơn theo phân công', 'cashier', 'support', 'Pha chế hỗ trợ Thu ngân'),
  skill('SC04', 'POS cơ bản theo phân quyền', 'cashier', 'support', 'Pha chế hỗ trợ Thu ngân'),
  skill('AT01', 'ATTP & vệ sinh', null, 'common', 'Bắt buộc đạt ở mọi bậc'),
  skill('AT02', 'SOP & tác phong', null, 'common', 'Bắt buộc đạt ở mọi bậc'),
  skill('AD01', 'Phòng ngừa lỗi', null, 'advanced', 'Phát hiện thiếu topping, sai tem, date'),
  skill('AD02', 'Xử lý sự cố', null, 'advanced', 'Xác định phạm vi, xử lý đúng SOP, báo cáo'),
  skill('AD03', 'Hướng dẫn', null, 'advanced', 'Làm mẫu, quan sát, sửa lỗi, kiểm tra lại'),
  skill('AD04', 'Cải tiến', null, 'advanced', 'Nhận biết điểm nghẽn, đề xuất có căn cứ'),
]

const req = (r: Partial<CareerGradeRequirement>): CareerGradeRequirement => ({
  main_min_level: null,
  support_min_level: null,
  second_min_level: null,
  advanced_min_level: null,
  common_required: false,
  ...r,
})

const GRADE_SUGGESTION: Record<CareerGradeCode, { min_months: number; min_hours: number; hourly_step_vnd: number; ft_monthly_vs_g1_vnd: number; requirement: CareerGradeRequirement }> = {
  T0: { min_months: 0, min_hours: 0, hourly_step_vnd: 0, ft_monthly_vs_g1_vnd: 0, requirement: req({}) },
  G1: { min_months: 1, min_hours: 120, hourly_step_vnd: 0, ft_monthly_vs_g1_vnd: 0, requirement: req({ main_min_level: 1, common_required: true }) },
  G2: { min_months: 2, min_hours: 240, hourly_step_vnd: 1500, ft_monthly_vs_g1_vnd: 315000, requirement: req({ main_min_level: 3, support_min_level: 2, common_required: true }) },
  G3: { min_months: 3, min_hours: 480, hourly_step_vnd: 2000, ft_monthly_vs_g1_vnd: 735000, requirement: req({ main_min_level: 3, second_min_level: 2, common_required: true }) },
  G4: { min_months: 4, min_hours: 720, hourly_step_vnd: 1500, ft_monthly_vs_g1_vnd: 1050000, requirement: req({ main_min_level: 3, second_min_level: 3, advanced_min_level: 2, common_required: true }) },
}

/** Điền các con số gợi ý của Playbook V7 vào bản nháp (không tự lưu). Giữ nguyên nhãn, mô tả, vai trò, danh mục kỹ năng. */
export function applyPlaybookV7Suggestion(s: CareerPathSettings): CareerPathSettings {
  return {
    ...s,
    grades: s.grades.map((g) => {
      const sug = GRADE_SUGGESTION[g.code]
      return sug ? { ...g, ...sug, requirement: { ...sug.requirement } } : g
    }),
    common_pass_level: 2,
    approval: {
      ...s.approval,
      review_rounds_per_month: 2,
      respond_within_working_days: 3,
      assess_within_working_days: 7,
      notify_within_working_days: 2,
    },
    rules: {
      ...s.rules,
      reason_min_chars: 5,
      exception_reason_min_chars: 20,
      non_working_weekdays: [0],
    },
  }
}
