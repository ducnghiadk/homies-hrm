'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  Filter,
  Plus,
  ShieldAlert,
  Sliders,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import KPIIncidentDrawer, {
  type KPIIncidentOption,
  type KPIIncidentViolationOption,
} from '@/components/kpi/incidents/KPIIncidentDrawer'
import KPIIncidentTable, { type KPIIncidentRow } from '@/components/kpi/incidents/KPIIncidentTable'
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
  { code: 'attendance_late', label: 'Di tre / cham gio tre', note: 'Nguon attendance' },
  { code: 'attendance_no_show', label: 'Bo ca / vang mat khong bao', note: 'Loi nang lien quan ky luat' },
  { code: 'wrong_topping', label: 'Sai topping / sai thanh pham', note: 'Loi thao tac va san pham' },
  { code: 'hygiene_breach', label: 'Vi pham ve sinh / an toan', note: 'Anh huong chat luong va SOP' },
  { code: 'cash_shortage', label: 'Thieu tien / sai ket ca', note: 'Lien quan ban giao va tai san' },
  { code: 'customer_complaint', label: 'Phan nan khach hang', note: 'Chi tach ra neu co hanh vi doc lap' },
]

export default function KpiViolationsPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()

  const [database, setDatabase] = useState<KpiDatabase | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('2026-08')
  const [selectedStoreId, setSelectedStoreId] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | KpiIncident['status']>('all')
  const [drawerMode, setDrawerMode] = useState<'create' | 'detail'>('detail')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<KpiIncident | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/violations')
    }
  }, [hasHydrated, isAuthenticated, router])

  const refreshData = useCallback(async () => {
    const db = await kpiAdapter.getDatabase()
    setDatabase(db)

    if (db.periods.length > 0) {
      const sortedMonths = Array.from(new Set(db.periods.map((period) => period.month))).sort().reverse()
      setSelectedMonth((current) => current || sortedMonths[0] || '2026-08')
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user || !canAccess) return

    const timer = window.setTimeout(() => {
      void refreshData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [canAccess, hasHydrated, isAuthenticated, refreshData, user])

  const periodOptions = useMemo(() => {
    const months = Array.from(new Set((database?.periods ?? []).map((period) => period.month))).sort().reverse()
    return months.length > 0 ? months : ['2026-08']
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
            ? `Chan thang bac ${impact.promotion_block_months} thang`
            : impact.suggested_score === undefined
            ? 'Chi canh bao'
            : `Goi y diem ${impact.suggested_score}/5`,
          severity,
        }
      })
      .sort((a, b) => b.incident.occurred_at.localeCompare(a.incident.occurred_at))
  ), [visibleIncidents])

  if (!hasHydrated || !user) return null
  if (!canAccess) return null

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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the luu ho so su co')
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
      <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3.5 shadow-2xs sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/kpi" className="transition hover:text-[#2F6FA8]">Dieu hanh KPI</Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Ho so su co</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                Ho so su co van hanh va ky luat
              </h1>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Route canonical
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Khong dung mock violation cu. Tat ca ho so moi se luu ve kho KPI local-first.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-h-[36px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
              <Filter size={13} className="text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none"
              >
                {periodOptions.map((month) => (
                  <option key={month} value={month}>{formatMonth(month)}</option>
                ))}
              </select>
            </div>

            {(actor?.role === 'ceo' || actor?.role === 'area_manager' || actor?.role === 'hr_admin') ? (
              <div className="flex min-h-[36px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
                <ShieldAlert size={13} className="text-gray-400" />
                <select
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(event.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none"
                >
                  <option value="all">Tat ca cua hang</option>
                  {storeOptions.map((store) => (
                    <option key={store.id} value={store.id}>{store.label}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <Link
              href="/kpi/violations/appeals"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50"
            >
              <span>Queue khieu nai</span>
            </Link>

            <Link
              href="/kpi/violations/settings"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50"
            >
              <Sliders size={13} className="text-[#2F6FA8]" />
              <span>Cau hinh khung loi</span>
            </Link>

            {canCreate ? (
              <button
                type="button"
                onClick={openCreateDrawer}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#D9381E] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#b62d17]"
              >
                <Plus size={14} />
                <span>Tao ho so su co</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="w-full space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <MetricCard label="Tong ho so trong bo loc" value={String(incidentRows.length)} note="Tat ca ho so su co dang hien" />
          <MetricCard
            label="Cho xac nhan / khieu nai"
            value={String(incidentRows.filter((row) => ['proposed', 'appealed'].includes(row.incident.status)).length)}
            note="Can leader / CEO xu ly tiep"
          />
          <MetricCard
            label="Loi nang / liet"
            value={String(incidentRows.filter((row) => row.severity === 'serious').length)}
            note="Co nguy co khoa thang bac hoac diem rat thap"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xs">
          {(['all', 'proposed', 'confirmed', 'appealed', 'finalized'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedStatus === status
                  ? 'bg-[#2F6FA8] text-white shadow-2xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'Tat ca' : status}
            </button>
          ))}
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <KPIIncidentTable rows={incidentRows} onSelect={openDetailDrawer} />

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
          onSubmit={async ({ incident }) => {
            await handleCreateIncident({ incident })
          }}
        />

        {isSaving ? (
          <div className="text-xs font-medium text-gray-500">Dang luu ho so su co...</div>
        ) : null}
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
  return VIOLATION_OPTIONS.find((option) => option.code === code)?.label ?? (code ?? 'Chua ro')
}

function formatMonth(month: string) {
  return `Thang ${month.slice(5)}/${month.slice(0, 4)}`
}
