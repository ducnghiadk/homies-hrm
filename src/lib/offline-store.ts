
// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SyncOperationType =
  | 'checkin'
  | 'leave_request'
  | 'swap_request'
  | 'task_complete'
  | 'kpi_feedback'
  | 'recognition'

type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'needs_review'

export type SyncOperation = {
  id: string
  type: SyncOperationType
  payload: Record<string, unknown>
  status: SyncStatus
  createdAt: string
  syncedAt?: string
  retryCount: number
  errorMessage?: string
  userId: string
  storeId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE KEYS
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  OPERATIONS: 'offline_operations',
  LAST_SYNC: 'offline_last_sync',
  DEVICE_ID: 'offline_device_id',
  USER_DATA: 'offline_user_data',
  SETTINGS: 'offline_settings',
  CACHED_DATA: 'offline_cached_data',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
  return `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE STORAGE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function saveOperation(operation: Omit<SyncOperation, 'id' | 'status' | 'createdAt' | 'retryCount'>): SyncOperation {
  const operations = getOperations()
  
  const newOperation: SyncOperation = {
    ...operation,
    id: generateId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }
  
  operations.push(newOperation)
  saveOperations(operations)
  
  console.log(`[Offline] Saved operation: ${operation.type}`, newOperation)
  
  return newOperation
}

export function getOperations(): SyncOperation[] {
  if (typeof window === 'undefined') return []
  
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPERATIONS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveOperations(operations: SyncOperation[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(operations))
}

export function updateOperation(id: string, updates: Partial<SyncOperation>): SyncOperation | null {
  const operations = getOperations()
  const index = operations.findIndex(op => op.id === id)
  
  if (index === -1) return null
  
  operations[index] = { ...operations[index], ...updates }
  saveOperations(operations)
  
  return operations[index]
}

export function deleteOperation(id: string): boolean {
  const operations = getOperations()
  const filtered = operations.filter(op => op.id !== id)
  
  if (filtered.length === operations.length) return false
  
  saveOperations(filtered)
  return true
}

export function clearSyncedOperations(): void {
  const operations = getOperations()
  const pending = operations.filter(op => op.status === 'pending' || op.status === 'failed')
  saveOperations(pending)
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS & COUNTS
// ─────────────────────────────────────────────────────────────────────────────

export function getPendingCount(): number {
  return getOperations().filter(op => op.status === 'pending').length
}

export function getPendingByType(type: SyncOperationType): SyncOperation[] {
  return getOperations().filter(op => op.type === type && op.status === 'pending')
}

export function getStats(): {
  total: number
  pending: number
  synced: number
  failed: number
  needsReview: number
} {
  const operations = getOperations()
  return {
    total: operations.length,
    pending: operations.filter(op => op.status === 'pending').length,
    synced: operations.filter(op => op.status === 'synced').length,
    failed: operations.filter(op => op.status === 'failed').length,
    needsReview: operations.filter(op => op.status === 'needs_review').length,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

type SyncResult = {
  success: boolean
  synced: number
  failed: number
  needsReview: number
}

/**
 * Main sync function - processes all pending operations
 */
export async function syncAllOperations(): Promise<SyncResult> {
  const operations = getOperations()
  const pending = operations.filter(op => op.status === 'pending')
  
  let synced = 0
  let failed = 0
  let needsReview = 0
  
  for (const operation of pending) {
    // Mark as syncing
    updateOperation(operation.id, { status: 'syncing' })
    
    try {
      const result = await syncSingleOperation(operation)
      
      if (result.success) {
        updateOperation(operation.id, {
          status: result.needsReview ? 'needs_review' : 'synced',
          syncedAt: new Date().toISOString(),
        })
        
        if (result.needsReview) {
          needsReview++
        } else {
          synced++
        }
      } else {
        updateOperation(operation.id, {
          status: 'failed',
          retryCount: operation.retryCount + 1,
          errorMessage: result.error,
        })
        failed++
      }
    } catch (error) {
      updateOperation(operation.id, {
        status: 'failed',
        retryCount: operation.retryCount + 1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      failed++
    }
  }
  
  // Update last sync time
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
  
  // Clean up synced records
  clearSyncedOperations()
  
  console.log(`[Sync] Completed: ${synced} synced, ${failed} failed, ${needsReview} need review`)
  
  return { success: failed === 0, synced, failed, needsReview }
}

/**
 * Sync a single operation
 */
async function syncSingleOperation(operation: SyncOperation): Promise<{
  success: boolean
  needsReview: boolean
  error?: string
}> {
  // Check time drift (operations older than 30 minutes need review)
  const createdAt = new Date(operation.createdAt)
  const now = new Date()
  const driftMinutes = (now.getTime() - createdAt.getTime()) / 60000
  
  const needsReview = driftMinutes > 30
  
  // Simulate API call based on operation type
  // In production, this would call actual APIs
  try {
    await simulateApiCall(operation)
    return { success: true, needsReview }
  } catch (error) {
    return {
      success: false,
      needsReview: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    }
  }
}

/**
 * Simulate API call (mock)
 */
async function simulateApiCall(_operation: SyncOperation): Promise<void> {
  void _operation
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // In production, this would be actual API calls:
  // switch (operation.type) {
  //   case 'checkin':
  //     await api.post('/checkin', operation.payload)
  //     break
  //   case 'leave_request':
  //     await api.post('/leave', operation.payload)
  //     break
  //   // etc.
  // }
}

/**
 * Retry failed operations
 */
export async function retryFailedOperations(): Promise<SyncResult> {
  const operations = getOperations()
  const failed = operations.filter(op => op.status === 'failed' && op.retryCount < 3)
  
  // Reset status to pending for retry
  failed.forEach(op => {
    updateOperation(op.id, { status: 'pending' })
  })
  
  // Then sync all
  return syncAllOperations()
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHED DATA HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cache user data for offline access
 */
export function cacheUserData(key: string, data: unknown): void {
  if (typeof window === 'undefined') return
  
  try {
    const cached = getCachedData()
    cached[key] = {
      data,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(cached))
  } catch (e) {
    console.error('[Offline] Failed to cache user data:', e)
  }
}

export function getCachedUserData<T>(key: string, maxAgeMinutes = 60): T | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = getCachedData()
    const entry = cached[key]
    
    if (!entry) return null
    
    const cachedAt = new Date(entry.timestamp)
    const now = new Date()
    const ageMinutes = (now.getTime() - cachedAt.getTime()) / 60000
    
    if (ageMinutes > maxAgeMinutes) return null
    
    return entry.data as T
  } catch {
    return null
  }
}

interface CachedEntry {
  data: unknown
  timestamp: string
}

function getCachedData(): Record<string, CachedEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_DATA)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAST SYNC TIME
// ─────────────────────────────────────────────────────────────────────────────

export function getLastSyncTime(): Date | null {
  if (typeof window === 'undefined') return null
  
  const raw = localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
  return raw ? new Date(raw) : null
}

export function getLastSyncTimeAgo(): string {
  const lastSync = getLastSyncTime()
  if (!lastSync) return 'Chưa bao giờ'
  
  const now = new Date()
  const diffMs = now.getTime() - lastSync.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  return `${diffDays} ngày trước`
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const offlineStoreExports = {
  saveOperation,
  getOperations,
  getPendingCount,
  getPendingByType,
  getStats,
  syncAllOperations,
  retryFailedOperations,
  cacheUserData,
  getCachedUserData,
  getLastSyncTime,
  getLastSyncTimeAgo,
}

export default offlineStoreExports
