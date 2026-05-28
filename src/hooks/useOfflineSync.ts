'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import {
  saveOperation,
  getPendingCount,
  getStats,
  syncAllOperations,
  retryFailedOperations,
  getLastSyncTimeAgo,
  type SyncOperationType,
} from '@/lib/offline-store'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type SyncState = 'idle' | 'syncing' | 'success' | 'error'

type UseOfflineSyncReturn = {
  isOnline: boolean
  pendingCount: number
  stats: ReturnType<typeof getStats>
  syncState: SyncState
  lastSyncAgo: string
  lastError: string | null
  
  // Actions
  queueOperation: (type: SyncOperationType, payload: Record<string, unknown>, userId: string, storeId: string) => void
  manualSync: () => Promise<void>
  retrySync: () => Promise<void>
  clearPending: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useOfflineSync(
  userId?: string,
  storeId?: string,
  autoSync = true,
  autoSyncIntervalMs = 30000
): UseOfflineSyncReturn {
  const isOnline = useNetworkStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [stats, setStats] = useState<ReturnType<typeof getStats>>({
    total: 0,
    pending: 0,
    synced: 0,
    failed: 0,
    needsReview: 0,
  })
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [lastSyncAgo, setLastSyncAgo] = useState('Chưa bao giờ')
  const [lastError, setLastError] = useState<string | null>(null)
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSyncingRef = useRef(false)

  // Update counts
  const updateCounts = useCallback(() => {
    setPendingCount(getPendingCount())
    setStats(getStats())
    setLastSyncAgo(getLastSyncTimeAgo())
  }, [])

  // Sync function
  const performSync = useCallback(async () => {
    if (isSyncingRef.current || !isOnline) return
    
    isSyncingRef.current = true
    setSyncState('syncing')
    setLastError(null)

    try {
      const result = await syncAllOperations()
      
      updateCounts()

      if (result.synced > 0) {
        setSyncState('success')
        toast.success(`Đã đồng bộ ${result.synced} tác vụ!`)
        
        if (result.needsReview > 0) {
          toast.warning(`${result.needsReview} tác vụ cần xem xét lại`)
        }
      }

      if (result.failed > 0) {
        setSyncState('error')
        setLastError(`${result.failed} tác vụ thất bại`)
        toast.error(`${result.failed} tác vụ không thể đồng bộ`)
      }

      // Reset state after showing feedback
      setTimeout(() => {
        if (syncState !== 'syncing') {
          setSyncState('idle')
        }
      }, 3000)

    } catch (error) {
      setSyncState('error')
      setLastError(error instanceof Error ? error.message : 'Sync failed')
      toast.error('Đồng bộ thất bại')
    } finally {
      isSyncingRef.current = false
    }
  }, [isOnline, updateCounts, syncState])

  // Queue operation
  const queueOperation = useCallback((
    type: SyncOperationType,
    payload: Record<string, unknown>,
    opUserId: string,
    opStoreId: string
  ) => {
    saveOperation({
      type,
      payload,
      userId: opUserId,
      storeId: opStoreId,
    })
    
    updateCounts()

    // Try to sync immediately if online
    if (isOnline) {
      performSync()
    } else {
      toast.info('Đã lưu offline, sẽ đồng bộ khi có mạng')
    }
  }, [isOnline, performSync, updateCounts])

  // Manual sync
  const manualSync = useCallback(async () => {
    if (!isOnline) {
      toast.error('Không có kết nối mạng')
      return
    }
    await performSync()
  }, [isOnline, performSync])

  // Retry failed
  const retrySync = useCallback(async () => {
    const result = await retryFailedOperations()
    updateCounts()
    
    if (result.success) {
      toast.success('Đã thử lại đồng bộ thành công!')
    } else {
      toast.error('Vẫn còn tác vụ thất bại')
    }
  }, [updateCounts])

  // Clear pending
  const clearPending = useCallback(() => {
    // This would need implementation in offline-store
    updateCounts()
  }, [updateCounts])

  // Auto-sync setup
  useEffect(() => {
    if (autoSync && isOnline) {
      // Initial sync
      performSync()

      // Setup interval
      syncIntervalRef.current = setInterval(() => {
        if (isOnline && pendingCount > 0) {
          performSync()
        }
      }, autoSyncIntervalMs)

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current)
        }
      }
    }
  }, [autoSync, isOnline, autoSyncIntervalMs, pendingCount, performSync])

  // Update counts on mount and when operations change
  useEffect(() => {
    updateCounts()
  }, [updateCounts])

  return {
    isOnline,
    pendingCount,
    stats,
    syncState,
    lastSyncAgo,
    lastError,
    queueOperation,
    manualSync,
    retrySync,
    clearPending,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIZED HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for check-in offline mode
 */
export function useOfflineCheckin(userId: string, storeId: string) {
  const { isOnline, pendingCount, queueOperation, syncState, lastSyncAgo } = useOfflineSync(
    userId,
    storeId
  )

  const saveCheckin = useCallback(
    (payload: {
      latitude: number
      longitude: number
      distanceMeters: number
      shiftId?: string
      shiftStartTime?: string
    }) => {
      queueOperation('checkin', {
        user_id: userId,
        store_id: storeId,
        check_in_time: new Date().toISOString(),
        check_in_method: isOnline ? 'gps' : 'gps_offline',
        ...payload,
      }, userId, storeId)
    },
    [queueOperation, userId, storeId, isOnline]
  )

  return {
    isOnline,
    pendingCount,
    saveCheckin,
    syncState,
    lastSyncAgo,
  }
}

/**
 * Hook for leave request offline mode
 */
export function useOfflineLeave(userId: string, storeId: string) {
  const { isOnline, pendingCount, queueOperation, syncState, lastSyncAgo } = useOfflineSync(
    userId,
    storeId
  )

  const saveLeaveRequest = useCallback(
    (payload: {
      leave_type: string
      start_date: string
      end_date: string
      reason: string
    }) => {
      queueOperation('leave_request', {
        user_id: userId,
        store_id: storeId,
        submitted_at: new Date().toISOString(),
        ...payload,
      }, userId, storeId)
    },
    [queueOperation, userId, storeId]
  )

  return {
    isOnline,
    pendingCount,
    saveLeaveRequest,
    syncState,
    lastSyncAgo,
  }
}

/**
 * Hook for task completion offline mode
 */
export function useOfflineTask(userId: string, storeId: string) {
  const { isOnline, pendingCount, queueOperation, syncState, lastSyncAgo } = useOfflineSync(
    userId,
    storeId
  )

  const saveTaskComplete = useCallback(
    (payload: {
      task_id: string
      completed_at: string
      notes?: string
    }) => {
      queueOperation('task_complete', {
        user_id: userId,
        store_id: storeId,
        ...payload,
      }, userId, storeId)
    },
    [queueOperation, userId, storeId]
  )

  return {
    isOnline,
    pendingCount,
    saveTaskComplete,
    syncState,
    lastSyncAgo,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export default useOfflineSync
