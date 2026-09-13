'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import { canSubmitMonthlyAppeal, createMonthlyAppeal, getMonthlyAppealDeadline } from '@/lib/kpi/appeal-service'
import { countConsecutiveQualifiedMonths } from '@/lib/kpi/development-service'
import type { KpiAppeal, KpiEvaluation } from '@/lib/kpi/types'

export default function KPIResultPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()

  const [evaluations, setEvaluations] = useState<KpiEvaluation[]>([])
  const [appeals, setAppeals] = useState<KpiAppeal[]>([])
  const [periodMonths, setPeriodMonths] = useState<Record<string, string>>({})
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08')
  const [showAppealDialog, setShowAppealDialog] = useState(false)
  const [appealReason, setAppealReason] = useState('')
  const [appealEvidence, setAppealEvidence] = useState('')
  const [appealCriterionIds, setAppealCriterionIds] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [now, setNow] = useState(() => new Date().toISOString())

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/result')
    }
  }, [hasHydrated, isAuthenticated, router])

  const refreshData = useCallback(async () => {
    if (!user) return
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const db = await kpiAdapter.getDatabase()

    const monthByPeriod = Object.fromEntries(db.periods.map((period) => [period.id, period.month]))
    const ownedEvaluations = db.evaluations
      .filter((evaluation) => evaluation.employee.id === user.id && ['published', 'locked'].includes(evaluation.status))
      .sort((a, b) => (monthByPeriod[b.period_id] ?? '').localeCompare(monthByPeriod[a.period_id] ?? ''))

      setEvaluations(ownedEvaluations)
      setPeriodMonths(monthByPeriod)
      setAppeals(db.appeals.filter((appeal) => appeal.employee_id === user.id))
      setSelectedPeriod((current) => ownedEvaluations.some((item) => monthByPeriod[item.period_id] === current)
        ? current
        : monthByPeriod[ownedEvaluations[0]?.period_id] ?? current)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải kết quả KPI.')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return

    const timer = window.setTimeout(() => {
      void refreshData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [hasHydrated, isAuthenticated, refreshData, user])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date().toISOString()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  if (!hasHydrated || !user) return null

  const periods = Array.from(new Set(evaluations.map((evaluation) => periodMonths[evaluation.period_id]).filter(Boolean))).sort().reverse()
  const currentEvaluation = evaluations.find((evaluation) => periodMonths[evaluation.period_id] === selectedPeriod) ?? evaluations[0] ?? null
  const currentAppeal = currentEvaluation ? appeals.find((appeal) => appeal.reference_id === currentEvaluation.id) ?? null : null

  const groupBreakdown = currentEvaluation
    ? currentEvaluation.snapshot.groups.map((group) => {
        const score = currentEvaluation.scores.find((item) => item.criterion_id === group.criteria[0]?.id)
        return {
          id: group.id,
          name: group.name,
          weight: group.weight,
          suggested: score?.suggested_score,
          final: score?.final_score ?? score?.suggested_score,
          note: score?.adjustment_reason,
          sourceRefs: score?.source_refs ?? [],
        }
      })
    : []

  const history = evaluations.slice(0, 3)
  const publishedAt = currentEvaluation?.published_at
  const appealDeadline = publishedAt ? getMonthlyAppealDeadline(publishedAt) : null
  const countdownLabel = appealDeadline ? formatCountdown(appealDeadline) : 'Không có hạn đếm ngược'
  const appealWindowOpen = publishedAt ? canSubmitMonthlyAppeal(now, publishedAt) : false

  const unresolvedAppealIds = new Set(appeals
    .filter((appeal) => appeal.status === 'submitted' || appeal.status === 'reviewing')
    .map((appeal) => appeal.reference_id))
  const consecutiveGoodMonths = countConsecutiveQualifiedMonths(evaluations.map((evaluation) => ({
    month: periodMonths[evaluation.period_id] ?? '',
    qualified: (evaluation.total_score ?? 0) >= 3.5 && !unresolvedAppealIds.has(evaluation.id),
  })))

  async function handleSubmitAppeal() {
    if (!currentEvaluation || !publishedAt || !user) return

    try {
      if (appeals.some((item) => item.reference_id === currentEvaluation.id && ['submitted', 'reviewing'].includes(item.status))) {
        throw new Error('Kết quả này đã có một khiếu nại đang được xử lý.')
      }
      const appeal = createMonthlyAppeal({
        employee_id: user.id,
        evaluation_id: currentEvaluation.id,
        reason: appealReason,
        evidence_refs: appealEvidence.split(',').map((item) => item.trim()).filter(Boolean),
        criterion_ids: appealCriterionIds,
        submitted_at: new Date().toISOString(),
        published_at: publishedAt,
        requester_id: user.id,
      })

      const db = await kpiAdapter.getDatabase()
      await kpiAdapter.repository.save({ ...db, appeals: [appeal, ...db.appeals] }, db.revision)
      await refreshData()
      setShowAppealDialog(false)
      setAppealReason('')
      setAppealEvidence('')
      setAppealCriterionIds([])
      setErrorMessage(null)
      toast.success('Đã gửi đơn khiếu nại KPI thành công. Ban Giám Đốc sẽ xử lý trong 48h.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể gửi khiếu nại KPI')
    }
  }

  return (
    <AppShell showNav className="w-full max-w-none min-h-screen bg-[#FFF8E8]">
      {/* HEADER */}
      <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3.5 shadow-2xs sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/kpi" className="transition hover:text-[#2F6FA8]">Hiệu Suất & KPI</Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Kết Quả Cá Nhân</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">Kết Quả Đánh Giá KPI Tháng</h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#2F6FA8]">
                Bảo Mật Cá Nhân
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {periods.length > 0 && (
              <div className="flex min-h-[36px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
                <Calendar size={13} className="text-gray-400" />
                <select
                  value={selectedPeriod}
                  onChange={(event) => setSelectedPeriod(event.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      Tháng {period.slice(5)}/{period.slice(0, 4)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link
              href="/kpi"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Về Trang KPI</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-xs">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#2F6FA8] border-t-transparent" />
            <div className="mt-3 text-xs font-medium text-gray-500">Đang tải kết quả đã công bố...</div>
          </div>
        ) : !currentEvaluation ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Clock3 size={20} />
            </div>
            <div className="mt-4 text-sm font-bold text-[#001D3D]">Chưa có kết quả KPI đã công bố</div>
            <div className="mt-1 text-xs text-gray-500">Kết quả sẽ hiển thị khi Trưởng ca và Ban Giám Đốc hoàn tất quy trình chốt kỳ.</div>
          </div>
        ) : (
          <>
            {/* 4 THẺ TỔNG QUAN */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <MetricCard
                label="Tổng Điểm KPI"
                value={currentEvaluation.total_score ? currentEvaluation.total_score.toFixed(1) : '--'}
                note="Thang điểm 1.0 - 5.0"
                tone="blue"
              />
              <MetricCard
                label="Xếp Loại Tháng"
                value={
                  currentEvaluation.grade_code === 'excellent'
                    ? 'Xuất Sắc'
                    : currentEvaluation.grade_code === 'good'
                    ? 'Tốt (Đạt)'
                    : currentEvaluation.grade_code === 'pass'
                    ? 'Đạt Yêu Cầu'
                    : 'Cần Cải Thiện'
                }
                note="Căn cứ xếp hạng & thưởng"
                tone="emerald"
              />
              <MetricCard
                label="Hạn Khiếu Nại (48h)"
                value={countdownLabel}
                note={appealDeadline ? `Đến ${new Date(appealDeadline).toLocaleString('vi-VN')}` : 'Chưa mở hạn'}
                tone="amber"
              />
              <MetricCard
                label="Thăng Tiến Liên Tiếp"
                value={`${consecutiveGoodMonths}/3 Tháng`}
                note="Yêu cầu: 3 tháng đạt Tốt trở lên"
                tone="purple"
              />
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              {/* CỘT TRÁI: BREAKDOWN VÀ ĐIỂM ĐỒNG NGHIỆP */}
              <div className="space-y-4 xl:col-span-2">
                {/* ĐIỂM ĐỒNG NGHIỆP ẨN DANH */}
                {currentEvaluation.peer_summary && (
                  <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                          <Users size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#001D3D]">
                            Góp Ý Đồng Nghiệp Cùng Ca ({currentEvaluation.peer_summary.applied_weight_percent}% Trọng Số)
                          </h3>
                          <p className="text-[11px] text-gray-500">
                            {currentEvaluation.peer_summary.enough_anonymous_sample
                              ? 'Được tổng hợp ẩn danh từ các đồng nghiệp làm chung ca'
                              : 'Chưa đủ mẫu ẩn danh — 10% trọng số tự động chuyển cho Người chấm chính'}
                          </p>
                        </div>
                      </div>

                      {currentEvaluation.peer_summary.total_score ? (
                        <span className="font-mono text-lg font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-xl">
                          {currentEvaluation.peer_summary.total_score.toFixed(1)} / 5.0
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-xl">
                          Không đủ mẫu
                        </span>
                      )}
                    </div>

                    {(currentEvaluation.peer_summary.strength_summary || currentEvaluation.peer_summary.improvement_summary) && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 text-xs">
                        {currentEvaluation.peer_summary.strength_summary && (
                          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                              Điểm Mạnh Được Đồng Nghiệp Ghi Nhận
                            </span>
                            <p className="text-gray-700 text-[11px] leading-relaxed">
                              {currentEvaluation.peer_summary.strength_summary}
                            </p>
                          </div>
                        )}

                        {currentEvaluation.peer_summary.improvement_summary && (
                          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                              Góp Ý Cải Thiện Từ Đồng Nghiệp
                            </span>
                            <p className="text-gray-700 text-[11px] leading-relaxed">
                              {currentEvaluation.peer_summary.improvement_summary}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* BREAKDOWN NHÓM TIÊU CHÍ */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-[#2F6FA8]" />
                      <h3 className="text-sm font-bold text-[#001D3D]">Chi Tiết Điểm Theo Nhóm Tiêu Chí</h3>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {groupBreakdown.map((group) => (
                      <div key={group.id} className="px-4 py-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-gray-900">{group.name}</div>
                            <div className="mt-1 text-[11px] text-gray-500">
                              Trọng số {group.weight}% • Nguồn đối chiếu: {group.sourceRefs.join(', ') || 'Hệ thống'}
                            </div>
                            {group.note && (
                              <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg">
                                Ghi chú của quản lý: {group.note}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono text-xs font-bold tabular-nums text-gray-400">
                              Gợi ý: {group.suggested !== undefined ? group.suggested.toFixed(1) : '--'}
                            </div>
                            <div className="mt-1 font-mono text-base font-bold tabular-nums text-[#001D3D]">
                              Chốt: {group.final !== undefined ? group.final.toFixed(1) : '--'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LỊCH SỬ 3 KỲ */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={15} className="text-[#2F6FA8]" />
                      <h3 className="text-sm font-bold text-[#001D3D]">Lịch Sử Đánh Giá 3 Kỳ Gần Nhất</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {history.map((evaluation) => (
                      <div key={evaluation.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <div className="text-xs font-bold text-gray-900">
                          Tháng {(periodMonths[evaluation.period_id] ?? '').slice(5)}/{(periodMonths[evaluation.period_id] ?? '').slice(0, 4)}
                        </div>
                        <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-[#2F6FA8]"
                            style={{ width: `${Math.min(((evaluation.total_score ?? 0) / 5) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="font-mono text-sm font-bold tabular-nums text-[#001D3D]">
                          {evaluation.total_score ? evaluation.total_score.toFixed(1) : '--'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: NHẬN XÉT CỦA TRƯỞNG CA & KHIẾU NẠI */}
              <div className="space-y-4 xl:col-span-1">
                {/* NHẬN XÉT CỦA TRƯỞNG CA */}
                {currentEvaluation.monthly_feedback && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-[#2F6FA8]" />
                      <h3 className="text-sm font-bold text-[#001D3D]">Nhận Xét Của Quản Lý Ca</h3>
                    </div>

                    <div className="space-y-2 text-xs">
                      {currentEvaluation.monthly_feedback.strength && (
                        <div className="rounded-xl bg-emerald-50/70 p-3 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-emerald-800">Điểm Mạnh Nổi Bật</span>
                          <p className="text-gray-700 leading-relaxed">{currentEvaluation.monthly_feedback.strength}</p>
                        </div>
                      )}

                      {currentEvaluation.monthly_feedback.improvement && (
                        <div className="rounded-xl bg-amber-50/70 p-3 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-amber-800">Hành Động Cải Thiện</span>
                          <p className="text-gray-700 leading-relaxed">{currentEvaluation.monthly_feedback.improvement}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* HỘP KHIẾU NẠI 48H */}
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-[#2F6FA8]" />
                    <h3 className="text-sm font-bold text-[#001D3D]">Khiếu Nại KPI (Trong Vòng 48H)</h3>
                  </div>

                  {currentAppeal ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-[#2F6FA8] space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <ShieldCheck size={14} />
                        <span>{isAppealPending(currentAppeal) ? 'Đơn khiếu nại đang được xử lý' : 'Đơn khiếu nại đã có kết quả'}</span>
                      </div>
                      <p className="text-gray-600">Trạng thái: <strong>{formatAppealStatus(currentAppeal.status)}</strong></p>
                      <p className="text-gray-500 text-[11px]">Hạn chót giải quyết: {new Date(currentAppeal.deadline_at).toLocaleString('vi-VN')}</p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5 text-xs text-gray-600 space-y-1">
                        <p>
                          {appealDeadline && appealWindowOpen
                            ? `Bạn còn ${countdownLabel} để gửi yêu cầu đối chiếu lại điểm số nếu phát hiện sai lệch dữ liệu chấm công hoặc POS.`
                            : appealDeadline
                              ? 'Thời hạn 48 giờ để gửi khiếu nại đã kết thúc.'
                              : 'Chưa có mốc công bố để mở tiếp nhận khiếu nại.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!appealWindowOpen}
                        onClick={() => setShowAppealDialog(true)}
                        className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#2F6FA8] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1D3E61] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        <Send size={14} />
                        <span>Tạo Đơn Khiếu Nại Điểm KPI</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* DIALOG GỬI KHIẾU NẠI */}
      {showAppealDialog && currentEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-[#2F6FA8]" />
              <h3 className="text-sm font-bold text-[#001D3D]">
                Gửi Khiếu Nại Điểm KPI Tháng {selectedPeriod.slice(5)}/{selectedPeriod.slice(0, 4)}
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">Lý do khiếu nại (bắt buộc):</label>
                <textarea
                  value={appealReason}
                  onChange={(event) => setAppealReason(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#2F6FA8]"
                  placeholder="Mô tả rõ tiêu chí nào, ca làm việc nào bạn muốn đối chiếu lại..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">Bằng chứng / Mã phiếu đối chiếu:</label>
                <input
                  value={appealEvidence}
                  onChange={(event) => setAppealEvidence(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#2F6FA8]"
                  placeholder="Ví dụ: pos_sheet_aug, cham_cong_ca_20_08"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">Tiêu chí cần đối chiếu:</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {currentEvaluation.snapshot.groups.flatMap((group) => group.criteria).filter((criterion) => criterion.active).map((criterion) => {
                    const checked = appealCriterionIds.includes(criterion.id)
                    return (
                      <label key={criterion.id} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setAppealCriterionIds((current) => (
                              current.includes(criterion.id)
                                ? current.filter((id) => id !== criterion.id)
                                : [...current, criterion.id]
                            ))
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-[#2F6FA8]"
                        />
                        <span>{criterion.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowAppealDialog(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitAppeal}
                disabled={!appealReason.trim()}
                className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1D3E61] disabled:opacity-40 cursor-pointer"
              >
                Gửi Khiếu Nại
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone: 'blue' | 'emerald' | 'amber' | 'purple'
}) {
  const toneMap = {
    blue: 'bg-blue-50 text-[#2F6FA8] border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    purple: 'bg-purple-50 text-purple-800 border-purple-100',
  } as const

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`mt-2 inline-flex rounded-2xl border px-3 py-1.5 ${toneMap[tone]}`}>
        <span className="font-mono text-xl font-bold tabular-nums">{value}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">{note}</div>
    </div>
  )
}

function formatCountdown(deadline: string) {
  const diffMs = new Date(deadline).getTime() - new Date().getTime()

  if (diffMs <= 0) return 'Đã hết hạn'

  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}h ${minutes}p`
}

function isAppealPending(appeal: KpiAppeal) {
  return appeal.status === 'submitted' || appeal.status === 'reviewing'
}

function formatAppealStatus(status: KpiAppeal['status']) {
  const labels: Record<KpiAppeal['status'], string> = {
    submitted: 'Đã tiếp nhận',
    reviewing: 'Đang xem xét',
    approved: 'Được chấp thuận',
    partially_approved: 'Được chấp thuận một phần',
    rejected: 'Không được chấp thuận',
  }
  return labels[status]
}
