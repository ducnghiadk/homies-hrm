'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuthStore } from '@/store/auth-store'
import AppShell from '@/components/layout/AppShell'
import { getStoreById, getShiftById, type Attendance } from '@/lib/mock-data'
import { saveOfflineCheckin, syncPendingCheckins, getPendingCount } from '@/lib/offline-checkin'
import { matchStoreWifi } from '@/lib/mock-data-wifi'
import { isEmployeeOnLeave } from '@/lib/leave-attendance-sync'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { calculateDistance, formatTime } from '@/lib/utils'
import confetti from 'canvas-confetti'
import {
  ArrowLeft, Clock, Navigation, AlertTriangle,
  CheckCircle2, LogIn, LogOut, Loader2, WifiOff, CloudOff, Wifi,
} from 'lucide-react'
import WifiSimulator from '@/components/checkin/WifiSimulator'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ScheduleService } from '@/lib/services/schedule-service'
import { AttendanceService } from '@/lib/services/attendance-service'

// Dynamically import Leaflet map (no SSR — uses window)
const CheckinMap = dynamic(() => import('@/components/checkin/CheckinMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-gray-400" />
    </div>
  ),
})

type PageStatus = 'locating' | 'gps_error' | 'in_range' | 'out_range' | 'checked_in' | 'checked_out'

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
  const store = getStoreById(currentUser.store_id)

  const [checkinRecord, setCheckinRecord] = useState<Attendance | null>(() => {
    if (typeof window === 'undefined') return null
    AttendanceService.syncLiveCheckinsToMock()
    return AttendanceService.getTodayCheckin(currentUser.id) || null
  })

  const [status, setStatus] = useState<PageStatus>(() => {
    if (typeof window === 'undefined') return 'locating'
    AttendanceService.syncLiveCheckinsToMock()
    const existing = AttendanceService.getTodayCheckin(currentUser.id)
    if (existing) {
      return existing.check_out_time ? 'checked_out' : 'checked_in'
    }
    return 'locating'
  })

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [pendingCount, setPendingCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return getPendingCount(currentUser.id)
  })
  const [isOfflineCheckin, setIsOfflineCheckin] = useState(false)

  const [simulatedWifi, setSimulatedWifi] = useState<{ ssid: string; bssid?: string } | null>(null)
  const [checkinMethod, setCheckinMethod] = useState<'gps' | 'wifi' | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const prevOnlineRef = useRef(true)

  const todayStr = new Date().toISOString().split('T')[0]
  const todaySchedule = ScheduleService.getSchedulesForUser(currentUser, currentUser.id)
    .filter(s => s.status === 'published' && ScheduleService.isWeekPublished(s.store_id, ScheduleService.getWeekStartDate(s.date)))
    .find(s => s.date === todayStr)
  const shift = todaySchedule ? getShiftById(todaySchedule.shift_id) : null

  const noSchedule = !todaySchedule

  // ─── WiFi verification ───
  const wifiMatch = store && simulatedWifi
    ? matchStoreWifi(store.id, simulatedWifi.ssid, simulatedWifi.bssid)
    : null
  const wifiVerified = !!wifiMatch
  const gpsInRange = distance !== null && store ? distance <= store.checkin_radius_meters : false
  const canCheckin = wifiVerified || gpsInRange

  // GPS location tracking
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('gps_error')
      return
    }

    setStatus('locating')

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords
      setUserPos({ lat: latitude, lng: longitude })

      if (store) {
        const dist = calculateDistance(latitude, longitude, store.latitude, store.longitude)
        const distRounded = Math.round(dist)
        setDistance(distRounded)

        // Only update range status if not already checked in/out
        const existing = AttendanceService.getTodayCheckin(currentUser.id)
        if (!existing) {
          setStatus(distRounded <= store.checkin_radius_meters ? 'in_range' : 'out_range')
        }
      }
    }

    const onError = () => {
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
  }, [store, currentUser.id, setStatus, setUserPos, setDistance])

  useEffect(() => {
    // Don't start GPS if already checked in/out
    const existing = AttendanceService.getTodayCheckin(currentUser.id)
    let active = true
    if (!existing) {
      setTimeout(() => {
        if (active) startGPS()
      }, 0)
    }
    return () => {
      active = false
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [startGPS, currentUser.id])

  // ─── Auto-sync when back online ───
  useEffect(() => {
    if (isOnline && !prevOnlineRef.current) {
      // Just came back online — sync pending
      const result = syncPendingCheckins()
      if (result.synced > 0) {
        setTimeout(() => {
          setToast(`☁️ Đã đồng bộ ${result.synced} chấm công`)
          setPendingCount(getPendingCount(currentUser.id))
          const existing = AttendanceService.getTodayCheckin(currentUser.id)
          if (existing) {
            setCheckinRecord(existing)
            setStatus(existing.check_out_time ? 'checked_out' : 'checked_in')
          }
          setTimeout(() => setToast(null), 3000)
        }, 0)
      }
      if (result.needsReview > 0) {
        setTimeout(() => {
          setToast(`⚠️ ${result.needsReview} chấm công cần HR review (chênh lệch thời gian)`)
          setTimeout(() => setToast(null), 4000)
        }, result.synced > 0 ? 3500 : 0)
      }
    }
    prevOnlineRef.current = isOnline
  }, [isOnline, currentUser.id])

  // ─── Check-in handler ───
  const handleCheckin = () => {
    if (!store) return

    // Must have WiFi match OR GPS in range
    if (!wifiVerified && !gpsInRange) {
      setToast('Bạn cần ở trong cửa hàng hoặc kết nối WiFi cửa hàng')
      setTimeout(() => setToast(null), 3000)
      return
    }

    // ── Validate leave status ──
    const leaveStatus = isEmployeeOnLeave(currentUser.id, todayStr)
    if (leaveStatus.onLeave) {
      setToast(`Không thể check-in: Bạn đang nghỉ phép (${leaveStatus.leaveType || 'leave'})`)
      setTimeout(() => setToast(null), 4000)
      return
    }

    const method: 'wifi' | 'gps' = wifiVerified ? 'wifi' : 'gps'
    setCheckinMethod(method)

    const timeStr = formatTime(new Date())

    if (isOnline) {
      // ── Online: write directly ──
      const record = AttendanceService.checkinToday(
        currentUser.id,
        currentUser.store_id,
        userPos?.lat ?? store.latitude,
        userPos?.lng ?? store.longitude,
        method === 'wifi' ? 0 : (distance ?? 0),
        shift?.id,
        shift?.start_time,
      )
      setCheckinRecord(record)
      setStatus('checked_in')
      setIsOfflineCheckin(false)

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3971B8', '#C8D69B', '#F6E6A5', '#1E9E57'],
      })

      setToast(`✅ Check-in thành công lúc ${timeStr}${method === 'wifi' ? ' (WiFi)' : ''}`)
      setTimeout(() => {
        setToast(null)
        router.push('/')
      }, 2500)
    } else {
      // ── Offline: save to localStorage ──
      saveOfflineCheckin(
        currentUser.id,
        currentUser.store_id,
        userPos?.lat ?? store.latitude,
        userPos?.lng ?? store.longitude,
        method === 'wifi' ? 0 : (distance ?? 0),
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

      setToast(`☁️ Check-in thành công lúc ${timeStr} (Chờ đồng bộ)`)
      setTimeout(() => {
        setToast(null)
        router.push('/')
      }, 3000)
    }
  }

  // ─── Check-out handler ───
  const handleCheckout = () => {
    if (!userPos) return

    const record = AttendanceService.checkoutToday(currentUser.id, userPos.lat, userPos.lng)
    if (!record) return

    setCheckinRecord(record)
    setStatus('checked_out')

    const totalH = Math.floor(record.total_hours)
    const totalM = Math.round((record.total_hours - totalH) * 60)
    setToast(`🏁 Kết thúc ca — Tổng ${totalH} giờ ${totalM} phút`)
    setTimeout(() => {
      setToast(null)
      router.push('/')
    }, 3000)
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
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-400">Không có thông tin cửa hàng</p>
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
        <div className="bg-gray-50 rounded-2xl p-4 mb-5">
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

        {/* ─── WiFi Simulator + Verification method ─── */}
        {status !== 'checked_in' && status !== 'checked_out' && (
          <div className="mb-4 space-y-3">
            <WifiSimulator onWifiChange={setSimulatedWifi} currentWifi={simulatedWifi} />

            {/* Verification method display */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Phương thức xác nhận</p>

              {/* WiFi status */}
              <div className="flex items-center gap-2">
                {wifiVerified ? (
                  <>
                    <Wifi size={14} className="text-success-500" />
                    <span className="text-xs text-success-700 font-medium">WiFi: {simulatedWifi?.ssid} ✓</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {simulatedWifi ? `WiFi: ${simulatedWifi.ssid} (không phải cửa hàng)` : 'WiFi: Không kết nối WiFi cửa hàng'}
                    </span>
                  </>
                )}
              </div>

              {/* GPS status */}
              <div className="flex items-center gap-2">
                {wifiVerified ? (
                  <>
                    <Navigation size={14} className="text-gray-300" />
                    <span className="text-xs text-gray-300">GPS: Không cần</span>
                  </>
                ) : gpsInRange ? (
                  <>
                    <Navigation size={14} className="text-success-500" />
                    <span className="text-xs text-success-700 font-medium">GPS: Trong phạm vi ({distance}m) ✓</span>
                  </>
                ) : distance !== null ? (
                  <>
                    <Navigation size={14} className="text-error-400" />
                    <span className="text-xs text-error-500">GPS: Ngoài phạm vi ({distance}m)</span>
                  </>
                ) : (
                  <>
                    <Navigation size={14} className="text-gray-300" />
                    <span className="text-xs text-gray-400">GPS: Đang xác định...</span>
                  </>
                )}
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
              {wifiVerified ? 'Xác nhận qua WiFi cửa hàng' : `Bạn đang trong cửa hàng (${distance}m)`}
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
                    Đã check-in lúc {checkinRecord && formatTime(checkinRecord.check_in_time!)}{checkinMethod === 'wifi' && ' (WiFi)'}
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
                canCheckin
                  ? 'bg-gradient-to-r from-[#3971B8] to-[#2A5A8F] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <LogIn size={24} />
              CHECK-IN {wifiVerified && !gpsInRange && '(WiFi)'}
            </button>
          )}

          {/* Locating / GPS Error — nothing actionable yet */}
          {status === 'locating' && (
            <button disabled className="w-full py-4 rounded-2xl bg-gray-200 text-gray-400 text-lg font-bold flex items-center justify-center gap-3 cursor-not-allowed">
              <Loader2 size={24} className="animate-spin" />
              Đang chờ GPS...
            </button>
          )}

          {status === 'gps_error' && (
            <button
              onClick={startGPS}
              className="w-full py-4 rounded-2xl bg-primary-600 text-white text-lg font-bold flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-transform"
            >
              <Navigation size={24} />
              Thử lại
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
              className="w-full py-4 rounded-2xl bg-gray-100 text-gray-500 text-lg font-bold flex items-center justify-center gap-3"
            >
              <CheckCircle2 size={24} />
              Về trang chủ
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
                  const r = syncPendingCheckins()
                  if (r.synced > 0) setToast(`☁️ Đã đồng bộ ${r.synced} chấm công`)
                  setPendingCount(getPendingCount(currentUser.id))
                  setTimeout(() => setToast(null), 3000)
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

      {/* ─── Toast notification ─── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
