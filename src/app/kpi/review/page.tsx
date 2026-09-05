'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import { peerReviewAdapter } from '@/lib/adapters/peer-review-adapter'
import {
  applySuggestedScores,
  autosaveEvaluation,
  createEvaluationFromPeriod,
  submitEvaluation,
  updateLeaderScore,
  validateEvaluationSubmission,
  type LeaderScoreInput,
} from '@/lib/kpi/evaluation-service'
import type {
  KpiActor,
  KpiEvaluation,
  KpiEvaluationIntegrityFlag,
  KpiMonthlyReview,
  KpiPeerManagerQueueDto,
  KpiPeerReviewerTaskDto,
  PeerResponseDraftInput,
} from '@/lib/kpi'
import KPIScoringWorkspace from '@/components/kpi/workspace/KPIScoringWorkspace'
import KPISourcePanel from '@/components/kpi/workspace/KPISourcePanel'
import { KPIMonthlyRoleWorkspace } from '@/components/kpi/monthly/KPIMonthlyRoleWorkspace'

type SaveState = 'idle' | 'saving' | 'saved' | 'conflict'

export default function KPIReviewPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()

  const [evaluations, setEvaluations] = useState<KpiEvaluation[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08')
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceMap, setSourceMap] = useState<Record<string, Awaited<ReturnType<typeof kpiAdapter.collectEmployeeSources>>>>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [statusMessage, setStatusMessage] = useState('Chưa có thay đổi mới')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true)

  // Peer review state
  const [reviewerTasks, setReviewerTasks] = useState<KpiPeerReviewerTaskDto[]>([])
  const [managerQueue, setManagerQueue] = useState<KpiPeerManagerQueueDto[]>([])
  const [monthlyReviews, setMonthlyReviews] = useState<KpiMonthlyReview[]>([])
  const [integrityFlags, setIntegrityFlags] = useState<KpiEvaluationIntegrityFlag[]>([])
  const [viewMode, setViewMode] = useState<'monthly_role' | 'scoring_workspace'>('monthly_role')

  const actor: KpiActor = useMemo(() => ({
    id: user?.id || 'guest',
    role: (user?.role || 'employee') as KpiActor['role'],
    store_id: user?.store_id,
  }), [user])

  const canAccess = ['employee', 'shift_leader', 'store_manager', 'hr_admin', 'area_manager', 'ceo'].includes(user?.role ?? '')

  const refreshWorkspace = useCallback(async () => {
    try {
      setIsWorkspaceLoading(true)
      setWorkspaceError(null)
      const db = await kpiAdapter.getDatabase()
      const period = db.periods.find((item) => item.month === selectedPeriod) ?? db.periods[0]

      if (!period) {
        setEvaluations([])
        setSourceMap({})
        return
      }

      const loadedEmployees = await Promise.all(
        period.employee_ids.map(async (employeeId) => {
          const existing = db.evaluations.find((evaluation) => evaluation.period_id === period.id && evaluation.employee.id === employeeId)
          const base = existing ?? createEvaluationFromPeriod(
            period,
            db.evaluations.find((evaluation) => evaluation.employee.id === employeeId)?.employee ?? {
              id: employeeId,
              store_id: period.store_id,
              level_code: 'pt1_pc',
              position_id: 'cashier',
              employment_status: 'official',
            }
          )

          const sources = await kpiAdapter.collectEmployeeSources(period.id, employeeId)
          return { evaluation: applySuggestedScores(base, sources), sources }
        })
      )
      const nextEvaluations = loadedEmployees.map((item) => item.evaluation)
      const nextSourceEntries = loadedEmployees.map((item) => [item.evaluation.employee.id, item.sources] as const)

      setEvaluations(nextEvaluations)
      setSourceMap(Object.fromEntries(nextSourceEntries))
      setSelectedIndex((current) => Math.min(current, Math.max(nextEvaluations.length - 1, 0)))

      // Load Peer Review data
      const tasks = await peerReviewAdapter.listReviewerTasks(actor)
      setReviewerTasks(tasks)

      if (['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'].includes(actor.role)) {
        const queue = await peerReviewAdapter.listManagerQueue(actor)
        setManagerQueue(queue)
        setMonthlyReviews(queue.map((item) => item.review))
      }
      if (['hr_admin', 'ceo'].includes(actor.role)) {
        setIntegrityFlags(await peerReviewAdapter.listIntegrityFlags(actor))
      } else {
        setIntegrityFlags([])
      }
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : 'Không thể tải không gian đánh giá tháng.')
    } finally {
      setIsWorkspaceLoading(false)
    }
  }, [actor, selectedPeriod])

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/review')
    }
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !canAccess) return
    const timer = window.setTimeout(() => {
      void refreshWorkspace()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [canAccess, hasHydrated, isAuthenticated, refreshWorkspace])

  const periods = ['2026-08', '2026-07', '2026-06']

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => {
      const label = `${evaluation.employee.id} ${evaluation.employee.position_id} ${evaluation.employee.level_code}`.toLowerCase()
      return label.includes(searchTerm.toLowerCase())
    })
  }, [evaluations, searchTerm])

  const currentEvaluation = filteredEvaluations[selectedIndex] ?? null
  const currentSources = currentEvaluation ? sourceMap[currentEvaluation.employee.id] ?? [] : []
  const currentIssues = currentEvaluation ? validateEvaluationSubmission(currentEvaluation) : []

  const employeeLabel = currentEvaluation
    ? `${currentEvaluation.employee.id} • ${currentEvaluation.employee.level_code} • ${currentEvaluation.employee.position_id}`
    : ''

  function updateCurrentEvaluation(next: KpiEvaluation) {
    setEvaluations((current) => current.map((evaluation) => (
      evaluation.id === next.id ? next : evaluation
    )))
  }

  function handleAutosave(input: LeaderScoreInput) {
    if (!currentEvaluation) return

    setSubmitError(null)
    setSaveState('saving')
    setStatusMessage('Đang tự động lưu...')

    try {
      const updated = updateLeaderScore(currentEvaluation, input)
      const saved = autosaveEvaluation(updated, currentEvaluation.revision + 1)
      updateCurrentEvaluation(saved)
      setSaveState('saved')
      setStatusMessage(`Đã tự động lưu phiên bản ${saved.revision}`)
    } catch (error) {
      setSaveState('conflict')
      setStatusMessage(error instanceof Error ? error.message : 'Tự động lưu thất bại')
    }
  }

  function handleSubmit() {
    if (!currentEvaluation || !user) return
    setSubmitError(null)

    try {
      const submitted = submitEvaluation(currentEvaluation, {
        id: user.id,
        role: user.role as never,
        store_id: user.store_id,
      })
      updateCurrentEvaluation(submitted)
      setSaveState('saved')
      setStatusMessage('Đã gửi lên Ban Giám Đốc sơ bộ')
      toast.success('Đã nộp phiếu chấm KPI thành công.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi phiếu KPI'
      setSubmitError(message)
      setSaveState('conflict')
      setStatusMessage(message)
    }
  }

  // Peer review handlers
  const handleSubmitPeer = async (assignmentId: string, draft: PeerResponseDraftInput) => {
    await peerReviewAdapter.submitResponse(actor, assignmentId, draft)
    toast.success('Đã gửi phiếu góp ý đồng nghiệp thành công!')
    await refreshWorkspace()
  }

  const handleSelectReviewers = async (monthlyReviewId: string, reviewerIds: string[], reason?: string) => {
    await peerReviewAdapter.selectReviewers(actor, monthlyReviewId, reviewerIds, reason)
    toast.success('Đã phân công 2 đồng nghiệp đánh giá thành công!')
    await refreshWorkspace()
  }

  const persistEvaluationStatus = async (
    evaluationId: string,
    status: KpiEvaluation['status'],
    publishedAt?: string
  ) => {
    const db = await kpiAdapter.getDatabase()
    const evaluationExists = db.evaluations.some((item) => item.id === evaluationId)
    if (!evaluationExists) {
      throw new Error('Không tìm thấy phiếu KPI tương ứng để cập nhật trạng thái.')
    }

    await kpiAdapter.repository.save(
      {
        ...db,
        evaluations: db.evaluations.map((item) =>
          item.id === evaluationId
            ? { ...item, status, published_at: status === 'published' ? publishedAt : undefined }
            : item
        ),
      },
      db.revision
    )
  }

  const handleApproveMonthly = async (reviewId: string) => {
    const approved = await peerReviewAdapter.approveMonthlyReview(actor, reviewId)
    await persistEvaluationStatus(approved.evaluation_id, 'published', approved.published_at)
    toast.success('Đã phê duyệt đánh giá tháng thành công!')
    await refreshWorkspace()
  }

  const handleReturnMonthly = async (reviewId: string, reason: string) => {
    const returned = await peerReviewAdapter.returnMonthlyReview(actor, reviewId, reason)
    await persistEvaluationStatus(returned.evaluation_id, 'returned')
    toast.info(`Đã yêu cầu rà soát lại: ${reason}`)
    await refreshWorkspace()
  }

  const handleResolveFlag = async (flagId: string, status: 'dismissed' | 'confirmed', reason: string) => {
    await peerReviewAdapter.resolveIntegrityFlag(actor, flagId, status, reason)
    toast.success('Đã cập nhật trạng thái cờ liêm chính.')
    await refreshWorkspace()
  }

  const handleRevealIdentity = async (assignmentId: string, reason: string) => {
    const res = await peerReviewAdapter.revealReviewerIdentity(actor, assignmentId, reason)
    toast.warning('Đã giải mật danh tính người đánh giá.')
    return res
  }

  const employeeNames: Record<string, { name: string; position_name: string }> = {
    emp_pt1: { name: 'Trần Thị Thu Ngân', position_name: 'Thu ngân Part-time' },
    emp_pt2: { name: 'Lê Văn Pha Chế', position_name: 'Pha chế Part-time' },
    emp_senior: { name: 'Phạm Thị Pha Chế Chính', position_name: 'Pha chế chính Full-time' },
    emp_leader: { name: 'Nguyễn Văn Quản Lý Ca', position_name: 'Quản lý ca' },
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

  if (!canAccess) {
    return (
      <AppShell showNav className="w-full max-w-none bg-[#FFF8E8] min-h-screen">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#001D3D]">Bạn không có quyền vào màn review KPI</h1>
                <p className="mt-1 text-sm text-gray-500">Chỉ nhân viên, ca trưởng, quản lý cửa hàng, HR Admin, Area Manager và CEO mới xem được.</p>
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
              <Link href="/kpi" className="transition hover:text-[#2F6FA8]">Hiệu Suất & KPI</Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Không Gian Đánh Giá Tháng</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                Không Gian Đánh Giá & Góp Ý Tháng {selectedPeriod}
              </h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#2F6FA8]">
                Bảo vệ ẩn danh • Chuẩn Homies
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TOGGLE GIỮA ROLE WORKSPACE VÀ BẢNG CHẤM CA NẾU LÀ LEADER/MANAGER */}
            {['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'].includes(user.role) && (
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('monthly_role')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'monthly_role' ? 'bg-white text-[#001D3D] shadow-xs' : 'text-gray-600'
                  }`}
                >
                  <Users size={13} />
                  <span>Quy Trình Tháng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('scoring_workspace')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'scoring_workspace' ? 'bg-white text-[#001D3D] shadow-xs' : 'text-gray-600'
                  }`}
                >
                  <Layers size={13} />
                  <span>Bảng Chấm Ca</span>
                </button>
              </div>
            )}

            <div className="flex min-h-[36px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
              <Calendar size={13} className="text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(event) => {
                  setSelectedPeriod(event.target.value)
                  setSelectedIndex(0)
                }}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                {periods.map((period) => (
                  <option key={period} value={period}>
                    Tháng {period.slice(5)}/{period.slice(0, 4)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => void refreshWorkspace()}
              disabled={isWorkspaceLoading}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-[#2F6FA8]" />
              <span>{isWorkspaceLoading ? 'Đang tải...' : 'Nạp lại dữ liệu'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        {workspaceError && (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <span>{workspaceError}</span>
            <button type="button" onClick={() => void refreshWorkspace()} className="rounded-xl bg-white px-3 py-2 font-bold text-rose-700 shadow-xs">
              Thử tải lại
            </button>
          </div>
        )}
        {/* VIEW 1: MONTHLY ROLE WORKSPACE */}
        {viewMode === 'monthly_role' ? (
          <KPIMonthlyRoleWorkspace
            actor={actor}
            month={selectedPeriod}
            reviewerTasks={reviewerTasks}
            managerQueue={managerQueue}
            monthlyReviews={monthlyReviews}
            evaluations={evaluations}
            integrityFlags={integrityFlags}
            employeeNames={employeeNames}
            onSubmitPeer={handleSubmitPeer}
            onSelectReviewers={handleSelectReviewers}
            onApprove={handleApproveMonthly}
            onReturn={handleReturnMonthly}
            onResolveFlag={handleResolveFlag}
            onRevealIdentity={handleRevealIdentity}
          />
        ) : (
          /* VIEW 2: SCORING WORKSPACE */
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-1">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-[#2F6FA8]" />
                  <h3 className="text-sm font-bold text-[#001D3D]">Danh sách nhân sự trong kỳ</h3>
                </div>

                <div className="relative mt-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value)
                      setSelectedIndex(0)
                    }}
                    placeholder="Tìm mã nhân sự, level, vị trí..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-700 outline-none focus:border-[#2F6FA8]"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  {filteredEvaluations.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
                      Không có nhân sự nào khớp bộ lọc hiện tại.
                    </div>
                  ) : (
                    filteredEvaluations.map((evaluation, index) => (
                      <button
                        key={evaluation.id}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition cursor-pointer ${
                          selectedIndex === index
                            ? 'border-blue-200 bg-blue-50/60'
                            : 'border-gray-100 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-gray-900">{evaluation.employee.id}</div>
                            <div className="mt-1 text-[11px] text-gray-500">
                              {evaluation.employee.level_code} • {evaluation.employee.position_id}
                            </div>
                          </div>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            evaluation.status === 'submitted'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                          }`}>
                            {evaluation.status === 'submitted' ? 'Đã gửi' : 'Đang chấm'}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <KPISourcePanel sources={currentSources} />
            </div>

            <div className="space-y-4 xl:col-span-2">
              {submitError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                  {submitError}
                </div>
              )}

              {currentEvaluation ? (
                <KPIScoringWorkspace
                  evaluation={currentEvaluation}
                  employeeLabel={employeeLabel}
                  issues={currentIssues}
                  saveState={saveState}
                  statusMessage={statusMessage}
                  canGoPrev={selectedIndex > 0}
                  canGoNext={selectedIndex < filteredEvaluations.length - 1}
                  onPrev={() => setSelectedIndex((current) => Math.max(current - 1, 0))}
                  onNext={() => setSelectedIndex((current) => Math.min(current + 1, filteredEvaluations.length - 1))}
                  onAutosave={handleAutosave}
                  onSubmit={handleSubmit}
                />
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2F6FA8]">
                    <Sparkles size={20} />
                  </div>
                  <div className="mt-4 text-sm font-bold text-[#001D3D]">Chọn 1 nhân sự để bắt đầu chấm</div>
                  <div className="mt-1 text-xs text-gray-500">Danh sách bên trái sẽ giữ vị trí hồ sơ, còn bên này hiện bảng chấm và cảnh báo tự động lưu.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
