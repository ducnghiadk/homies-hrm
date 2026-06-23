import type { UserRole } from '@/store/auth-store'
import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Home,
  MessageCircle,
  Settings,
  Target,
  Users,
} from 'lucide-react'

export type SidebarRole = Extract<UserRole, 'shift_leader' | 'store_manager' | 'area_manager' | 'hr_admin' | 'ceo'>

export type SidebarChildItem = {
  href: string
  label: string
  roles?: SidebarRole[]
}

export type SidebarEntry = {
  href?: string
  icon: LucideIcon
  id: string
  items?: SidebarChildItem[]
  label: string
  roles?: SidebarRole[]
}

const MANAGER_ROLES: SidebarRole[] = ['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo']
const LEADERSHIP_ROLES: SidebarRole[] = ['area_manager', 'hr_admin', 'ceo']
const ADMIN_ROLES: SidebarRole[] = ['hr_admin', 'ceo']
const ONBOARDING_ADMIN_ROLES: SidebarRole[] = ['store_manager', 'area_manager', 'hr_admin', 'ceo']

const SIDEBAR_ENTRIES: SidebarEntry[] = [
  { id: 'overview', label: 'Tổng quan', href: '/', icon: Home, roles: MANAGER_ROLES },
  {
    id: 'approvals',
    label: 'Việc chờ duyệt',
    icon: Bell,
    roles: MANAGER_ROLES,
    items: [
      { href: '/requests', label: 'Trung tâm yêu cầu', roles: MANAGER_ROLES },
      { href: '/leave/approval', label: 'Duyệt nghỉ phép', roles: MANAGER_ROLES },
      { href: '/attendance/requests', label: 'Yêu cầu chấm công', roles: MANAGER_ROLES },
      { href: '/kpi/review', label: 'Review KPI', roles: MANAGER_ROLES },
      { href: '/kpi/violations/appeals', label: 'Khiếu nại KPI', roles: MANAGER_ROLES },
    ],
  },
  {
    id: 'employees',
    label: 'Nhân sự',
    icon: Users,
    roles: MANAGER_ROLES,
    items: [
      { href: '/employees', label: 'Trung tâm nhân sự', roles: MANAGER_ROLES },
      { href: '/employees/invitations', label: 'Lời mời nhân sự', roles: ADMIN_ROLES },
      { href: '/employees/contracts', label: 'Hợp đồng nhân sự', roles: MANAGER_ROLES },
    ],
  },
  {
    id: 'new-hires',
    label: 'Nhân sự mới',
    icon: Users,
    roles: ONBOARDING_ADMIN_ROLES,
    items: [
      { href: '/career-path/onboarding/overview', label: 'Tổng quan thử việc', roles: ['hr_admin', 'ceo'] },
      { href: '/career-path/onboarding', label: 'Theo dõi thử việc', roles: ONBOARDING_ADMIN_ROLES },
      { href: '/career-path/onboarding/setup', label: 'Thiết lập quy trình thử việc', roles: ['store_manager', 'hr_admin', 'ceo'] },
    ],
  },
  {
    id: 'schedule',
    label: 'Lịch làm việc',
    icon: CalendarDays,
    roles: MANAGER_ROLES,
    items: [
      { href: '/schedules', label: 'Board tuần', roles: MANAGER_ROLES },
      { href: '/settings/schedule-rules/shifts', label: 'Cài đặt ca', roles: ['store_manager', 'hr_admin', 'ceo'] },
      { href: '/settings/schedule-rules', label: 'Quy tắc xếp ca', roles: MANAGER_ROLES },
      { href: '/settings/schedule-rules/preferences', label: 'Preference ca', roles: MANAGER_ROLES },
      { href: '/settings/staffing', label: 'Định biên và staffing', roles: MANAGER_ROLES },
      { href: '/schedule/open-shifts', label: 'Ca trống', roles: MANAGER_ROLES },
      { href: '/schedule/swap/list', label: 'Đổi ca', roles: MANAGER_ROLES },
      { href: '/schedule/history', label: 'Lịch sử publish', roles: MANAGER_ROLES },
    ],
  },
  {
    id: 'attendance',
    label: 'Chấm công',
    icon: ClipboardCheck,
    roles: MANAGER_ROLES,
    items: [
      { href: '/attendance', label: 'Tổng quan chấm công', roles: MANAGER_ROLES },
      { href: '/attendance/today', label: 'Hôm nay', roles: MANAGER_ROLES },
      { href: '/attendance/by-date', label: 'Theo ngày', roles: MANAGER_ROLES },
      { href: '/attendance/by-store', label: 'Theo chi nhánh', roles: LEADERSHIP_ROLES },
      { href: '/attendance/calendar', label: 'Lịch công', roles: MANAGER_ROLES },
      { href: '/attendance/overtime', label: 'Tăng ca', roles: MANAGER_ROLES },
      { href: '/attendance/manual', label: 'Sửa công thủ công', roles: LEADERSHIP_ROLES },
      { href: '/attendance/device-alerts', label: 'Cảnh báo thiết bị', roles: LEADERSHIP_ROLES },
      { href: '/attendance/devices', label: 'Thiết bị chấm công', roles: LEADERSHIP_ROLES },
      { href: '/checkin', label: 'Check-in kiosk', roles: MANAGER_ROLES },
      { href: '/settings/wifi', label: 'WiFi check-in', roles: LEADERSHIP_ROLES },
    ],
  },
  {
    id: 'kpi',
    label: 'KPI và đánh giá',
    icon: Target,
    roles: MANAGER_ROLES,
    items: [
      { href: '/kpi', label: 'Tổng quan KPI', roles: MANAGER_ROLES },
      { href: '/kpi/review', label: 'Review KPI', roles: MANAGER_ROLES },
      { href: '/kpi/violations', label: 'Vi phạm', roles: MANAGER_ROLES },
      { href: '/kpi/violations/log', label: 'Log vi phạm', roles: MANAGER_ROLES },
      { href: '/kpi/leaderboard', label: 'Leaderboard', roles: MANAGER_ROLES },
      { href: '/kpi/promotion', label: 'Xét thăng tiến', roles: MANAGER_ROLES },
      { href: '/kpi/reports', label: 'Báo cáo KPI', roles: MANAGER_ROLES },
      { href: '/kpi/settings', label: 'Cài đặt KPI', roles: LEADERSHIP_ROLES },
    ],
  },
  {
    id: 'payroll-leave',
    label: 'Lương và nghỉ phép',
    icon: CreditCard,
    roles: MANAGER_ROLES,
    items: [
      { href: '/leave', label: 'Tổng quan nghỉ phép', roles: MANAGER_ROLES },
      { href: '/leave/request', label: 'Tạo đơn nghỉ', roles: MANAGER_ROLES },
      { href: '/leave/calendar', label: 'Lịch nghỉ phép', roles: MANAGER_ROLES },
      { href: '/leave/balance', label: 'Số dư phép', roles: MANAGER_ROLES },
      { href: '/payroll', label: 'Tổng quan lương', roles: MANAGER_ROLES },
      { href: '/payroll/calculate', label: 'Tính lương', roles: ADMIN_ROLES },
      { href: '/payroll/bonus', label: 'Thưởng', roles: ADMIN_ROLES },
      { href: '/payroll/deductions', label: 'Khấu trừ', roles: ADMIN_ROLES },
      { href: '/payroll/insurance', label: 'Bảo hiểm', roles: ADMIN_ROLES },
      { href: '/payroll/advance', label: 'Tạm ứng', roles: ADMIN_ROLES },
    ],
  },
  {
    id: 'operations',
    label: 'Giao việc và nội bộ',
    icon: MessageCircle,
    roles: MANAGER_ROLES,
    items: [
      { href: '/tasks/daily', label: 'Việc hằng ngày', roles: MANAGER_ROLES },
      { href: '/tasks/handover', label: 'Bàn giao ca', roles: MANAGER_ROLES },
      { href: '/tasks/incidents', label: 'Sự cố', roles: MANAGER_ROLES },
      { href: '/tasks/templates', label: 'Mẫu checklist', roles: MANAGER_ROLES },
      { href: '/news', label: 'Truyền thông nội bộ', roles: MANAGER_ROLES },
      { href: '/chat', label: 'Chat', roles: MANAGER_ROLES },
      { href: '/notifications', label: 'Thông báo', roles: MANAGER_ROLES },
      { href: '/policies', label: 'Chính sách', roles: MANAGER_ROLES },
    ],
  },
  {
    id: 'growth',
    label: 'Phát triển nhân viên',
    icon: Award,
    roles: MANAGER_ROLES,
    items: [
      { href: '/career-path', label: 'Lộ trình phát triển', roles: MANAGER_ROLES },
      { href: '/career-path/skills', label: 'Khung kỹ năng', roles: MANAGER_ROLES },
      { href: '/career-path/goals', label: 'Mục tiêu phát triển', roles: MANAGER_ROLES },
      { href: '/career-path/promotion', label: 'Đề xuất thăng tiến', roles: MANAGER_ROLES },
      { href: '/learning', label: 'Học tập', roles: MANAGER_ROLES },
      { href: '/recognition', label: 'Ghi nhận', roles: MANAGER_ROLES },
      { href: '/rewards', label: 'Phần thưởng', roles: MANAGER_ROLES },
      { href: '/gamification', label: 'Gamification', roles: MANAGER_ROLES },
      { href: '/wellness', label: 'Wellness', roles: MANAGER_ROLES },
    ],
  },
  {
    id: 'reports',
    label: 'Báo cáo và phân tích',
    icon: BarChart3,
    roles: MANAGER_ROLES,
    items: [
      { href: '/reports', label: 'Trung tâm báo cáo', roles: MANAGER_ROLES },
      { href: '/reports/hr-overview', label: 'HR overview', roles: ADMIN_ROLES },
      { href: '/reports/budget', label: 'Budget', roles: ADMIN_ROLES },
      { href: '/reports/attendance-report', label: 'Attendance report', roles: LEADERSHIP_ROLES },
      { href: '/reports/staff-hours', label: 'Staff hours', roles: LEADERSHIP_ROLES },
      { href: '/reports/salary-structure', label: 'Salary structure', roles: ADMIN_ROLES },
      { href: '/analytics', label: 'Analytics', roles: ADMIN_ROLES },
    ],
  },
  {
    id: 'settings',
    label: 'Cài đặt và danh mục',
    icon: Settings,
    roles: MANAGER_ROLES,
    items: [
      { href: '/settings', label: 'Cài đặt chung', roles: MANAGER_ROLES },
      { href: '/settings/permissions', label: 'Phân quyền', roles: ADMIN_ROLES },
      { href: '/settings/payroll', label: 'Cấu hình lương', roles: ADMIN_ROLES },
      { href: '/settings/labor-cost', label: 'Labor cost', roles: ADMIN_ROLES },
      { href: '/settings/system', label: 'Hệ thống', roles: ADMIN_ROLES },
      { href: '/inventory', label: 'Kho và vật tư', roles: LEADERSHIP_ROLES },
    ],
  },
]

function includesRole(roles: SidebarRole[] | undefined, role: SidebarRole) {
  return !roles || roles.includes(role)
}

export function getDesktopSidebarEntries(role: UserRole | null | undefined) {
  if (!role || role === 'employee') return []

  return SIDEBAR_ENTRIES.flatMap((entry) => {
    if (!includesRole(entry.roles, role)) return []
    if (!entry.items) return [entry]

    const nextItems = entry.items.filter((item) => includesRole(item.roles, role))
    if (nextItems.length === 0) return []

    return [{ ...entry, items: nextItems }]
  })
}
