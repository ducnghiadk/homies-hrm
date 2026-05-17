// UX Onboarding — Traffic & Salary template data

// --- Traffic Templates ---

export interface TrafficTimeSlot {
  hours: string
  percent: number
  level: 'very_low' | 'low' | 'medium' | 'high'
}

export interface TrafficTemplate {
  key: string
  name: string
  icon: string
  description: string
  pattern: TrafficTimeSlot[] | null // null = custom
}

export const TRAFFIC_TEMPLATES: TrafficTemplate[] = [
  {
    key: 'bubble_tea',
    name: 'Trà sữa',
    icon: '🧋',
    description: 'Đông trưa + tối',
    pattern: [
      { hours: '7h-9h',   percent: 10, level: 'low' },
      { hours: '9h-11h',  percent: 5,  level: 'very_low' },
      { hours: '11h-14h', percent: 30, level: 'high' },
      { hours: '14h-17h', percent: 10, level: 'low' },
      { hours: '17h-21h', percent: 35, level: 'high' },
      { hours: '21h-23h', percent: 10, level: 'low' },
    ],
  },
  {
    key: 'coffee',
    name: 'Cà phê',
    icon: '☕',
    description: 'Đông sáng + chiều',
    pattern: [
      { hours: '7h-9h',   percent: 25, level: 'high' },
      { hours: '9h-11h',  percent: 15, level: 'medium' },
      { hours: '11h-14h', percent: 10, level: 'low' },
      { hours: '14h-17h', percent: 20, level: 'medium' },
      { hours: '17h-21h', percent: 25, level: 'high' },
      { hours: '21h-23h', percent: 5,  level: 'very_low' },
    ],
  },
  {
    key: 'restaurant',
    name: 'Quán ăn',
    icon: '🍜',
    description: 'Đông bữa chính',
    pattern: [
      { hours: '7h-9h',   percent: 5,  level: 'very_low' },
      { hours: '9h-11h',  percent: 10, level: 'low' },
      { hours: '11h-14h', percent: 35, level: 'high' },
      { hours: '14h-17h', percent: 5,  level: 'very_low' },
      { hours: '17h-21h', percent: 40, level: 'high' },
      { hours: '21h-23h', percent: 5,  level: 'very_low' },
    ],
  },
  {
    key: 'custom',
    name: 'Tự nhập',
    icon: '✏️',
    description: 'Nhập theo quán của bạn',
    pattern: null,
  },
]

// --- Salary Templates ---

export interface SalaryPosition {
  position: string
  label: string
  ft: number       // VND/month
  pt: number | null // VND/hour, null = not available
}

export interface SalaryTemplate {
  key: string
  name: string
  icon: string
  ftRange: string  // e.g. "7-8tr"
  ptRange: string  // e.g. "25-30k"
  salaries: SalaryPosition[]
}

export const SALARY_TEMPLATES: SalaryTemplate[] = [
  {
    key: 'hcm',
    name: 'TP.HCM',
    icon: '🏙️',
    ftRange: '7-9tr',
    ptRange: '25-30k',
    salaries: [
      { position: 'barista',  label: 'Pha chế chính', ft: 7500000, pt: 28000 },
      { position: 'cashier',  label: 'Thu ngân',       ft: 6500000, pt: 25000 },
      { position: 'support',  label: 'Phụ việc',       ft: 5500000, pt: 22000 },
      { position: 'manager',  label: 'Quản lý ca',     ft: 9000000, pt: null },
    ],
  },
  {
    key: 'hanoi',
    name: 'Hà Nội',
    icon: '🌆',
    ftRange: '6-8.5tr',
    ptRange: '22-28k',
    salaries: [
      { position: 'barista',  label: 'Pha chế chính', ft: 7000000, pt: 26000 },
      { position: 'cashier',  label: 'Thu ngân',       ft: 6000000, pt: 23000 },
      { position: 'support',  label: 'Phụ việc',       ft: 5000000, pt: 20000 },
      { position: 'manager',  label: 'Quản lý ca',     ft: 8500000, pt: null },
    ],
  },
  {
    key: 'province',
    name: 'Tỉnh khác',
    icon: '🏘️',
    ftRange: '5-7tr',
    ptRange: '18-22k',
    salaries: [
      { position: 'barista',  label: 'Pha chế chính', ft: 5500000, pt: 22000 },
      { position: 'cashier',  label: 'Thu ngân',       ft: 5000000, pt: 20000 },
      { position: 'support',  label: 'Phụ việc',       ft: 4500000, pt: 18000 },
      { position: 'manager',  label: 'Quản lý ca',     ft: 7000000, pt: null },
    ],
  },
  {
    key: 'custom',
    name: 'Tự nhập',
    icon: '✏️',
    ftRange: '',
    ptRange: '',
    salaries: [],
  },
]

// --- Progress Messages ---

export const PROGRESS_MESSAGES: Record<number, { text: string; emoji: string }> = {
  1: { text: 'Bắt đầu thôi! Còn 3 bước nữa', emoji: '🚀' },
  2: { text: 'Tốt lắm! Còn 2 bước nữa', emoji: '👍' },
  3: { text: 'Sắp xong! Chỉ còn 1 bước', emoji: '💪' },
  4: { text: 'Hoàn thành! Xem kết quả bên dưới', emoji: '🎉' },
}

// --- Tooltip Content ---

export const WIZARD_TOOLTIPS: Record<number, { title: string; body: string }> = {
  1: {
    title: '💡 MẸO',
    body: 'Chỉ cần nhập ước tính, không cần chính xác 100%. Hệ thống sẽ tự điều chỉnh theo thực tế sau.',
  },
  2: {
    title: '💡 TẠI SAO CẦN BƯỚC NÀY?',
    body: 'Biết giờ cao điểm giúp bạn:\n• Xếp đúng số người vào đúng giờ\n• Tiết kiệm 15-25% chi phí lương\n• Không bị thiếu người giờ đông\n\nNếu không chắc, cứ chọn mẫu "Trà sữa".',
  },
  3: {
    title: '💡 MẸO VỀ MỨC LƯƠNG',
    body: 'Mức lương ảnh hưởng đến tổng chi phí hàng tháng và so sánh các phương án.\n\nNếu chưa có nhân viên, cứ chọn mức trung bình theo khu vực của bạn.',
  },
  4: {
    title: '💡 CÁCH ĐỌC KẾT QUẢ',
    body: '⭐ Phương án C (Đề xuất): Cân bằng chi phí và ổn định\n💰 Phương án B (Tiết kiệm): Chi phí thấp, cần quản lý nhiều\n🏢 Phương án A (Ổn định): Dễ quản lý, chi phí cao hơn',
  },
}
