/**
 * Danh sách "Việc cần cài đặt" cho CEO/HR: đọc dữ liệu thật trên máy chủ,
 * mỗi mục cho biết đã xong chưa, thiếu gì và bấm vào đâu để làm.
 * Hàm thuần, không đọc/ghi gì; dữ liệu do API truyền vào.
 */

export type SetupStepId =
  | 'stores'
  | 'checkin'
  | 'shifts'
  | 'operation'
  | 'payroll_policy'
  | 'holidays'
  | 'tax'
  | 'employee_pay'
  | 'career_path'

export interface SetupStep {
  id: SetupStepId
  title: string
  /** Giải thích ngắn: vì sao cần, hoặc còn thiếu gì. */
  detail: string
  href: string
  done: boolean
  /** Mục không bắt buộc để chạy hằng ngày. */
  optional?: boolean
}

export interface SetupChecklistInput {
  stores: Array<{
    name: string
    is_active?: boolean
    latitude?: number
    longitude?: number
    pin_code?: string
    checkin_method?: string
    wifi_public_ips?: string[]
  }>
  shiftTemplateCount: number
  operationSettingsSaved: boolean
  payrollPolicy: Record<string, unknown> | null
  taxSettingsSaved: boolean
  employees: Array<{
    full_name: string
    role: string
    status: string
    base_salary?: number
    hourly_rate?: number
  }>
  careerPathConfigured: boolean
}

export interface SetupChecklist {
  steps: SetupStep[]
  doneCount: number
  /** Chỉ đếm mục bắt buộc. */
  requiredCount: number
  requiredDone: number
}

function hasGps(s: SetupChecklistInput['stores'][number]) {
  return Number.isFinite(s.latitude) && Number.isFinite(s.longitude) && !(s.latitude === 0 && s.longitude === 0)
}

function listNames(names: string[], max = 3) {
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max).join(', ')} và ${names.length - max} người khác`
}

export function buildSetupChecklist(input: SetupChecklistInput): SetupChecklist {
  const activeStores = input.stores.filter((s) => s.is_active !== false)
  const storesMissing = activeStores.filter((s) => !hasGps(s) || !s.pin_code)
  const wifiMissing = activeStores.filter((s) => {
    const method = s.checkin_method || 'wifi_or_qr'
    return method !== 'qr' && (!s.wifi_public_ips || s.wifi_public_ips.length === 0)
  })

  const policy = input.payrollPolicy
  const holidays = Array.isArray(policy?.holidays) ? (policy!.holidays as unknown[]) : []

  const working = input.employees.filter(
    (e) => (e.status === 'active' || e.status === 'probation') && e.role !== 'ceo' && e.role !== 'hr_admin',
  )
  const missingPay = working.filter((e) => !(Number(e.base_salary) > 0) && !(Number(e.hourly_rate) > 0))

  const steps: SetupStep[] = [
    {
      id: 'stores',
      title: 'Thông tin chi nhánh',
      detail:
        activeStores.length === 0
          ? 'Chưa có chi nhánh nào đang hoạt động.'
          : storesMissing.length === 0
            ? `${activeStores.length} chi nhánh đã có vị trí GPS và mã PIN.`
            : `Còn thiếu vị trí GPS hoặc mã PIN: ${storesMissing.map((s) => s.name).join(', ')}.`,
      href: '/settings/organization?tab=branches',
      done: activeStores.length > 0 && storesMissing.length === 0,
    },
    {
      id: 'checkin',
      title: 'Cách chấm công tại quán',
      detail:
        wifiMissing.length === 0
          ? 'Mỗi chi nhánh đã chọn cách chấm công.'
          : `Chưa lưu Wi-Fi quán cho: ${wifiMissing.map((s) => s.name).join(', ')}. Quản lý đứng tại quán bấm "Dùng mạng hiện tại", hoặc chọn "Chỉ mã QR".`,
      href: '/settings/wifi',
      done: activeStores.length > 0 && wifiMissing.length === 0,
    },
    {
      id: 'shifts',
      title: 'Ca làm mẫu',
      detail:
        input.shiftTemplateCount > 0
          ? `Đã có ${input.shiftTemplateCount} ca làm mẫu.`
          : 'Chưa có ca làm mẫu (ví dụ Ca sáng, Ca chiều) để xếp lịch.',
      href: '/settings/schedule-rules/shifts',
      done: input.shiftTemplateCount > 0,
    },
    {
      id: 'operation',
      title: 'Hạn nộp lịch rảnh và cách tính giờ công',
      detail: input.operationSettingsSaved
        ? 'Đã lưu cài đặt vận hành.'
        : 'Chưa lưu: hạn chót nộp lịch rảnh, số phút cho phép trễ, có tính công đến sớm/ở muộn hay không.',
      href: '/settings/schedule-rules?tab=registration',
      done: input.operationSettingsSaved,
    },
    {
      id: 'payroll_policy',
      title: 'Cài đặt lương',
      detail: policy
        ? 'Đã lưu Cài đặt lương lên máy chủ.'
        : 'Chưa lưu Cài đặt lương. Mở trang, kiểm tra phần Cơ bản rồi bấm Lưu.',
      href: '/settings/payroll',
      done: Boolean(policy),
    },
    {
      id: 'holidays',
      title: 'Ngày lễ, Tết trong năm',
      detail:
        holidays.length > 0
          ? `Đã nhập ${holidays.length} ngày lễ.`
          : 'Chưa nhập ngày lễ, nên làm ngày lễ đang được tính như ngày thường.',
      href: '/settings/payroll',
      done: holidays.length > 0,
    },
    {
      id: 'tax',
      title: 'Thuế thu nhập cá nhân',
      detail: input.taxSettingsSaved
        ? 'Đã kiểm tra và lưu mức giảm trừ, biểu thuế.'
        : 'Chưa lưu. Kế toán kiểm tra mức giảm trừ gia cảnh và biểu thuế rồi bấm Lưu.',
      href: '/settings/payroll',
      done: input.taxSettingsSaved,
    },
    {
      id: 'employee_pay',
      title: 'Mức lương từng nhân viên',
      detail:
        working.length === 0
          ? 'Chưa có nhân viên đang làm việc.'
          : missingPay.length === 0
            ? `${working.length} nhân viên đã có lương tháng hoặc đơn giá giờ.`
            : `${missingPay.length} người chưa có lương tháng hoặc đơn giá giờ: ${listNames(missingPay.map((e) => e.full_name))}.`,
      href: '/employees',
      done: working.length > 0 && missingPay.length === 0,
    },
    {
      id: 'career_path',
      title: 'Lộ trình thăng tiến',
      detail: input.careerPathConfigured
        ? 'Đã lưu cài đặt lộ trình.'
        : 'Không bắt buộc. Khi cần xét lên bậc, điền mốc tháng/giờ và mức cộng lương rồi Lưu.',
      href: '/settings/career-path',
      done: input.careerPathConfigured,
      optional: true,
    },
  ]

  const required = steps.filter((s) => !s.optional)
  return {
    steps,
    doneCount: steps.filter((s) => s.done).length,
    requiredCount: required.length,
    requiredDone: required.filter((s) => s.done).length,
  }
}
