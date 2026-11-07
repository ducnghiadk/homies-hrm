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

export type SidebarRole = Extract<UserRole, 'employee' | 'shift_leader' | 'store_manager' | 'area_manager' | 'hr_admin' | 'ceo'>

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

const ALL_ROLES: SidebarRole[] = ['employee', 'shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo']
const MANAGER_ROLES: SidebarRole[] = ['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo']
const LEADERSHIP_ROLES: SidebarRole[] = ['area_manager', 'hr_admin', 'ceo']
const ADMIN_ROLES: SidebarRole[] = ['hr_admin', 'ceo']
const KPI_REVIEW_ROLES: SidebarRole[] = ['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo']
const KPI_INCIDENT_ROLES: SidebarRole[] = ['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo']
const KPI_ADMIN_ROLES: SidebarRole[] = ['hr_admin', 'ceo']

const SIDEBAR_ENTRIES: SidebarEntry[] = [
  { id: 'overview', label: 'Tổng quan', href: '/', icon: Home, roles: MANAGER_ROLES },
  {
    id: 'approvals',
    label: 'Phê duyệt',
    icon: Bell,
    roles: MANAGER_ROLES,
    href: '/approvals',
  },
  {
    id: 'employees',
    label: 'Nhân sự & Đào tạo',
    icon: Users,
    roles: MANAGER_ROLES,
    items: [
      { href: '/employees', label: 'Hồ sơ nhân sự', roles: MANAGER_ROLES },
      { href: '/employees/invitations', label: 'Lời mời tuyển dụng', roles: ADMIN_ROLES },
      { href: '/employees/contracts', label: 'Hợp đồng lao động', roles: MANAGER_ROLES },
      { href: '/career-path', label: 'Lộ trình thăng tiến', roles: MANAGER_ROLES },
      { href: '/onboarding', label: 'Học việc & Onboarding', roles: MANAGER_ROLES },
    ],
  },
  {
    id: 'schedule',
    label: 'Lịch làm việc',
    icon: CalendarDays,
    roles: ALL_ROLES,
    items: [
      { href: '/schedule', label: 'Bảng xếp lịch tuần', roles: MANAGER_ROLES },
      { href: '/schedule/registrations', label: 'Duyệt đăng ký ca & Bản đồ trống', roles: MANAGER_ROLES },
      { href: '/my-schedule', label: 'Lịch của tôi & Đăng ký ca', roles: ALL_ROLES },
    ],
  },
  {
    id: 'attendance',
    label: 'Chấm công & Nghỉ phép',
    icon: ClipboardCheck,
    roles: ALL_ROLES,
    items: [
      { href: '/attendance', label: 'Bảng chấm công', roles: MANAGER_ROLES },
      { href: '/leave', label: 'Quản lý nghỉ phép', roles: ALL_ROLES },
      { href: '/checkin', label: 'Kiosk Check-in', roles: ALL_ROLES },
    ],
  },
  {
    id: 'kpi',
    label: 'KPI & Phát triển',
    icon: Target,
    roles: MANAGER_ROLES,
    items: [
      { href: '/kpi', label: 'Tổng quan KPI', roles: MANAGER_ROLES },
      { href: '/kpi/review', label: 'Việc cần đánh giá', roles: KPI_REVIEW_ROLES },
      { href: '/kpi/result', label: 'Kết quả & cải thiện', roles: MANAGER_ROLES },
      { href: '/kpi/promotion', label: 'Sẵn sàng tăng bậc', roles: KPI_ADMIN_ROLES },
      { href: '/kpi/settings', label: 'Chương trình đánh giá', roles: KPI_ADMIN_ROLES },
    ],
  },
  {
    id: 'payroll',
    label: 'Lương, thưởng & tạm ứng',
    icon: CreditCard,
    roles: MANAGER_ROLES,
    items: [
      { href: '/payroll', label: 'Bảng tính lương & Phiếu lương', roles: MANAGER_ROLES },
      { href: '/bsc-bonus', label: 'Thưởng BSC Cửa hàng', roles: MANAGER_ROLES },
    ],
  },
  {
    id: 'operations',
    label: 'Vận hành & Nội bộ',
    icon: MessageCircle,
    roles: ALL_ROLES,
    items: [
      { href: '/tasks/daily', label: 'Sổ vận hành ca', roles: MANAGER_ROLES },
      { href: '/kpi/violations', label: 'Sự cố & Vi phạm', roles: KPI_INCIDENT_ROLES },
      { href: '/news', label: 'Truyền thông nội bộ', roles: ALL_ROLES },
      { href: '/policies', label: 'Chính sách & Nội quy', roles: ALL_ROLES },
    ],
  },
  {
    id: 'reports',
    label: 'Báo cáo & Phân tích',
    icon: BarChart3,
    roles: MANAGER_ROLES,
    items: [
      { href: '/reports', label: 'Trung tâm báo cáo', roles: MANAGER_ROLES },
      { href: '/kpi/reports', label: 'Báo cáo KPI', roles: KPI_ADMIN_ROLES },
    ],
  },
  {
    id: 'settings',
    label: 'Cài đặt hệ thống',
    icon: Settings,
    roles: MANAGER_ROLES,
    items: [
      { href: '/settings', label: 'Tổng quan Cài đặt', roles: MANAGER_ROLES },
      { href: '/settings/organization', label: 'Doanh nghiệp & Chi nhánh', roles: ADMIN_ROLES },
      { href: '/settings/schedule-rules', label: 'Quy tắc ca & Xếp lịch', roles: MANAGER_ROLES },
      { href: '/settings/payroll', label: 'Lương & Phụ cấp', roles: ADMIN_ROLES },
      { href: '/settings/permissions', label: 'Phân quyền & Bảo mật', roles: ADMIN_ROLES },
    ],
  },
]

function includesRole(roles: SidebarRole[] | undefined, role: SidebarRole) {
  return !roles || roles.includes(role)
}

export function getDesktopSidebarEntries(role: UserRole | null | undefined) {
  if (!role) return []

  const sidebarRole = role as SidebarRole

  return SIDEBAR_ENTRIES.flatMap(entry => {
    if (!includesRole(entry.roles, sidebarRole)) return []
    if (!entry.items) return [entry]

    const nextItems = entry.items.filter(item => includesRole(item.roles, sidebarRole))
    if (nextItems.length === 0) return []

    return [{ ...entry, items: nextItems }]
  })
}
