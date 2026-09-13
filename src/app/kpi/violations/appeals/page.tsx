'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ChevronRight,
  Clock3,
  MessageSquare,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import KPIIncidentAppealQueue, {
  type KPIIncidentAppealQueueItem,
} from '@/components/kpi/incidents/KPIIncidentAppealQueue'
import { useAuthStore } from '@/store/auth-store'
import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import {
  decideIncidentAppeal,
  type IncidentAppealDecisionInput,
  type IncidentAppealPolicy,
} from '@/lib/kpi/appeal-service'
import { canKpi } from '@/lib/kpi/permissions'
import { calculateIncidentImpact } from '@/lib/kpi/incident-service'
import type { KpiActor, KpiDatabase } from '@/lib/kpi/types'
import { mockEmployees, mockStores } from '@/lib/mock-data'

const INCIDENT_POLICY: IncidentAppealPolicy & {
  criterion_mappings: Record<string, string>
} = {
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

export default function IncidentAppealsPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()

  const [database, setDatabase] = useState<KpiDatabase | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState('store_001')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  const actor = useMemo<KpiActor | null>(() => {
    if (!user) return null

    return {
      id: user.id,
      role: user.role as KpiActor['role'],
      store_id: user.store_id,
    }
  }, [user])

  const canAccess = actor ? actor.role !== 'employee' : false
  const canDecide = actor ? canKpi(actor.role, 'triage_appeal') && actor.role === 'ceo' : false

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/violations/appeals')
    }
  }, [hasHydrated, isAuthenticated, router])

  const refreshData = useCallback(async () => {
    const db = await kpiAdapter.getDatabase()
    setDatabase(db)

    if (!selectedStoreId && db.periods[0]?.store_id) {
      setSelectedStoreId(db.periods[0].store_id)
    }
  }, [selectedStoreId])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user || !canAccess) return

    const timer = window.setTimeout(() => {
      void refreshData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [canAccess, hasHydrated, isAuthenticated, refreshData, user])

  const items = useMemo<KPIIncidentAppealQueueItem[]>(() => {
    if (!database) return []

    return database.appeals
      .filter((appeal) => appeal.type === 'incident')
      .filter((appeal) => {
        const incident = database.incidents.find((item) => item.id === appeal.reference_id)
        if (!incident) return false
        return selectedStoreId ? incident.store_id === selectedStoreId : true
      })
      .map((appeal) => {
        const incident = database.incidents.find((item) => item.id === appeal.reference_id)!
        const primary = incident.violations.find((violation) => violation.primary)
        const impact = calculateIncidentImpact(incident, INCIDENT_POLICY)
        const auditTrail = database.audit_logs
          .filter((log) => log.entity_id === incident.id || log.entity_id === appeal.id)
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((log) => `${formatDateTime(log.created_at)} • ${log.action} • ${log.reason ?? 'Khong co ghi chu'}`)

        return {
          appeal,
          incident,
          employeeLabel: getEmployeeName(incident.employee_id),
          storeLabel: getStoreName(incident.store_id),
          primaryViolationLabel: primary ? primary.code : 'Chua ro',
          currentImpactLabel: impact.promotion_block_months > 0
            ? `Chan thang bac ${impact.promotion_block_months} thang`
            : impact.suggested_score === undefined
            ? 'Chi canh bao'
            : `Goi y diem ${impact.suggested_score}/5`,
          deadlineLabel: buildDeadlineLabel(appeal.deadline_at),
          overdue: new Date(appeal.deadline_at).getTime() < now,
          auditTrail,
        }
      })
      .sort((a, b) => a.appeal.submitted_at.localeCompare(b.appeal.submitted_at))
  }, [database, now, selectedStoreId])

  if (!hasHydrated || !user) return null
  if (!canAccess) return null

  async function handleDecision(item: KPIIncidentAppealQueueItem, decision: IncidentAppealDecisionInput) {
    if (!database || !actor) return

    setErrorMessage(null)

    try {
      const result = decideIncidentAppeal(item.incident, item.appeal, decision, actor, INCIDENT_POLICY)

      const nextDatabase: KpiDatabase = {
        ...database,
        revision: database.revision + 1,
        incidents: database.incidents.map((incident) => (
          incident.id === item.incident.id ? result.incident : incident
        )),
        appeals: database.appeals.map((appeal) => (
          appeal.id === item.appeal.id ? result.appeal : appeal
        )),
        audit_logs: [
          ...database.audit_logs,
          {
            id: `audit_incident_appeal_${item.appeal.id}_${Date.now()}`,
            entity_type: 'kpi_incident_appeal',
            entity_id: item.appeal.id,
            action: `decide_${decision.result}`,
            actor_id: actor.id,
            old_value: {
              appeal_status: item.appeal.status,
              incident_status: item.incident.status,
            },
            new_value: {
              appeal_status: result.appeal.status,
              incident_status: result.incident.status,
              impact_override: result.impact_override,
            },
            reason: result.audit_note,
            created_at: new Date().toISOString(),
          },
        ],
      }

      const saved = await kpiAdapter.repository.save(nextDatabase, database.revision)
      setDatabase(saved)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the luu quyet dinh khiếu nai')
      throw error
    }
  }

  return (
    <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
      <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3.5 shadow-2xs sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/kpi/violations" className="transition hover:text-[#2F6FA8]">Ho so su co</Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Queue khiếu nai incident</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                Queue CEO xet duyet khiếu nai su co
              </h1>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                SLA 48 gio
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Ngay hom nay la 22/08/2026. Cac ho so qua han se hien canh bao ngay trong queue.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-h-[36px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
              <Building2 size={13} className="text-gray-400" />
              <select
                value={selectedStoreId}
                onChange={(event) => setSelectedStoreId(event.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none"
              >
                {mockStores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            <Link
              href="/kpi/violations"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50"
            >
              <ArrowLeft size={14} />
              <span>Ve ho so su co</span>
            </Link>

            <Link
              href="/bsc-bonus?tab=audit_report"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50"
            >
              <BarChart3 size={14} className="text-[#2F6FA8]" />
              <span>Thuong BSC</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <MetricCard label="Tong ho so incident appeal" value={String(items.length)} note="Cung cua hang dang chon" />
          <MetricCard label="Cho CEO quyet dinh" value={String(items.filter((item) => item.appeal.status === 'submitted').length)} note="Trang thai submitted" />
          <MetricCard label="Dang xem xet" value={String(items.filter((item) => item.appeal.status === 'reviewing').length)} note="Trang thai reviewing" />
          <MetricCard label="Qua han 48h" value={String(items.filter((item) => item.overdue).length)} note="Can xu ly truoc tien" />
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-2xs">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 font-bold text-[#2F6FA8]">
              <MessageSquare size={13} />
              <span>Bang chung hai ben se hien tren tung item</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 font-bold text-amber-800">
              <Clock3 size={13} />
              <span>Decision bat buoc co note</span>
            </span>
          </div>
        </div>

        <KPIIncidentAppealQueue items={items} canDecide={canDecide} onDecide={handleDecision} />
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

function buildDeadlineLabel(deadlineAt: string) {
  const diffHours = Math.round((new Date(deadlineAt).getTime() - Date.now()) / 3600000)
  if (diffHours < 0) return `Qua han ${Math.abs(diffHours)}h`
  return `Con ${diffHours}h den han`
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN')
}
