'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { useNotifications } from '@/hooks/useNotifications'
import { getNotificationActionUrl, type Notification } from '@/lib/notifications/notification-center'
import { Bell, CheckCircle, AlertTriangle, Info, Megaphone, X, ArrowRight } from 'lucide-react'

const iconMap: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  schedule_published: { icon: Bell, bg: '#2F6FA8', color: 'white' },
  schedule_changed_after_publish: { icon: AlertTriangle, bg: '#F59E0B', color: 'white' },
  swap_request: { icon: AlertTriangle, bg: '#2F6FA8', color: 'white' },
  swap_accepted: { icon: CheckCircle, bg: '#10B981', color: 'white' },
  swap_rejected: { icon: X, bg: '#EF4444', color: 'white' },
  swap_approved: { icon: CheckCircle, bg: '#10B981', color: 'white' },
  swap_rejected_by_manager: { icon: X, bg: '#EF4444', color: 'white' },
  open_shift_posted: { icon: Megaphone, bg: '#7C3AED', color: 'white' },
  open_shift_claim_submitted: { icon: Bell, bg: '#0EA5E9', color: 'white' },
  open_shift_claim_approved: { icon: CheckCircle, bg: '#10B981', color: 'white' },
  open_shift_claim_rejected: { icon: X, bg: '#EF4444', color: 'white' },
  system: { icon: Info, bg: '#6B7280', color: 'white' },
}

function formatRelative(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function NotificationCard({
  notification,
  onRead,
  onDelete,
  onOpen,
}: {
  notification: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onOpen: (notification: Notification) => void
}) {
  const config = iconMap[notification.type] || iconMap.system
  const Icon = config.icon
  const isRead = notification.status === 'read'
  const actionUrl = getNotificationActionUrl(notification)

  return (
    <div
      className="rounded-2xl border bg-white p-4 shadow-sm transition-all hover:border-gray-200"
      style={{
        borderLeft: isRead ? '4px solid transparent' : `4px solid ${config.bg}`,
        opacity: isRead ? 0.78 : 1,
      }}
    >
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${config.bg}18` }}>
          <Icon size={18} style={{ color: config.bg }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-800">{notification.title}</h3>
                {!isRead && <span className="h-2 w-2 rounded-full bg-primary-500" />}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{notification.message}</p>
              <p className="mt-2 text-[11px] text-gray-400">{formatRelative(notification.created_at)}</p>
            </div>
            <button
              onClick={() => onDelete(notification.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
            >
              <X size={12} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!isRead && (
              <button
                onClick={() => onRead(notification.id)}
                className="rounded-xl bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100"
              >
                Đánh dấu đã đọc
              </button>
            )}
            {actionUrl && (
              <button
                onClick={() => onOpen(notification)}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Mở liên quan <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user?.id)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user) return null

  return (
    <AppShell title={`Thông báo ${unreadCount > 0 ? `(${unreadCount})` : ''}`}>
      <div className="space-y-4 pb-20">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">Thông báo</h1>
            <p className="mt-0.5 text-xs text-gray-400">Lịch mới, thay đổi ca, đổi ca và ca trống sẽ xuất hiện ở đây.</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="rounded-xl bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-16 text-center">
            <Bell size={40} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-500">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
                onOpen={(nextNotification) => {
                  markAsRead(nextNotification.id)
                  const actionUrl = getNotificationActionUrl(nextNotification)
                  if (actionUrl) router.push(actionUrl)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
