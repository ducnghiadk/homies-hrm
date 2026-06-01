// ============================================
// Offline Check-in Store (localStorage)
// Stores pending check-ins when offline, auto-syncs when online
// ============================================

import { checkinToday } from './mock-data-checkin'

const STORAGE_KEY = 'pending_checkins'

// ─── Types ───
export type PendingCheckin = {
  id: string
  user_id: string
  store_id: string
  date: string
  check_in_time: string
  check_in_latitude: number
  check_in_longitude: number
  check_in_distance_meters: number
  check_in_method: 'gps_offline'
  shift_id?: string
  shift_start_time?: string
  sync_status: 'pending' | 'synced' | 'needs_review'
  created_at: string
  client_time: string
}

let pendingIdCounter = 1

// ─── Read/Write localStorage ───
function readPending(): PendingCheckin[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writePending(items: PendingCheckin[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

// ─── API ───

/**
 * Save a check-in to localStorage when offline.
 */
export function saveOfflineCheckin(
  userId: string,
  storeId: string,
  lat: number,
  lng: number,
  distanceMeters: number,
  shiftId?: string,
  shiftStartTime?: string,
): PendingCheckin {
  const now = new Date()

  const record: PendingCheckin = {
    id: `offline-${Date.now()}-${pendingIdCounter++}`,
    user_id: userId,
    store_id: storeId,
    date: now.toISOString().split('T')[0],
    check_in_time: now.toISOString(),
    check_in_latitude: lat,
    check_in_longitude: lng,
    check_in_distance_meters: distanceMeters,
    check_in_method: 'gps_offline',
    shift_id: shiftId,
    shift_start_time: shiftStartTime,
    sync_status: 'pending',
    created_at: now.toISOString(),
    client_time: now.toISOString(),
  }

  const pending = readPending()
  pending.push(record)
  writePending(pending)

  return record
}

/**
 * Get all pending (unsynced) check-ins.
 */
export function getPendingCheckins(): PendingCheckin[] {
  return readPending().filter(r => r.sync_status === 'pending')
}

/**
 * Get count of pending check-ins for a specific user.
 */
export function getPendingCount(userId?: string): number {
  const pending = getPendingCheckins()
  if (!userId) return pending.length
  return pending.filter(r => r.user_id === userId).length
}

/**
 * Sync all pending check-ins to the main store.
 * Returns number of successfully synced records.
 */
export function syncPendingCheckins(): { synced: number; needsReview: number } {
  const pending = readPending()
  let synced = 0
  let needsReview = 0

  const serverTime = new Date()

  const updated = pending.map(record => {
    if (record.sync_status !== 'pending') return record

    // Check time drift (> 5 minutes difference)
    const clientTime = new Date(record.client_time)
    const driftMs = Math.abs(serverTime.getTime() - clientTime.getTime())
    const driftMinutes = driftMs / 60000

    if (driftMinutes > 5) {
      // Mark for HR review
      record.sync_status = 'needs_review'
      needsReview++
      return record
    }

    try {
      // Sync to main store
      checkinToday(
        record.user_id,
        record.store_id,
        record.check_in_latitude,
        record.check_in_longitude,
        record.check_in_distance_meters,
        record.shift_id,
        record.shift_start_time,
      )
      record.sync_status = 'synced'
      synced++
    } catch {
      // Keep as pending on failure
    }

    return record
  })

  // Remove synced records, keep pending and needs_review
  const remaining = updated.filter(r => r.sync_status !== 'synced')
  writePending(remaining)

  return { synced, needsReview }
}

/**
 * Clear all synced/reviewed records.
 */
export function clearSyncedRecords() {
  const pending = readPending()
  writePending(pending.filter(r => r.sync_status === 'pending'))
}

/**
 * Manual retry sync for a specific record.
 */
export function retrySyncRecord(recordId: string): boolean {
  const pending = readPending()
  const record = pending.find(r => r.id === recordId)
  if (!record) return false

  try {
    checkinToday(
      record.user_id,
      record.store_id,
      record.check_in_latitude,
      record.check_in_longitude,
      record.check_in_distance_meters,
      record.shift_id,
      record.shift_start_time,
    )
    // Remove from pending
    writePending(pending.filter(r => r.id !== recordId))
    return true
  } catch {
    return false
  }
}
