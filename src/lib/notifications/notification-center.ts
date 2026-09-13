// =============================================
// Notification Center — Mock data store
// =============================================

export type NotificationType =
  | 'swap_request'        // Ai đó gửi request đổi ca đến bạn
  | 'swap_accepted'       // Người được hỏi đồng ý đổi ca
  | 'swap_rejected'       // Người được hỏi từ chối đổi ca
  | 'swap_cancelled'      // Người yêu cầu hủy request đổi ca
  | 'swap_approved'       // Manager duyệt đổi ca
  | 'swap_rejected_by_manager' // Manager từ chối đổi ca
  | 'open_shift_posted'   // Ca trống mới được đăng
  | 'open_shift_claim_submitted' // Có NV nhận ca trống — notify manager
  | 'open_shift_claim_approved'   // NV được duyệt nhận ca
  | 'open_shift_claim_rejected'  // NV bị từ chối nhận ca
  | 'schedule_published'  // Lịch tuần mới được xuất bản
  | 'schedule_changed_after_publish' // Ca bị chỉnh sau publish
  | 'preference_reminder' // Nhắc đăng ký ca mong muốn
  | 'system'

export type NotificationStatus = 'unread' | 'read'

export interface Notification {
  id: string
  user_id: string              // Người nhận
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, string>  // Lưu id liên quan (swap_id, shift_id, ...)
  status: NotificationStatus
  created_at: string
  read_at?: string
}

// ─── In-memory store ───
let notifCounter = 1000
const notifications: Notification[] = []
const STORAGE_KEY = 'homies_notification_center'
const listeners = new Set<() => void>()
let notificationsInitialized = false

function normalizeNotificationMetadata(metadata?: Record<string, string>): string {
  return JSON.stringify(
    Object.entries(metadata || {}).sort(([left], [right]) => left.localeCompare(right))
  )
}

function emitNotificationsChanged() {
  listeners.forEach(listener => listener())
}

function persistNotifications() {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    notifCounter,
    notifications,
  }))
}

function initNotifications() {
  if (notificationsInitialized || typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as {
        notifCounter?: number
        notifications?: Notification[]
      }
      if (typeof parsed.notifCounter === 'number') {
        notifCounter = parsed.notifCounter
      }
      if (Array.isArray(parsed.notifications)) {
        notifications.splice(0, notifications.length, ...parsed.notifications)
      }
    }
  } catch {
    notifications.length = 0
  } finally {
    notificationsInitialized = true
  }
}

export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// ─── CRUD ───

export function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, string>,
): Notification {
  initNotifications()
  const notif: Notification = {
    id: `notif-${notifCounter++}`,
    user_id: userId,
    type,
    title,
    message,
    metadata,
    status: 'unread',
    created_at: new Date().toISOString(),
  }
  notifications.unshift(notif) // newest first
  persistNotifications()
  emitNotificationsChanged()
  return notif
}

export function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, string>,
): Notification[] {
  return userIds.map(uid =>
    createNotification(uid, type, title, message, metadata)
  )
}

export function createNotificationDeduped(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, string>,
  dedupeWindowMs = 30 * 60 * 1000,
): { notification: Notification; created: boolean } {
  initNotifications()
  const metadataKey = normalizeNotificationMetadata(metadata)
  const threshold = Date.now() - dedupeWindowMs

  const duplicate = notifications.find(notification =>
    notification.user_id === userId &&
    notification.type === type &&
    normalizeNotificationMetadata(notification.metadata) === metadataKey &&
    new Date(notification.created_at).getTime() >= threshold
  )

  if (duplicate) {
    return { notification: duplicate, created: false }
  }

  return {
    notification: createNotification(userId, type, title, message, metadata),
    created: true,
  }
}

export function createBulkNotificationsDeduped(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, string>,
  dedupeWindowMs?: number,
): Notification[] {
  return userIds
    .map(userId => createNotificationDeduped(userId, type, title, message, metadata, dedupeWindowMs).notification)
}

export function getNotificationsForUser(userId: string): Notification[] {
  initNotifications()
  return notifications.filter(n => n.user_id === userId)
}

export function getUnreadCount(userId: string): number {
  initNotifications()
  return notifications.filter(n => n.user_id === userId && n.status === 'unread').length
}

export function getUnreadNotifications(userId: string): Notification[] {
  initNotifications()
  return notifications.filter(n => n.user_id === userId && n.status === 'unread')
}

export function markAsRead(notificationId: string): Notification | null {
  initNotifications()
  const notif = notifications.find(n => n.id === notificationId)
  if (!notif) return null
  notif.status = 'read'
  notif.read_at = new Date().toISOString()
  persistNotifications()
  emitNotificationsChanged()
  return notif
}

export function markAllAsRead(userId: string): number {
  initNotifications()
  const now = new Date().toISOString()
  let count = 0
  notifications.forEach(n => {
    if (n.user_id === userId && n.status === 'unread') {
      n.status = 'read'
      n.read_at = now
      count++
    }
  })
  if (count > 0) {
    persistNotifications()
    emitNotificationsChanged()
  }
  return count
}

export function deleteNotification(notificationId: string): boolean {
  initNotifications()
  const idx = notifications.findIndex(n => n.id === notificationId)
  if (idx === -1) return false
  notifications.splice(idx, 1)
  persistNotifications()
  emitNotificationsChanged()
  return true
}

export function clearAllForUser(userId: string): number {
  initNotifications()
  const filtered = notifications.filter(n => n.user_id !== userId)
  const removed = notifications.length - filtered.length
  notifications.length = 0
  notifications.push(...filtered)
  if (removed > 0) {
    persistNotifications()
    emitNotificationsChanged()
  }
  return removed
}

export function getNotificationActionUrl(notification: Notification): string | null {
  if (notification.metadata?.action_url) {
    return notification.metadata.action_url
  }

  switch (notification.type) {
    case 'swap_request':
    case 'swap_accepted':
    case 'swap_rejected':
    case 'swap_cancelled':
    case 'swap_approved':
    case 'swap_rejected_by_manager':
      return '/schedule/swap/list'
    case 'open_shift_posted':
    case 'open_shift_claim_approved':
    case 'open_shift_claim_rejected':
      return '/schedule/open-shifts'
    case 'open_shift_claim_submitted':
      return '/schedule/open-shifts/claims'
    case 'schedule_published':
    case 'schedule_changed_after_publish':
      return '/schedules'
    case 'preference_reminder':
      return '/schedules'
    default:
      return null
  }
}

// ─── Seed demo notifications ───
export function seedDemoNotifications(userId: string) {
  initNotifications()
  if (notifications.some(n => n.user_id === userId)) return

  createNotification(
    userId,
    'swap_request',
    '🔄 Yêu cầu đổi ca mới',
    'Nguyễn Văn Minh muốn đổi ca với bạn vào ngày mai (Ca sáng)',
    { swap_id: 'swap-demo-1', requester_id: 'emp-008', date: '2026-02-24' }
  )

  createNotification(
    userId,
    'open_shift_claim_approved',
    '✅ Đơn nhận ca trống đã được duyệt',
    'Bạn đã được duyệt nhận Ca chiều ngày 24/02 tại Store Quận 1',
    { shift_id: 'shift-002', date: '2026-02-24', store_id: 'store-001' }
  )

  createNotification(
    userId,
    'schedule_published',
    '📅 Lịch tuần mới đã được xuất bản',
    'Lịch làm tuần 24/02 - 02/03 đã được xuất bản. Vui lòng kiểm tra lại.',
    { week: '2026-W09' }
  )
}
