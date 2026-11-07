'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  Filter,
  MessageSquare,
  Plus,
  Share2,
  ShieldAlert,
  Sliders,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import AppShell from '@/components/layout/AppShell'
import { useMounted } from '@/hooks/useMounted'
import KPIIncidentDrawer, {
  type KPIIncidentOption,
  type KPIIncidentViolationOption,
} from '@/components/kpi/incidents/KPIIncidentDrawer'
import KPIIncidentTable, { type KPIIncidentRow } from '@/components/kpi/incidents/KPIIncidentTable'
import AuthorizedVerifiersModal from '@/components/kpi/incidents/AuthorizedVerifiersModal'
import StoreOperationIncidentModal from '@/components/kpi/incidents/StoreOperationIncidentModal'
import IncidentCatalogSettingsModal from '@/components/kpi/incidents/IncidentCatalogSettingsModal'
import { kpiBscSyncService } from '@/lib/services/kpi-bsc-sync-service'
import { useAuthStore } from '@/store/auth-store'
import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import { canKpi } from '@/lib/kpi/permissions'
import { calculateIncidentImpact, type KpiIncidentPolicy } from '@/lib/kpi/incident-service'
import type { KpiActor, KpiDatabase, KpiIncident } from '@/lib/kpi/types'
import { mockEmployees, mockStores } from '@/lib/mock-data'

const INCIDENT_POLICY: KpiIncidentPolicy = {
  criterion_mappings: {
    attendance_late: 'attendance_integrity',
    attendance_no_show: 'attendance_integrity',
    wrong_topping: 'product_execution',
    hygiene_breach: 'product_execution',
    cash_shortage: 'discipline_execution',
    customer_complaint: 'service_recovery',
  },
  manager_accountability_allowed_codes: ['cash_shortage', 'attendance_no_show'],
}

const VIOLATION_OPTIONS: KPIIncidentViolationOption[] = [
  { code: 'attendance_late', label: 'Đi trễ / chấm giờ trễ', note: 'Nguồn chấm công attendance' },
  { code: 'attendance_no_show', label: 'Bỏ ca / vắng mặt không báo', note: 'Lỗi nặng liên quan kỷ luật' },
  { code: 'wrong_topping', label: 'Sai topping / sai thành phẩm', note: 'Lỗi thao tác và chất lượng sản phẩm' },
  { code: 'hygiene_breach', label: 'Vi phạm vệ sinh / an toàn', note: 'Ảnh hưởng tiêu chuẩn SOP và VSATTP' },
  { code: 'cash_shortage', label: 'Thiếu tiền / sai két ca', note: 'Liên quan bàn giao tiền và tài sản' },
  { code: 'customer_complaint', label: 'Phàn nàn của khách hàng', note: 'Sự cố trực tiếp từ phản ánh khách hàng' },
]

