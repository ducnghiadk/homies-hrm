import type {
  SettingCategory,
  SettingCategoryId,
  SettingItem,
  SettingsWorkspaceTab,
  SettingsWorkspaceTabId,
  SetupProgress,
} from '@/lib/types/settings';

export const settingCategories: SettingCategory[] = [
  { id: 'organization', icon: '🏬', label: 'Cơ cấu cửa hàng', description: 'Thương hiệu, cửa hàng, điểm làm việc' },
  { id: 'hr', icon: '👥', label: 'Nhân sự & ca làm', description: 'Vị trí vận hành, ca kíp, định biên' },
  { id: 'finance', icon: '📋', label: 'Chính sách nhân sự', description: 'Nghỉ phép, phê duyệt, lương thưởng' },
  { id: 'system', icon: '⚙️', label: 'Quản trị hệ thống', description: 'Phân quyền, thiết bị, cấu hình' },
];

export const settingsWorkspaceTabs: SettingsWorkspaceTab[] = [
  {
    id: 'stores',
    label: 'Cửa hàng',
    description: 'Mạng lưới vận hành điểm bán',
    statusLabel: '1 việc cần xử lý',
    actionLabel: 'Thêm chi nhánh',
    primaryCards: [
      { id: 'store-network', title: 'Mạng lưới cửa hàng', description: 'Danh sách cửa hàng đang hoạt động' },
      { id: 'departments', title: 'Bộ phận & điểm làm việc', description: 'Bộ phận theo cửa hàng' },
      { id: 'store-sync', title: 'Đồng bộ từ file nhân sự', description: 'Upload, preview, áp dụng đồng bộ' },
    ],
    secondaryBlocks: [],
  },
  {
    id: 'workforce',
    label: 'Nhân sự & ca làm',
    description: 'Cấu trúc vận hành hằng ngày',
    statusLabel: 'Đã cấu hình nền tảng',
    actionLabel: 'Cấu hình ca làm',
    primaryCards: [
      { id: 'positions', title: 'Vị trí vận hành', description: 'Vai trò làm việc tại cửa hàng' },
      { id: 'shifts', title: 'Ca làm', description: 'Khung giờ và ca đang áp dụng' },
      { id: 'schedule-rules', title: 'Quy tắc xếp ca', description: 'Ràng buộc và chu kỳ xếp ca' },
      { id: 'staffing', title: 'Định biên nhân sự', description: 'Nhu cầu nhân sự theo lưu lượng' },
    ],
    secondaryBlocks: [
      { id: 'preferences', title: 'Đăng ký ca mong muốn', description: 'Preference trước khi xếp ca' },
    ],
  },
  {
    id: 'policies',
    label: 'Chính sách nhân sự',
    description: 'Quy định quyền lợi và quy trình áp dụng',
    statusLabel: 'Đang theo dõi 1 mục cần chuẩn hóa',
    actionLabel: 'Cập nhật quy trình duyệt',
    primaryCards: [
      { id: 'leave-types', title: 'Loại nghỉ phép', description: 'Danh mục loại nghỉ và quota áp dụng' },
      { id: 'levels', title: 'Cấp bậc & khung áp dụng', description: 'Khung cấp bậc và điều kiện áp dụng' },
      { id: 'workflows', title: 'Quy trình duyệt', description: 'Luồng duyệt cho các yêu cầu nhân sự' },
    ],
    secondaryBlocks: [],
  },
  {
    id: 'system_access',
    label: 'Hệ thống & phân quyền',
    description: 'Thiết lập nhạy cảm và quyền truy cập',
    statusLabel: '3 nhóm cấu hình đang hoạt động',
    actionLabel: 'Rà soát phân quyền',
    primaryCards: [
      { id: 'permissions', title: 'Phân quyền vai trò', description: 'Vai trò và phạm vi truy cập' },
      { id: 'system-settings', title: 'Thiết lập hệ thống', description: 'Ngôn ngữ, theme và cấu hình vận hành' },
      { id: 'device-security', title: 'Tích hợp / thiết bị / bảo mật', description: 'WiFi, thiết bị và cấu hình bảo mật' },
    ],
    secondaryBlocks: [],
  },
];

