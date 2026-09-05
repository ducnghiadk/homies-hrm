import type { SettingItem, SettingCategory, SettingCategoryId, SetupProgress } from '@/lib/types/settings';

export const settingCategories: SettingCategory[] = [
  { id: 'organization', icon: '🏢', label: 'Cài đặt Doanh nghiệp', description: 'Thông tin pháp lý, người đại diện & danh sách chi nhánh cửa hàng' },
  { id: 'hr_master', icon: '📋', label: 'Danh mục Nhân sự', description: 'Phòng ban, vị trí & cấp bậc, loại nghỉ phép, quy trình duyệt' },
  { id: 'payroll', icon: '💰', label: 'Lương & Phụ cấp', description: 'Bậc lương, phụ cấp OT, F&B, bảo hiểm, ngân sách & cảnh báo chi phí' },
  { id: 'scheduling', icon: '📅', label: 'Phân ca & Chấm công', description: 'Khung ca làm việc, quy tắc xếp ca, preference, định biên, WiFi' },
  { id: 'system', icon: '🛡️', label: 'Hệ thống & Phân quyền', description: 'Phân quyền RBAC, đồng bộ ngoại tuyến, thông báo, sao lưu' },
];

export const settingItems: SettingItem[] = [
  // === 1. CÀI ĐẶT DOANH NGHIỆP ===
  {
    id: 'org-info', category: 'organization', icon: '🏢', iconBg: 'bg-primary-100',
    title: 'Cài đặt Doanh nghiệp & Chi nhánh', description: 'Tên chuỗi, MST, người ký HĐLĐ & địa chỉ chuẩn 4 cấp GPS 3 cửa hàng',
    href: '/settings/organization', status: 'completed', statusText: 'Homies Milk Tea • 3 chi nhánh',
    isRequired: true, setupOrder: 1,
    subItems: [
      { title: 'Thông tin doanh nghiệp', href: '/settings/organization?tab=general' },
      { title: 'Chi nhánh & Cửa hàng', href: '/settings/organization?tab=branches' },
    ],
  },

  // === 2. DANH MỤC NHÂN SỰ ===
  {
    id: 'master-data', category: 'hr_master', icon: '📁', iconBg: 'bg-slate-100',
    title: 'Danh mục Nhân sự', description: 'Phòng ban, vị trí & cấp bậc, loại nghỉ phép, quy trình phê duyệt',
    href: '/settings/master-data', status: 'completed', statusText: '5 phòng ban • 6 vị trí',
    isRequired: true, setupOrder: 2,
    subItems: [
      { title: 'Phòng ban', href: '/settings/master-data' },
      { title: 'Vị trí & Cấp bậc', href: '/settings/master-data' },
      { title: 'Loại nghỉ phép', href: '/settings/master-data' },
      { title: 'Quy trình phê duyệt', href: '/settings/master-data' },
    ],
  },

  // === 3. LƯƠNG & PHỤ CẤP ===
  {
    id: 'payroll', category: 'payroll', icon: '💵', iconBg: 'bg-warning-100',
    title: 'Lương, Phụ cấp & Chi phí Lao động', description: 'Bậc lương, hệ số OT, cơm ca F&B, bảo hiểm, ngân sách & cảnh báo',
    href: '/settings/payroll', status: 'completed', statusText: 'Tự động tính • 9 phân khu',
    isRequired: true, setupOrder: 3,
    subItems: [
      { title: 'Bậc lương theo vị trí', href: '/settings/payroll?tab=grades' },
      { title: 'Phụ cấp & Hệ số Tăng ca', href: '/settings/payroll?tab=allowances' },
      { title: 'Quy định F&B Việt Nam', href: '/settings/payroll?tab=fnb' },
      { title: 'Ngân sách chi nhánh', href: '/settings/payroll?tab=budgets' },
      { title: 'Mùa cao điểm & Thưởng', href: '/settings/payroll?tab=seasons' },
      { title: 'Cảnh báo chi phí lương', href: '/settings/payroll?tab=warnings' },
    ],
  },
  {
    id: 'bsc-bonus', category: 'payroll', icon: '🎯', iconBg: 'bg-amber-100',
    title: 'Cài Đặt Thưởng BSC & Quy Tắc Lỗi', description: 'Cấu hình mốc doanh thu lợi nhuận, trọng số 4 tiêu chí & ma trận điểm phạt vi phạm chuẩn',
    href: '/settings/bsc', status: 'completed', statusText: 'Chuẩn Homies • Auto-Lock',
    isRequired: true, setupOrder: 3.5,
  },

  // === 4. PHÂN CA & CHẤM CÔNG ===
  {
    id: 'shifts', category: 'scheduling', icon: '⏰', iconBg: 'bg-success-100',
    title: 'Khung ca làm việc (Shifts)', description: 'Tạo ca Sáng, Chiều, Tối, Ca Gãy, định mức giờ làm',
    href: '/settings/schedule-rules/shifts', status: 'completed', statusText: '3 ca làm việc',
    isRequired: true, setupOrder: 4,
  },
  {
    id: 'schedule-rules', category: 'scheduling', icon: '🛡️', iconBg: 'bg-emerald-100',
    title: 'Quy tắc xếp ca & Cảnh báo', description: 'Giới hạn giờ làm/tuần, khoảng nghỉ giữa 2 ca, ngoại lệ theo vị trí',
    href: '/settings/schedule-rules', status: 'completed', statusText: '4 quy tắc đang bật',
    isRequired: true, setupOrder: 4.2,
  },
  {
    id: 'preferences', category: 'scheduling', icon: '❤️', iconBg: 'bg-pink-100',
    title: 'Đăng ký ca mong muốn (Preferences)', description: 'Cấu hình ưu tiên và mở cổng cho nhân viên đăng ký lịch rảnh',
    href: '/settings/schedule-rules/preferences', status: 'completed', statusText: 'Ưu tiên ca đăng ký',
    isRequired: false, setupOrder: 4.5,
  },
  {
    id: 'staffing', category: 'scheduling', icon: '📊', iconBg: 'bg-indigo-100',
    title: 'Định biên & Tham số nhân sự', description: 'Số lượng nhân sự tối ưu theo giờ cao điểm và quy mô cửa hàng',
    href: '/settings/staffing', status: 'completed', statusText: 'Cấu hình chuẩn F&B',
    isRequired: false, setupOrder: 5,
  },
  {
    id: 'wifi', category: 'scheduling', icon: '📶', iconBg: 'bg-cyan-100',
    title: 'WiFi Check-in', description: 'Cài đặt tên SSID/BSSID router cửa hàng để xác thực vị trí check-in',
    href: '/settings/wifi', status: 'completed', statusText: '3 WiFi chi nhánh',
    isRequired: false, setupOrder: 6,
  },

  // === 5. HỆ THỐNG & PHÂN QUYỀN ===
  {
    id: 'permissions', category: 'system', icon: '🔐', iconBg: 'bg-error-100',
    title: 'Phân quyền & Bảo mật (RBAC)', description: 'Vai trò, phân quyền theo chi nhánh, quyền duyệt đơn',
    href: '/settings/permissions', status: 'completed', statusText: '6 vai trò hệ thống',
    isRequired: false, setupOrder: 7,
  },
  {
    id: 'system', category: 'system', icon: '⚙️', iconBg: 'bg-primary-50',
    title: 'Hệ thống & Đồng bộ Offline', description: 'Thiết bị kiosk, trạng thái sync offline, xóa cache bộ nhớ',
    href: '/settings/system', status: 'completed', statusText: 'Tiếng Việt • Auto Sync',
    isRequired: false, setupOrder: 8,
  },
  {
    id: 'notifications', category: 'system', icon: '🔔', iconBg: 'bg-pink-100',
    title: 'Thông báo hệ thống', description: 'Cấu hình kênh nhận thông báo Push, Email, Zalo',
    href: '/settings/system', status: 'completed', statusText: 'Push + Email',
    isRequired: false, setupOrder: 9,
  },
  {
    id: 'backup', category: 'system', icon: '📤', iconBg: 'bg-slate-100',
    title: 'Sao lưu & Dữ liệu', description: 'Xuất báo cáo, sao lưu cấu hình hệ thống',
    href: '/settings/system', status: 'completed', statusText: 'Lần cuối: Hôm nay',
    isRequired: false, setupOrder: 10,
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
