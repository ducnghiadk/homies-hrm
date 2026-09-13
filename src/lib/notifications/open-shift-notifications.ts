// =============================================
// Open Shift Notifications — triggered on open shift events
// =============================================

import { createBulkNotificationsDeduped, createNotificationDeduped } from './notification-center'
import { mockEmployees, mockSchedules } from '@/lib/mock-data'
import { isEmployeeCompatibleWithPositionId } from '@/lib/scheduling/position-compatibility'

export interface OpenShiftCreatedEvent {
  openShiftId: string
  storeId: string
  storeName: string
  shiftId: string
  shiftName: string
  startTime: string
  endTime: string
  date: string
  positionId: string
  positionName: string
  createdByName: string
}

/**
 * Gọi khi tạo ca trống mới
 * → Notify tất cả NV trong store có position phù hợp và không có lịch trùng
 */
export function notifyOpenShiftCreated(event: OpenShiftCreatedEvent): void {
  const displayDate = event.date.includes('-')
    ? event.date.split('-').reverse().join('/')
    : event.date

  const eligible = mockEmployees.filter(emp => {
    if (emp.store_id !== event.storeId) return false
    if (!['active', 'probation'].includes(emp.status)) return false
    if (!isEmployeeCompatibleWithPositionId(emp.position_id, event.positionId)) return false

    const hasConflict = mockSchedules.some(s =>
      s.employee_id === emp.id &&
      s.date === event.date
    )

    return !hasConflict
  })

  const userIds = eligible.map(e => e.id)

  createBulkNotificationsDeduped(
    userIds,
    'open_shift_posted',
    '🆕 Ca trống mới cần người',
    `Ca ${event.shiftName} (${event.startTime}-${event.endTime}) ngày ${displayDate} tại ${event.storeName} cần người. Đăng ký ngay!`,
    {
      open_shift_id: event.openShiftId,
      shift_id: event.shiftId,
      date: event.date,
      store_id: event.storeId,
      action_url: `/schedule/open-shifts?tab=available&openShiftId=${event.openShiftId}`,
    }
  )
}

export interface OpenShiftClaimSubmittedEvent {
  openShiftId: string
  claimId: string
  userId: string
  userName: string
  shiftName: string
  date: string
  startTime: string
  endTime: string
  storeName: string
  managerIds: string[]
  autoApprove?: boolean
}

/**
 * Gọi khi NV đăng ký nhận ca trống (cần duyệt tay)
 * → Notify tất cả manager của store
 */
export function notifyOpenShiftClaimSubmitted(event: OpenShiftClaimSubmittedEvent): void {
  const message = event.autoApprove
    ? `NV ${event.userName} đã đăng ký ca ${event.shiftName} ngày ${event.date} — Tự động duyệt.`
    : `NV ${event.userName} muốn nhận ca ${event.shiftName} (${event.startTime}-${event.endTime}) ngày ${event.date} tại ${event.storeName}. Vui lòng duyệt.`

  event.managerIds.forEach(managerId => {
    createNotificationDeduped(
      managerId,
      'open_shift_claim_submitted',
      '📋 Có đăng ký nhận ca trống mới',
      message,
      {
        claim_id: event.claimId,
        open_shift_id: event.openShiftId,
        user_id: event.userId,
        date: event.date,
        auto_approve: String(event.autoApprove || false),
        action_url: `/schedule/open-shifts/claims?claimId=${event.claimId}`,
      }
    )
  })
}

export interface OpenShiftClaimResultEvent {
  openShiftId: string
  claimId: string
  userId: string
  userName: string
  approved: boolean
  managerName: string
  shiftName: string
  date: string
  storeName: string
}

/**
 * Gọi khi Manager duyệt/từ chối đăng ký ca trống
 * → Notify nhân viên đăng ký
 */
export function notifyOpenShiftClaimResult(event: OpenShiftClaimResultEvent): void {
  if (event.approved) {
    createNotificationDeduped(
      event.userId,
      'open_shift_claim_approved',
      '✅ Đơn nhận ca trống đã được duyệt!',
      `Bạn được duyệt nhận ca ${event.shiftName} ngày ${event.date} tại ${event.storeName}. Ca đã được thêm vào lịch của bạn.`,
      {
        claim_id: event.claimId,
        open_shift_id: event.openShiftId,
        date: event.date,
        action_url: `/schedule/open-shifts?tab=my&claimId=${event.claimId}`,
      }
    )
  } else {
    createNotificationDeduped(
      event.userId,
      'open_shift_claim_rejected',
      '❌ Đơn nhận ca trống bị từ chối',
      `Yêu cầu nhận ca ${event.shiftName} ngày ${event.date} tại ${event.storeName} đã bị từ chối bởi ${event.managerName}.`,
      {
        claim_id: event.claimId,
        open_shift_id: event.openShiftId,
        date: event.date,
        action_url: `/schedule/open-shifts?tab=my&claimId=${event.claimId}`,
      }
    )
  }
}
