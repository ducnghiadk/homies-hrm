'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuthStore } from '@/store/auth-store'
import AppShell from '@/components/layout/AppShell'
import { getShiftById, type Attendance, type Schedule } from '@/lib/mock-data'
import { saveOfflineCheckin, syncPendingCheckins, getPendingCount } from '@/lib/offline-checkin'
import { isEmployeeOnLeave } from '@/lib/leave-attendance-sync'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { calculateDistance, formatTime } from '@/lib/utils'
import { storeAdapter, type StoreWithWifi } from '@/lib/adapters/store-adapter'
import confetti from 'canvas-confetti'
import {
  ArrowLeft, Clock, Navigation, AlertTriangle,
  CheckCircle2, LogIn, LogOut, Loader2, WifiOff, CloudOff, Wifi,
  QrCode, ScanLine, Camera, X,
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ScheduleService } from '@/lib/services/schedule-service'
import { AttendanceService } from '@/lib/services/attendance-service'

// Dynamically import Leaflet map (no SSR — uses window)
const CheckinMap = dynamic(() => import('@/components/checkin/CheckinMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-primary-50 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-gray-400" />
    </div>
  ),
})

type PageStatus = 'locating' | 'gps_error' | 'in_range' | 'out_range' | 'checked_in' | 'checked_out'
type ToastTone = 'default' | 'success' | 'warning' | 'error'
type CheckinMethod = 'gps' | 'thu_cong'

const TOAST_TONE_CLASS: Record<ToastTone, string> = {
  default: 'bg-dark-700 text-white',
  success: 'bg-success-600 text-white',
  warning: 'bg-warning-100 text-warning-900 border border-warning-300',
  error: 'bg-error-600 text-white',
}

