import type { SettingItem, SettingCategory, SettingCategoryId, SetupProgress } from '@/lib/types/settings';

export const settingCategories: SettingCategory[] = [
  { id: 'organization', icon: '🏢', label: 'Tổ chức', description: 'Thông tin doanh nghiệp, chi nhánh' },
  { id: 'hr', icon: '👥', label: 'Nhân sự', description: 'Lộ trình, KPI, xếp ca, nghỉ phép' },
  { id: 'finance', icon: '💰', label: 'Tài chính', description: 'Lương, phụ cấp, chi phí' },
  { id: 'system', icon: '⚡', label: 'Hệ thống', description: 'WiFi, thông báo, bảo mật' },
];

export const settingItems: SettingItem[] = [
  // === TỔ CHỨC ===
  {
    id: 'org-info', category: 'organization', icon: '🏪', iconBg: 'bg-blue-100',
    title: 'Thông tin doanh nghiệp', description: 'Tên, logo, múi giờ, tiền tệ',
    href: '/settings/organization', status: 'completed', statusText: 'Boba House',
    isRequired: true, setupOrder: 1,
  },
  {
    id: 'branches', category: 'organization', icon: '🏬', iconBg: 'bg-blue-100',
    title: 'Chi nhánh & Cửa hàng', description: 'Quản lý các địa điểm kinh doanh',
    href: '/settings/branches', status: 'completed', statusText: '2 chi nhánh',
    isRequired: true, setupOrder: 2,
  },
  {
    id: 'master-data', category: 'organization', icon: '📁', iconBg: 'bg-slate-100',
    title: 'Dữ liệu gốc', description: 'Phòng ban, chức vụ, loại hợp đồng',
    href: '/settings/master-data', status: 'completed', statusText: '5 phòng ban',
    isRequired: true, setupOrder: 3,
  },
  // === NHÂN SỰ ===
  {
    id: 'scheduling', category: 'hr', icon: '📅', iconBg: 'bg-green-100',
    title: 'Xếp ca & Định biên', description: 'Ca làm việc, quy tắc xếp ca',
    href: '/settings/schedule-rules', status: 'completed', statusText: '3 ca làm việc',
    isRequired: true, setupOrder: 4,
  },
  {
    id: 'staffing', category: 'hr', icon: '📊', iconBg: 'bg-green-100',
    title: 'Định biên nhân sự', description: 'Tính toán số lượng nhân viên tối ưu',
    href: '/settings/staffing', status: 'completed', statusText: 'Đã cấu hình',
    isRequired: false, setupOrder: 5,
  },
  {
    id: 'leave', category: 'hr', icon: '🏖️', iconBg: 'bg-teal-100',
    title: 'Nghỉ phép & Phúc lợi', description: 'Loại phép, quota, quy định',
    href: '/leave', status: 'completed', statusText: '12 ngày/năm',
    isRequired: true, setupOrder: 6,
  },
  {
    id: 'career-path', category: 'hr', icon: '🚀', iconBg: 'bg-purple-100',
    title: 'Lộ trình thăng tiến', description: 'Cấp bậc, kỹ năng, điều kiện thăng tiến',
    href: '/career-path/settings', status: 'not_started', statusText: 'Chưa thiết lập',
    isRequired: true, setupOrder: 7,
  },
  {
    id: 'kpi', category: 'hr', icon: '🎯', iconBg: 'bg-indigo-100',
    title: 'Đánh giá KPI', description: 'Tiêu chí, thang điểm, chu kỳ đánh giá',
    href: '/kpi/settings', status: 'completed', statusText: '3 tiêu chí',
    isRequired: true, setupOrder: 8,
  },
  // === TÀI CHÍNH ===
  {
    id: 'payroll', category: 'finance', icon: '💵', iconBg: 'bg-yellow-100',
    title: 'Bảng lương & Phụ cấp', description: 'Ngày trả lương, năm tài chính',
    href: '/settings/payroll', status: 'completed', statusText: 'Ngày 5 hàng tháng',
    isRequired: true, setupOrder: 9,
  },
  {
    id: 'labor-cost', category: 'finance', icon: '🧾', iconBg: 'bg-orange-100',
    title: 'Chi phí lao động', description: 'Cài đặt lương, phụ cấp, OT',
    href: '/settings/labor-cost', status: 'not_started', statusText: 'Chưa thiết lập',
    isRequired: false, setupOrder: 10,
  },
  // === HỆ THỐNG ===
  {
    id: 'wifi', category: 'system', icon: '📶', iconBg: 'bg-cyan-100',
    title: 'WiFi Check-in', description: 'Cài đặt WiFi cho chấm công',
    href: '/settings/wifi', status: 'completed', statusText: '2 WiFi đã cài',
    isRequired: false, setupOrder: 11,
  },
  {
    id: 'system', category: 'system', icon: '⚙️', iconBg: 'bg-gray-100',
    title: 'Cài đặt hệ thống', description: 'Ngôn ngữ, theme, thông tin chung',
    href: '/settings/system', status: 'completed', statusText: 'Tiếng Việt',
    isRequired: false, setupOrder: 12,
  },
  {
    id: 'notifications', category: 'system', icon: '🔔', iconBg: 'bg-pink-100',
    title: 'Thông báo', description: 'Push, Email, Zalo',
    href: '/settings/notifications', status: 'completed', statusText: 'Push + Email',
    isRequired: false, setupOrder: 13,
    quickActions: [
      { label: 'Push', action: 'toggle', value: true },
      { label: 'Email', action: 'toggle', value: true },
      { label: 'Zalo', action: 'toggle', value: false },
    ],
  },
  {
    id: 'permissions', category: 'system', icon: '🔐', iconBg: 'bg-red-100',
    title: 'Phân quyền & Bảo mật', description: 'Vai trò, quyền truy cập',
    href: '/settings/permissions', status: 'completed', statusText: '3 vai trò',
    isRequired: false, setupOrder: 14,
  },
  {
    id: 'backup', category: 'system', icon: '📤', iconBg: 'bg-gray-100',
    title: 'Sao lưu & Xuất dữ liệu', description: 'Export, import, backup',
    href: '/settings/backup', status: 'completed', statusText: 'Lần cuối: Hôm nay',
    isRequired: false, setupOrder: 15,
  },
];

export function getSettingsByCategory(category: SettingCategoryId): SettingItem[] {
  return settingItems.filter(item => item.category === category);
}

export function getSetupProgress(): SetupProgress {
  const required = settingItems.filter(item => item.isRequired);
  const completed = required.filter(item => item.status === 'completed');
  const percentage = Math.round((completed.length / required.length) * 100);
  const nextStep = required
    .filter(item => item.status !== 'completed')
    .sort((a, b) => a.setupOrder - b.setupOrder)[0] || null;
  return { completed: completed.length, total: required.length, percentage, nextStep };
}

export function searchSettings(query: string): SettingItem[] {
  const q = query.toLowerCase();
  return settingItems.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q)
  );
}