export const settingItems: SettingItem[] = [
  {
    id: 'brand-profile', category: 'organization', icon: '🏪', iconBg: 'bg-primary-100',
    title: 'Thương hiệu & pháp nhân', description: 'Tên thương hiệu, múi giờ, tiền tệ, thông tin doanh nghiệp',
    href: '/settings#co-cau-cua-hang', status: 'completed', statusText: 'Homies Milk Tea',
    isRequired: true, setupOrder: 1,
  },
  {
    id: 'store-network', category: 'organization', icon: '📍', iconBg: 'bg-primary-100',
    title: 'Cửa hàng & điểm làm việc', description: 'Danh sách cửa hàng, địa chỉ, bán kính check-in',
    href: '/settings#co-cau-cua-hang', status: 'completed', statusText: '3 cửa hàng',
    isRequired: true, setupOrder: 2,
  },
  {
    id: 'workforce-structure', category: 'hr', icon: '🧋', iconBg: 'bg-success-100',
    title: 'Vị trí vận hành & ca làm', description: 'Vị trí pha chế, thu ngân, ca mở cửa, ca đóng cửa',
    href: '/settings#nhan-su-va-ca-lam', status: 'completed', statusText: '3 ca làm việc',
    isRequired: true, setupOrder: 3,
  },
  {
    id: 'scheduling', category: 'hr', icon: '📆', iconBg: 'bg-success-100',
    title: 'Quy tắc xếp ca', description: 'Chu kỳ xếp ca, quy tắc đăng ký, ràng buộc lịch làm việc',
    href: '/settings/schedule-rules', status: 'completed', statusText: 'Đã cấu hình',
    isRequired: true, setupOrder: 4,
  },
  {
    id: 'preferences', category: 'hr', icon: '❤️', iconBg: 'bg-pink-100',
    title: 'Đăng ký ca mong muốn', description: 'Cấu hình preference và tổng quan đăng ký ca của nhân sự',
    href: '/settings/schedule-rules/preferences', status: 'completed', statusText: 'Ưu tiên theo ca',
    isRequired: false, setupOrder: 5,
    subItems: [
      { title: 'Cài đặt preference', href: '/settings/schedule-rules/preferences' },
      { title: 'Tổng quan đăng ký', href: '/settings/schedule-rules/preferences/overview' },
    ],
  },
  {
    id: 'staffing', category: 'hr', icon: '📊', iconBg: 'bg-success-100',
    title: 'Định biên nhân sự', description: 'Nhu cầu nhân sự theo lưu lượng, giờ cao điểm và năng suất',
    href: '/settings/staffing', status: 'completed', statusText: 'Đã cấu hình',
    isRequired: false, setupOrder: 6,
  },
  {
    id: 'leave', category: 'finance', icon: '🏖️', iconBg: 'bg-teal-100',
    title: 'Nghỉ phép & quy định nghỉ', description: 'Loại phép, quota, quy định áp dụng cho nhân sự cửa hàng',
    href: '/leave', status: 'completed', statusText: '12 ngày/năm',
    isRequired: true, setupOrder: 7,
  },
  {
    id: 'career-path', category: 'finance', icon: '🚀', iconBg: 'bg-primary-100',
    title: 'Lộ trình phát triển', description: 'Cấp bậc, kỹ năng, điều kiện thăng tiến và thử việc',
    href: '/career-path/settings', status: 'not_started', statusText: 'Chưa thiết lập',
    isRequired: true, setupOrder: 8,
  },
  {
    id: 'kpi', category: 'finance', icon: '🎯', iconBg: 'bg-indigo-100',
    title: 'Đánh giá KPI', description: 'Tiêu chí, thang điểm, chu kỳ đánh giá cho đội cửa hàng',
    href: '/kpi/settings', status: 'completed', statusText: '3 tiêu chí',
    isRequired: true, setupOrder: 9,
  },
  {
    id: 'payroll', category: 'finance', icon: '💵', iconBg: 'bg-warning-100',
    title: 'Cấu hình lương', description: 'Kỳ lương, phụ cấp, chế độ trả lương và dữ liệu tính công',
    href: '/settings/payroll', status: 'completed', statusText: 'Ngày 5 hàng tháng',
    isRequired: true, setupOrder: 10,
  },
  {
    id: 'labor-cost', category: 'finance', icon: '🧾', iconBg: 'bg-warning-100',
    title: 'Labor cost', description: 'Theo dõi chi phí lao động theo cửa hàng và ca làm',
    href: '/settings/labor-cost', status: 'not_started', statusText: 'Chưa thiết lập',
    isRequired: false, setupOrder: 11,
  },
  {
    id: 'wifi', category: 'system', icon: '📶', iconBg: 'bg-cyan-100',
    title: 'WiFi check-in', description: 'Thiết bị và WiFi dùng cho chấm công tại cửa hàng',
    href: '/settings/wifi', status: 'completed', statusText: '2 WiFi đã cài',
    isRequired: false, setupOrder: 12,
  },
  {
    id: 'permissions', category: 'system', icon: '🔐', iconBg: 'bg-error-100',
    title: 'Phân quyền', description: 'Vai trò, quyền truy cập và phạm vi quản lý',
    href: '/settings/permissions', status: 'completed', statusText: '3 vai trò',
    isRequired: false, setupOrder: 13,
  },
  {
    id: 'system', category: 'system', icon: '⚙️', iconBg: 'bg-gray-100',
    title: 'Hệ thống', description: 'Ngôn ngữ, theme và cấu hình vận hành chung',
    href: '/settings/system', status: 'completed', statusText: 'Tiếng Việt',
    isRequired: false, setupOrder: 14,
  },
];

export function getSettingsByCategory(category: SettingCategoryId): SettingItem[] {
  return settingItems.filter(item => item.category === category);
}

export function getSettingsWorkspaceTab(id: SettingsWorkspaceTabId): SettingsWorkspaceTab {
  const tab = settingsWorkspaceTabs.find((item) => item.id === id);
  if (!tab) throw new Error(`Unknown settings workspace tab: ${id}`);
  return tab;
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