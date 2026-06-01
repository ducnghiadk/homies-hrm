export const ROLE_OPTIONS = [
  { value: 'employee', label: 'Nhân viên' },
  { value: 'shift_leader', label: 'Trưởng ca' },
  { value: 'store_manager', label: 'Quản lý cửa hàng' },
]

export const DEFAULT_EMAIL_SUBJECT = '[Homies Milk Tea] Thư mời nhận việc và hoàn tất hồ sơ nhân sự'
export const DEFAULT_EMAIL_PERSONAL_NOTE = 'Chúng tôi rất ấn tượng với hồ sơ của bạn và mong muốn bạn đồng hành cùng đội ngũ Homies.'
export const DEFAULT_EMAIL_SUPPORT_NAME = 'Hoàng Thị Yến (HR Dept)'
export const DEFAULT_EMAIL_SUPPORT_INFO = '0956677889 / yen@bobahouse.vn'

export function getDefaultEmailDeadline() {
  const date = new Date()
  date.setDate(date.getDate() + 3)
  return date.toISOString().split('T')[0]
}
