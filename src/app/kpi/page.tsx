'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import { getEvaluationScoreSummary } from '@/lib/kpi/evaluation-service'
import type {
  KpiDatabase,
  KpiEvaluation,
  KpiPeriod,
} from '@/lib/kpi/types'
import { mockEmployees, mockPositions, mockStores } from '@/lib/mock-data'

type DashboardRole = 'employee' | 'leader' | 'admin' | 'ceo'
type TableFilterTab = 'all' | 'pending' | 'published' | 'promotion'

interface MacroMetric {
  id: string
  title: string
  value: string
  secondaryValue?: string
  subText: string
  tone: 'blue' | 'emerald' | 'amber' | 'purple'
  icon: React.ReactNode
  tooltip: string
  progress?: number
}

export default function KpiDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()

  const [database, setDatabase] = useState<KpiDatabase | null>(null)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('')
  const [missingSourceMap, setMissingSourceMap] = useState<Record<string, number>>({})
  const [mainViewTab, setMainViewTab] = useState<'matrix' | 'overview'>('matrix')
  const [tableFilterTab, setTableFilterTab] = useState<TableFilterTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvaluation, setSelectedEvaluation] = useState<KpiEvaluation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Redirect if unauthenticated
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi')
    }
  }, [hasHydrated, isAuthenticated, router])

  const refreshData = useCallback(async () => {
    try {
      const db = await kpiAdapter.getDatabase()
      setDatabase(db)

      const missingEntries = await Promise.all(
        db.periods.map(async (period) => {
          let missingCount = 0
          await Promise.all(
            period.employee_ids.map(async (employeeId) => {
              const sources = await kpiAdapter.collectEmployeeSources(period.id, employeeId)
              missingCount += sources.filter((source) => source.status === 'missing').length
            })
          )
          return [period.id, missingCount] as const
        })
      )

      const nextMissingMap = Object.fromEntries(missingEntries)
      setMissingSourceMap(nextMissingMap)
      setSelectedPeriodId((current) => current || sortPeriods(db.periods)[0]?.id || '')
    } catch (err) {
      console.error('[KpiDashboard] Error refreshing KPI data:', err)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return

    const timer = window.setTimeout(() => {
      void refreshData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [hasHydrated, isAuthenticated, refreshData, user])

  // Determine current user dashboard role
  const roleMode = useMemo<DashboardRole>(() => {
    if (!user) return 'employee'
    if (['ceo', 'area_manager'].includes(user.role)) return 'ceo'
    if (user.role === 'hr_admin') return 'admin'
    if (['shift_leader', 'store_manager'].includes(user.role)) return 'leader'
    return 'employee'
  }, [user])

  // Filter visible periods
  const visiblePeriods = useMemo(() => {
    if (!database || !user) return []
    const periods = sortPeriods(database.periods)
    if (roleMode === 'ceo' || roleMode === 'admin') return periods
    return periods.filter((period) => period.store_id === user.store_id)
  }, [database, roleMode, user])

  // Current selected period
  const selectedPeriod = useMemo(
    () => visiblePeriods.find((period) => period.id === selectedPeriodId) ?? visiblePeriods[0] ?? null,
    [selectedPeriodId, visiblePeriods]
  )

  // Current evaluations in selected period
  const periodEvaluations = useMemo(() => {
    if (!database || !selectedPeriod) return []
    return database.evaluations.filter((evaluation) => evaluation.period_id === selectedPeriod.id)
  }, [database, selectedPeriod])

  const selectedAppeals = useMemo(() => database?.appeals ?? [], [database])
  const selectedDevelopmentCases = useMemo(() => database?.development_cases ?? [], [database])

  const selectedStoreName = selectedPeriod ? getStoreName(selectedPeriod.store_id) : getStoreName(user?.store_id)

  // Metrics
  const totalEmployeesInPeriod = selectedPeriod?.employee_ids.length ?? 0
  const completionCount = periodEvaluations.filter((ev) =>
    ['submitted', 'preapproved', 'published', 'locked'].includes(ev.status)
  ).length
  const publishedCount = periodEvaluations.filter((ev) =>
    ['published', 'locked'].includes(ev.status)
  ).length
  const pendingScoringCount = periodEvaluations.filter((ev) =>
    ['draft', 'returned'].includes(ev.status)
  ).length
  const submittedForCeoCount = periodEvaluations.filter((ev) => ev.status === 'submitted').length
  const pendingAppealsCount = selectedAppeals.filter((ap) =>
    ['submitted', 'reviewing'].includes(ap.status)
  ).length
  const openPromotionCount = selectedDevelopmentCases.filter(
    (item) => !['approved', 'rejected', 'deferred'].includes(item.status)
  ).length
  const averageScore = getAverageScore(periodEvaluations)
  const missingSourceCount = selectedPeriod ? (missingSourceMap[selectedPeriod.id] ?? 0) : 0

  const ownEvaluation = periodEvaluations.find((ev) => ev.employee.id === user?.id) ?? null

  // Filtered employees for the main table
  const filteredEvaluations = useMemo(() => {
    return periodEvaluations.filter((ev) => {
      const emp = mockEmployees.find((e) => e.id === ev.employee.id)
      const empName = emp?.full_name ?? ev.employee.id
      const empCode = emp?.employee_code ?? ''
      const posName = getPositionName(ev.employee.position_id)

      const matchSearch =
        empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posName.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchSearch) return false

      if (tableFilterTab === 'pending') {
        return ['draft', 'submitted', 'returned', 'preapproved'].includes(ev.status)
      }
      if (tableFilterTab === 'published') {
        return ['published', 'locked'].includes(ev.status)
      }
      if (tableFilterTab === 'promotion') {
        return (ev.total_score !== undefined && ev.total_score >= 4.0)
      }

      return true
    })
  }, [periodEvaluations, searchTerm, tableFilterTab])

  // Macro 4 KPI cards (Apple SaaS Minimalist)
  const macroMetrics: MacroMetric[] = useMemo(() => {
    const completionPercent =
      totalEmployeesInPeriod > 0 ? Math.round((completionCount / totalEmployeesInPeriod) * 100) : 0

    return [
      {
        id: 'progress',
        title: 'Tiến Độ Đánh Giá Kỳ',
        value: totalEmployeesInPeriod > 0 ? `${completionCount}/${totalEmployeesInPeriod}` : '0/0',
        secondaryValue: `${completionPercent}%`,
        subText: selectedPeriod ? `${formatMonth(selectedPeriod.month)} • ${selectedStoreName}` : 'Chưa mở kỳ',
        tone: 'emerald',
        icon: <CheckCircle2 size={16} />,
        tooltip: 'Số nhân sự đã được chấm điểm hoặc gửi duyệt trên tổng nhân sự trong kỳ.',
        progress: completionPercent,
      },
      {
        id: 'avg_score',
        title: 'Điểm KPI Trung Bình',
        value: averageScore !== null ? averageScore.toFixed(1) : '—',
        secondaryValue: '/ 5.0',
        subText: averageScore !== null ? getGradeLabelFromScore(averageScore) : 'Chưa có điểm chốt',
        tone: 'blue',
        icon: <Award size={16} />,
        tooltip: 'Điểm đánh giá KPI bình quân toàn thể nhân sự trong kỳ đang chọn.',
      },
      {
        id: 'queue',
        title:
          roleMode === 'ceo'
            ? 'Phiếu Chờ CEO Duyệt'
            : roleMode === 'leader'
            ? 'Phiếu Chưa Chấm'
            : roleMode === 'admin'
            ? 'Cảnh Báo Nguồn Thiếu'
            : 'Điểm KPI Của Tôi',
        value:
          roleMode === 'ceo'
            ? `${submittedForCeoCount} phiếu`
            : roleMode === 'leader'
            ? `${pendingScoringCount} phiếu`
            : roleMode === 'admin'
            ? `${missingSourceCount} mục`
            : ownEvaluation?.total_score !== undefined
            ? `${ownEvaluation.total_score} / 5`
            : 'Chưa có',
        secondaryValue: roleMode === 'ceo' && pendingAppealsCount > 0 ? `${pendingAppealsCount} khiếu nại` : undefined,
        subText:
          roleMode === 'ceo'
            ? 'Cần phê duyệt chốt kỳ'
            : roleMode === 'leader'
            ? 'Cần hoàn tất chấm'
            : roleMode === 'admin'
            ? 'Cần đối soát POS'
            : ownEvaluation
            ? mapEvaluationStatus(ownEvaluation.status)
            : 'Đang đợi Leader chấm',
        tone: 'amber',
        icon: <Clock3 size={16} />,
        tooltip: 'Nhiệm vụ trọng tâm cần xử lý theo vai trò của bạn.',
      },
      {
        id: 'promotion',
        title: 'Hồ Sơ Thăng Bậc',
        value: `${openPromotionCount} Hồ sơ`,
        secondaryValue: pendingAppealsCount > 0 ? `${pendingAppealsCount} khiếu nại` : undefined,
        subText: 'Đủ điều kiện xét duyệt',
        tone: 'purple',
        icon: <Rocket size={16} />,
        tooltip: 'Số nhân sự đạt điều kiện xem xét thăng cấp bậc trong chuỗi.',
      },
    ]
  }, [
    totalEmployeesInPeriod,
    completionCount,
    selectedPeriod,
    selectedStoreName,
    averageScore,
    roleMode,
    submittedForCeoCount,
    pendingScoringCount,
    missingSourceCount,
    ownEvaluation,
    pendingAppealsCount,
    openPromotionCount,
  ])

  // Handle employee row click to open detail modal
  const handleOpenEvaluationDetail = (evaluation: KpiEvaluation) => {
    setSelectedEvaluation(evaluation)
    setIsModalOpen(true)
  }

  // Modal employee navigation
  const currentModalIndex = selectedEvaluation
    ? filteredEvaluations.findIndex((ev) => ev.id === selectedEvaluation.id)
    : -1

  const handlePrevEmployee = () => {
    if (currentModalIndex > 0) {
      setSelectedEvaluation(filteredEvaluations[currentModalIndex - 1])
    }
  }

  const handleNextEmployee = () => {
    if (currentModalIndex >= 0 && currentModalIndex < filteredEvaluations.length - 1) {
      setSelectedEvaluation(filteredEvaluations[currentModalIndex + 1])
    }
  }

  if (!hasHydrated || !user) {
    return (
      <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2F6FA8] border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
      {/* ══════════════════════════════════════════════════════════════
          TẦNG 1: EXECUTIVE COMMAND HEADER (STICKY NỀN TRẮNG CỐ ĐỊNH)
          ══════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3.5 shadow-2xs sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Cột trái: Breadcrumb + Tiêu đề H1 + Badge vai trò + Trạng thái kỳ */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Đánh Giá KPI &amp; Phát Triển</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                Tổng Quan Đánh Giá KPI &amp; Thăng Bậc
              </h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2F6FA8]">
                {getRoleLabel(roleMode)}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  selectedPeriod?.status === 'published' || selectedPeriod?.status === 'locked'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : selectedPeriod?.status === 'ceo_preapproval'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-blue-200 bg-blue-50 text-[#2F6FA8]'
                }`}
              >
                ● {selectedPeriod ? mapPeriodStatus(selectedPeriod.status) : 'Chưa mở kỳ'}
              </span>
            </div>
          </div>

          {/* Cột phải: Bộ chọn Kỳ xét + Phím hành động chính */}
          <div className="flex flex-wrap items-center gap-2">
            {visiblePeriods.length > 0 ? (
              <div className="flex min-h-[36px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
                <Calendar size={13} className="text-[#2F6FA8]" />
                <select
                  value={selectedPeriod?.id ?? ''}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="cursor-pointer bg-transparent text-xs font-bold text-gray-700 outline-none"
                >
                  {visiblePeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {formatMonth(period.month)} • {getStoreName(period.store_id)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Primary Action Button based on role */}
            {roleMode === 'leader' ? (
              <Link
                href="/kpi/review"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1D3E61]"
              >
                <Sparkles size={13} />
                <span>Vào Chấm Điểm Cơ Sở</span>
              </Link>
            ) : roleMode === 'ceo' ? (
              <Link
                href="/kpi/periods"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
              >
                <CheckCircle2 size={13} />
                <span>Phê Duyệt Kỳ KPI</span>
              </Link>
            ) : roleMode === 'admin' ? (
              <Link
                href="/kpi/periods"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1D3E61]"
              >
                <Plus size={13} />
                <span>Quản Lý Kỳ KPI</span>
              </Link>
            ) : (
              <Link
                href="/kpi/result"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1D3E61]"
              >
                <UserCheck size={13} />
                <span>Xem Điểm Của Tôi</span>
              </Link>
            )}

            <Link
              href="/kpi/settings"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs transition hover:bg-gray-50"
              title="Cài đặt bộ tiêu chí và chính sách đánh giá"
            >
              <Settings size={13} className="text-gray-500" />
              <span className="hidden sm:inline">Cài Đặt</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* ══════════════════════════════════════════════════════════════
            TẦNG 2: DẢI 4 THẺ CHỈ SỐ VĨ MÔ (MACRO KPI CARDS - GRID 4 CỘT)
            ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {macroMetrics.map((metric) => (
            <div
              key={metric.id}
              className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs transition hover:border-[#2F6FA8]/20"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-600">{metric.title}</span>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    metric.tone === 'emerald'
                      ? 'bg-emerald-50 text-emerald-600'
                      : metric.tone === 'amber'
                      ? 'bg-amber-50 text-amber-700'
                      : metric.tone === 'purple'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-blue-50 text-[#2F6FA8]'
                  }`}
                >
                  {metric.icon}
                </div>
              </div>

              <div className="mt-2.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-bold tabular-nums text-[#001D3D]">
                    {metric.value}
                  </span>
                  {metric.secondaryValue ? (
                    <span className="font-mono text-xs font-semibold text-gray-500">
                      ({metric.secondaryValue})
                    </span>
                  ) : null}
                </div>

                {/* Progress bar if applicable */}
                {metric.progress !== undefined ? (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(metric.progress, 100)}%` }}
                    />
                  </div>
                ) : null}

                <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-1.5 text-[11px] text-gray-500 font-medium">
                  <span className="truncate">{metric.subText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TẦNG 3: BỐ CỤC TỶ LỆ VÀNG (2/3 CỘT CHÍNH + 1/3 CỘT PHỤ)
            ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* ◀ CỘT CHÍNH (2/3 BÊN TRÁI): BẢNG DỮ LIỆU ĐÁNH GIÁ TRỌNG TÂM */}
          <div className="space-y-3.5 xl:col-span-2">
            {/* View Tab Switcher: Bảng Đánh Giá vs Thông Số Kỳ */}
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMainViewTab('matrix')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    mainViewTab === 'matrix'
                      ? 'border border-[#2F6FA8]/20 bg-blue-50 text-[#2F6FA8]'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <Users size={14} />
                  <span>Ma Trận Đánh Giá Đội Ngũ</span>
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      mainViewTab === 'matrix' ? 'bg-[#2F6FA8] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {periodEvaluations.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMainViewTab('overview')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    mainViewTab === 'overview'
                      ? 'border border-[#2F6FA8]/20 bg-blue-50 text-[#2F6FA8]'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <FileText size={14} />
                  <span>Thông Số Kỳ &amp; Nguồn Dữ Liệu</span>
                </button>
              </div>

              {/* Action count hint */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span>{selectedStoreName}</span>
              </div>
            </div>

            {/* ── VIEW 1: BẢNG MA TRẬN NHÂN SỰ TƯƠNG TÁC ── */}
            {mainViewTab === 'matrix' ? (
              <div className="space-y-3">
                {/* Search & Filter Chips */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm theo họ tên, mã NV, chức vụ..."
                      className="w-full rounded-xl border border-gray-200 bg-white py-1.5 pl-8.5 pr-3 text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#2F6FA8] focus:ring-1 focus:ring-[#2F6FA8]/20"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTableFilterTab('all')}
                      className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                        tableFilterTab === 'all'
                          ? 'bg-[#001D3D] text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Tất cả ({periodEvaluations.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilterTab('pending')}
                      className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                        tableFilterTab === 'pending'
                          ? 'border border-amber-200 bg-amber-50 text-amber-800'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Chờ duyệt ({pendingScoringCount + submittedForCeoCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilterTab('published')}
                      className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                        tableFilterTab === 'published'
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Đã chốt ({publishedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilterTab('promotion')}
                      className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                        tableFilterTab === 'promotion'
                          ? 'border border-purple-200 bg-purple-50 text-purple-700'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Thăng bậc ({periodEvaluations.filter((ev) => ev.total_score !== undefined && ev.total_score >= 4.0).length})
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80 font-bold text-gray-600">
                          <th className="py-3 px-4 text-[#001D3D]">Nhân Viên</th>
                          <th className="py-3 px-3 text-center">Chức Vụ</th>
                          <th className="py-3 px-3 text-center">Điểm Gợi Ý</th>
                          <th className="py-3 px-3 text-center">Điểm Chốt</th>
                          <th className="py-3 px-3 text-center">Xếp Loại</th>
                          <th className="py-3 px-3 text-center">Trạng Thái</th>
                          <th className="py-3 px-4 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredEvaluations.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-500">
                              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]">
                                <Users size={16} />
                              </div>
                              <div className="mt-2 text-xs font-bold text-[#001D3D]">
                                Không có nhân sự phù hợp bộ lọc
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredEvaluations.map((evaluation) => {
                            const emp = mockEmployees.find((e) => e.id === evaluation.employee.id)
                            const empName = emp?.full_name ?? `Nhân sự ${evaluation.employee.id.slice(0, 6)}`
                            const empCode = emp?.employee_code ?? 'NV-HM'
                            const posName = getPositionName(evaluation.employee.position_id)
                            const scoreSummary = getEvaluationScoreSummary(evaluation)
                            const resolvedScore = scoreSummary.resolved_total

                            return (
                              <tr
                                key={evaluation.id}
                                onClick={() => handleOpenEvaluationDetail(evaluation)}
                                className="cursor-pointer transition-colors hover:bg-blue-50/30"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-[#2F6FA8]">
                                      {empName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-900">{empName}</div>
                                      <div className="font-mono text-[10px] font-medium text-gray-400">
                                        {empCode}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                                    {posName}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-center font-mono font-bold tabular-nums text-gray-600">
                                  {scoreSummary.suggested_total !== undefined
                                    ? scoreSummary.suggested_total.toFixed(1)
                                    : '—'}
                                </td>

                                <td className="py-3 px-3 text-center font-mono font-bold tabular-nums text-gray-600">
                                  {resolvedScore !== undefined
                                    ? resolvedScore.toFixed(1)
                                    : '—'}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  {resolvedScore !== undefined ? (
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        resolvedScore >= 4.5
                                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : resolvedScore >= 3.5
                                          ? 'border border-blue-200 bg-blue-50 text-[#2F6FA8]'
                                          : resolvedScore >= 3.0
                                          ? 'border border-amber-200 bg-amber-50 text-amber-800'
                                          : 'border border-rose-200 bg-rose-50 text-rose-700'
                                      }`}
                                    >
                                      {getGradeLabelFromScore(resolvedScore)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                      evaluation.status === 'published' || evaluation.status === 'locked'
                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : evaluation.status === 'preapproved'
                                        ? 'border border-blue-200 bg-blue-50 text-[#2F6FA8]'
                                        : evaluation.status === 'submitted'
                                        ? 'border border-amber-200 bg-amber-50 text-amber-800'
                                        : 'border border-gray-200 bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {mapEvaluationStatus(evaluation.status)}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenEvaluationDetail(evaluation)
                                    }}
                                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700 transition hover:bg-[#2F6FA8] hover:text-white"
                                  >
                                    Chi tiết
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer Summary */}
                  <div className="flex flex-col gap-1.5 border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600">
                    <div>
                      Tổng số:{' '}
                      <span className="font-bold font-mono text-[#001D3D]">
                        {periodEvaluations.length} nhân sự
                      </span>{' '}
                      • Đã hoàn tất:{' '}
                      <span className="font-bold font-mono text-emerald-700">
                        {completionCount}/{periodEvaluations.length}
                      </span>
                    </div>
                    <div>
                      Điểm TB:{' '}
                      <span className="font-bold font-mono text-[#001D3D]">
                        {averageScore !== null ? `${averageScore.toFixed(1)} / 5.0` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── VIEW 2: THÔNG SỐ KỲ & ĐỐI SOÁT NGUỒN ── */
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                      Thông Số Kỳ Đánh Giá Đang Chọn
                    </h2>
                  </div>

                  {!selectedPeriod ? (
                    <div className="py-6 text-center text-gray-500">Chưa có dữ liệu kỳ.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      <SummaryRow
                        label="Trạng Thái Vận Hành"
                        value={mapPeriodStatus(selectedPeriod.status)}
                        tone={selectedPeriod.status === 'published' ? 'success' : 'default'}
                      />
                      <SummaryRow label="Cơ Sở Áp Dụng" value={selectedStoreName} />
                      <SummaryRow
                        label="Bộ Tiêu Chí Hiệu Lực"
                        value={`${selectedPeriod.snapshot.name} (v${selectedPeriod.snapshot.version})`}
                      />
                      <SummaryRow
                        label="Tổng Nhân Sự Đánh Giá"
                        value={`${selectedPeriod.employee_ids.length} Nhân sự`}
                      />
                      <SummaryRow
                        label="Tiến Độ Hoàn Tất"
                        value={`${completionCount}/${selectedPeriod.employee_ids.length} Phiếu (${Math.round(
                          (completionCount / (selectedPeriod.employee_ids.length || 1)) * 100
                        )}%)`}
                      />
                      <SummaryRow
                        label="Cảnh Báo Nguồn Dữ Liệu Thiếu"
                        value={missingSourceCount === 0 ? 'Đầy đủ, không thiếu' : `${missingSourceCount} mục cần đối soát`}
                        tone={missingSourceCount === 0 ? 'success' : 'warning'}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ▶ CỘT PHỤ (1/3 BÊN PHẢI): TIẾN ĐỘ CHU KỲ & ĐIỀU HÀNH */}
          <div className="space-y-3.5 xl:col-span-1">
            {/* ── WIDGET 1: CHU KỲ ĐÁNH GIÁ 5 BƯỚC (COMPACT STEPPER) ── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#2F6FA8]">
                    <Calendar size={13} />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                    Chu Kỳ Đánh Giá
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-[#2F6FA8]">
                  {selectedPeriod ? formatMonth(selectedPeriod.month) : 'Kỳ hiện tại'}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                <TimelineStepItem
                  stepNumber={1}
                  title="1. Thu thập & Đối soát POS"
                  duration="Ngày 01-05"
                  status="completed"
                />
                <TimelineStepItem
                  stepNumber={2}
                  title="2. Leader chấm & Nhận xét"
                  duration="Ngày 06-15"
                  status={selectedPeriod?.status === 'leader_scoring' ? 'active' : 'completed'}
                />
                <TimelineStepItem
                  stepNumber={3}
                  title="3. CEO thẩm định & Duyệt"
                  duration="Ngày 16-20"
                  status={
                    selectedPeriod?.status === 'ceo_preapproval'
                      ? 'active'
                      : ['published', 'appeal_window', 'locked'].includes(selectedPeriod?.status ?? '')
                      ? 'completed'
                      : 'pending'
                  }
                />
                <TimelineStepItem
                  stepNumber={4}
                  title="4. Công bố & Khiếu nại"
                  duration="Ngày 21-25"
                  status={
                    selectedPeriod?.status === 'appeal_window' || selectedPeriod?.status === 'published'
                      ? 'active'
                      : selectedPeriod?.status === 'locked'
                      ? 'completed'
                      : 'pending'
                  }
                />
                <TimelineStepItem
                  stepNumber={5}
                  title="5. Khóa kỳ & Chốt thăng bậc"
                  duration="Ngày 26-30"
                  status={selectedPeriod?.status === 'locked' ? 'completed' : 'pending'}
                />
              </div>
            </div>

            {/* ── WIDGET 2: TRUNG TÂM KIỂM SOÁT & CẢNH BÁO NÓNG ── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-2.5">
                <ShieldAlert size={14} className="text-amber-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                  Cảnh Báo Điều Hành
                </h3>
              </div>

              <div className="mt-3 space-y-2">
                {roleMode === 'ceo' ? (
                  <>
                    <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-2.5 text-xs">
                      <div className="font-bold text-rose-800">
                        {pendingAppealsCount > 0
                          ? `Có ${pendingAppealsCount} khiếu nại đang mở`
                          : '0 khiếu nại phát sinh'}
                      </div>
                      <div className="mt-0.5 text-[11px] text-rose-700">
                        {pendingAppealsCount > 0 ? 'Cần CEO xem xét và kết luận.' : 'Kỳ này chưa có khiếu nại nào.'}
                      </div>
                    </div>

                    <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-2.5 text-xs">
                      <div className="font-bold text-purple-800">
                        {openPromotionCount > 0 ? `${openPromotionCount} hồ sơ thăng bậc` : 'Chưa có hồ sơ thăng bậc'}
                      </div>
                      <div className="mt-0.5 text-[11px] text-purple-700">
                        Theo dõi ứng viên đủ chuẩn để phân quyền.
                      </div>
                    </div>
                  </>
                ) : roleMode === 'leader' ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-2.5 text-xs">
                    <div className="font-bold text-amber-800">
                      {pendingScoringCount > 0
                        ? `Còn ${pendingScoringCount} phiếu chưa hoàn tất`
                        : 'Đã hoàn tất chấm điểm toàn cơ sở'}
                    </div>
                    <div className="mt-0.5 text-[11px] text-amber-700">
                      Bổ sung đầy đủ nhận xét trước khi gửi duyệt.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-xs">
                    <div className="font-bold text-emerald-800">Cửa sổ xem điểm &amp; Khiếu nại</div>
                    <div className="mt-0.5 text-[11px] text-emerald-700">
                      Bạn có 48 giờ sau công bố để gửi yêu cầu đối soát nếu cần.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── WIDGET 3: LỐI TẮT PHÂN HỆ (QUICK LINKS) ── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#001D3D] border-b border-gray-50 pb-2">
                Phím Tắt Nghiệp Vụ
              </h3>
              <div className="mt-2.5 divide-y divide-gray-50">
                <QuickLinkItem href="/kpi/review" label="Phòng Chấm Điểm" badge="Leader" />
                <QuickLinkItem href="/kpi/result" label="Bảng Điểm Cá Nhân" badge="Kết quả" />
                <QuickLinkItem href="/kpi/promotion" label="Lộ Trình Thăng Bậc" badge="Career" />
                <QuickLinkItem href="/kpi/periods" label="Quản Lý Kỳ KPI" badge="Vận hành" />
                <QuickLinkItem href="/kpi/reports" label="Báo Cáo Phân Tích" badge="Thống kê" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL BÓC TÁCH CHI TIẾT PHIẾU ĐÁNH GIÁ (INDIVIDUAL DETAIL MODAL)
          ══════════════════════════════════════════════════════════════ */}
      {isModalOpen && selectedEvaluation ? (
        <EvaluationDetailModal
          evaluation={selectedEvaluation}
          onClose={() => setIsModalOpen(false)}
          onPrev={handlePrevEmployee}
          onNext={handleNextEmployee}
          hasPrev={currentModalIndex > 0}
          hasNext={currentModalIndex >= 0 && currentModalIndex < filteredEvaluations.length - 1}
        />
      ) : null}
    </AppShell>
  )
}

// ── SUB-COMPONENTS ──

function SummaryRow({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'warning' | 'success'
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
      <div className="font-medium text-gray-500">{label}</div>
      <div
        className={`font-mono font-bold tabular-nums ${
          tone === 'warning'
            ? 'text-amber-800'
            : tone === 'success'
            ? 'text-emerald-700'
            : 'text-[#001D3D]'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function TimelineStepItem({
  stepNumber,
  title,
  duration,
  status,
}: {
  stepNumber: number
  title: string
  duration: string
  status: 'completed' | 'active' | 'pending'
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border p-2 text-xs transition ${
        status === 'active'
          ? 'border-blue-200 bg-blue-50/60 ring-1 ring-blue-200/50'
          : status === 'completed'
          ? 'border-gray-100 bg-gray-50/60 opacity-90'
          : 'border-gray-100 bg-white opacity-50'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
            status === 'active'
              ? 'bg-[#2F6FA8] text-white'
              : status === 'completed'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {status === 'completed' ? <CheckCircle2 size={11} /> : stepNumber}
        </div>
        <div className="min-w-0 truncate">
          <div className={`truncate font-bold ${status === 'active' ? 'text-[#2F6FA8]' : 'text-gray-800'}`}>
            {title}
          </div>
        </div>
      </div>
      <span className="shrink-0 text-[10px] font-medium text-gray-400">{duration}</span>
    </div>
  )
}

function QuickLinkItem({
  href,
  label,
  badge,
}: {
  href: string
  label: string
  badge: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-2 text-xs font-bold text-gray-700 transition hover:text-[#2F6FA8]"
    >
      <span>{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="rounded-md bg-gray-100 px-1.5 py-0.2 text-[10px] font-semibold text-gray-500">
          {badge}
        </span>
        <ArrowUpRight size={12} className="text-gray-400" />
      </div>
    </Link>
  )
}

function EvaluationDetailModal({
  evaluation,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  evaluation: KpiEvaluation
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}) {
  const emp = mockEmployees.find((e) => e.id === evaluation.employee.id)
  const empName = emp?.full_name ?? `Nhân sự ${evaluation.employee.id.slice(0, 6)}`
  const empCode = emp?.employee_code ?? 'NV-HM'
  const posName = getPositionName(evaluation.employee.position_id)
  const score = evaluation.total_score

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-[#2F6FA8]">
              {empName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#001D3D]">{empName}</h3>
                <span className="font-mono text-xs font-semibold text-gray-400">({empCode})</span>
              </div>
              <div className="text-[11px] font-medium text-gray-500">
                Chức vụ: <span className="font-bold text-gray-700">{posName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
              title="Nhân viên trước"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
              title="Nhân viên tiếp theo"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Big Score Header */}
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
          <div>
            <span className="text-[11px] font-semibold text-gray-500">Tổng Điểm KPI</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold tabular-nums text-[#001D3D]">
                {score !== undefined ? score.toFixed(1) : '—'}
              </span>
              <span className="font-mono text-xs font-semibold text-gray-500">/ 5.0</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {score !== undefined ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  score >= 4.5
                    ? 'border border-emerald-200 bg-emerald-100 text-emerald-800'
                    : score >= 3.5
                    ? 'border border-blue-200 bg-blue-100 text-[#2F6FA8]'
                    : score >= 3.0
                    ? 'border border-amber-200 bg-amber-100 text-amber-900'
                    : 'border border-rose-200 bg-rose-100 text-rose-800'
                }`}
              >
                {getGradeLabelFromScore(score)}
              </span>
            ) : null}

            <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-bold text-gray-700">
              {mapEvaluationStatus(evaluation.status)}
            </span>
          </div>
        </div>

        {/* Scores breakdown */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Chi Tiết Tiêu Chí Đánh Giá
          </h4>

          <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl border border-gray-100 p-2.5 bg-gray-50/40">
            {evaluation.scores.map((s, idx) => (
              <div
                key={s.criterion_id || idx}
                className="flex items-center justify-between rounded-lg bg-white p-2 border border-gray-100 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-gray-800">
                    Tiêu chí #{idx + 1}: {s.criterion_id}
                  </div>
                  {s.adjustment_reason ? (
                    <div className="text-[10px] text-gray-500 italic">
                      Lý do: {s.adjustment_reason}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                  <span className="text-gray-400">Gợi ý: {s.suggested_score ?? '—'}</span>
                  <span className="font-bold text-[#001D3D]">
                    Leader chốt: {s.final_score ?? '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {evaluation.monthly_feedback ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-xs space-y-1">
            <div className="font-bold text-gray-800">Nhận Xét Quản Lý:</div>
            <div className="text-gray-600 text-[11px]">
              <span className="font-semibold text-emerald-700">Điểm mạnh:</span>{' '}
              {evaluation.monthly_feedback.strength || 'Chưa có ghi nhận'}
            </div>
            <div className="text-gray-600 text-[11px]">
              <span className="font-semibold text-amber-700">Cần cải thiện:</span>{' '}
              {evaluation.monthly_feedback.improvement || 'Chưa có ghi nhận'}
            </div>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            Đóng
          </button>
          <Link
            href="/kpi/review"
            className="rounded-xl bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#1D3E61]"
          >
            Vào Phòng Chấm
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── UTILITIES & HELPERS ──

function getAverageScore(evaluations: KpiEvaluation[]) {
  const scores = evaluations
    .map((evaluation) => evaluation.total_score)
    .filter((score): score is number => score !== undefined)

  if (scores.length === 0) return null
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}

function sortPeriods(periods: KpiPeriod[]) {
  return [...periods].sort((a, b) => b.month.localeCompare(a.month))
}

function getStoreName(storeId?: string) {
  if (!storeId) return 'Chuỗi Homies'
  return mockStores.find((store) => store.id === storeId)?.name ?? storeId
}

function getPositionName(posId?: string) {
  if (!posId) return 'Nhân viên'
  return mockPositions.find((p) => p.id === posId)?.name ?? posId
}

function formatMonth(month: string) {
  return `Tháng ${month.slice(5)}/${month.slice(0, 4)}`
}

function getRoleLabel(roleMode: DashboardRole) {
  if (roleMode === 'employee') return 'Nhân Viên'
  if (roleMode === 'leader') return 'Quản Lý / Trưởng Ca'
  if (roleMode === 'admin') return 'HR Admin'
  return 'CEO / Area Manager'
}

function getGradeLabelFromScore(score: number): string {
  if (score >= 4.5) return 'Xuất sắc (A)'
  if (score >= 3.5) return 'Tốt (B)'
  if (score >= 3.0) return 'Khá (C)'
  if (score >= 2.0) return 'Cần cải thiện (D)'
  return 'Không đạt (E)'
}

function mapPeriodStatus(status: KpiPeriod['status']) {
  switch (status) {
    case 'draft':
      return 'Bản nháp'
    case 'collecting':
      return 'Đang thu dữ liệu'
    case 'leader_scoring':
      return 'Leader đang chấm'
    case 'ceo_preapproval':
      return 'Chờ CEO duyệt'
    case 'published':
      return 'Đã công bố'
    case 'appeal_window':
      return 'Đang mở khiếu nại'
    case 'locked':
      return 'Đã khóa kỳ'
    default:
      return status
  }
}

function mapEvaluationStatus(status: KpiEvaluation['status']) {
  switch (status) {
    case 'draft':
      return 'Bản nháp'
    case 'submitted':
      return 'Chờ CEO duyệt'
    case 'returned':
      return 'Yêu cầu sửa lại'
    case 'preapproved':
      return 'Đã duyệt sơ bộ'
    case 'published':
      return 'Đã công bố'
    case 'locked':
      return 'Đã khóa'
    default:
      return status
  }
}