function toMinutes(value?: string): number | null {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function isScheduleActive(schedule: { shift_id: string }, nowMinutes: number): boolean {
  const shift = getShiftById(schedule.shift_id)
  const start = toMinutes(shift?.start_time)
  const end = toMinutes(shift?.end_time)
  if (start === null || end === null) return false
  if (end <= start) return nowMinutes >= start || nowMinutes < end
  return nowMinutes >= start && nowMinutes < end
}

export default function CheckInPage() {
  return (
    <ProtectedRoute>
      <CheckInPageContent />
    </ProtectedRoute>
  )
}

function CheckInPageContent() {
  const { user } = useAuthStore()
  const router = useRouter()
  const isOnline = useNetworkStatus()

  const currentUser = user!
  const [store, setStore] = useState<StoreWithWifi | null>(null)
  const [storeLoadMessage, setStoreLoadMessage] = useState('Đang tải thông tin cửa hàng...')
  const todayStr = new Date().toISOString().split('T')[0]

  const [apiTodaySchedule, setApiTodaySchedule] = useState<Schedule | null>(null)

  const publishedTodaySchedules = ScheduleService.getSchedulesForUser(currentUser, currentUser.id)
    .filter(s => s.status === 'published' || (s.status as string) === 'APPROVED')
    .filter(s => s.date === todayStr)
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes()
  const fallbackSchedule = publishedTodaySchedules.find(schedule => isScheduleActive(schedule, currentMinutes))
    || publishedTodaySchedules.find(schedule => {
      const start = toMinutes(getShiftById(schedule.shift_id)?.start_time)
      return start !== null && start > currentMinutes
    })
    || publishedTodaySchedules[0]
  const todaySchedule = apiTodaySchedule || fallbackSchedule
  const shift = todaySchedule ? getShiftById(todaySchedule.shift_id) : null

  const [checkinRecord, setCheckinRecord] = useState<Attendance | null>(() => {
    if (typeof window === 'undefined') return null
    AttendanceService.syncLiveCheckinsToMock()
    return AttendanceService.getTodayCheckin(currentUser.id, todaySchedule?.shift_id) || null
  })

  const [status, setStatus] = useState<PageStatus>(() => {
    if (typeof window === 'undefined') return 'locating'
    AttendanceService.syncLiveCheckinsToMock()
    const existing = AttendanceService.getTodayCheckin(currentUser.id, todaySchedule?.shift_id)
    if (existing) {
      return existing.check_out_time ? 'checked_out' : 'checked_in'
    }
    return 'locating'
  })

  // Gọi trực tiếp GET /api/shifts & GET /api/attendance để đồng bộ dữ liệu thật từ máy chủ
  useEffect(() => {
    if (!currentUser) return
    let active = true

    // 1. Nạp ca làm hôm nay trực tiếp từ máy chủ
    fetch(`/api/shifts?employee_id=${currentUser.id}&date=${todayStr}`)
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (!active) return
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const validShifts = json.data.filter((s: { status: string }) => s.status === 'APPROVED' || s.status?.toLowerCase() === 'published')
          if (validShifts.length > 0) {
            const first = validShifts[0]
            const mapped: Schedule = {
              id: first.id,
              org_id: 'org-001',
              store_id: first.store_id || currentUser.store_id,
              employee_id: first.employee_id,
              shift_id: first.shift_id,
              date: first.date,
              notes: first.notes || first.shift_name,
              status: 'published',
              updated_at: new Date().toISOString(),
            }
            setApiTodaySchedule(mapped)
          }
        }
      })
      .catch(e => console.warn('[CheckInPage] Lỗi tải ca từ /api/shifts:', e))

    // 2. Nạp trạng thái chấm công hôm nay trực tiếp từ máy chủ
    fetch(`/api/attendance?employee_id=${currentUser.id}&date=${todayStr}`)
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (!active) return
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const rec = json.data[0]
          const mappedAtt: Attendance = {
            id: rec.id,
            org_id: rec.org_id || 'org-001',
            employee_id: rec.employee_id,
            store_id: rec.store_id,
            shift_id: rec.shift_id || 'shift-001',
            date: rec.date,
            check_in_time: rec.check_in_time,
            check_out_time: rec.check_out_time,
            check_in_lat: rec.check_in_lat,
            check_in_lng: rec.check_in_lng,
            check_out_lat: rec.check_out_lat,
            check_out_lng: rec.check_out_lng,
            check_in_distance_meters: rec.check_in_distance_meters || 0,
            status: rec.status === 'late' ? 'late' : 'on_time',
            late_minutes: rec.late_minutes || 0,
            total_hours: rec.total_hours !== undefined ? Number(rec.total_hours) : 0,
            overtime_hours: rec.overtime_hours !== undefined ? Number(rec.overtime_hours) : 0,
            qr_code: rec.qr_code,
          }
          setCheckinRecord(mappedAtt)
          if (rec.check_out_time) {
            setStatus('checked_out')
          } else if (rec.check_in_time) {
            setStatus('checked_in')
          }
        }
      })
      .catch(e => console.warn('[CheckInPage] Lỗi tải chấm công từ /api/attendance:', e))

    return () => { active = false }
  }, [currentUser, todayStr])

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [toastTone, setToastTone] = useState<ToastTone>('default')

  const [pendingCount, setPendingCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return getPendingCount(currentUser.id)
  })
  const [isOfflineCheckin, setIsOfflineCheckin] = useState(false)
  const [checkinMethod, setCheckinMethod] = useState<CheckinMethod | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const gpsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevOnlineRef = useRef(true)

  const noSchedule = !todaySchedule
  const targetStoreId = todaySchedule?.store_id || currentUser.store_id

  useEffect(() => {
    let active = true
    const storeId = targetStoreId
    if (!storeId) {
      setTimeout(() => {
        if (!active) return
        setStore(null)
        setStoreLoadMessage('Nhân viên chưa có cua_hang_id nên chưa xác định được cửa hàng.')
        setStatus('gps_error')
      }, 0)
      return
    }

    storeAdapter.getStoreById(storeId)
      .then(result => {
        if (!active) return
        if (!result) {
          setStore(null)
          setStoreLoadMessage(`Không tìm thấy cửa hàng với cua_hang_id: ${storeId}`)
          setStatus('gps_error')
          return
        }
        setStore(result)
        setStoreLoadMessage('')
      })
      .catch(error => {
        if (!active) return
        setStore(null)
        setStoreLoadMessage(`Lỗi query cửa hàng: ${error instanceof Error ? error.message : 'Không rõ lý do'}`)
        setStatus('gps_error')
      })

    return () => {
      active = false
    }
  }, [targetStoreId])

  const gpsInRange = userPos !== null && distance !== null && store ? distance <= store.checkin_radius_meters : false
  const canCheckin = !!store

  // GPS location tracking
  const startGPS = useCallback(() => {
    if (!store) return
    if (gpsTimeoutRef.current !== null) {
      clearTimeout(gpsTimeoutRef.current)
      gpsTimeoutRef.current = null
    }

    if (!navigator.geolocation) {
      setStatus('gps_error')
      return
    }

    setStatus('locating')
    gpsTimeoutRef.current = setTimeout(() => {
      setStatus(prev => prev === 'locating' ? 'gps_error' : prev)
      gpsTimeoutRef.current = null
    }, 10000)

    const onSuccess = (pos: GeolocationPosition) => {
      if (gpsTimeoutRef.current !== null) {
        clearTimeout(gpsTimeoutRef.current)
        gpsTimeoutRef.current = null
      }
      const { latitude, longitude } = pos.coords
      setUserPos({ lat: latitude, lng: longitude })

      if (store) {
        const dist = calculateDistance(latitude, longitude, store.latitude, store.longitude)
        const distRounded = Math.round(dist)
        setDistance(distRounded)

        // Only update range status if not already checked in/out
        const existing = AttendanceService.getTodayCheckin(currentUser.id, todaySchedule?.shift_id)
        if (!existing) {
          setStatus(distRounded <= store.checkin_radius_meters ? 'in_range' : 'out_range')
        }
      }
    }

    const onError = () => {
      if (gpsTimeoutRef.current !== null) {
        clearTimeout(gpsTimeoutRef.current)
        gpsTimeoutRef.current = null
      }
      setStatus('gps_error')
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })

    // Watch for updates
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    })
  }, [store, currentUser.id, todaySchedule?.shift_id, setStatus, setUserPos, setDistance])

  useEffect(() => {
    // Don't start GPS if already checked in/out
    const existing = AttendanceService.getTodayCheckin(currentUser.id, todaySchedule?.shift_id)
    let active = true
    if (!existing && store) {
      setTimeout(() => {
        if (active) startGPS()
      }, 0)
    }
    return () => {
      active = false
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (gpsTimeoutRef.current !== null) {
        clearTimeout(gpsTimeoutRef.current)
        gpsTimeoutRef.current = null
      }
    }
  }, [startGPS, currentUser.id, todaySchedule?.shift_id, store])

  // ─── Auto-sync when back online ───
  useEffect(() => {
    if (isOnline && !prevOnlineRef.current) {
      // Just came back online — sync pending
      void syncPendingCheckins().then(result => {
        if (result.synced > 0) {
          setTimeout(() => {
            setToastTone('success')
            setToast(`Đã đồng bộ ${result.synced} chấm công`)
            setPendingCount(getPendingCount(currentUser.id))
            const existing = AttendanceService.getTodayCheckin(currentUser.id, todaySchedule?.shift_id)
            if (existing) {
              setCheckinRecord(existing)
              setStatus(existing.check_out_time ? 'checked_out' : 'checked_in')
            }
            setTimeout(() => setToast(null), 3000)
          }, 0)
        }
        if (result.needsReview > 0) {
          setTimeout(() => {
            setToastTone('warning')
            setToast(`${result.needsReview} chấm công cần HR review (chênh lệch thời gian)`)
            setTimeout(() => setToast(null), 4000)
          }, result.synced > 0 ? 3500 : 0)
        }
      })
    }
    prevOnlineRef.current = isOnline
  }, [isOnline, currentUser.id, todaySchedule?.shift_id])

  // ─── Check-in handler ───
  const getAttendanceDecision = () => {
    if (gpsInRange && distance !== null) {
      return {
        method: 'gps' as const,
        distanceMeters: distance,
        ghiChuViTri: undefined,
      }
    }

    const roundedDistance = distance === null ? null : Math.round(distance)
    return {
      method: 'thu_cong' as const,
      distanceMeters: roundedDistance ?? (store ? store.checkin_radius_meters + 1 : 0),
      ghiChuViTri: roundedDistance === null ? 'Không có GPS' : `Ngoài vùng: cách ${roundedDistance}m`,
    }
  }

  const confirmManualAttendance = (actionLabel: string) => {
    const locationDetail = distance === null
      ? 'Không có GPS.'
      : `Khoảng cách thực tế: ${Math.round(distance)}m.`
    return window.confirm(`${actionLabel} chưa được xác minh bằng GPS.\n${locationDetail}\nCa này sẽ cần quản lý duyệt`)
  }

  const handleCheckin = async () => {
    if (!store) {
      setToastTone('error')
      setToast(storeLoadMessage || 'Chưa có thông tin cửa hàng để check-in.')
      setTimeout(() => setToast(null), 4000)
      return
    }

    // ── Validate leave status ──
    const leaveStatus = isEmployeeOnLeave(currentUser.id, todayStr)
    if (leaveStatus.onLeave) {
      setToast(`Không thể check-in: Bạn đang nghỉ phép (${leaveStatus.leaveType || 'leave'})`)
      setTimeout(() => setToast(null), 4000)
      return
    }

    const decision = getAttendanceDecision()
    if (decision.method === 'thu_cong' && !confirmManualAttendance('Check-in')) {
      return
    }
    setCheckinMethod(decision.method)

    const timeStr = formatTime(new Date())

    if (isOnline) {
      // ── Online: write directly ──
      const result = await AttendanceService.checkinToday(
        currentUser.id,
        targetStoreId,
        userPos?.lat,
        userPos?.lng,
        decision.distanceMeters,
        shift?.id,
        shift?.start_time,
        { waitForDb: true, phuongThucCheckIn: decision.method, ghiChuViTri: decision.ghiChuViTri },
      )
      if (result.trangThai === 'that_bai' || !result.record) {
        setToastTone('error')
        setToast(`Check-in THẤT BẠI, chưa được ghi nhận.${result.loi ? ` ${result.loi}` : ''}`)
        setTimeout(() => setToast(null), 4000)
        return
      }
      const record = result.record
      setCheckinRecord(record)
      setStatus('checked_in')
      setIsOfflineCheckin(result.trangThai === 'chi_luu_may')

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3971B8', '#C8D69B', '#F6E6A5', '#1E9E57'],
      })

      setToastTone(result.trangThai === 'da_luu_db' ? 'success' : 'warning')
      setToast(
        result.trangThai === 'da_luu_db'
          ? `Đã check-in lúc ${timeStr}${decision.method === 'thu_cong' ? ' (Chờ quản lý duyệt)' : ''}`
          : 'Đã lưu tạm trên máy, CHƯA vào hệ thống. Sẽ tự gửi lại khi có mạng.'
      )
      setTimeout(() => {
        setToast(null)
        router.push('/')
      }, 2500)
    } else {
      // ── Offline: save to localStorage ──
      saveOfflineCheckin(
        currentUser.id,
        targetStoreId,
        userPos?.lat ?? 0,
        userPos?.lng ?? 0,
        decision.distanceMeters,
        shift?.id,
        shift?.start_time,
      )
      setStatus('checked_in')
      setIsOfflineCheckin(true)
      setPendingCount(getPendingCount(currentUser.id))

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F6C85F', '#d97706', '#fbbf24'],
      })

      setToastTone('warning')
      setToast('Đã lưu tạm trên máy, CHƯA vào hệ thống. Sẽ tự gửi lại khi có mạng.')
      setTimeout(() => {
        setToast(null)
        router.push('/')
      }, 3000)
    }
  }

  // ─── QR Code Check-in handler (Fallback chống GPS yếu / treo) ───
  const handleQrCheckin = async (qrCodeVal?: string) => {
    if (!store) {
      setToastTone('error')
      setToast('Chưa có thông tin cửa hàng để quét QR.')
      setTimeout(() => setToast(null), 3000)
      return
    }

    const leaveStatus = isEmployeeOnLeave(currentUser.id, todayStr)
    if (leaveStatus.onLeave) {
      setToast(`Không thể check-in: Bạn đang nghỉ phép (${leaveStatus.leaveType || 'leave'})`)
      setTimeout(() => setToast(null), 4000)
      return
    }

    setShowQrModal(false)
    setCheckinMethod('gps')
    const timeStr = formatTime(new Date())
    const qrIdentifier = qrCodeVal || `HOMIES-${store.id.toUpperCase()}-POS`

    if (isOnline) {
      const result = await AttendanceService.checkinToday(
        currentUser.id,
        targetStoreId,
        store.latitude,
        store.longitude,
        0, // Coi như tại quầy
        shift?.id,
        shift?.start_time,
        {
          waitForDb: true,
          phuongThucCheckIn: 'gps',
          ghiChuViTri: `Quét QR quầy thu ngân: ${qrIdentifier}`,
        },
      )
      if (result.trangThai === 'that_bai' || !result.record) {
        setToastTone('error')
        setToast(`Check-in QR thất bại.${result.loi ? ` ${result.loi}` : ''}`)
        setTimeout(() => setToast(null), 4000)
        return
      }

      setCheckinRecord(result.record)
      setStatus('checked_in')
      setIsOfflineCheckin(result.trangThai === 'chi_luu_may')

      confetti({
        particleCount: 140,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#2F6FA8', '#F6C85F', '#1E9E57'],
      })

      setToastTone('success')
      setToast(`✓ Đã xác thực có mặt bằng QR quầy thu ngân lúc ${timeStr}`)
      setTimeout(() => {
        setToast(null)
        router.push('/')
      }, 2500)
    } else {
      saveOfflineCheckin(
        currentUser.id,
        targetStoreId,
        store.latitude,
        store.longitude,
        0,
        shift?.id,
        shift?.start_time,
      )
      setStatus('checked_in')
      setIsOfflineCheckin(true)
      setPendingCount(getPendingCount(currentUser.id))

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F6C85F', '#d97706'],
      })

      setToastTone('warning')
      setToast(`Đã lưu xác thực QR offline lúc ${timeStr}, sẽ gửi lại khi có mạng.`)
      setTimeout(() => {
        setToast(null)
        router.push('/')
      }, 3000)
    }
  }

  // ─── Check-out handler ───
  const handleCheckout = async () => {
    if (!store) return

    const decision = getAttendanceDecision()
    if (decision.method === 'thu_cong' && !confirmManualAttendance('Check-out')) {
      return
    }

    try {
      // Gọi trực tiếp POST /api/attendance với trạng thái check_out lên máy chủ
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: currentUser.id,
          employee_name: currentUser.full_name,
          store_id: store.id,
          store_name: store.name,
          status: 'check_out',
          action: 'check_out',
          check_out_time: new Date().toISOString(),
          check_out_lat: userPos?.lat || store.latitude,
          check_out_lng: userPos?.lng || store.longitude,
          date: todayStr,
          shift_id: shift?.id,
          shift_end_time: shift?.end_time,
        }),
      })

      const resJson = await res.json()
      if (!res.ok || !resJson?.success) {
        setToastTone('error')
        setToast(`Check-out thất bại: ${resJson?.error || 'Lỗi kết nối máy chủ'}`)
        setTimeout(() => setToast(null), 4000)
        return
      }

      const recordData = resJson.data
      const updatedRecord: Attendance = {
        id: recordData?.id || checkinRecord?.id || `att-${Date.now()}`,
        org_id: 'org-001',
        employee_id: currentUser.id,
        store_id: store.id,
        shift_id: shift?.id,
        date: todayStr,
        check_in_time: recordData?.check_in_time || checkinRecord?.check_in_time || new Date().toISOString(),
        check_out_time: recordData?.check_out_time || new Date().toISOString(),
        check_in_lat: recordData?.check_in_lat || checkinRecord?.check_in_lat,
        check_in_lng: recordData?.check_in_lng || checkinRecord?.check_in_lng,
        check_out_lat: recordData?.check_out_lat || userPos?.lat,
        check_out_lng: recordData?.check_out_lng || userPos?.lng,
        status: recordData?.status || 'on_time',
        late_minutes: recordData?.late_minutes || 0,
        total_hours: recordData?.total_hours !== undefined ? Number(recordData.total_hours) : 8,
        overtime_hours: recordData?.overtime_hours !== undefined ? Number(recordData.overtime_hours) : 0,
      }

      setCheckinRecord(updatedRecord)
      setStatus('checked_out')

      // Đồng bộ dự phòng cho local storage nếu có
      try {
        AttendanceService.checkoutToday(
          currentUser.id,
          userPos?.lat,
          userPos?.lng,
          shift?.id,
        )
      } catch {}

      const totalH = Math.floor(updatedRecord.total_hours)
      const totalM = Math.round((updatedRecord.total_hours - totalH) * 60)
      setToastTone('success')
      setToast(
        resJson.message || `Đã ghi nhận tan ca thành công lên máy chủ — Tổng ${totalH} giờ ${totalM} phút`
      )
      setTimeout(() => {
        setToast(null)
        router.push('/')
      }, 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối máy chủ để ghi nhận tan ca.'
      setToastTone('error')
      setToast(`Check-out thất bại: ${msg}`)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <AppShell showNav={false} className="!max-w-none !px-0 !pt-0 h-screen overflow-hidden relative font-['Inter']">
      {/* ─── Map Background (top 50%) ─── */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-[55%]">
          {store && (
            <CheckinMap
              storePos={{ lat: store.latitude, lng: store.longitude }}
              userPos={userPos}
              radius={store.checkin_radius_meters}
              storeName={store.name}
            />
          )}
          {!store && (
            <div className="w-full h-full bg-primary-50 flex items-center justify-center">
              <p className="text-gray-400">{storeLoadMessage}</p>
            </div>
          )}
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none" />
      </div>

      {/* ─── Offline banner ─── */}
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 z-40 bg-warning-500 text-white text-xs font-medium text-center py-2 flex items-center justify-center gap-2 animate-fade-in">
          <WifiOff size={14} />
          Không có kết nối mạng — Offline mode
        </div>
      )}

      {/* ─── Header ─── */}
      <div className={`absolute left-0 right-0 z-30 p-4 flex justify-between items-center ${!isOnline ? 'top-8 pt-4' : 'top-0 pt-[calc(env(safe-area-inset-top)+16px)]'}`}>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-dark-700 hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-dark-700 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
          Chấm công
          {isOnline ? (
            <Wifi size={14} className="text-success-500" />
          ) : (
            <CloudOff size={14} className="text-warning-500" />
          )}
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* ─── Bottom Sheet ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-slide-up">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* ─── Shift info card ─── */}
        <div className="bg-vanilla-50 rounded-2xl p-4 mb-5">
          {shift ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${shift.color}20` }}>
                <Clock size={20} style={{ color: shift.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-dark-700">{shift.name}</p>
                <p className="text-xs text-gray-400">{shift.start_time} — {shift.end_time} • {store?.name}</p>
              </div>
              <div className="w-3 h-3 rounded-full" style={{ background: shift.color }} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                <AlertTriangle size={20} className="text-warning-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-700">Hôm nay bạn không có lịch</p>
                <p className="text-xs text-gray-400">Bạn vẫn có thể check-in</p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Phương thức xác nhận chấm công chuẩn F&B (GPS + QR Kiosk) ─── */}
        {status !== 'checked_in' && status !== 'checked_out' && (
          <div className="mb-4 space-y-3">
            <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs space-y-2.5">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Phương thức xác nhận chấm công</span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Bảo mật F&B</span>
              </p>

              {/* GPS status */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gpsInRange ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    <Navigation size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800">Định vị GPS</span>
                    <p className="text-[11px] text-gray-400">Bán kính cho phép &le; {store?.checkin_radius_meters || 100}m</p>
                  </div>
                </div>
                {gpsInRange ? (
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                    Hợp lệ ({distance}m) ✓
                  </span>
                ) : distance !== null ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                    Cách {distance}m
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Đang dò GPS...</span>
                )}
              </div>

              {/* QR Kiosk POS status */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2F6FA8] flex items-center justify-center">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800">Mã QR Kiosk quầy thu ngân</span>
                    <p className="text-[11px] text-gray-400">Đổi mã 30-60 giây chống gian lận</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="text-xs font-bold text-[#2F6FA8] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg transition-colors cursor-pointer active:scale-95"
                >
                  Quét QR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Status display ─── */}
        <div className="text-center mb-5 min-h-[48px] flex flex-col items-center justify-center">
          {status === 'locating' && (
            <div className="flex items-center gap-2 text-gray-500 animate-pulse">
              <Navigation size={18} className="animate-spin" />
              <span className="text-sm font-medium">Đang xác định vị trí...</span>
            </div>
          )}

          {status === 'gps_error' && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-error-500 font-medium">
                <WifiOff size={18} />
                <span className="text-sm">Không lấy được vị trí</span>
              </div>
              <p className="text-xs text-gray-400">Vui lòng bật GPS trong cài đặt</p>
            </div>
          )}

          {status === 'in_range' && (
            <div className="inline-flex items-center gap-2 bg-success-50 text-success-700 px-4 py-2 rounded-full text-sm font-semibold">
              <CheckCircle2 size={16} />
              Bạn đang trong cửa hàng ({distance}m)
            </div>
          )}

          {status === 'out_range' && (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-error-50 text-error-600 px-4 py-2 rounded-full text-sm font-semibold">
                <AlertTriangle size={16} />
                Bạn cách cửa hàng {distance}m
              </div>
              <p className="text-xs text-gray-400">
                Phạm vi cho phép: {store?.checkin_radius_meters}m
              </p>
            </div>
          )}

          {status === 'checked_in' && (checkinRecord?.check_in_time || isOfflineCheckin) && (
            <div className="space-y-1">
              {isOfflineCheckin ? (
                <>
                  <div className="inline-flex items-center gap-2 text-warning-600 font-semibold text-sm">
                    <CloudOff size={16} />
                    Check-in thành công (Chờ đồng bộ)
                  </div>
                  <p className="text-xs text-gray-400">Sẽ tự động đồng bộ khi có mạng</p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 text-primary-600 font-semibold text-sm">
                    <CheckCircle2 size={16} />
                    Đã check-in lúc {checkinRecord && formatTime(checkinRecord.check_in_time!)}{checkinMethod === 'thu_cong' && ' (Chờ quản lý duyệt)'}
                  </div>
                  {checkinRecord?.status === 'late' && (
                    <p className="text-xs text-warning-600">⚠️ Trễ {checkinRecord.late_minutes} phút</p>
                  )}
                </>
              )}
            </div>
          )}

          {status === 'checked_out' && checkinRecord && (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-gray-500 font-semibold text-sm">
                <CheckCircle2 size={16} />
                Đã hoàn thành ca
              </div>
              <p className="text-xs text-gray-400">
                {formatTime(checkinRecord.check_in_time!)} → {formatTime(checkinRecord.check_out_time!)}
                {' • '}
                Tổng {Math.floor(checkinRecord.total_hours)}h{Math.round((checkinRecord.total_hours - Math.floor(checkinRecord.total_hours)) * 60)}m
              </p>
            </div>
          )}
        </div>

        {/* ─── No schedule warning ─── */}
        {noSchedule && status !== 'checked_in' && status !== 'checked_out' && (
          <div className="bg-warning-50 border border-warning-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning-500 shrink-0" />
            <p className="text-xs text-warning-700">Bạn không có lịch hôm nay. Attendance sẽ được ghi với schedule_id = null.</p>
          </div>
        )}

        {/* ─── Action buttons ─── */}
        <div className="space-y-3">
          {/* CHECK-IN button */}
          {(status === 'in_range' || status === 'out_range') && (
            <button
              onClick={handleCheckin}
              disabled={!canCheckin}
              className={`w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg ${
                canCheckin && gpsInRange
                  ? 'bg-gradient-to-r from-[#3971B8] to-[#2A5A8F] text-white'
                  : canCheckin
                    ? 'bg-warning-500 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <LogIn size={24} />
              {gpsInRange ? 'CHECK-IN' : 'CHECK-IN (ngoài vùng - chờ duyệt)'}
            </button>
          )}

          {/* Locating / GPS Error */}
          {status === 'locating' && (
            <button
              onClick={handleCheckin}
              disabled={!canCheckin}
              className={`w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-transform ${
                canCheckin ? 'bg-warning-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <LogIn size={24} />
              CHECK-IN (không có GPS - chờ duyệt)
            </button>
          )}

          {status === 'gps_error' && (
            <button
              onClick={handleCheckin}
              disabled={!canCheckin}
              className="w-full py-4 rounded-2xl bg-warning-500 text-white text-lg font-bold flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-transform"
            >
              <LogIn size={24} />
              CHECK-IN (không có GPS - chờ duyệt)
            </button>
          )}

          {/* CHECK-OUT button */}
          {status === 'checked_in' && (
            <button
              onClick={handleCheckout}
              className="w-full py-4 rounded-2xl text-white text-lg font-bold flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #F6C85F, #d97706)' }}
            >
              <LogOut size={24} />
              CHECK-OUT
            </button>
          )}

          {/* Completed */}
          {status === 'checked_out' && (
            <button
              onClick={() => router.push('/')}
              className="w-full py-4 rounded-2xl bg-primary-50 text-gray-500 text-lg font-bold flex items-center justify-center gap-3"
            >
              <CheckCircle2 size={24} />
              Về trang chủ
            </button>
          )}

          {/* ─── QR Code Fallback Button ─── */}
          {status !== 'checked_in' && status !== 'checked_out' && (
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-full py-3 rounded-2xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <QrCode size={18} className="text-sky-600" />
              <span>Chấm công bằng QR Code (Dự phòng sóng yếu)</span>
            </button>
          )}
        </div>

        {/* Pending sync notice */}
        {pendingCount > 0 && (
          <div className="mt-3 bg-warning-50 border border-warning-200 rounded-xl p-3 flex items-center gap-2">
            <CloudOff size={14} className="text-warning-500 shrink-0" />
            <p className="text-xs text-warning-700 flex-1">
              {pendingCount} chấm công chưa đồng bộ
            </p>
            {isOnline && (
              <button
                onClick={() => {
                  void syncPendingCheckins().then(r => {
                    if (r.synced > 0) {
                      setToastTone('success')
                      setToast(`Đã đồng bộ ${r.synced} chấm công`)
                    }
                    setPendingCount(getPendingCount(currentUser.id))
                    setTimeout(() => setToast(null), 3000)
                  })
                }}
                className="text-xs font-medium text-warning-600 underline whitespace-nowrap"
              >
                Thử đồng bộ
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 mt-4 flex items-center justify-center gap-2">
          {isOnline ? (
            <Wifi size={10} className="text-success-400" />
          ) : (
            <WifiOff size={10} className="text-warning-400" />
          )}
          GPS • {userPos ? `${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}` : 'Chưa xác định'}
          {!isOnline && ' • Offline'}
        </p>
      </div>

      {/* ─── Modal Quét Mã QR Quầy (Fallback GPS) ─── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Mã QR Chấm Công Tại Quầy</h3>
                  <p className="text-[11px] text-gray-500">{store?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Mock Display */}
            <div className="bg-slate-50 border-2 border-dashed border-sky-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-36 h-36 bg-white p-3 rounded-2xl shadow-inner border border-gray-200 flex flex-col items-center justify-center relative">
                <QrCode size={110} className="text-slate-800" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-md">
                    <ScanLine size={18} />
                  </div>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold">
                  {`HOMIES-${store?.id.toUpperCase()}-POS-VERIFY`}
                </span>
                <p className="text-xs text-gray-600 mt-2 font-medium">
                  Mã QR tĩnh dán tại quầy thu ngân cơ sở
                </p>
                <p className="text-[11px] text-gray-400">
                  Dùng khi sóng GPS trong quầy bar bị yếu hoặc chập chờn
                </p>
              </div>
            </div>

            {/* Action button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleQrCheckin(`HOMIES-${store?.id.toUpperCase()}-POS-VERIFY`)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:from-sky-500 hover:to-blue-600 cursor-pointer active:scale-[0.98] transition-all"
              >
                <Camera size={16} />
                Xác nhận đã quét mã tại quầy
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast notification ─── */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 ${TOAST_TONE_CLASS[toastTone]} px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in max-w-[90vw] text-center`}>
          {toast}
        </div>
      )}
    </AppShell>
  )
}
