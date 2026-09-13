// =============================================
// Swap/Cover Notifications — triggered on swap events
// =============================================

import { createNotificationDeduped } from './notification-center'

export interface SwapRequestCreatedEvent {
  requestId: string
  requesterId: string
  requesterName: string
  targetUserId: string
  targetName: string
  type: 'swap' | 'cover'
  shiftName: string
  date: string
  targetShiftName?: string
  targetDate?: string
}

/**
 * Gọi khi NV tạo yêu cầu đổi/nhờ thay ca
 * → Notify người được hỏi
 */
export function notifySwapRequestCreated(event: SwapRequestCreatedEvent): void {
  const { targetUserId, type, requesterName, shiftName, date } = event
  const display = type === 'swap'
    ? `${shiftName} ngày ${date}${event.targetShiftName ? ` ↔ ${event.targetShiftName}` : ''}${event.targetDate ? ` ngày ${event.targetDate}` : ''}`
    : `${event.shiftName} ngày ${event.date}`

  createNotificationDeduped(
    targetUserId,
    'swap_request',
    '🔄 Yêu cầu đổi ca mới',
    `${requesterName} muốn ${type === 'swap' ? 'đổi ca' : 'nhờ bạn thay ca'}: ${display}`,
    {
      swap_id: event.requestId,
      requester_id: event.requesterId,
      type,
      date,
      action_url: `/schedule/swap/list?tab=received&requestId=${event.requestId}`,
    }
  )
}

export interface SwapRespondedEvent {
  requestId: string
  requesterId: string
  requesterName: string
  targetName: string
  type: 'swap' | 'cover'
  accepted: boolean
  shiftName: string
  date: string
}

/**
 * Gọi khi người được hỏi đồng ý / từ chối
 * → Notify người yêu cầu
 */
export function notifySwapResponded(event: SwapRespondedEvent): void {
  const { requesterId, targetName, accepted, shiftName, date } = event

  if (accepted) {
    createNotificationDeduped(
      requesterId,
      'swap_accepted',
      '✅ Đồng nghiệp đồng ý đổi ca',
      `${targetName} đã đồng ý ${event.type === 'swap' ? 'đổi ca' : 'thay ca'} ${shiftName} ngày ${date}. Đang chờ quản lý duyệt.`,
      {
        swap_id: event.requestId,
        type: event.type,
        action_url: `/schedule/swap/list?tab=sent&requestId=${event.requestId}`,
      }
    )
  } else {
    createNotificationDeduped(
      requesterId,
      'swap_rejected',
      '❌ Đồng nghiệp từ chối đổi ca',
      `${targetName} đã từ chối ${event.type === 'swap' ? 'đổi ca' : 'thay ca'} ${shiftName} ngày ${date}.`,
      {
        swap_id: event.requestId,
        type: event.type,
        action_url: `/schedule/swap/list?tab=sent&requestId=${event.requestId}`,
      }
    )
  }
}

export interface SwapManagerActionEvent {
  requestId: string
  requesterId: string
  requesterName: string
  targetUserId?: string
  targetName?: string
  type: 'swap' | 'cover'
  approved: boolean
  managerName: string
  shiftName: string
  date: string
}

/**
 * Gọi khi Manager duyệt / từ chối
 * → Notify người yêu cầu (+ người được hỏi nếu là swap)
 */
export function notifySwapManagerAction(event: SwapManagerActionEvent): void {
  const { requesterId, approved, managerName, shiftName, date, type } = event

  if (approved) {
    createNotificationDeduped(
      requesterId,
      'swap_approved',
      '✅ Yêu cầu đổi ca đã được duyệt!',
      `${managerName} đã duyệt yêu cầu ${type === 'swap' ? 'đổi ca' : 'thay ca'}. Lịch của bạn đã được cập nhật.`,
      { swap_id: event.requestId, type, action_url: `/schedule/swap/list?tab=sent&requestId=${event.requestId}` }
    )

    if (event.targetUserId) {
      const targetMessage = type === 'swap'
        ? `${managerName} đã duyệt yêu cầu đổi ca. Ca của bạn ngày ${date} đã được cập nhật.`
        : `${managerName} đã duyệt yêu cầu nhờ thay ca. Bạn đã được thêm vào ca ${shiftName} ngày ${date}.`

      createNotificationDeduped(
        event.targetUserId,
        'swap_approved',
        '✅ Yêu cầu đổi ca đã được duyệt!',
        targetMessage,
        { swap_id: event.requestId, type, action_url: `/schedule/swap/list?tab=received&requestId=${event.requestId}` }
      )
    }
  } else {
    createNotificationDeduped(
      requesterId,
      'swap_rejected_by_manager',
      '❌ Yêu cầu đổi ca bị từ chối',
      `${managerName} đã từ chối yêu cầu ${type === 'swap' ? 'đổi ca' : 'thay ca'}. ${shiftName} ngày ${date}.`,
      { swap_id: event.requestId, type, action_url: `/schedule/swap/list?tab=sent&requestId=${event.requestId}` }
    )
  }
}

export interface SwapCancelledEvent {
  requestId: string
  requesterName: string
  targetUserId: string
  type: 'swap' | 'cover'
  shiftName: string
  date: string
}

export function notifySwapCancelled(event: SwapCancelledEvent): void {
  createNotificationDeduped(
    event.targetUserId,
    'swap_cancelled',
    'ℹ️ Yêu cầu đổi ca đã được hủy',
    `${event.requesterName} đã hủy yêu cầu ${event.type === 'swap' ? 'đổi ca' : 'nhờ thay ca'} cho ${event.shiftName} ngày ${event.date}.`,
    {
      swap_id: event.requestId,
      type: event.type,
      action_url: `/schedule/swap/list?tab=received&requestId=${event.requestId}`,
    }
  )
}
