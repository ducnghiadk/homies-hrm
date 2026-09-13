// =============================================
// useNotifications — Hook để đọc notification từ store
// =============================================

'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  seedDemoNotifications,
  type Notification,
} from '@/lib/notifications/notification-center'

function buildNotificationState(userId: string | undefined) {
  if (!userId) {
    return {
      notifications: [] as Notification[],
      unreadCount: 0,
    }
  }

  seedDemoNotifications(userId)

  return {
    notifications: getNotificationsForUser(userId),
    unreadCount: getUnreadCount(userId),
  }
}

export function useNotifications(userId: string | undefined) {
  const [refreshKey, setRefreshKey] = useState(0)
  const state = useMemo(() => {
    void refreshKey
    return buildNotificationState(userId)
  }, [userId, refreshKey])

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  const handleMarkAsRead = useCallback((id: string) => {
    if (!userId) return
    markAsRead(id)
    refresh()
  }, [refresh, userId])

  const handleMarkAllAsRead = useCallback(() => {
    if (!userId) return
    markAllAsRead(userId)
    refresh()
  }, [refresh, userId])

  const handleDelete = useCallback((id: string) => {
    if (!userId) return
    deleteNotification(id)
    refresh()
  }, [refresh, userId])

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
    refresh,
  }
}
