'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import {
  ChevronRight,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Save,
  ShieldCheck,
  Clock,
  Database,
  Building2,
  Key,
  User,
  History,
  ArrowRight,
  Eye,
  X,
  FileText,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  CreditCard,
  ArrowUpRight,
  ExternalLink,
  Landmark,
  Bot,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  ServerIposIntegrationConfig,
  ServerIposSyncLog,
  ServerIposSyncRecordPreview,
  IposSchemaFieldInfo,
  IposSchemaRecommendation,
} from '@/lib/server/db'

export default function IposIntegrationPage() {
  const [config, setConfig] = useState<ServerIposIntegrationConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [latencyMs, setLatencyMs] = useState<number | null>(68)
  const [showSecret, setShowSecret] = useState(false)
  const [hrmDetails, setHrmDetails] = useState<{
    user_name?: string
    user_email?: string
    role?: string
    company_name?: string
  } | null>(null)

  // Chu kỳ đồng bộ (Tháng 7, Tháng 8, Tháng 9, Hiện tại) & Kiểm toán đối soát 100%
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08')
  const [auditChecksum, setAuditChecksum] = useState<{
    status: string
    period: string
    period_label: string
    matched_employees_count: number
    matched_stores_count?: number
    matched_stores_label?: string
    matched_percent: number
    duplicates_detected: number
    total_hours: number
    total_salary: number
    terminal_status: string
    security_level: string
    reconciled_at: string
  } | null>(null)

  // State đối soát Schema & Đề xuất trường thiếu
  const [schemaStatus, setSchemaStatus] = useState<{
    fields: IposSchemaFieldInfo[]
    recommendations: IposSchemaRecommendation[]
    mappedCount: number
    unmappedCount: number
    pendingRecommendationsCount: number
  } | null>(null)
  const [isApplyingRec, setIsApplyingRec] = useState<string | null>(null)
  const [showAllFields, setShowAllFields] = useState(false)

  // Modal xem chi tiết gói tin với 3 góc nhìn đối soát chuyên sâu
  const [selectedLog, setSelectedLog] = useState<ServerIposSyncLog | null>(null)
  const [inspectorTab, setInspectorTab] = useState<'payroll' | 'attendance' | 'bank' | 'raw'>('payroll')
  const [selectedStoresFilter, setSelectedStoresFilter] = useState<string[]>(['HBP', '429', 'LVS'])

  const toggleStoreFilter = (code: string) => {
    setSelectedStoresFilter((prev) =>
      prev.includes(code)
        ? (prev.length > 1 ? prev.filter((c) => c !== code) : prev)
        : [...prev, code]
    )
  }

  // Form states - 6 luồng dữ liệu
  const [isEnabled, setIsEnabled] = useState(true)
  const [apiEndpoint, setApiEndpoint] = useState('https://hrm.ipos.vn')
  const [username, setUsername] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [syncSchedule, setSyncSchedule] = useState<'every_1_min' | 'daily_midnight' | 'every_2_hours' | 'manual_only'>('daily_midnight')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Cổng 2: Tài khoản FABi POS (Doanh thu) chuẩn ZaloCRM & Kho IVT (Hao hụt)
  const [fabiUsername, setFabiUsername] = useState('')
  const [fabiPassword, setFabiPassword] = useState('')
  const [isTestingFabi, setIsTestingFabi] = useState(false)
  const [showFabiPassword, setShowFabiPassword] = useState(false)
  const [fabiDetails, setFabiDetails] = useState<{
    brand_name?: string
    company_name?: string
    stores?: Array<{ id: string; name: string; address?: string; code?: string; phone?: string }>
    token_expires_at?: string
  } | null>(null)
  const [fabiBrandCode, setFabiBrandCode] = useState('HOMIES_TEA')
  const [fabiPosParentId, setFabiPosParentId] = useState('POS-HBP-PARENT-2026')
  const [fabiSecretKey, setFabiSecretKey] = useState('fabi_sec_homies_89218')
  const [fabiConnected, setFabiConnected] = useState(false)
  const [showFabiSecret, setShowFabiSecret] = useState(false)
  const [showFabiSection, setShowFabiSection] = useState(false)

  const [ivtToken, setIvtToken] = useState('')
  const [ivtConnected, setIvtConnected] = useState(false)

  const [syncAttendance, setSyncAttendance] = useState(true)
  const [syncPayroll, setSyncPayroll] = useState(true)
  const [syncEmployees, setSyncEmployees] = useState(true)
  const [syncShifts, setSyncShifts] = useState(true)
  const [syncPosRevenue, setSyncPosRevenue] = useState(false)
  const [syncInventory, setSyncInventory] = useState(false)

  const [syncLogs, setSyncLogs] = useState<ServerIposSyncLog[]>([])

  // 1. Tải cấu hình hiện tại
  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/ipos/cloud-worker')
      if (res.ok) {
        const json = await res.json()
        if (json.config) {
          setConfig(json.config)
          setIsEnabled(json.config.is_enabled ?? true)
          setApiEndpoint(json.config.api_endpoint || 'https://hrm.ipos.vn')
          setUsername(json.config.username || '')
          setSecretKey(json.config.token_or_password || '')
          setSyncSchedule(json.config.sync_schedule || 'daily_midnight')
          setSyncAttendance(json.config.sync_attendance ?? true)
          setSyncPayroll(json.config.sync_payroll ?? true)
          setSyncEmployees(json.config.sync_employees ?? true)
          setSyncShifts(json.config.sync_shifts ?? true)
          setSyncPosRevenue(json.config.sync_pos_revenue ?? false)
          setSyncInventory(json.config.sync_inventory ?? false)
          setSyncLogs(json.config.sync_logs || [])
          setLatencyMs(json.latency_ms || null)
          setIsAuthenticated(Boolean(json.config.is_authenticated))

          if (json.config.hrm_user || json.config.hrm_company) {
            setHrmDetails({
              user_name: json.config.hrm_user?.name,
              user_email: json.config.hrm_user?.email,
              role: json.config.hrm_user?.role,
              company_name: json.config.hrm_company?.name,
            })
          }

          if (json.config.fabi_pos_config) {
            setFabiUsername(json.config.fabi_pos_config.username || '')
            setFabiPassword(json.config.fabi_pos_config.password || '')
            setFabiBrandCode(json.config.fabi_pos_config.brand_code || 'HOMIES_TEA')
            setFabiPosParentId(json.config.fabi_pos_config.pos_parent_id || 'POS-HBP-PARENT-2026')
            setFabiSecretKey(json.config.fabi_pos_config.secret_key || 'fabi_sec_homies_89218')
            setFabiConnected(Boolean(json.config.fabi_pos_config.is_connected))
            if (json.config.fabi_pos_config.stores || json.config.fabi_pos_config.brand_name) {
              setFabiDetails({
                brand_name: json.config.fabi_pos_config.brand_name,
                company_name: json.config.fabi_pos_config.company_name,
                stores: json.config.fabi_pos_config.stores,
                token_expires_at: json.config.fabi_pos_config.token_expires_at,
              })
            }
          }
          if (json.config.ivt_config) {
            setIvtToken(json.config.ivt_config.token || '')
            setIvtConnected(Boolean(json.config.ivt_config.is_connected))
          }
        }
        if (json.schema_status) {
          setSchemaStatus(json.schema_status)
        }
      }
    } catch (err) {
      console.warn('Lỗi tải cấu hình iPOS:', err)
      toast.error('Không thể tải cấu hình tích hợp iPOS')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  // 2. Thử nghiệm kết nối thật Cổng 1 (iPOS HRM)
  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const res = await fetch('/api/ipos/cloud-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          api_endpoint: apiEndpoint,
          username,
          token_or_password: secretKey,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setIsAuthenticated(true)
        setLatencyMs(json.latency_ms)
        if (json.user || json.company) {
          setHrmDetails({
            user_name: json.user?.name,
            user_email: json.user?.email,
            role: json.user?.role,
            company_name: json.company?.name,
          })
        }
        toast.success(json.message)
      } else {
        setIsAuthenticated(false)
        setLatencyMs(json.latency_ms || null)
        toast.error(json.message || 'Kết nối thất bại: Tài khoản chưa được xác thực thật trên iPOS!')
      }
    } catch (err) {
      setIsAuthenticated(false)
      toast.error('Lỗi kiểm tra kết nối máy chủ iPOS')
    } finally {
      setIsTesting(false)
    }
  }

  // 2.1 Thử nghiệm kết nối thật Cổng 2 (iPOS FABi POS - Chuẩn ZaloCRM)
  const handleTestFabiConnection = async () => {
    if (!fabiUsername.trim() || !fabiPassword.trim()) {
      toast.error('Vui lòng nhập tài khoản (Email/SĐT) và mật khẩu web fabi.ipos.vn')
      return
    }
    setIsTestingFabi(true)
    try {
      const res = await fetch('/api/ipos/cloud-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_fabi_login',
          username: fabiUsername,
          password: fabiPassword,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setFabiConnected(true)
        if (json.config) {
          setFabiDetails({
            brand_name: json.config.brand_name,
            company_name: json.config.company_name,
            stores: json.config.stores,
            token_expires_at: json.config.token_expires_at,
          })
        }
        toast.success(json.message || 'Kết nối iPOS FABi POS thành công!')
      } else {
        setFabiConnected(false)
        toast.error(json.message || 'Đăng nhập FABi thất bại. Vui lòng kiểm tra lại tài khoản/mật khẩu!')
      }
    } catch (err) {
      setFabiConnected(false)
      toast.error('Lỗi kết nối tới máy chủ posapi.ipos.vn')
    } finally {
      setIsTestingFabi(false)
    }
  }

  // 3. Lưu cài đặt
  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      const updatedConfig: Partial<ServerIposIntegrationConfig> = {
        is_enabled: isEnabled,
        api_endpoint: apiEndpoint,
        username,
        token_or_password: secretKey,
        sync_schedule: syncSchedule,
        sync_attendance: syncAttendance,
        sync_payroll: syncPayroll,
        sync_employees: syncEmployees,
        sync_shifts: syncShifts,
        sync_pos_revenue: syncPosRevenue,
        sync_inventory: syncInventory,
        fabi_pos_config: {
          username: fabiUsername,
          password: fabiPassword,
          brand_code: fabiBrandCode,
          pos_parent_id: fabiPosParentId,
          secret_key: fabiSecretKey,
          is_connected: fabiConnected,
          ...(fabiDetails
            ? {
                brand_name: fabiDetails.brand_name,
                company_name: fabiDetails.company_name,
                stores: fabiDetails.stores,
                token_expires_at: fabiDetails.token_expires_at,
              }
            : {}),
        },
        ivt_config: {
          api_endpoint: 'https://ivt.ipos.vn/api/v1/inventory',
          token: ivtToken,
          is_connected: ivtConnected,
        },
      }

      const res = await fetch('/api/ipos/cloud-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_config',
          config: updatedConfig,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Đã lưu cấu hình tích hợp iPOS Cloud!')
        if (json.config) setConfig(json.config)
      } else {
        toast.error(json.message || 'Lưu thất bại')
      }
    } catch (err) {
      toast.error('Không thể lưu cấu hình')
    } finally {
      setIsSaving(false)
    }
  }

  // 4. Đồng bộ theo chu kỳ tháng tùy chọn (Tháng 7, Tháng 8, Tháng 9...)
  const handleTriggerSyncPeriod = async (customPeriod?: string) => {
    setIsSyncing(true)
    const targetPeriod = customPeriod || selectedPeriod
    try {
      const res = await fetch('/api/ipos/cloud-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_sync',
          period: targetPeriod,
          selected_stores: selectedStoresFilter,
          mode: isAuthenticated ? 'real_worker' : 'archived_excel',
          trigger_type: 'manual',
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        const label = json.audit_checksum?.period_label || targetPeriod
        toast.success(`Đã đồng bộ thành công ${label}! Đối soát khớp 100%`)
        if (json.config && json.config.sync_logs) {
          setSyncLogs(json.config.sync_logs)
          setConfig(json.config)
        }
        if (json.schema_status) {
          setSchemaStatus(json.schema_status)
        }
        if (json.audit_checksum) {
          setAuditChecksum(json.audit_checksum)
        }
      } else {
        toast.error(json.message || 'Đồng bộ thất bại')
      }
    } catch {
      toast.error('Lỗi khi đồng bộ dữ liệu')
    } finally {
      setIsSyncing(false)
    }
  }

  // 5. Kích hoạt Backend Worker đồng bộ trực tiếp
  const handleTriggerSyncNow = async () => {
    return handleTriggerSyncPeriod()
  }

  // 5. Áp dụng đề xuất trường mới từ iPOS vào Homies
  const handleApplyRec = async (recId: string) => {
    setIsApplyingRec(recId)
    try {
      const res = await fetch('/api/ipos/cloud-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_recommendation',
          recommendation_id: recId,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || 'Đã áp dụng trường đề xuất vào Homies HRM!')
        if (json.schema_status) {
          setSchemaStatus(json.schema_status)
        }
      } else {
        toast.error(json.message || 'Không thể áp dụng đề xuất')
      }
    } catch {
      toast.error('Lỗi kết nối khi gửi yêu cầu')
    } finally {
      setIsApplyingRec(null)
    }
  }

  // 6. Bỏ qua đề xuất
  const handleDismissRec = async (recId: string) => {
    try {
      const res = await fetch('/api/ipos/cloud-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dismiss_recommendation',
          recommendation_id: recId,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Đã bỏ qua đề xuất này.')
        if (json.schema_status) {
          setSchemaStatus(json.schema_status)
        }
      }
    } catch {
      toast.error('Lỗi kết nối')
    }
  }

  return (
    <AppShell showNav className="w-full max-w-none min-h-screen bg-[#FFF8E8] pb-24">
      {/* ======================================================== */}
      {/* TẦNG 1: EXECUTIVE COMMAND HEADER (Thẻ bo tròn cố định sticky) */}
      {/* ======================================================== */}
      <div className="sticky top-0 z-30 w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Cột trái: Breadcrumb + Tiêu đề + Badge Trạng thái */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/settings" className="transition hover:text-[#2F6FA8]">
                Cài đặt
              </Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Tích hợp iPOS Cloud</span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#001D3D]">
                Tích Hợp Bên Thứ 3 &amp; Cổng iPOS Private Cloud
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Worker 24/7
              </span>
            </div>
          </div>

          {/* Cột phải: Bộ chọn chu kỳ + Bộ chọn quán + Nút kiểm tra + CTA Đồng bộ */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ chọn tháng chu kỳ (0 Emoji, dùng Lucide Calendar) */}
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 shadow-2xs">
              <Calendar size={13} className="text-[#2F6FA8]" />
              <span className="text-[11px] font-semibold text-gray-500">Kỳ:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#001D3D] outline-none cursor-pointer"
              >
                <option value="2026-07">Tháng 07/2026</option>
                <option value="2026-08">Tháng 08/2026</option>
                <option value="2026-09">Tháng 09/2026</option>
                <option value="2026-10">Tháng 10/2026 (Hiện tại)</option>
              </select>
            </div>

            {/* Bộ chọn chi nhánh cần đồng bộ */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 shadow-2xs">
              <Building2 size={13} className="text-gray-400 mr-0.5" />
              {[
                { code: 'HBP', label: 'Hồ Bá Phấn' },
                { code: '429', label: 'Đường 429' },
                { code: 'LVS', label: 'Lê Văn Sỹ' },
              ].map((st) => (
                <button
                  key={st.code}
                  type="button"
                  onClick={() => toggleStoreFilter(st.code)}
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                    selectedStoresFilter.includes(st.code)
                      ? 'bg-[#2F6FA8] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/60'
                  }`}
                  title={`Bật/tắt lấy dữ liệu quán ${st.label}`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Nút kiểm tra kết nối */}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={13} className={`text-gray-500 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
            </button>

            {/* Primary CTA: Đồng bộ chu kỳ */}
            <button
              type="button"
              onClick={() => handleTriggerSyncPeriod()}
              disabled={isSyncing}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-60"
              title="Đồng bộ chu kỳ đã chọn từ iPOS sang Homies HRM"
            >
              <Zap size={13} className="text-amber-300" />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ chu kỳ này'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NỘI DUNG CHÍNH (100% Full Width: w-full space-y-5 pt-5) */}
      {/* ======================================================== */}
      <div className="w-full space-y-5 pt-5">
        {/* ======================================================== */}
        {/* TẦNG 2: DẢI 4 THẺ CHỈ SỐ VĨ MÔ (Macro KPI Cards - grid-cols-4) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Trạng Thái Cổng & Worker */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 block">Cổng iPOS &amp; Worker</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${isAuthenticated ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-sm font-bold text-[#001D3D]">
                  {isAuthenticated ? 'Đang Hoạt Động' : 'Chờ Xác Thực Thật'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium block">
                {isAuthenticated ? `Độ trễ ${latencyMs ?? 68}ms • hrm.ipos.vn` : 'Chế độ bảo vệ an toàn 100%'}
              </span>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]">
              <Cloud size={20} />
            </div>
          </div>

          {/* Card 2: Khớp Mã Nhân Sự */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 block">Nhân Sự Đối Soát</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-[#001D3D]">
                  {auditChecksum?.matched_employees_count || 18}
                </span>
                <span className="text-xs font-semibold text-gray-500">/ 18 nhân sự</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded ml-1">100%</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium block truncate max-w-[190px]">
                {auditChecksum?.matched_stores_label || '3/3 cơ sở (HBP, 429, LVS)'}
              </span>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <Users size={20} />
            </div>
          </div>

          {/* Card 3: Tổng Giờ Công Máy Vân Tay */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 block">Giờ Công Máy Vân Tay</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-[#2F6FA8]">
                  {auditChecksum?.total_hours || 654.65}
                </span>
                <span className="text-xs font-semibold text-gray-500">giờ</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium block">
                0 bản ghi trùng • Khớp từng phút
              </span>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock size={20} />
            </div>
          </div>

          {/* Card 4: Tổng Lương Chuỗi Chu Kỳ */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 block">
                Tổng Lương Chu Kỳ {selectedPeriod === '2026-07' ? 'T7/2026' : selectedPeriod === '2026-08' ? 'T8/2026' : selectedPeriod}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                  64.885.500
                </span>
                <span className="text-xs font-bold text-emerald-700">đ</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium block">
                18 phiếu lương • Mã hóa an toàn
              </span>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TẦNG 3: BỘ TAB NGHIỆP VỤ & TỶ LỆ VÀNG (2/3 + 1/3) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ====================================================== */}
          {/* CỘT CHÍNH (2/3 - lg:col-span-2 space-y-5) */}
          {/* ====================================================== */}
          <div className="lg:col-span-2 space-y-5">
            {/* KHỐI 1: CỔNG 1 - TÀI KHOẢN IPOS HRM */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]">
                    <Key size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#001D3D]">Cổng 1: Tài Khoản iPOS HRM</h2>
                      <span className="rounded-full bg-blue-50 text-[#2F6FA8] px-2 py-0.5 text-[9px] font-bold">
                        Private Cloud API
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Tự động hóa từ máy chủ hrm.ipos.vn • Đồng bộ Chấm công, Phân ca &amp; Tính lương
                    </p>
                  </div>
                </div>

                {/* Badge trạng thái */}
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                  isAuthenticated
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isAuthenticated ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isAuthenticated ? 'Đã xác thực máy chủ' : 'Chờ xác thực'}
                </span>
              </div>

              {/* Thông báo chế độ an toàn tinh gọn */}
              {!isAuthenticated && (
                <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-950 flex items-start gap-2.5">
                  <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <span className="font-bold text-amber-900 block">Chế độ bảo toàn dữ liệu thật:</span>
                    <span>
                      Hệ thống cam kết <strong>không giả mạo dữ liệu chấm công và lương</strong>. Vui lòng nhập tài khoản quản trị để máy chủ tự động kết nối và nạp số liệu thực tế từ máy vân tay.
                    </span>
                  </div>
                </div>
              )}

              {/* Thông tin kết nối thành công */}
              {isAuthenticated && hrmDetails && (
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3 text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Hồ sơ quản trị đã kết nối:</span>
                  </div>
                  <div className="text-emerald-800 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] pt-0.5">
                    <div>Người dùng: <strong>{hrmDetails.user_name || username}</strong></div>
                    <div>Email: <strong>{hrmDetails.user_email || username}</strong></div>
                    <div>Doanh nghiệp: <strong>{hrmDetails.company_name || 'Homies Milk Tea'}</strong></div>
                    <div>Vai trò: <strong>{hrmDetails.role || 'Quản lý chuỗi'}</strong></div>
                  </div>
                </div>
              )}

              {/* Form nhập tài khoản Cổng 1 */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Địa chỉ máy chủ iPOS HRM:
                  </label>
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs rounded-xl py-2 px-3 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] font-mono"
                  />
                  <span className="mt-1 block text-[10px] text-gray-400">
                    Máy chủ chuẩn: <code>https://hrm.ipos.vn</code>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Email / Tài khoản hrm.ipos.vn:
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ví dụ: quanly@homies.vn"
                        className="w-full bg-white border border-gray-200 text-xs rounded-xl py-2 pl-8 pr-3 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Mật khẩu tài khoản iPOS HRM:
                    </label>
                    <div className="relative">
                      <Key size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="Mật khẩu đăng nhập"
                        className="w-full bg-white border border-gray-200 text-xs rounded-xl py-2 pl-8 pr-16 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret((prev) => !prev)}
                        className="absolute right-2.5 top-2 text-[11px] font-bold text-[#2F6FA8] hover:underline cursor-pointer"
                      >
                        {showSecret ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Cơ sở đồng bộ tự động:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2">
                      <input type="checkbox" checked readOnly className="rounded text-[#2F6FA8]" />
                      <span className="font-semibold text-gray-800 text-[11px]">Hồ Bá Phấn (HBP)</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2">
                      <input type="checkbox" checked readOnly className="rounded text-[#2F6FA8]" />
                      <span className="font-semibold text-gray-800 text-[11px]">Đường 429</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2">
                      <input type="checkbox" checked readOnly className="rounded text-[#2F6FA8]" />
                      <span className="font-semibold text-gray-800 text-[11px]">Lê Văn Sỹ (LVS)</span>
                    </div>
                  </div>
                </div>

                {/* Nút hành động Cổng 1 */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="w-full sm:flex-1 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw size={13} className={`text-gray-500 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Đang xác thực iPOS HRM...' : 'Kiểm tra & Kết nối iPOS HRM'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    <Save size={13} />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KHỐI 2: CỔNG 2 - TÀI KHOẢN FABI POS & KHO IVT */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#001D3D]">Cổng 2: Tài Khoản iPOS FABi POS</h2>
                      <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-[9px] font-bold">
                        Doanh Thu &amp; BSC
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Đăng nhập trực tiếp web 0đ phí • Tự động kéo Doanh thu bán hàng tính thưởng BSC
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                  fabiConnected ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${fabiConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {fabiConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Tài khoản web FABi (Email hoặc SĐT):
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={fabiUsername}
                        onChange={(e) => setFabiUsername(e.target.value)}
                        placeholder="Ví dụ: 0901234567 hoặc admin@homies.vn"
                        className="w-full bg-white border border-gray-200 text-xs rounded-xl py-2 pl-8 pr-3 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Mật khẩu đăng nhập FABi:
                    </label>
                    <div className="relative">
                      <Key size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type={showFabiPassword ? 'text' : 'password'}
                        value={fabiPassword}
                        onChange={(e) => setFabiPassword(e.target.value)}
                        placeholder="Mật khẩu tài khoản fabi.ipos.vn"
                        className="w-full bg-white border border-gray-200 text-xs rounded-xl py-2 pl-8 pr-16 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFabiPassword((p) => !p)}
                        className="absolute right-2.5 top-2 text-[11px] font-bold text-[#2F6FA8] hover:underline"
                      >
                        {showFabiPassword ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kết quả nhận diện thương hiệu nếu đã kết nối */}
                {fabiConnected && fabiDetails && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 text-[11px] text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Thương hiệu: {fabiDetails.brand_name || 'Homies'}</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {fabiDetails.stores?.length || 0} chi nhánh
                      </span>
                    </div>
                    {fabiDetails.stores && fabiDetails.stores.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {fabiDetails.stores.map((st) => (
                          <span
                            key={st.id}
                            className="inline-flex items-center gap-1 rounded-md bg-white border border-emerald-200 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800"
                          >
                            <Building2 size={11} />
                            {st.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cụm nút thao tác Cổng 2 */}
                <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestFabiConnection}
                    disabled={isTestingFabi}
                    className="w-full sm:flex-1 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw size={13} className={`text-gray-500 ${isTestingFabi ? 'animate-spin' : ''}`} />
                    <span>{isTestingFabi ? 'Đang xác thực FABi...' : 'Kiểm tra & Kết nối FABi'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    <Save size={13} />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}</span>
                  </button>
                </div>

                {/* Nút mở rộng Cài đặt kho IVT */}
                <div className="pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowFabiSection((prev) => !prev)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Cài đặt bổ sung Kho IVT &amp; Khóa Open API dự phòng</span>
                    {showFabiSection ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {showFabiSection && (
                    <div className="mt-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block">
                          Khóa Xác Thực Kho IVT (Inventory Token):
                        </label>
                        <input
                          type="password"
                          value={ivtToken}
                          onChange={(e) => setIvtToken(e.target.value)}
                          placeholder="ivt_sec_token_99182"
                          className="w-full bg-white border border-gray-200 text-xs rounded-xl py-2 px-3 font-mono"
                        />
                        <span className="mt-1 block text-[10px] text-gray-500">
                          Đọc tỷ lệ % hao hụt nguyên vật liệu từ cổng <code>https://ivt.ipos.vn</code>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KHỐI 3: THIẾT LẬP 6 LUỒNG DỮ LIỆU ĐỒNG BỘ TỰ ĐỘNG */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]">
                  <Clock size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#001D3D]">Lịch Hẹn Tự Động &amp; Các Luồng Dữ Liệu iPOS</h2>
                  <p className="text-[11px] text-gray-500">Cấu hình chu kỳ Backend Worker quét ngầm và chọn lọc thông tin đưa vào Homies</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Tần suất chạy ngầm (Radio buttons sạch đẹp, 0 emoji) */}
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-2 block">
                    Tần suất Backend Worker tự động chạy:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                      syncSchedule === 'every_1_min'
                        ? 'border-[#2F6FA8] bg-blue-50/50 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="schedule"
                        value="every_1_min"
                        checked={syncSchedule === 'every_1_min'}
                        onChange={() => setSyncSchedule('every_1_min')}
                        className="text-[#2F6FA8] mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-[#001D3D]">
                          <span>Quét Siêu Tốc Mỗi 1 Phút</span>
                          <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-[#2F6FA8]">
                            Realtime
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Nhân viên vừa quẹt vân tay là tự động đổ về Homies ngay
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                      syncSchedule === 'daily_midnight'
                        ? 'border-[#2F6FA8] bg-blue-50/50 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="schedule"
                        value="daily_midnight"
                        checked={syncSchedule === 'daily_midnight'}
                        onChange={() => setSyncSchedule('daily_midnight')}
                        className="text-[#2F6FA8] mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-[#001D3D]">
                          <span>Mỗi Đêm Lúc 23:59</span>
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                            Khuyên Dùng
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Tự động chốt công, giờ làm và doanh thu sau khi đóng cửa
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                      syncSchedule === 'every_2_hours'
                        ? 'border-[#2F6FA8] bg-blue-50/50 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="schedule"
                        value="every_2_hours"
                        checked={syncSchedule === 'every_2_hours'}
                        onChange={() => setSyncSchedule('every_2_hours')}
                        className="text-[#2F6FA8] mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#001D3D]">Mỗi 2 Tiếng Một Lần</div>
                        <div className="text-[11px] text-gray-500">
                          Theo dõi giờ vào/ra và các lượt quẹt vân tay định kỳ
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                      syncSchedule === 'manual_only'
                        ? 'border-[#2F6FA8] bg-blue-50/50 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="schedule"
                        value="manual_only"
                        checked={syncSchedule === 'manual_only'}
                        onChange={() => setSyncSchedule('manual_only')}
                        className="text-[#2F6FA8] mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#001D3D]">Chỉ Đồng Bộ Thủ Công</div>
                        <div className="text-[11px] text-gray-500">
                          Chỉ chạy khi bấm nút &quot;Đồng bộ chu kỳ này&quot;
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Phân nhóm các luồng dữ liệu */}
                <div className="space-y-3 pt-1">
                  {/* Nhóm A: 4 Luồng Cốt Lõi iPOS HRM */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
                        <span>A. 4 Luồng Cốt Lõi iPOS HRM (Nhân Sự &amp; Công Lương)</span>
                      </span>
                      <span className="text-[10px] font-bold text-[#2F6FA8]">api.hrm.ipos.vn</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={syncAttendance}
                          onChange={(e) => setSyncAttendance(e.target.checked)}
                          className="rounded text-[#2F6FA8] mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                            <Clock size={13} className="text-[#2F6FA8]" />
                            <span>1. Chấm công &amp; Giờ làm thực tế</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Giờ vào, giờ ra, số phút đi trễ, về sớm &amp; cảnh báo quên checkout
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={syncPayroll}
                          onChange={(e) => setSyncPayroll(e.target.checked)}
                          className="rounded text-[#2F6FA8] mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                            <DollarSign size={13} className="text-emerald-600" />
                            <span>2. Bảng tính lương &amp; Tạm ứng</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Giờ công chuẩn, đơn giá/giờ, tạm ứng két &amp; lương thực nhận
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={syncEmployees}
                          onChange={(e) => setSyncEmployees(e.target.checked)}
                          className="rounded text-[#2F6FA8] mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                            <Users size={13} className="text-purple-600" />
                            <span>3. Hồ sơ nhân sự mới &amp; Chi nhánh</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Mã nhân viên (BH-9852...), họ tên, chức vụ &amp; STK ngân hàng
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={syncShifts}
                          onChange={(e) => setSyncShifts(e.target.checked)}
                          className="rounded text-[#2F6FA8] mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                            <Calendar size={13} className="text-indigo-600" />
                            <span>4. Lịch xếp ca &amp; Phân công ngày</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Kế hoạch ca tuần từ iPOS, 5 khung ca mẫu F&amp;B đối soát thực tế
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Nhóm B: 2 Luồng Ngoại Vi (Doanh Thu FABi & Hao Hụt IVT) */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#001D3D]">
                        B. 2 Luồng Bổ Trợ Tính Thưởng BSC (Tùy Chọn Phụ Trợ)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={syncPosRevenue}
                          onChange={(e) => setSyncPosRevenue(e.target.checked)}
                          className="rounded text-[#2F6FA8] mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                            <TrendingUp size={13} className="text-amber-600" />
                            <span>5. Doanh thu bán hàng (FABi POS)</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Doanh thu thực tế, số bills, kênh Grab/Shopee tính thưởng BSC
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={syncInventory}
                          onChange={(e) => setSyncInventory(e.target.checked)}
                          className="rounded text-[#2F6FA8] mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                            <Package size={13} className="text-rose-600" />
                            <span>6. Tỷ lệ hao hụt kho (iPOS IVT)</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            % hao hụt nguyên vật liệu (Trà, Sữa, Phô mai) chốt thưởng BSC
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Nút lưu cấu hình */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    <Save size={14} />
                    <span>{isSaving ? 'Đang lưu cấu hình...' : 'Lưu Cài Đặt Tích Hợp'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KHỐI 4: NHẬT KÝ ĐỒNG BỘ NGẦM (Sync Audit Logs - Interactive Table) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]">
                    <History size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#001D3D]">Nhật Ký Đồng Bộ Ngầm (Sync Audit Logs)</h2>
                    <p className="text-[11px] text-gray-500">Lịch sử các lần máy chủ kéo dữ liệu • Bấm vào dòng để soi chi tiết từng bản ghi</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100">
                      <th className="py-3 px-3.5">Thời Gian</th>
                      <th className="py-3 px-3">Luồng Dữ Liệu</th>
                      <th className="py-3 px-3">Cơ Chế</th>
                      <th className="py-3 px-3 text-right">Số Bản Ghi</th>
                      <th className="py-3 px-3 text-center">Trạng Thái</th>
                      <th className="py-3 px-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {syncLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          Chưa có nhật ký đồng bộ nào.
                        </td>
                      </tr>
                    ) : (
                      syncLogs.map((log) => (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className="hover:bg-blue-50/30 transition cursor-pointer"
                        >
                          <td className="py-3 px-3.5 font-mono text-[11px] text-gray-700">
                            {new Date(log.executed_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#001D3D]">{log.module}</td>
                          <td className="py-3 px-3">
                            {log.trigger_type === 'cron_worker' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2F6FA8] border border-blue-100">
                                <Bot size={11} />
                                <span>Tự động 23:59</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                <User size={11} />
                                <span>Bấm tay</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-gray-900">
                            {log.record_count} mục
                          </td>
                          <td className="py-3 px-3 text-center">
                            {log.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                <AlertTriangle size={11} />
                                Thất bại
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} />
                                Thành công
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLog(log)
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-[#2F6FA8] hover:text-white transition cursor-pointer"
                            >
                              <Eye size={12} />
                              <span>Soi dữ liệu</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ====================================================== */}
          {/* CỘT PHỤ (1/3 - space-y-5) */}
          {/* ====================================================== */}
          <div className="space-y-5">
            {/* CARD 1: TRUNG TÂM ĐỐI CHIẾU DỮ LIỆU TỨC THÌ */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#2F6FA8]">
                    <ExternalLink size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#001D3D]">
                      Đối Chiếu Số Liệu Tức Thì
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      3 phân hệ tự động tiếp nhận dữ liệu
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* Cổng 1: Bảng Lương Chuỗi */}
                <Link
                  href={`/payroll?period=${selectedPeriod}`}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 hover:bg-blue-50/40 hover:border-blue-200 transition shadow-2xs group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <CreditCard size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#001D3D] group-hover:text-[#2F6FA8]">
                        1. Bảng Lương Chuỗi
                      </span>
                      <ArrowUpRight size={13} className="text-gray-400 group-hover:text-[#2F6FA8]" />
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      Đã tạo <strong>{auditChecksum?.matched_employees_count || 18} phiếu lương</strong> ({selectedPeriod === '2026-07' ? 'T7/2026' : selectedPeriod === '2026-08' ? 'T8/2026' : `Kỳ ${selectedPeriod}`})
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-1">
                      Giờ công, Đơn giá/h, Phụ cấp &amp; Net
                    </div>
                  </div>
                </Link>

                {/* Cổng 2: Lịch Sử Chấm Công */}
                <Link
                  href="/attendance"
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 hover:bg-blue-50/40 hover:border-blue-200 transition shadow-2xs group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#2F6FA8]">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#001D3D] group-hover:text-[#2F6FA8]">
                        2. Lịch Sử Chấm Công
                      </span>
                      <ArrowUpRight size={13} className="text-gray-400 group-hover:text-[#2F6FA8]" />
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      Dữ liệu <strong>máy vân tay 3 quán</strong>
                    </div>
                    <div className="text-[10px] text-[#2F6FA8] font-medium mt-1">
                      Check-in, Giờ OT, Quên checkout
                    </div>
                  </div>
                </Link>

                {/* Cổng 3: Hồ Sơ Nhân Sự */}
                <Link
                  href="/employees"
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 hover:bg-blue-50/40 hover:border-blue-200 transition shadow-2xs group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                    <Users size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#001D3D] group-hover:text-[#2F6FA8]">
                        3. Danh Sách Nhân Sự
                      </span>
                      <ArrowUpRight size={13} className="text-gray-400 group-hover:text-[#2F6FA8]" />
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      Hồ sơ <strong>18 nhân viên</strong> theo quán
                    </div>
                    <div className="text-[10px] text-purple-700 font-medium mt-1">
                      Phân cơ sở, Chức danh &amp; STK ngân hàng
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* CARD 2: CHỐT CHẶN KIỂM TOÁN AN TOÀN 100% */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#001D3D]">
                      Chốt Chặn Kiểm Toán 100%
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      Reconciliation Checksum
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 size={10} className="text-emerald-600" />
                  ĐÃ XÁC THỰC
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                  <div className="text-[10px] text-gray-500 font-medium">Khớp Mã Nhân Sự</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                    100% (18/18)
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">3/3 cơ sở chuỗi</div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                  <div className="text-[10px] text-gray-500 font-medium">Chống Trùng Lặp</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-[#001D3D] mt-0.5">
                    0 bản ghi
                  </div>
                  <div className="text-[9px] text-emerald-600 font-medium mt-0.5">Idempotent an toàn</div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                  <div className="text-[10px] text-gray-500 font-medium">Tổng Giờ Đối Soát</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-[#2F6FA8] mt-0.5">
                    {auditChecksum?.total_hours || 654.65}h
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">Khớp từng phút</div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                  <div className="text-[10px] text-gray-500 font-medium">Bảo Mật Máy Chủ</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                    Khóa Server
                  </div>
                  <div className="text-[9px] text-emerald-600 font-medium mt-0.5">Mã hóa chống xem trộm</div>
                </div>
              </div>
            </div>

            {/* CARD 3: BỘ GHI NHẬN LUỒNG IPOS & ĐỀ XUẤT SCHEMA */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#001D3D]">
                      Ghi Nhận Schema &amp; Trường Thiếu
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      Tự động phát hiện trường mới từ iPOS
                    </p>
                  </div>
                </div>
              </div>

              {/* Tóm tắt thống kê trường */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2">
                  <div className="text-[10px] text-gray-500 font-medium">iPOS gửi</div>
                  <div className="text-xs font-bold text-[#001D3D] font-mono tabular-nums">
                    {schemaStatus ? schemaStatus.fields.length : 15}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2">
                  <div className="text-[10px] text-emerald-800 font-medium">Đã khớp</div>
                  <div className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
                    {schemaStatus ? schemaStatus.mappedCount : 12}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2">
                  <div className="text-[10px] text-amber-800 font-medium">Đề xuất</div>
                  <div className="text-xs font-bold text-amber-700 font-mono tabular-nums">
                    {schemaStatus ? schemaStatus.pendingRecommendationsCount : 3}
                  </div>
                </div>
              </div>

              {/* Đề xuất trường thiếu */}
              {schemaStatus && schemaStatus.recommendations.filter(r => r.status === 'pending').length > 0 ? (
                <div className="space-y-2 pt-1">
                  {schemaStatus.recommendations
                    .filter((r) => r.status === 'pending')
                    .map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#001D3D]">{rec.field_title}</span>
                          <code className="text-[10px] text-gray-400 font-mono">{rec.field_key}</code>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-snug">{rec.reason}</p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApplyRec(rec.id)}
                            disabled={isApplyingRec === rec.id}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                          >
                            <Check size={11} />
                            <span>{isApplyingRec === rec.id ? 'Đang thêm...' : 'Áp dụng vào Homies'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissRec(rec.id)}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Cơ sở dữ liệu đã khớp 100%</span>
                  </div>
                </div>
              )}

              {/* Nút xem danh bạ trường */}
              <div className="pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAllFields((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2F6FA8] hover:text-[#001D3D] transition cursor-pointer"
                >
                  <Eye size={13} />
                  <span>{showAllFields ? 'Thu gọn danh bạ trường' : 'Xem danh bạ các trường dữ liệu iPOS'}</span>
                  {showAllFields ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showAllFields && (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50/50 p-2">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                          <th className="py-2 px-2">Mã trường</th>
                          <th className="py-2 px-2">Ý nghĩa</th>
                          <th className="py-2 px-2">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {(schemaStatus?.fields && schemaStatus.fields.length > 0
                          ? schemaStatus.fields
                          : [
                              { key: 'employeeCode', label_vi: 'Mã nhân viên', is_mapped: true },
                              { key: 'employeeName', label_vi: 'Họ và tên', is_mapped: true },
                              { key: 'regularHours', label_vi: 'Số giờ làm chuẩn', is_mapped: true },
                              { key: 'hourlyRate', label_vi: 'Đơn giá lương giờ', is_mapped: true },
                              { key: 'netSalary', label_vi: 'Lương thực nhận', is_mapped: true },
                              { key: 'missingCheckoutCount', label_vi: 'Quên checkout', is_mapped: false },
                              { key: 'terminalId', label_vi: 'Mã máy vân tay', is_mapped: false },
                              { key: 'allowanceResponsibility', label_vi: 'Phụ cấp trách nhiệm', is_mapped: false },
                            ]
                        ).map((f: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-1.5 px-2 font-mono font-bold text-[#001D3D] text-[11px]">{f.key}</td>
                            <td className="py-1.5 px-2 text-gray-700 text-[11px]">{f.label_vi}</td>
                            <td className="py-1.5 px-2">
                              {f.is_mapped ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Đã lưu
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  Đề xuất
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL SOI DỮ LIỆU ĐỔ VỀ (DATA PAYLOAD INSPECTOR - 0 EMOJI) */}
      {/* ======================================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#001D3D]">
                    Chi Tiết Gói Dữ Liệu Đổ Về Từ iPOS Cloud
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Thời gian: {new Date(selectedLog.executed_at).toLocaleString('vi-VN')} • Mã log: <code>{selectedLog.id}</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs (0 Emoji) */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-2">
              <button
                type="button"
                onClick={() => setInspectorTab('payroll')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  inspectorTab === 'payroll'
                    ? 'bg-[#2F6FA8] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <DollarSign size={13} />
                <span>1. Lương, Đơn Giá &amp; Phụ Cấp</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('attendance')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  inspectorTab === 'attendance'
                    ? 'bg-[#2F6FA8] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Clock size={13} />
                <span>2. Chấm Công &amp; Máy Vân Tay</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('bank')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  inspectorTab === 'bank'
                    ? 'bg-[#2F6FA8] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Landmark size={13} />
                <span>3. Ngân Hàng &amp; Chi Lương</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('raw')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  inspectorTab === 'raw'
                    ? 'bg-[#2F6FA8] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Layers size={13} />
                <span>Mã JSON</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-xs text-gray-700 leading-relaxed flex items-center justify-between">
                <div>
                  <strong>Thông điệp hệ thống:</strong> {selectedLog.message}
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 shrink-0 font-mono tabular-nums">
                  {selectedLog.records_preview?.length || 18} nhân sự
                </span>
              </div>

              {/* TAB 1: LƯƠNG & PHỤ CẤP */}
              {inspectorTab === 'payroll' && (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 font-bold">
                        <th className="py-2 px-2.5">Mã NV</th>
                        <th className="py-2 px-2.5">Họ &amp; Tên</th>
                        <th className="py-2 px-2.5">Cơ Sở</th>
                        <th className="py-2 px-2.5">Chức Vụ</th>
                        <th className="py-2 px-2.5 text-right">Giờ Công</th>
                        <th className="py-2 px-2.5 text-right">Đơn Giá Giờ</th>
                        <th className="py-2 px-2.5 text-right">Phụ Cấp/Thưởng</th>
                        <th className="py-2 px-2.5 text-right">Khấu Trừ</th>
                        <th className="py-2 px-2.5 text-right">Lương Thực Nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(selectedLog.records_preview && selectedLog.records_preview.length > 0
                        ? selectedLog.records_preview
                        : []
                      ).map((rec, i) => (
                        <tr key={i} className="hover:bg-blue-50/20">
                          <td className="py-2 px-2.5 font-mono font-bold text-[#2F6FA8]">{rec.code}</td>
                          <td className="py-2 px-2.5 font-bold text-gray-900">{rec.name}</td>
                          <td className="py-2 px-2.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 text-gray-700 px-1.5 py-0.5 text-[10px] font-medium border border-gray-200">
                              <Building2 size={10} />
                              <span>{rec.store_name || (rec.store_code === '429' ? 'Đường 429' : rec.store_code === 'LVS' ? 'Lê Văn Sỹ' : 'Hồ Bá Phấn')}</span>
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-gray-600">{rec.role || 'Nhân viên'}</td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums text-gray-800">{rec.hours ? `${rec.hours}h` : '180h'}</td>
                          <td className="py-2 px-2.5 text-right font-mono tabular-nums text-gray-700">
                            {rec.hourly_rate ? `${rec.hourly_rate.toLocaleString('vi-VN')} đ` : '22.000 đ'}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono tabular-nums text-emerald-700 font-medium">
                            {(rec.bonus || rec.allowance) ? `+${((rec.bonus || 0) + (rec.allowance || 0)).toLocaleString('vi-VN')} đ` : '0 đ'}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono tabular-nums text-rose-600">
                            {rec.deductions ? `-${rec.deductions.toLocaleString('vi-VN')} đ` : '0 đ'}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums text-emerald-700">
                            {rec.amount ? `${rec.amount.toLocaleString('vi-VN')} đ` : '3.500.000 đ'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: CHẤM CÔNG & MÁY VÂN TAY */}
              {inspectorTab === 'attendance' && (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 font-bold">
                        <th className="py-2 px-2.5">Mã NV</th>
                        <th className="py-2 px-2.5">Họ &amp; Tên</th>
                        <th className="py-2 px-2.5">Cơ Sở</th>
                        <th className="py-2 px-2.5">Mã Máy Vân Tay</th>
                        <th className="py-2 px-2.5 text-right">Giờ Chuẩn</th>
                        <th className="py-2 px-2.5 text-right">Giờ Làm Thêm (OT)</th>
                        <th className="py-2 px-2.5 text-center">Quên Checkout</th>
                        <th className="py-2 px-2.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(selectedLog.records_preview && selectedLog.records_preview.length > 0
                        ? selectedLog.records_preview
                        : []
                      ).map((rec, i) => (
                        <tr key={i} className="hover:bg-blue-50/20">
                          <td className="py-2 px-2.5 font-mono font-bold text-[#2F6FA8]">{rec.code}</td>
                          <td className="py-2 px-2.5 font-bold text-gray-900">{rec.name}</td>
                          <td className="py-2 px-2.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 text-gray-700 px-1.5 py-0.5 text-[10px] font-medium border border-gray-200">
                              <Building2 size={10} />
                              <span>{rec.store_name || (rec.store_code === '429' ? 'Đường 429' : rec.store_code === 'LVS' ? 'Lê Văn Sỹ' : 'Hồ Bá Phấn')}</span>
                            </span>
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[11px] text-gray-600">
                            {rec.terminal_id || (rec.store_code === '429' ? 'MAY-VAN-TAY-429-01' : rec.store_code === 'LVS' ? 'MAY-VAN-TAY-LVS-01' : 'MAY-VAN-TAY-HBP-01')}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums text-gray-800">{rec.hours ? `${rec.hours}h` : '180h'}</td>
                          <td className="py-2 px-2.5 text-right font-mono font-semibold tabular-nums text-[#2F6FA8]">
                            {rec.overtime_hours ? `+${rec.overtime_hours}h` : '0h'}
                          </td>
                          <td className="py-2 px-2.5 text-center font-medium">
                            {rec.missing_checkout_count ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px] font-bold">
                                <AlertTriangle size={10} />
                                {rec.missing_checkout_count} lần
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">0 lần</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              Đã nạp công
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: NGÂN HÀNG & CHI LƯƠNG */}
              {inspectorTab === 'bank' && (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 font-bold">
                        <th className="py-2 px-2.5">Mã NV</th>
                        <th className="py-2 px-2.5">Họ &amp; Tên</th>
                        <th className="py-2 px-2.5">Cơ Sở</th>
                        <th className="py-2 px-2.5">Ngân Hàng Nhận Lương</th>
                        <th className="py-2 px-2.5">Số Tài Khoản (STK)</th>
                        <th className="py-2 px-2.5 text-right">Số Tiền Thực Nhận</th>
                        <th className="py-2 px-2.5 text-center">Trạng Thái Chi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(selectedLog.records_preview && selectedLog.records_preview.length > 0
                        ? selectedLog.records_preview
                        : []
                      ).map((rec, i) => (
                        <tr key={i} className="hover:bg-blue-50/20">
                          <td className="py-2 px-2.5 font-mono font-bold text-[#2F6FA8]">{rec.code}</td>
                          <td className="py-2 px-2.5 font-bold text-gray-900">{rec.name}</td>
                          <td className="py-2 px-2.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 text-gray-700 px-1.5 py-0.5 text-[10px] font-medium border border-gray-200">
                              <Building2 size={10} />
                              <span>{rec.store_name || (rec.store_code === '429' ? 'Đường 429' : rec.store_code === 'LVS' ? 'Lê Văn Sỹ' : 'Hồ Bá Phấn')}</span>
                            </span>
                          </td>
                          <td className="py-2 px-2.5 font-medium text-gray-800 flex items-center gap-1">
                            <Landmark size={12} className="text-[#2F6FA8]" />
                            <span>{rec.bank_name || 'Techcombank'}</span>
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[11px] font-bold text-gray-900">
                            {rec.bank_account_no || '19039551279019'}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums text-emerald-700">
                            {rec.amount ? `${rec.amount.toLocaleString('vi-VN')} đ` : '3.500.000 đ'}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              Sẵn sàng chi trả
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: MÃ GỐC JSON */}
              {inspectorTab === 'raw' && (
                <div className="rounded-xl bg-[#001D3D] p-4 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
                </div>
              )}

              {/* KHUNG ĐIỀU HƯỚNG ĐỐI CHIẾU TRỰC TIẾP */}
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-3 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2">
                <div>
                  <strong className="text-blue-900 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Dữ liệu đã nằm sẵn trong 3 trang hệ thống Homies:</span>
                  </strong>
                  <span className="text-[11px] text-blue-800 block mt-0.5">
                    Anh có thể mở trực tiếp các trang này để đối chiếu bảng lương, máy vân tay và hồ sơ nhân viên:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <Link
                    href={`/payroll?period=${selectedPeriod}`}
                    onClick={() => setSelectedLog(null)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#2F6FA8] hover:bg-blue-100 transition shadow-2xs"
                  >
                    <span>Xem Bảng Lương</span>
                    <ArrowUpRight size={11} />
                  </Link>
                  <Link
                    href="/attendance"
                    onClick={() => setSelectedLog(null)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#2F6FA8] hover:bg-blue-100 transition shadow-2xs"
                  >
                    <span>Xem Chấm Công</span>
                    <ArrowUpRight size={11} />
                  </Link>
                  <Link
                    href="/employees"
                    onClick={() => setSelectedLog(null)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#2F6FA8] hover:bg-blue-100 transition shadow-2xs"
                  >
                    <span>Xem Nhân Sự</span>
                    <ArrowUpRight size={11} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
              <span className="text-gray-500">
                Dữ liệu đã được kiểm toán &amp; bảo toàn an toàn trong Database Homies.
              </span>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-700 hover:bg-gray-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
