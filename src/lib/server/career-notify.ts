// Gửi thông báo trong ứng dụng (chuông thông báo) cho các bước của lộ trình thăng tiến.
import type { ServerDatabaseSchema, ServerNotification } from '@/lib/server/db'

export interface CareerNotice {
  title: string
  message: string
  /** Gửi riêng cho 1 người. */
  target_user_id?: string
  /** Hoặc gửi cho mọi người có vai trò này. */
  target_role?: string
  metadata?: Record<string, string>
}

const MAX_NOTIFICATIONS = 500

export function pushCareerNotices(db: ServerDatabaseSchema, notices: CareerNotice[], now = new Date()) {
  if (notices.length === 0) return
  if (!db.notifications) db.notifications = []
  const created: ServerNotification[] = notices.map((n, i) => ({
    id: `career-${now.getTime()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    title: n.title,
    message: n.message,
    type: 'career_path',
    created_at: now.toISOString(),
    is_read: false,
    target_user_id: n.target_user_id,
    target_role: n.target_role,
    metadata: n.metadata,
  }))
  db.notifications = [...created, ...db.notifications].slice(0, MAX_NOTIFICATIONS)
}

/** Thông báo này có dành cho người dùng hiện tại không (không có người nhận = thông báo chung). */
export function isNotificationForUser(n: ServerNotification, userId: string, role: string) {
  if (!n.target_user_id && !n.target_role) return true
  return n.target_user_id === userId || n.target_role === role
}

/**
 * Người này đã đọc thông báo chưa.
 * Thông báo gửi riêng 1 người dùng `is_read`; thông báo chung/theo vai trò dùng `read_by`
 * để một người đọc không làm mất thông báo của người khác.
 */
export function isNotificationReadBy(n: ServerNotification, userId: string) {
  if (n.target_user_id) return n.is_read
  if (Array.isArray(n.read_by)) return n.read_by.includes(userId)
  return n.is_read
}

/** Đánh dấu đã đọc cho đúng người đang xem. */
export function markNotificationReadBy(n: ServerNotification, userId: string) {
  if (n.target_user_id) {
    n.is_read = true
    return
  }
  const readBy = Array.isArray(n.read_by) ? n.read_by : []
  if (!readBy.includes(userId)) n.read_by = [...readBy, userId]
}

/** Những người có quyền duyệt đề xuất lên bậc này (theo Cài đặt), trừ người đề xuất. */
export function careerApproverIds(
  db: ServerDatabaseSchema,
  canApprove: (role: string) => boolean,
  storeId: string,
  excludeId: string,
): string[] {
  return db.employees
    .filter((e) => e.id !== excludeId && e.status !== 'resigned' && e.status !== 'inactive')
    .filter((e) => {
      if (!canApprove(e.role)) return false
      // Quản lý cửa hàng chỉ nhận thông báo của chi nhánh mình.
      if (e.role === 'store_manager') return e.store_id === storeId || (e.secondary_store_ids || []).includes(storeId)
      return true
    })
    .map((e) => e.id)
}
