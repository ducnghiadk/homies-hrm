'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Layers3,
  Lock,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import { canKpi } from '@/lib/kpi/permissions'
import { approvePeriodReopen, createKpiPeriod, requestPeriodReopen, transitionPeriod } from '@/lib/kpi/period-service'
import { validateEvaluationSubmission } from '@/lib/kpi/evaluation-service'
import type { KpiActor, KpiDatabase, KpiPeriod, KpiReopenRequest, KpiSetVersion } from '@/lib/kpi/types'
import KPICreatePeriodDrawer, { type PeriodEmployeeOption } from '@/components/kpi/periods/KPICreatePeriodDrawer'
import KPIPeriodTable, { type KPIPeriodRow } from '@/components/kpi/periods/KPIPeriodTable'
import KPIApprovalQueue, { type KPIApprovalQueueItem } from '@/components/kpi/workspace/KPIApprovalQueue'
import KPIReopenDialog from '@/components/kpi/workspace/KPIReopenDialog'
import { mockStores } from '@/lib/mock-data'

type DrawerMode = 'create' | 'detail'

export default function KpiPeriodsPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()

  const [database, setDatabase] = useState<KpiDatabase | null>(null)
  const [periodRows, setPeriodRows] = useState<KPIPeriodRow[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('detail')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)
  const [reopenPending, setReopenPending] = useState(false)

  const actor = useMemo<KpiActor | null>(() => {
    if (!user) return null

    return {
      id: user.id,
      role: user.role as KpiActor['role'],
      store_id: user.store_id,
    }
  }, [user])

  const canAccess = actor ? ['hr_admin', 'ceo', 'area_manager'].includes(actor.role) : false

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/periods')
    }
  }, [hasHydrated, isAuthenticated, router])

  const refreshData = useCallback(async () => {
    const db = await kpiAdapter.getDatabase()
    setDatabase(db)

    const nextRows = await Promise.all(
      db.periods.map(async (period) => {
        const missingSourceCount = await countMissingSources(period)
        const reviews = db.evaluations.filter((evaluation) => evaluation.period_id === period.id)
        const completedReviews = reviews.filter((evaluation) => ['submitted', 'preapproved', 'published', 'locked'].includes(evaluation.status)).length

        return {
          id: period.id,
          store_id: period.store_id,
          store_name: getStoreName(period.store_id),
          month: period.month,
          status: period.status,
          version_name: `${period.snapshot.name} • v${period.snapshot.version}`,
          employee_count: period.employee_ids.length,
          missing_source_count: missingSourceCount,
          completed_reviews: completedReviews,
          total_reviews: reviews.length || period.employee_ids.length,
          appeal_count: db.appeals.filter((appeal) => appeal.reference_id === period.id).length,
        } satisfies KPIPeriodRow
      })
    )

    const sorted = nextRows.sort((a, b) => b.month.localeCompare(a.month))
    setPeriodRows(sorted)
    setSelectedPeriodId((current) => current ?? sorted[0]?.id ?? null)
  }, [])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !canAccess) return
    void refreshData()
  }, [canAccess, hasHydrated, isAuthenticated, refreshData])

  const selectedPeriod = useMemo(
    () => periodRows.find((period) => period.id === selectedPeriodId) ?? null,
    [periodRows, selectedPeriodId]
  )

  const selectedPeriodEntity = useMemo(
    () => database?.periods.find((period) => period.id === selectedPeriodId) ?? null,
    [database, selectedPeriodId]
  )

  const publishedVersions = useMemo(
    () => (database?.sets ?? []).filter((set): set is KpiSetVersion => set.status === 'published'),
    [database]
  )

  const storeOptions = useMemo(() => {
    const ids = new Set<string>()

    database?.periods.forEach((period) => ids.add(period.store_id))
    publishedVersions.forEach((version) => {
      if (Array.isArray(version.store_ids)) {
        version.store_ids.forEach((storeId) => ids.add(storeId))
      }
    })

    return Array.from(ids).map((storeId) => ({
      id: storeId,
      label: getStoreName(storeId),
    }))
  }, [database, publishedVersions])

  const employeeOptions = useMemo<PeriodEmployeeOption[]>(() => {
    const employees = new Map<string, PeriodEmployeeOption>()

    ;(database?.evaluations ?? []).forEach((evaluation) => {
      if (!employees.has(evaluation.employee.id)) {
        employees.set(evaluation.employee.id, {
          id: evaluation.employee.id,
          label: evaluation.employee.id,
          subtitle: `${getStoreName(evaluation.employee.store_id)} • ${evaluation.employee.level_code} • ${evaluation.employee.position_id}`,
        })
      }
    })

    return Array.from(employees.values())
  }, [database])

  const macroStats = useMemo(() => {
    const totalPeriods = periodRows.length
    const lockedPeriods = periodRows.filter((period) => period.status === 'locked').length
    const missingSources = periodRows.reduce((sum, period) => sum + period.missing_source_count, 0)
    const activeVersions = publishedVersions.length

    return { totalPeriods, lockedPeriods, missingSources, activeVersions }
  }, [periodRows, publishedVersions.length])

  const selectedPeriodEvaluations = useMemo(
    () => (database?.evaluations ?? []).filter((evaluation) => evaluation.period_id === selectedPeriodId),
    [database, selectedPeriodId]
  )

  const approvalQueueItems = useMemo<KPIApprovalQueueItem[]>(() => {
    if (!selectedPeriodEntity) return []

    const missingByEmployee = new Map<string, number>()
    const selectedRow = periodRows.find((row) => row.id === selectedPeriodEntity.id)
    const avgMissing = selectedRow && selectedPeriodEntity.employee_ids.length > 0
      ? Math.ceil(selectedRow.missing_source_count / selectedPeriodEntity.employee_ids.length)
      : 0

    selectedPeriodEntity.employee_ids.forEach((employeeId) => {
      missingByEmployee.set(employeeId, avgMissing)
    })

    return selectedPeriodEvaluations.map((evaluation) => {
      const issues = validateEvaluationSubmission(evaluation)
      const adjustmentCount = evaluation.scores.filter((score) => score.suggested_score !== undefined && score.final_score !== undefined && Math.abs(score.final_score - score.suggested_score) >= 2).length
      const hasSeriousIncident = evaluation.scores.some((score) => score.criterion_id === 'discipline_execution' && (score.final_score ?? score.suggested_score ?? 5) <= 2)
      const missingSources = missingByEmployee.get(evaluation.employee.id) ?? 0

      let queueGroup: KPIApprovalQueueItem['queue_group'] = 'clean'
      const notes: string[] = []

      if (missingSources > 0) {
        queueGroup = 'missing_source'
        notes.push(`Con ${missingSources} nguon du lieu thieu`)
      } else if (issues.some((issue) => issue.code === 'MISSING_EVIDENCE')) {
        queueGroup = 'missing_evidence'
        notes.push('Con tieu chi diem thap chua co bang chung')
      } else if (hasSeriousIncident) {
        queueGroup = 'serious_incident'
        notes.push('Co diem ky luat rat thap, can CEO canh')
      } else if (adjustmentCount > 0) {
        queueGroup = 'large_adjustment'
        notes.push(`Co ${adjustmentCount} tieu chi sua diem manh`)
      } else {
        notes.push('Du du lieu, da duoc leader chot sach')
      }

      if (issues.some((issue) => issue.code === 'MISSING_REASON')) {
        notes.push('Con muc sua diem chua ghi ly do')
      }

      return {
        evaluation_id: evaluation.id,
        employee_label: `${evaluation.employee.id} • ${evaluation.employee.level_code} • ${evaluation.employee.position_id}`,
        total_score: evaluation.total_score,
        status: evaluation.status,
        queue_group: queueGroup,
        notes,
      }
    })
  }, [periodRows, selectedPeriodEntity, selectedPeriodEvaluations])

  async function countMissingSources(period: KpiPeriod) {
    let total = 0

    await Promise.all(
      period.employee_ids.map(async (employeeId) => {
        const sources = await kpiAdapter.collectEmployeeSources(period.id, employeeId)
        total += sources.filter((source: { status: string }) => source.status === 'missing').length
      })
    )

    return total
  }

  async function handleCreatePeriod(payload: {
    month: string
    store_id: string
    version_id: string
    employee_ids: string[]
  }) {
    if (!database || !actor) return

    setErrorMessage(null)

    if (!payload.month || !payload.store_id || !payload.version_id) {
      setErrorMessage('Can chon day du thang, cua hang va phien ban KPI.')
      return
    }

    if (payload.employee_ids.length === 0) {
      setErrorMessage('Can chon it nhat 1 nhan su trong ky KPI.')
      return
    }

    const version = publishedVersions.find((item) => item.id === payload.version_id)
    if (!version) {
      setErrorMessage('Chi duoc mo ky bang phien ban KPI da cong bo.')
      return
    }

    if (database.periods.some((period) => period.store_id === payload.store_id && period.month === payload.month)) {
      setErrorMessage('Ky KPI cua cua hang nay da ton tai trong thang da chon.')
      return
    }

    if (!isVersionEffectiveForMonth(version, payload.month)) {
      setErrorMessage('Phien ban KPI dang chon khong con hieu luc cho thang nay.')
      return
    }

    setIsSaving(true)

    try {
      const period = createKpiPeriod(
        {
          org_id: 'homies',
          store_id: payload.store_id,
          month: payload.month,
          employee_ids: payload.employee_ids,
          opened_by: actor.id,
          opened_at: new Date().toISOString(),
        },
        version
      )

      const next = {
        ...database,
        revision: database.revision + 1,
        periods: [period, ...database.periods],
      }

      await kpiAdapter.repository.save(next, database.revision)
      await refreshData()
      setDrawerOpen(false)
      setSelectedPeriodId(period.id)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the mo ky KPI moi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function persistDatabase(next: KpiDatabase) {
    if (!database) return

    await kpiAdapter.repository.save(next, database.revision)
    await refreshData()
  }

  async function handleApproveCleanBatch() {
    if (!database || !actor || !selectedPeriodEntity) return

    const cleanIds = approvalQueueItems
      .filter((item) => item.queue_group === 'clean')
      .map((item) => item.evaluation_id)

    if (cleanIds.length === 0) return

    const nextEvaluations = database.evaluations.map((evaluation) => (
      cleanIds.includes(evaluation.id)
        ? { ...evaluation, status: 'preapproved' as const, revision: evaluation.revision + 1 }
        : evaluation
    ))

    const next = {
      ...database,
      revision: database.revision + 1,
      evaluations: nextEvaluations,
      audit_logs: [
        ...database.audit_logs,
        {
          id: `audit_preapprove_${selectedPeriodEntity.id}_${Date.now()}`,
          entity_type: 'kpi_period',
          entity_id: selectedPeriodEntity.id,
          action: 'batch_preapprove_clean',
          actor_id: actor.id,
          new_value: { evaluation_ids: cleanIds },
          created_at: new Date().toISOString(),
        },
      ],
    }

    setErrorMessage(null)
    await persistDatabase(next)
  }

  async function handleReturnEvaluation(evaluationId: string) {
    if (!database || !actor || !selectedPeriodEntity) return

    const nextEvaluations = database.evaluations.map((evaluation) => (
      evaluation.id === evaluationId
        ? { ...evaluation, status: 'returned' as const, revision: evaluation.revision + 1 }
        : evaluation
    ))

    const next = {
      ...database,
      revision: database.revision + 1,
      evaluations: nextEvaluations,
      audit_logs: [
        ...database.audit_logs,
        {
          id: `audit_return_${evaluationId}_${Date.now()}`,
          entity_type: 'kpi_evaluation',
          entity_id: evaluationId,
          action: 'ceo_return_to_leader',
          actor_id: actor.id,
          reason: 'CEO tra lai do ho so co ngoai le can bo sung.',
          created_at: new Date().toISOString(),
        },
      ],
    }

    setErrorMessage(null)
    await persistDatabase(next)
  }

  async function handlePeriodTransition(nextStatus: 'published' | 'appeal_window' | 'locked') {
    if (!database || !actor || !selectedPeriodEntity) return

    try {
      const transitioned = transitionPeriod(selectedPeriodEntity, nextStatus, actor)
      const nextEvaluations = database.evaluations.map((evaluation) => {
        if (evaluation.period_id !== selectedPeriodEntity.id) return evaluation

        if (nextStatus === 'published') {
          return { ...evaluation, status: 'published' as const, revision: evaluation.revision + 1 }
        }

        if (nextStatus === 'locked') {
          return { ...evaluation, status: 'locked' as const, revision: evaluation.revision + 1 }
        }

        return evaluation
      })

      const next = {
        ...database,
        revision: database.revision + 1,
        periods: database.periods.map((period) => period.id === selectedPeriodEntity.id ? transitioned : period),
        evaluations: nextEvaluations,
        audit_logs: [
          ...database.audit_logs,
          {
            id: `audit_period_${nextStatus}_${selectedPeriodEntity.id}_${Date.now()}`,
            entity_type: 'kpi_period',
            entity_id: selectedPeriodEntity.id,
            action: `transition_${nextStatus}`,
            actor_id: actor.id,
            old_value: { status: selectedPeriodEntity.status },
            new_value: { status: nextStatus },
            created_at: new Date().toISOString(),
          },
        ],
      }

      setErrorMessage(null)
      await persistDatabase(next)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the chuyen trang thai ky KPI.')
    }
  }

  async function handleApproveReopen(reason: string) {
    if (!database || !actor || !selectedPeriodEntity) return

    setReopenPending(true)

    try {
      const request: KpiReopenRequest = requestPeriodReopen(selectedPeriodEntity, actor, reason)
      const reopened = approvePeriodReopen(selectedPeriodEntity, request, actor)

      const next = {
        ...database,
        revision: database.revision + 1,
        periods: database.periods.map((period) => period.id === selectedPeriodEntity.id ? reopened : period),
        evaluations: database.evaluations.map((evaluation) => (
          evaluation.period_id === selectedPeriodEntity.id && evaluation.status === 'locked'
            ? { ...evaluation, status: 'returned' as const, revision: evaluation.revision + 1 }
            : evaluation
        )),
        audit_logs: [
          ...database.audit_logs,
          {
            id: `audit_reopen_${selectedPeriodEntity.id}_${Date.now()}`,
            entity_type: 'kpi_period',
            entity_id: selectedPeriodEntity.id,
            action: 'approve_reopen',
            actor_id: actor.id,
            reason,
            old_value: { status: selectedPeriodEntity.status },
            new_value: { status: reopened.status },
            created_at: new Date().toISOString(),
          },
        ],
      }

      await persistDatabase(next)
      setReopenDialogOpen(false)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the mo lai ky KPI.')
    } finally {
      setReopenPending(false)
    }
  }

  if (!hasHydrated) {
    return (
      <AppShell showNav className="w-full max-w-none bg-[#FFF8E8]">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2F6FA8] border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  if (!canAccess || !actor) {
    return (
      <AppShell showNav className="w-full max-w-none bg-[#FFF8E8] min-h-screen">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#001D3D]">Ban khong co quyen vao man nay</h1>
                <p className="mt-1 text-sm text-gray-500">Man quan ly ky KPI chi mo cho HR Admin, Area Manager va CEO.</p>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell showNav className="w-full max-w-none min-h-screen bg-[#FFF8E8]">
      <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3.5 shadow-2xs sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Quan ly ky KPI</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">Dieu hanh ky KPI theo thang</h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#2F6FA8]">
                HR chuan bi • CEO khoa/mo
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-h-[36px] items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5">
              <Building2 size={13} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-700">{storeOptions.length} cua hang co KPI</span>
            </div>

            <div className="flex min-h-[36px] items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5">
              <Calendar size={13} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-700">{formatMonth(getCurrentMonth())}</span>
            </div>

            <button
              type="button"
              onClick={() => void refreshData()}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50"
            >
              <FileSpreadsheet size={14} className="text-[#2F6FA8]" />
              <span>Lam moi du lieu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerMode('create')
                setErrorMessage(null)
                setDrawerOpen(true)
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1D3E61]"
            >
              <Plus size={14} />
              <span>Mo ky KPI</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <MacroCard
            label="Tong ky KPI"
            value={String(macroStats.totalPeriods)}
            note="Tat ca ky dang theo doi"
            accent="blue"
            icon={<Layers3 size={16} />}
          />
          <MacroCard
            label="Ky da khoa/cong bo"
            value={String(macroStats.lockedPeriods)}
            note="Da xong vong xet diem"
            accent="emerald"
            icon={<CheckCircle2 size={16} />}
          />
          <MacroCard
            label="Nguon thieu"
            value={String(macroStats.missingSources)}
            note="Can bo sung truoc khi chot"
            accent="rose"
            icon={<ShieldAlert size={16} />}
          />
          <MacroCard
            label="Phien ban san sang"
            value={String(macroStats.activeVersions)}
            note="Da cong bo va co hieu luc"
            accent="amber"
            icon={<Sparkles size={16} />}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <KPIPeriodTable
              rows={periodRows}
              selectedPeriodId={selectedPeriodId}
              onSelectPeriod={(periodId) => {
                setSelectedPeriodId(periodId)
                setDrawerMode('detail')
                setDrawerOpen(true)
              }}
            />
          </div>

          <div className="space-y-4">
            {selectedPeriodEntity && actor.role === 'ceo' ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={15} className="text-[#2F6FA8]" />
                  <h3 className="text-sm font-bold text-[#001D3D]">CEO actions</h3>
                </div>

                <div className="mt-3 space-y-2">
                  {canKpi(actor.role, 'lock_period') && selectedPeriodEntity.status === 'ceo_preapproval' ? (
                    <button
                      type="button"
                      onClick={() => void handlePeriodTransition('published')}
                      className="flex w-full items-center justify-between rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <span>Cong bo ky KPI</span>
                      <Sparkles size={14} />
                    </button>
                  ) : null}

                  {canKpi(actor.role, 'lock_period') && selectedPeriodEntity.status === 'published' ? (
                    <button
                      type="button"
                      onClick={() => void handlePeriodTransition('appeal_window')}
                      className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                    >
                      <span>Mo cua so khiếu nai</span>
                      <AlertTriangle size={14} />
                    </button>
                  ) : null}

                  {canKpi(actor.role, 'lock_period') && selectedPeriodEntity.status === 'appeal_window' ? (
                    <button
                      type="button"
                      onClick={() => void handlePeriodTransition('locked')}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
                    >
                      <span>Khoa ky KPI</span>
                      <Lock size={14} />
                    </button>
                  ) : null}

                  {canKpi(actor.role, 'reopen_period') && selectedPeriodEntity.status === 'locked' ? (
                    <button
                      type="button"
                      onClick={() => setReopenDialogOpen(true)}
                      className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <span>Mo lai ky da khoa</span>
                      <RotateCcw size={14} />
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <InfoPanel
              title="Checklist mo ky"
              icon={<Sparkles size={15} className="text-[#2F6FA8]" />}
              items={[
                'Chon phien ban KPI da cong bo',
                'Kiem tra thang chua bi trung ky',
                'Chot danh sach nhan su trong ky',
                'Theo doi du lieu thieu truoc khi leader cham',
              ]}
            />

            <InfoPanel
              title="Vai tro van hanh"
              icon={<Lock size={15} className="text-[#2F6FA8]" />}
              items={[
                'HR Admin: mo ky va chuan bi nhan su',
                'Area Manager: theo doi nhieu cua hang',
                'CEO: khoa ky va mo lai khi can',
              ]}
            />

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="text-sm font-bold text-[#001D3D]">Ky dang chon</div>
              {selectedPeriod ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#2F6FA8]">{selectedPeriod.store_name}</div>
                    <div className="mt-1 text-lg font-bold text-[#001D3D]">{formatMonth(selectedPeriod.month)}</div>
                    <div className="mt-1 text-[11px] text-gray-500">{selectedPeriod.version_name}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <SmallStat label="Nhan su" value={String(selectedPeriod.employee_count)} />
                    <SmallStat label="Tien do" value={`${selectedPeriod.completed_reviews}/${selectedPeriod.total_reviews}`} />
                    <SmallStat label="Thieu du lieu" value={String(selectedPeriod.missing_source_count)} danger={selectedPeriod.missing_source_count > 0} />
                    <SmallStat label="Khieu nai" value={String(selectedPeriod.appeal_count)} />
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
                  Chon 1 dong trong bang de xem chi tiet ky KPI.
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedPeriodEntity && actor.role === 'ceo' ? (
          <KPIApprovalQueue
            items={approvalQueueItems}
            onApproveCleanBatch={() => void handleApproveCleanBatch()}
            onReturnEvaluation={(evaluationId) => void handleReturnEvaluation(evaluationId)}
          />
        ) : null}
      </div>

      <KPICreatePeriodDrawer
        isOpen={drawerOpen}
        mode={drawerMode}
        actor={actor}
        period={selectedPeriod}
        storeOptions={storeOptions}
        versionOptions={publishedVersions}
        employeeOptions={employeeOptions}
        initialMonth={getCurrentMonth()}
        isSaving={isSaving}
        errorMessage={errorMessage}
        onClose={() => setDrawerOpen(false)}
        onCreatePeriod={handleCreatePeriod}
      />

      <KPIReopenDialog
        isOpen={reopenDialogOpen}
        isSaving={reopenPending}
        onClose={() => setReopenDialogOpen(false)}
        onApprove={(reason) => void handleApproveReopen(reason)}
      />
    </AppShell>
  )
}

function MacroCard({
  label,
  value,
  note,
  accent,
  icon,
}: {
  label: string
  value: string
  note: string
  accent: 'blue' | 'emerald' | 'rose' | 'amber'
  icon: React.ReactNode
}) {
  const accentMap = {
    blue: 'bg-blue-50 text-[#2F6FA8] border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
  } as const

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#001D3D]">{value}</div>
          <div className="mt-2 text-xs text-gray-500">{note}</div>
        </div>
        <div className={`rounded-2xl border p-2 ${accentMap[accent]}`}>{icon}</div>
      </div>
    </div>
  )
}

function InfoPanel({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: string[]
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-[#001D3D]">{title}</h3>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#2F6FA8]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SmallStat({
  label,
  value,
  danger = false,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`mt-1 font-mono text-base font-bold tabular-nums ${danger ? 'text-rose-700' : 'text-[#001D3D]'}`}>{value}</div>
    </div>
  )
}

function formatMonth(month: string) {
  return `Thang ${month.slice(5)}/${month.slice(0, 4)}`
}

function getCurrentMonth() {
  return '2026-08'
}

function isVersionEffectiveForMonth(version: KpiSetVersion, month: string) {
  const effectiveFrom = version.effective_from.slice(0, 7)
  const effectiveTo = version.effective_to?.slice(0, 7)

  if (month < effectiveFrom) return false
  if (effectiveTo && month > effectiveTo) return false

  if (Array.isArray(version.store_ids) && version.store_ids.length === 0) return false

  return true
}

function getStoreName(storeId: string) {
  const normalized = normalizeStoreId(storeId)
  const matched = mockStores.find((store) => normalizeStoreId(store.id) === normalized)

  if (matched) {
    return matched.name.replace('Homies Milk Tea - ', '')
  }

  return storeId.replace(/_/g, ' ').replace(/-/g, ' ')
}

function normalizeStoreId(value: string) {
  return value.replace(/[-_]/g, '').toLowerCase()
}
