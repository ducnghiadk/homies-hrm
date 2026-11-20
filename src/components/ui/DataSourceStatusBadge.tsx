'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
  Cloud,
  CloudOff,
  Lock,
  Settings,
  Info,
  HardDrive,
  AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'

export interface StorageStatusClient {
  provider: 'supabase_cloud' | 'local_file'
  status: 'connected' | 'unconfigured' | 'table_missing' | 'auth_error' | 'unreachable'
  ready_for_vercel: boolean
  using_service_role: boolean
  supabase_host: string | null
  reason: string
  last_checked_at: string | null
  last_synced_at: string | null
}

export interface EffectiveDataModeClient {
  mode: 'ipos' | 'homies_native'
  ipos_master_enabled: boolean
  ipos_authenticated: boolean
  modules: {
    employees: boolean
    shifts: boolean
    attendance: boolean
    payroll: boolean
  }
}

interface ModuleHealth {
  name: string
  table: string
  syncKey?: 'employees' | 'shifts' | 'attendance'
  count: number | null
  badgeText: string
  badgeTone: 'ipos' | 'homies' | 'off' | 'loading'
}

const IPOS_STORAGE_KEY = 'homies_ipos_integration_config_v2'

export default function DataSourceStatusBadge() {
  const { user } = useAuthStore()
  const canManageMode = user?.role === 'ceo' || user?.role === 'hr_admin'

  const [isOpen, setIsOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isUpdatingMode, setIsUpdatingMode] = useState(false)
  const [modeError, setModeError] = useState<string | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [dataMode, setDataMode] = useState<EffectiveDataModeClient | null>(null)
  const [storageStatus, setStorageStatus] = useState<StorageStatusClient | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [modules, setModules] = useState<ModuleHealth[]>([
    { name: 'Cửa hàng & Chi nhánh', table: 'cua_hang', count: null, badgeText: 'Kiểm tra...', badgeTone: 'loading' },
    { name: 'Hồ sơ Nhân viên', table: 'nhan_vien', syncKey: 'employees', count: null, badgeText: 'Kiểm tra...', badgeTone: 'loading' },
    { name: 'Đăng ký & Lịch ca', table: 'lich_phan_ca', syncKey: 'shifts', count: null, badgeText: 'Kiểm tra...', badgeTone: 'loading' },
    { name: 'Chấm công', table: 'cham_cong', syncKey: 'attendance', count: null, badgeText: 'Kiểm tra...', badgeTone: 'loading' },
    { name: 'Cầu nối iPOS Cloud', table: 'ipos_bridge', count: null, badgeText: 'Kiểm tra...', badgeTone: 'loading' },
  ])

  const checkLiveStatus = useCallback(async (forceStorageProbe = false) => {
    setIsChecking(true)
    const startTime = performance.now()

    let resolvedMode: EffectiveDataModeClient = {
      mode: 'ipos',
      ipos_master_enabled: true,
      ipos_authenticated: false,
      modules: { employees: true, shifts: true, attendance: true, payroll: true },
    }

    try {
      const workerUrl = forceStorageProbe ? '/api/ipos/cloud-worker?check_storage=1' : '/api/ipos/cloud-worker'
      const iposRes = await fetch(workerUrl, { cache: 'no-store' })
      if (iposRes.ok) {
        const json = await iposRes.json()
        if (json.storage_status) {
          setStorageStatus(json.storage_status)
        }
        if (json.config && typeof window !== 'undefined') {
          try {
            localStorage.setItem(IPOS_STORAGE_KEY, JSON.stringify(json.config))
          } catch {
            // Bỏ qua lỗi quota localStorage
          }
        }
        if (json.data_mode) {
          resolvedMode = json.data_mode
        } else if (json.config) {
          const master = json.config.is_enabled !== false
          resolvedMode = {
            mode: master ? 'ipos' : 'homies_native',
            ipos_master_enabled: master,
            ipos_authenticated: Boolean(json.config.is_authenticated),
            modules: {
              employees: master && json.config.sync_employees !== false,
              shifts: master && json.config.sync_shifts !== false,
              attendance: master && json.config.sync_attendance !== false,
              payroll: master && json.config.sync_payroll !== false,
            },
          }
        }
      }
    } catch {
      // Giữ trạng thái mặc định an toàn nếu mất mạng cục bộ
    }

    setDataMode(resolvedMode)

    const fetchCount = async (url: string): Promise<number | null> => {
      try {
        const r = await fetch(url, { cache: 'no-store' })
        if (!r.ok) return null
        const j = await r.json()
        if (typeof j.count === 'number') return j.count
        if (Array.isArray(j.data)) return j.data.length
        return null
      } catch {
        return null
      }
    }

    const [storesCount, empCount, shiftCount, attCount] = await Promise.all([
      fetchCount('/api/stores'),
      fetchCount('/api/employees'),
      fetchCount('/api/shifts'),
      fetchCount('/api/attendance'),
    ])

    const makeMod = (
      name: string,
      table: string,
      count: number | null,
      syncKey?: 'employees' | 'shifts' | 'attendance'
    ): ModuleHealth => {
      if (!syncKey) {
        return {
          name,
          table,
          count,
          badgeText: count !== null ? `Homies Nội Bộ (${count})` : 'Homies Nội Bộ',
          badgeTone: 'homies',
        }
      }
      const isModIpos = resolvedMode.ipos_master_enabled && resolvedMode.modules[syncKey]
      if (isModIpos) {
        return {
          name,
          table,
          syncKey,
          count,
          badgeText: count !== null ? `iPOS Live (${count})` : 'iPOS Live',
          badgeTone: 'ipos',
        }
      }
      return {
        name,
        table,
        syncKey,
        count,
        badgeText: count !== null ? `Homies Nội Bộ (${count})` : 'Homies Nội Bộ',
        badgeTone: 'homies',
      }
    }

    const bridgeHealth: ModuleHealth = !resolvedMode.ipos_master_enabled
      ? { name: 'Cầu nối iPOS Cloud', table: 'ipos_bridge', count: 0, badgeText: 'Đang tắt', badgeTone: 'off' }
      : resolvedMode.ipos_authenticated
      ? { name: 'Cầu nối iPOS Cloud', table: 'ipos_bridge', count: 1, badgeText: 'Đang kết nối', badgeTone: 'ipos' }
      : { name: 'Cầu nối iPOS Cloud', table: 'ipos_bridge', count: 0, badgeText: 'Chờ xác thực', badgeTone: 'off' }

    setModules([
      makeMod('Cửa hàng & Chi nhánh', 'cua_hang', storesCount),
      makeMod('Hồ sơ Nhân viên', 'nhan_vien', empCount, 'employees'),
      makeMod('Đăng ký & Lịch ca', 'lich_phan_ca', shiftCount, 'shifts'),
      makeMod('Chấm công', 'cham_cong', attCount, 'attendance'),
      bridgeHealth,
    ])

    setLatencyMs(Math.round(performance.now() - startTime))
    setIsChecking(false)
  }, [])

  useEffect(() => {
    checkLiveStatus()
  }, [checkLiveStatus])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleUpdateMode = async (
    patch: Partial<{
      is_enabled: boolean
      sync_employees: boolean
      sync_shifts: boolean
      sync_attendance: boolean
      sync_payroll: boolean
    }>
  ) => {
    if (!canManageMode || isUpdatingMode) return
    setIsUpdatingMode(true)
    setModeError(null)
    try {
      const res = await fetch('/api/ipos/cloud-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_data_mode', ...patch }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        setModeError(json.error || 'Không thể thay đổi chế độ vận hành.')
        return
      }
      if (json.data_mode) setDataMode(json.data_mode)
      if (json.config && typeof window !== 'undefined') {
        try {
          localStorage.setItem(IPOS_STORAGE_KEY, JSON.stringify(json.config))
        } catch {
          // Bỏ qua lỗi bộ nhớ trình duyệt
        }
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('homies-data-mode-changed', { detail: json.data_mode }))
      }
      await checkLiveStatus()
    } catch {
      setModeError('Lỗi kết nối máy chủ khi cập nhật chế độ.')
    } finally {
      setIsUpdatingMode(false)
    }
  }

  const masterEnabled = dataMode?.ipos_master_enabled ?? true
  const allCoreOn = Boolean(
    masterEnabled &&
      dataMode?.modules.employees &&
      dataMode?.modules.shifts &&
      dataMode?.modules.attendance
  )
  const badgeLabel = !masterEnabled
    ? 'Homies Tự Vận Hành'
    : allCoreOn
    ? 'Đồng bộ iPOS'
    : 'iPOS (Tùy chọn)'

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Nút hiển thị chế độ trên Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Chuyển đổi giữa Đồng bộ iPOS Cloud và Homies Tự Vận Hành"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer ${
          masterEnabled
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70'
            : 'bg-blue-50 text-[#2F6FA8] border-[#2F6FA8]/30 hover:bg-blue-100/70'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {masterEnabled && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              masterEnabled ? 'bg-emerald-500' : 'bg-[#2F6FA8]'
            }`}
          />
        </span>
        <Database size={13} className="hidden sm:inline" />
        <span>{badgeLabel}</span>
      </button>

      {/* Bảng Popover điều khiển Công tắc Kiểu 1 */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl z-50"
          style={{ boxShadow: '0 12px 35px -5px rgba(0,29,61,0.14), 0 8px 20px -6px rgba(0,0,0,0.06)' }}
        >
          {/* Tiêu đề Popover */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl ${
                  masterEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#2F6FA8]'
                }`}
              >
                <Server size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#001D3D]">Chế Độ Vận Hành Hệ Thống</h4>
                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                  <ShieldCheck size={11} className={masterEnabled ? 'text-emerald-600' : 'text-[#2F6FA8]'} />
                  <span>{masterEnabled ? 'Đang kết nối iPOS Cloud' : 'Homies Tự Vận Hành Độc Lập'}</span>
                  {latencyMs !== null && (
                    <span className="text-gray-600 font-mono font-bold flex items-center gap-0.5 ml-1">
                      <Zap size={9} /> {latencyMs}ms
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => checkLiveStatus(true)}
              disabled={isChecking}
              className="p-1.5 text-gray-400 hover:text-[#2F6FA8] hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
              title="Kiểm tra lại kết nối iPOS & Supabase"
            >
              <RefreshCw size={14} className={isChecking ? 'animate-spin text-[#2F6FA8]' : ''} />
            </button>
          </div>

          {/* Công tắc Tổng (Master Switch) */}
          <div className="p-3 rounded-xl bg-[#FFF8E8]/80 border border-amber-200/70 mb-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {masterEnabled ? (
                  <Cloud size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <CloudOff size={16} className="text-[#2F6FA8] shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#001D3D]">Công tắc Tổng: Đồng bộ iPOS</div>
                  <div className="text-[11px] text-gray-600 leading-snug">
                    {masterEnabled
                      ? 'Đang lấy dữ liệu thật từ hrm.ipos.vn'
                      : 'Tắt iPOS — chạy khép kín trên app Homies'}
                  </div>
                </div>
              </div>

              {canManageMode ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={masterEnabled}
                  disabled={isUpdatingMode}
                  onClick={() => handleUpdateMode({ is_enabled: !masterEnabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                    masterEnabled ? 'bg-emerald-600' : 'bg-[#2F6FA8]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      masterEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-bold shrink-0">
                  <Lock size={11} /> Chỉ CEO/HR
                </span>
              )}
            </div>

            {modeError && (
              <div className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                {modeError}
              </div>
            )}
          </div>

          {/* Công tắc lẻ từng phân hệ (Kiểu 1 — hiện khi Công tắc Tổng đang BẬT) */}
          {masterEnabled && (
            <div className="mb-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider px-1">
                Tùy chọn đồng bộ từng mục
              </div>
              {[
                { key: 'sync_employees' as const, modKey: 'employees' as const, label: 'Nhân sự cửa hàng' },
                { key: 'sync_shifts' as const, modKey: 'shifts' as const, label: 'Đăng ký ca & Lịch tuần' },
                { key: 'sync_attendance' as const, modKey: 'attendance' as const, label: 'Dữ liệu chấm công' },
              ].map((item) => {
                const enabled = dataMode?.modules[item.modKey] ?? true
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white border border-gray-100"
                  >
                    <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#2F6FA8]'
                        }`}
                      >
                        {enabled ? 'iPOS' : 'Homies'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        disabled={!canManageMode || isUpdatingMode}
                        onClick={() => handleUpdateMode({ [item.key]: !enabled })}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                          canManageMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                        } ${enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                            enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Kho Lưu Trữ Dữ Liệu (Vercel Deploy Readiness) */}
          {storageStatus && (
            <div
              className={`mb-3 p-2.5 rounded-xl border space-y-1 ${
                storageStatus.ready_for_vercel
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {storageStatus.ready_for_vercel ? (
                    <HardDrive size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                  )}
                  <span className="text-xs font-bold truncate">
                    {storageStatus.ready_for_vercel
                      ? 'Supabase Đám Mây — Sẵn sàng Deploy'
                      : 'File Nội Bộ — Cần nối Supabase mới'}
                  </span>
                </div>
                {storageStatus.supabase_host && (
                  <span className="text-[10px] font-mono text-gray-500 shrink-0 truncate max-w-[120px]">
                    {storageStatus.supabase_host}
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-snug opacity-90">{storageStatus.reason}</p>
            </div>
          )}

          {/* Tình trạng 5 luồng dữ liệu */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 text-xs">
            {modules.map((mod) => (
              <div
                key={mod.table}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80 border border-gray-100"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {mod.badgeTone === 'ipos' || mod.badgeTone === 'homies' ? (
                    <CheckCircle2
                      size={14}
                      className={mod.badgeTone === 'ipos' ? 'text-emerald-600 shrink-0' : 'text-[#2F6FA8] shrink-0'}
                    />
                  ) : (
                    <AlertCircle size={14} className="text-gray-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800 text-[11px] block leading-tight truncate">
                      {mod.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{mod.table}</span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                    mod.badgeTone === 'ipos'
                      ? 'bg-emerald-100 text-emerald-800'
                      : mod.badgeTone === 'homies'
                      ? 'bg-blue-50 text-[#2F6FA8] border border-blue-200/70'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {mod.badgeText}
                </span>
              </div>
            ))}
          </div>

          {/* Liên kết cài đặt chi tiết + Ghi chú */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2">
            <Link
              href="/settings/integrations/ipos"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#001D3D] transition no-underline"
            >
              <Settings size={13} />
              <span>Cài đặt kết nối iPOS chi tiết</span>
            </Link>

            <div className="flex items-start gap-1.5 text-[10px] text-gray-500 leading-snug">
              <Info size={12} className="text-[#2F6FA8] shrink-0 mt-0.5" />
              <span>
                Tắt đồng bộ iPOS giúp toàn quán vận hành khép kín trực tiếp trên app Homies mà không phụ thuộc bên ngoài.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