export default function KpiViolationsPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const mounted = useMounted()

  const [database, setDatabase] = useState<KpiDatabase | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('2026-09')
  const [selectedStoreId, setSelectedStoreId] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | KpiIncident['status']>('all')
  const [drawerMode, setDrawerMode] = useState<'create' | 'detail'>('detail')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<KpiIncident | null>(null)
  const [editingIncident, setEditingIncident] = useState<{
    id: string
    store_id: string
    period?: string
    target_type?: 'store_operation' | 'individual_discipline'
    employee_id?: string
    employee_name?: string
    error_id: string
    error_name?: string
    custom_title?: string
    penalty_points: number
    occurred_at: string
    shift_name?: string
    order_code?: string
    evidence_note?: string
    verifier_name?: string
    impact_rating_1star?: boolean
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isVerifiersModalOpen, setIsVerifiersModalOpen] = useState(false)
  const [isStoreOpModalOpen, setIsStoreOpModalOpen] = useState(false)
  const [isCatalogSettingsOpen, setIsCatalogSettingsOpen] = useState(false)
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false)
  const utilitiesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (utilitiesRef.current && !utilitiesRef.current.contains(event.target as Node)) {
        setIsUtilitiesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const actor = useMemo<KpiActor | null>(() => {
    if (!user) return null

    return {
      id: user.id,
      role: user.role as KpiActor['role'],
      store_id: user.store_id,
    }
  }, [user])

  const canAccess = actor ? actor.role !== 'employee' : false
  const canCreate = actor ? canKpi(actor.role, 'log_incident') : false

  // ── Mở khóa hydration an toàn tránh kẹt vòng xoay tải ──
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().hasHydrated) {
        useAuthStore.setState({ hasHydrated: true })
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/violations')
    }
  }, [hasHydrated, isAuthenticated, router])

  const refreshData = useCallback(async () => {
    const db = await kpiAdapter.getDatabase()
    setDatabase(db)

    const nowMonth = new Date().toISOString().slice(0, 7)
    const incidentMonths = (db.incidents || []).map((inc) => inc.occurred_at.slice(0, 7))
    const periodMonths = (db.periods || []).map((period) => period.month)
    const sortedMonths = Array.from(new Set([...incidentMonths, ...periodMonths, nowMonth, '2026-09', '2026-08'])).sort().reverse()
    
    // Nếu tháng hiện tại chưa có hồ sơ nào, tự động chọn tháng gần nhất có dữ liệu
    const monthsWithIncidents = sortedMonths.filter((m) => (db.incidents || []).some((inc) => inc.occurred_at.startsWith(m)))
    const bestMonth = monthsWithIncidents[0] || sortedMonths[0] || '2026-08'

    setSelectedMonth((current) => {
      if (current && (db.incidents || []).some((inc) => inc.occurred_at.startsWith(current))) {
        return current
      }
      return bestMonth
    })
  }, [])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user || !canAccess) return

    const timer = window.setTimeout(() => {
      void refreshData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [canAccess, hasHydrated, isAuthenticated, refreshData, user])

  const periodOptions = useMemo(() => {
    const nowMonth = new Date().toISOString().slice(0, 7)
    const monthsFromPeriods = (database?.periods ?? []).map((period) => period.month)
    const monthsFromIncidents = (database?.incidents ?? []).map((inc) => inc.occurred_at.slice(0, 7))
    const months = Array.from(new Set([...monthsFromPeriods, ...monthsFromIncidents, nowMonth, '2026-09', '2026-08', '2026-07'])).sort().reverse()
    return months
  }, [database])

  const storeOptions = useMemo<KPIIncidentOption[]>(() => (
    mockStores.map((store) => ({ id: store.id, label: store.name }))
  ), [])

  const employeeOptions = useMemo<KPIIncidentOption[]>(() => (
    mockEmployees
      .filter((employee) => employee.status !== 'inactive')
      .map((employee) => ({
        id: employee.id,
        label: employee.full_name,
        note: `${getStoreName(employee.store_id)} • ${employee.role}`,
      }))
  ), [])

  const visibleIncidents = useMemo(() => {
    if (!database || !actor) return []

    return database.incidents.filter((incident) => {
      if (!incident.occurred_at.startsWith(selectedMonth)) return false
      if (selectedStatus !== 'all' && incident.status !== selectedStatus) return false

      if (actor.role === 'ceo' || actor.role === 'area_manager' || actor.role === 'hr_admin') {
        return selectedStoreId === 'all' ? true : incident.store_id === selectedStoreId
      }

      return incident.store_id === actor.store_id
    })
  }, [actor, database, selectedMonth, selectedStatus, selectedStoreId])

  const incidentRows = useMemo<KPIIncidentRow[]>(() => (
    visibleIncidents
      .map((incident) => {
        const impact = calculateIncidentImpact(incident, INCIDENT_POLICY)
        const primary = incident.violations.find((violation) => violation.primary)

        const severity: KPIIncidentRow['severity'] =
          impact.promotion_block_months >= 3 || impact.suggested_score === 1 ? 'serious' : 'normal'

        return {
          incident,
          storeLabel: getStoreName(incident.store_id),
          employeeLabel: getEmployeeName(incident.employee_id),
          primaryViolationLabel: getViolationLabel(primary?.code),
          impactLabel: impact.promotion_block_months > 0
            ? `Chặn thăng bậc ${impact.promotion_block_months} tháng`
            : impact.suggested_score === undefined
            ? 'Chỉ cảnh báo'
            : `Gợi ý điểm ${impact.suggested_score}/5`,
          severity,
        }
      })
      .sort((a, b) => b.incident.occurred_at.localeCompare(a.incident.occurred_at))
  ), [visibleIncidents])

  const handleEditIncident = useCallback((incident: KpiIncident) => {
    const isEmp = incident.employee_id && incident.employee_id !== 'all_store_staff'
    const violation = incident.violations?.[0]
    setEditingIncident({
      id: incident.id,
      store_id: incident.store_id,
      period: incident.occurred_at?.slice(0, 7) || selectedMonth,
      target_type: isEmp ? 'individual_discipline' : 'store_operation',
      employee_id: isEmp ? incident.employee_id : undefined,
      employee_name: isEmp ? getEmployeeName(incident.employee_id) : undefined,
      error_id: violation?.code || 'PER-OTHER',
      error_name: violation?.reason || incident.description,
      custom_title: incident.description,
      penalty_points: 1,
      occurred_at: incident.occurred_at,
      shift_name: 'Ca làm việc',
      order_code: '',
      evidence_note: incident.description,
      verifier_name: user?.full_name || user?.email || 'Quản lý',
      impact_rating_1star: incident.violations.some((v) => v.reason?.includes('1 sao') || v.reason?.includes('khiếu nại')),
    })
    setIsStoreOpModalOpen(true)
  }, [selectedMonth, user])

  if (!mounted) {
    return (
      <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2F6FA8] border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !canAccess) {
    return (
      <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
        <div className="flex items-center justify-center min-h-[50vh] text-xs font-semibold text-gray-500">
          Đang xác thực quyền truy cập...
        </div>
      </AppShell>
    )
  }

  async function handleCreateIncident(payload: { incident: KpiIncident }) {
    if (!database || !actor) return

    setErrorMessage(null)
    setIsSaving(true)

    try {
      const periodId = database.periods.find((period) => (
        period.month === selectedMonth && period.store_id === payload.incident.store_id
      ))?.id

      const nextIncident: KpiIncident = {
        ...payload.incident,
        period_id: periodId,
      }

      const nextDatabase: KpiDatabase = {
        ...database,
        revision: database.revision + 1,
        incidents: [...database.incidents, nextIncident],
        audit_logs: [
          ...database.audit_logs,
          {
            id: `audit_incident_${nextIncident.id}`,
            entity_type: 'kpi_incident',
            entity_id: nextIncident.id,
            action: 'create',
            actor_id: actor.id,
            new_value: nextIncident,
            created_at: new Date().toISOString(),
          },
        ],
      }

      const saved = await kpiAdapter.repository.save(nextDatabase, database.revision)
      setDatabase(saved)

      // Đồng bộ tức thì sang trừ điểm BSC cá nhân nếu có employee_id
      try {
        if (payload.incident.employee_id && payload.incident.employee_id !== 'all_store_staff') {
          const violationCode = payload.incident.violations[0]?.code || 'ATT-01'
          const desc = payload.incident.description || payload.incident.violations[0]?.reason || 'Vi phạm kỷ luật'
          await kpiBscSyncService.logIncident({
            employee_id: payload.incident.employee_id,
            store_id: payload.incident.store_id,
            period: selectedMonth,
            occurred_at: payload.incident.occurred_at,
            violation_code: violationCode,
            description: desc,
            penalty_points: 1,
            logged_by: user?.full_name || 'Quản lý',
            logged_by_role: actor.role || 'manager',
            is_operation_error: false,
          })
        }
      } catch (syncErr) {
        console.warn('[KPI Violations] Sync to BSC warning:', syncErr)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể lưu hồ sơ sự cố')
    } finally {
      setIsSaving(false)
    }
  }

  function openCreateDrawer() {
    setSelectedIncident(null)
    setDrawerMode('create')
    setDrawerOpen(true)
  }

  function openDetailDrawer(incident: KpiIncident) {
    setSelectedIncident(incident)
    setDrawerMode('detail')
    setDrawerOpen(true)
  }

  return (
    <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
      <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3 shadow-2xs sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Cột trái: Breadcrumb + Tiêu đề gọn gàng */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/kpi" className="transition hover:text-[#2F6FA8]">Điều hành KPI</Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Hồ sơ sự cố</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-[#001D3D] sm:text-lg">
                Hồ sơ sự cố vận hành và kỷ luật
              </h1>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Chuẩn KPI &amp; BSC
              </span>
            </div>
          </div>

          {/* Cột phải: Thanh công cụ gom gọn trên 1 dòng duy nhất */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Bộ lọc tháng */}
            <div className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 shrink-0">
              <Filter size={13} className="text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                {periodOptions.map((month) => (
                  <option key={month} value={month}>{formatMonth(month)}</option>
                ))}
              </select>
            </div>

            {/* Bộ lọc chi nhánh (nếu có quyền) */}
            {(actor?.role === 'ceo' || actor?.role === 'area_manager' || actor?.role === 'hr_admin') ? (
              <div className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 shrink-0">
                <ShieldAlert size={13} className="text-gray-400" />
                <select
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(event.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="all">Tất cả quán</option>
                  {storeOptions.map((store) => (
                    <option key={store.id} value={store.id}>{store.label}</option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Nút chia sẻ link Leader nhanh */}
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/kpi/violations/public`
                navigator.clipboard.writeText(url)
                toast.success('Đã sao chép link Leader: ' + url)
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100 transition cursor-pointer shrink-0"
              title="Sao chép link Leader nhập sự cố trên điện thoại"
            >
              <Share2 size={13} className="text-amber-700" />
              <span>Link Leader</span>
            </button>

            {/* Menu Tiện ích (Gom gọn các công cụ quản trị vào 1 menu thông minh) */}
            <div className="relative shrink-0" ref={utilitiesRef}>
              <button
                type="button"
                onClick={() => setIsUtilitiesOpen((prev) => !prev)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 transition cursor-pointer"
                title="Các công cụ quản trị và cài đặt khác"
              >
                <Sliders size={13} className="text-[#2F6FA8]" />
                <span>Tiện ích</span>
                <ChevronDown size={12} className={`text-gray-400 transition-transform ${isUtilitiesOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUtilitiesOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUtilitiesOpen(false)
                      setIsVerifiersModalOpen(true)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
                  >
                    <UserCheck size={14} className="text-emerald-700 shrink-0" />
                    <span>Phân quyền người nhập &amp; PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUtilitiesOpen(false)
                      setIsCatalogSettingsOpen(true)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition cursor-pointer"
                  >
                    <Sliders size={14} className="text-amber-600 shrink-0" />
                    <span>Cài đặt danh mục &amp; Điểm phạt</span>
                  </button>

                  <Link
                    href="/kpi/violations/appeals"
                    onClick={() => setIsUtilitiesOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-800 transition cursor-pointer"
                  >
                    <MessageSquare size={14} className="text-purple-600 shrink-0" />
                    <span>Hàng đợi khiếu nại</span>
                  </Link>

                  <Link
                    href="/settings/bsc?tab=penalties"
                    onClick={() => setIsUtilitiesOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2F6FA8] transition cursor-pointer"
                  >
                    <Sliders size={14} className="text-[#2F6FA8] shrink-0" />
                    <span>Cài đặt khung lỗi BSC</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Nút hành động chính: Ghi Nhận Sự Cố */}
            {canCreate ? (
              <button
                type="button"
                onClick={() => {
                  setEditingIncident(null)
                  setIsStoreOpModalOpen(true)
                }}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1D3E61] cursor-pointer shrink-0"
                title="Ghi nhận sự cố vận hành quán hoặc lỗi kỷ luật cá nhân"
              >
                <Plus size={14} />
                <span>Ghi Nhận Sự Cố</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="w-full space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <MetricCard label="Tổng hồ sơ trong bộ lọc" value={String(incidentRows.length)} note="Tất cả hồ sơ sự cố đang hiển thị" />
          <MetricCard
            label="Chờ xác nhận / khiếu nại"
            value={String(incidentRows.filter((row) => ['proposed', 'appealed'].includes(row.incident.status)).length)}
            note="Cần Leader / Quản lý xử lý tiếp"
          />
          <MetricCard
            label="Lỗi nặng / liệt"
            value={String(incidentRows.filter((row) => row.severity === 'serious').length)}
            note="Có nguy cơ khóa thăng bậc hoặc trừ điểm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'proposed', label: 'Chờ duyệt' },
            { id: 'confirmed', label: 'Đã duyệt' },
            { id: 'appealed', label: 'Đang khiếu nại' },
            { id: 'finalized', label: 'Đã chốt' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedStatus(item.id as 'all' | KpiIncident['status'])}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedStatus === item.id
                  ? 'bg-[#2F6FA8] text-white shadow-2xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <KPIIncidentTable
          rows={incidentRows}
          onSelect={openDetailDrawer}
          onEdit={handleEditIncident}
        />

        <KPIIncidentDrawer
          open={drawerOpen}
          mode={drawerMode}
          actor={actor ?? { id: 'unknown', role: 'hr_admin' }}
          incident={selectedIncident}
          initialStoreId={selectedStoreId === 'all' ? actor?.store_id : selectedStoreId}
          stores={storeOptions}
          employees={employeeOptions}
          violationOptions={VIOLATION_OPTIONS}
          policy={INCIDENT_POLICY}
          onClose={() => setDrawerOpen(false)}
          onEdit={handleEditIncident}
          onSubmit={async ({ incident }) => {
            await handleCreateIncident({ incident })
          }}
        />

        {isSaving ? (
          <div className="text-xs font-medium text-gray-500">Đang lưu hồ sơ sự cố...</div>
        ) : null}

        <AuthorizedVerifiersModal
          isOpen={isVerifiersModalOpen}
          onClose={() => setIsVerifiersModalOpen(false)}
        />

        {/* Modal Ghi Nhận Lỗi Vận Hành & Cá Nhân (1 Form Thống Nhất Auto BSC & KPI) */}
        <StoreOperationIncidentModal
          isOpen={isStoreOpModalOpen}
          onClose={() => {
            setIsStoreOpModalOpen(false)
            setEditingIncident(null)
          }}
          onSuccess={() => void refreshData()}
          defaultStoreId={actor?.store_id || selectedStoreId}
          defaultPeriod={selectedMonth}
          editingIncident={editingIncident}
        />

        {/* Modal Cài Đặt Danh Mục Lỗi & Điểm Phạt F&B (Full Button Suite) */}
        <IncidentCatalogSettingsModal
          isOpen={isCatalogSettingsOpen}
          onClose={() => setIsCatalogSettingsOpen(false)}
          onUpdate={() => void refreshData()}
        />
      </div>
    </AppShell>
  )
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-2xs">
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <div className="mt-2 text-2xl font-bold text-[#001D3D]">{value}</div>
      <div className="mt-2 text-[11px] text-gray-500">{note}</div>
    </div>
  )
}

function getStoreName(storeId: string) {
  return mockStores.find((store) => store.id === storeId)?.name ?? storeId
}

function getEmployeeName(employeeId: string) {
  return mockEmployees.find((employee) => employee.id === employeeId)?.full_name ?? employeeId
}

function getViolationLabel(code?: string) {
  return VIOLATION_OPTIONS.find((option) => option.code === code)?.label ?? (code ?? 'Chưa rõ')
}

function formatMonth(month: string) {
  return `Tháng ${month.slice(5)}/${month.slice(0, 4)}`
}
