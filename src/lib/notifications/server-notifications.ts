// Đọc / đánh dấu đã đọc thông báo trên máy chủ (dùng chung cho chuông thông báo và trang /notifications).
import type { Notification } from './notification-center'

interface ServerNotificationItem {
  id: string
  type?: string
  title: string
  message: string
  metadata?: Record<string, unknown>
  is_read?: boolean
  created_at: string
}

function toStringMetadata(metadata?: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  Object.entries(metadata || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) out[key] = String(value)
  })
  return out
}

/** Trả về danh sách thông báo máy chủ của người đang đăng nhập, hoặc null nếu không tải được. */
export async function fetchServerNotifications(userId: string, limit = 50): Promise<Notification[] | null> {
  try {
    const res = await fetch(`/api/notifications?limit=${limit}`)
    if (!res.ok) return null
    const json = await res.json()
    if (!json?.success || !Array.isArray(json.data)) return null
    return (json.data as ServerNotificationItem[]).map((item) => ({
      id: item.id,
      user_id: userId,
      type: (item.type || 'system') as Notification['type'],
      title: item.title,
      message: item.message,
      metadata: toStringMetadata(item.metadata),
      status: item.is_read ? 'read' : 'unread',
      created_at: item.created_at,
    }))
  } catch {
    return null
  }
}

/** Gộp thông báo máy chủ với thông báo trên máy, bỏ trùng, mới nhất lên đầu. */
export function mergeNotifications(server: Notification[], local: Notification[]): Notification[] {
  const seen = new Set<string>()
  const combined: Notification[] = []
  ;[...server, ...local].forEach((n) => {
    if (!seen.has(n.id)) {
      seen.add(n.id)
      combined.push(n)
    }
  })
  return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function markServerNotificationRead(id: string) {
  return fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark_read', id }),
  }).catch(() => undefined)
}

export function markAllServerNotificationsRead() {
  return fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark_all_read' }),
  }).catch(() => undefined)
}
