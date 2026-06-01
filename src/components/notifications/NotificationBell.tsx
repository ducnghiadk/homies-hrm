'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Trash2, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { getNotificationActionUrl, type Notification } from '@/lib/notifications/notification-center'

const typeConfig: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  swap_request:           { emoji: '🔄', label: 'Yêu cầu đổi ca', color: '#2F6FA8', bg: '#DBEAFE' },
  swap_accepted:          { emoji: '✅', label: 'Đồng ý đổi ca', color: '#1E9E57', bg: '#D1FAE5' },
  swap_rejected:          { emoji: '❌', label: 'Từ chối đổi ca', color: '#D9381E', bg: '#FEE2E2' },
  swap_cancelled:         { emoji: 'ℹ️', label: 'Đã hủy yêu cầu', color: '#6B7280', bg: '#F3F4F6' },
  swap_approved:          { emoji: '✅', label: 'Đổi ca được duyệt', color: '#1E9E57', bg: '#D1FAE5' },
  swap_rejected_by_manager:{ emoji: '❌', label: 'Bị từ chối', color: '#D9381E', bg: '#FEE2E2' },
  open_shift_posted:       { emoji: '🆕', label: 'Ca trống mới', color: '#F6C85F', bg: '#FFF8E8' },
  open_shift_claim_submitted:{ emoji: '📋', label: 'Đăng ký ca trống', color: '#2F6FA8', bg: '#DBEAFE' },
  open_shift_claim_approved: { emoji: '✅', label: 'Đăng ký được duyệt', color: '#1E9E57', bg: '#D1FAE5' },
  open_shift_claim_rejected: { emoji: '❌', label: 'Bị từ chối', color: '#D9381E', bg: '#FEE2E2' },
  schedule_published:     { emoji: '📅', label: 'Lịch xuất bản', color: '#001D3D', bg: '#EDE9FE' },
  preference_reminder:    { emoji: '🗓️', label: 'Nhắc đăng ký ca', color: '#F6C85F', bg: '#FFF8E8' },
  system:                  { emoji: '⚙️', label: 'Hệ thống', color: '#6B7280', bg: '#F3F4F6' },
}

function NotificationItem({ notif, onRead, onDelete, onOpen }: {
  notif: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onOpen: (notif: Notification) => void
}) {
  const config = typeConfig[notif.type] || typeConfig.system
  const isUnread = notif.status === 'unread'
  const actionUrl = getNotificationActionUrl(notif)

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl transition-all group ${
        isUnread ? 'bg-primary-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ backgroundColor: config.bg }}>
        {config.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs font-bold truncate ${isUnread ? 'text-dark-700' : 'text-gray-500'}`}>
            {notif.title}
          </p>
          <span className="text-[9px] text-gray-300 shrink-0">
            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
          {notif.message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2">
          {isUnread && (
            <button
              onClick={() => onRead(notif.id)}
              className="text-[9px] text-primary-500 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
            >
              <CheckCheck size={10} /> Đánh dấu đã đọc
            </button>
          )}
          {actionUrl && (
            <button
              onClick={() => onOpen(notif)}
              className="text-[9px] text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronRight size={10} /> Mở
            </button>
          )}
          <button
            onClick={() => onDelete(notif.id)}
            className="text-[9px] text-gray-300 hover:text-error-400 flex items-center gap-1 transition-colors ml-2"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  )
}

interface NotificationBellProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
}

export default function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationBellProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const handleOpenNotification = (notification: Notification) => {
    const actionUrl = getNotificationActionUrl(notification)
    if (!actionUrl) return

    onMarkAsRead(notification.id)
    setIsOpen(false)
    router.push(actionUrl)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-95"
      >
        <Bell size={18} className="text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-dark-700">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-error-50 text-error-500">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-[10px] text-primary-500 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <CheckCheck size={11} /> Đọc hết
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
                  <Bell size={20} className="text-gray-200" />
                </div>
                <p className="text-xs text-gray-400">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onRead={onMarkAsRead}
                  onDelete={onDelete}
                  onOpen={handleOpenNotification}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <button className="text-[10px] text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 mx-auto">
                Xem tất cả <ChevronRight size={10} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
