/**
 * Trang "Cài đặt" gom về một chỗ: 4 nhóm theo việc người dùng cần làm.
 * Mục "nâng cao" chỉ hiện khi bấm "Hiện cài đặt nâng cao".
 * `roles` khớp với chặn quyền trong `src/proxy.ts` để không hiện ô bấm vào bị chặn.
 */

export type HubRole = 'ceo' | 'hr_admin' | 'area_manager' | 'store_manager'

const ADMIN: HubRole[] = ['ceo', 'hr_admin']
const MANAGER: HubRole[] = ['ceo', 'hr_admin', 'area_manager', 'store_manager']

export interface HubItem {
  title: string
  description: string
  href: string
  roles: HubRole[]
  advanced?: boolean
}

export interface HubGroup {
  id: string
  title: string
  items: HubItem[]
}

export const SETTINGS_HUB: HubGroup[] = [
  {
    id: 'store',
    title: 'Quán & nhân sự',
    items: [
      { title: 'Chi nhánh', description: 'Địa chỉ, vị trí GPS, bán kính chấm công, mã PIN quán', href: '/settings/organization?tab=branches', roles: ADMIN },
      { title: 'Thông tin công ty', description: 'Tên, mã số thuế, người ký hợp đồng', href: '/settings/organization?tab=general', roles: ADMIN },
      { title: 'Phòng ban & chức danh', description: 'Chức danh, loại nghỉ phép, quy trình duyệt đơn', href: '/settings/master-data', roles: ADMIN },
      { title: 'Phân quyền', description: 'Vai trò nào được xem, sửa màn hình nào', href: '/settings/permissions', roles: ADMIN, advanced: true },
    ],
  },
  {
    id: 'schedule',
    title: 'Lịch & chấm công',
    items: [
      { title: 'Ca làm mẫu', description: 'Tên ca, giờ bắt đầu, giờ kết thúc, số người mỗi ca', href: '/settings/schedule-rules/shifts', roles: MANAGER },
      { title: 'Quy tắc xếp ca & hạn nộp lịch rảnh', description: 'Giờ tối đa mỗi ngày/tuần, hạn chót nộp lịch rảnh, cách tính giờ công', href: '/settings/schedule-rules', roles: MANAGER },
      { title: 'Cách chấm công', description: 'Chấm bằng Wi-Fi quán, mã QR hoặc cả hai, có kiểm tra GPS không', href: '/settings/wifi', roles: MANAGER },
      { title: 'Ưu tiên ca khi xếp lịch', description: 'Ưu tiên người đăng ký sớm, người ít giờ', href: '/settings/schedule-rules/preferences', roles: MANAGER, advanced: true },
      { title: 'Định biên nhân sự', description: 'Số người cần theo giờ cao điểm', href: '/settings/staffing', roles: ADMIN, advanced: true },
    ],
  },
  {
    id: 'pay',
    title: 'Lương & thưởng',
    items: [
      { title: 'Cài đặt lương', description: 'Ngày công, tăng ca, đi trễ, bảo hiểm, thuế, ngày lễ', href: '/settings/payroll', roles: ADMIN },
      { title: 'Lộ trình thăng tiến', description: 'Bậc, mốc lên bậc, mức cộng lương theo bậc', href: '/settings/career-path', roles: ADMIN },
      { title: 'Thưởng BSC cửa hàng', description: 'Mốc lợi nhuận, tiêu chí, hệ số chia thưởng', href: '/settings/bsc', roles: ADMIN, advanced: true },
      { title: 'Chi phí nhân sự', description: 'Ngưỡng cảnh báo chi phí lương theo doanh thu', href: '/settings/labor-cost', roles: ADMIN, advanced: true },
    ],
  },
  {
    id: 'system',
    title: 'Hệ thống',
    items: [
      { title: 'Kết nối iPOS', description: 'Đồng bộ nhân viên, ca, chấm công từ iPOS', href: '/settings/integrations/ipos', roles: ADMIN, advanced: true },
      { title: 'Trợ lý Hermes', description: 'Bot nhập lỗi, trợ lý hỏi đáp', href: '/settings/hermes', roles: ADMIN, advanced: true },
      { title: 'Hệ thống & sao lưu', description: 'Ngôn ngữ, thông báo, sao lưu dữ liệu', href: '/settings/system', roles: ['ceo'], advanced: true },
    ],
  },
]

export function getHubGroups(role: string, showAdvanced: boolean, query = ''): HubGroup[] {
  const q = query.trim().toLowerCase()
  return SETTINGS_HUB.map((g) => ({
    ...g,
    items: g.items.filter((item) => {
      if (!item.roles.includes(role as HubRole)) return false
      if (q) return `${item.title} ${item.description}`.toLowerCase().includes(q)
      return showAdvanced || !item.advanced
    }),
  })).filter((g) => g.items.length > 0)
}

export function countAdvanced(role: string): number {
  return SETTINGS_HUB.flatMap((g) => g.items).filter((i) => i.advanced && i.roles.includes(role as HubRole)).length
}
