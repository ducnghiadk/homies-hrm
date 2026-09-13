import type { InvitationTab } from './invitations-types'

export const INVITATIONS_COPY = {
  pageTitle: 'Lời mời nhân sự',
  pageDescription: 'Quản lý lời mời gửi đến ứng viên. Sau khi được xác nhận, ứng viên sẽ chuyển thành nhân sự chính thức.',
  createLabel: 'Tạo lời mời',
  searchPlaceholder: 'Tìm theo tên, email, số điện thoại...',
  allStoresLabel: 'Tất cả chi nhánh',
  accessDeniedTitle: 'Lời mời nhân sự',
  accessDeniedMessage: 'Bạn không có quyền truy cập trang này.',
  emptyMessage: 'Chưa có lời mời nào trong mục này.',
  emptyCta: 'Tạo lời mời đầu tiên',
  totalLabel: 'Tổng cộng',
  backToCloseLabel: 'Đóng',
  copyDoneLabel: 'Đã sao chép',
  copyLabel: 'Sao chép',
  columns: {
    candidate: 'Ứng viên',
    workplace: 'Nơi làm việc',
    onboarding: 'Nhận việc',
    compensation: 'Đãi ngộ',
    status: 'Trạng thái',
    actions: 'Thao tác',
  },
} as const

export const INVITATION_TABS: Array<{ id: InvitationTab; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending_approval', label: 'Chờ duyệt' },
  { id: 'needs_revision', label: 'Yêu cầu bổ sung' },
  { id: 'approved', label: 'Đã duyệt' },
  { id: 'rejected', label: 'Bị từ chối' },
  { id: 'others', label: 'Khác (Nháp/Đã gửi)' },
]
