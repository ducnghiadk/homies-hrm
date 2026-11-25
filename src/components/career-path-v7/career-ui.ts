// Nhãn hiển thị dùng chung cho các màn lộ trình thăng tiến (Playbook V7).
import type { CareerGradeCode, CareerPositionCode, CareerSkillGroup } from '@/lib/career-path/settings'

export const POSITION_LABEL: Record<CareerPositionCode, string> = {
  cashier: 'Thu ngân',
  barista: 'Pha chế',
}

export const SKILL_GROUP_LABEL: Record<CareerSkillGroup, string> = {
  core: 'Kỹ năng chính',
  support: 'Kỹ năng hỗ trợ',
  common: 'Tiêu chuẩn chung',
  advanced: 'Năng lực nâng cao',
}

export const ROLE_LABEL: Record<string, string> = {
  ceo: 'CEO',
  hr_admin: 'HR',
  area_manager: 'Quản lý vùng',
  store_manager: 'Quản lý cửa hàng',
  shift_leader: 'Trưởng ca',
}

export const GRADE_BADGE: Record<CareerGradeCode, string> = {
  T0: 'bg-gray-100 text-gray-700',
  G1: 'bg-sky-50 text-sky-700',
  G2: 'bg-emerald-50 text-emerald-700',
  G3: 'bg-amber-50 text-amber-800',
  G4: 'bg-indigo-50 text-indigo-700',
}

export const formatVnd = (n: number) => `${Math.round(n).toLocaleString('vi-VN')} đ`

export const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-[#001D3D] focus:border-[#2F6FA8] focus:outline-none focus:ring-2 focus:ring-[#2F6FA8]/20 disabled:bg-gray-50 disabled:text-gray-500'

export const cardClass = 'rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs sm:p-5'
