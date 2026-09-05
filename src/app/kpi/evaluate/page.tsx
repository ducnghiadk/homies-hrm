'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import SelfEvaluationForm from '@/components/kpi/SelfEvaluationForm'
import { getViolationSummary, getCurrentPeriod } from '@/lib/mock-data-kpi'
import { submitSelfEvaluation, evaluationStore, createEvaluation, initStores } from '@/lib/kpi-evaluation-service'
import { mockEmployees } from '@/lib/mock-data'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Clock,
  CheckCircle2,
  Calendar,
  Save,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import type { EmployeeLevel } from '@/lib/kpi-types'

function getEmployeeLevel(empId: string): EmployeeLevel {
  const emp = mockEmployees.find(e => e.id === empId)
  if (!emp) return 'L1'
  if (emp.status === 'probation') return 'L0'
  switch (emp.role) {
    case 'ceo': return 'L5'
    case 'store_manager': return 'L4'
    case 'shift_leader': return 'L3'
    default: return 'L1'
  }
}

export default function SelfEvaluatePage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [tick, setTick] = useState(0)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/kpi/evaluate')
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    initStores()
  }, [])

  if (!hasHydrated || !user) return null

  void tick
  const period = getCurrentPeriod()
  const empId = user.id
  const level = getEmployeeLevel(empId)

  let evaluation = evaluationStore.find(e => e.employee_id === empId && e.period === period)

  if (!evaluation) {
    evaluation = createEvaluation(empId, period, user.store_id || 'store-001', level)
  }

  const violationSummary = getViolationSummary(empId, period)
  const isDraft = evaluation.status === 'draft'
  const isSubmitted = ['self_submitted', 'under_review', 'published', 'finalized'].includes(evaluation.status)
  const draftKey = `kpi-eval-draft-${empId}-${period}`

  const steps = [
    { label: 'Tự Đánh Giá', active: isDraft, done: !isDraft },
    { label: 'Quản Lý Review', active: evaluation.status === 'self_submitted' || evaluation.status === 'under_review', done: ['published', 'finalized'].includes(evaluation.status) },
    { label: 'Công Bố Điểm', active: ['published', 'finalized'].includes(evaluation.status), done: evaluation.status === 'finalized' },
  ]

  return (
    <AppShell showNav className="w-full max-w-none bg-[#FFF8E8] min-h-screen">
      {/* ══════════════════════════════════════════════════════════════════════
          TẦNG 1: EXECUTIVE COMMAND HEADER (Cố định sticky top-0 z-30)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs w-full sticky top-0 z-30">
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          {/* Cột trái: Breadcrumb + Tiêu đề */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/kpi" className="hover:text-[#2F6FA8] transition">
                Hiệu Suất &amp; Đánh Giá KPI
              </Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="text-[#2F6FA8] font-bold">Tự Đánh Giá</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight">
                Tự Đánh Giá Hiệu Suất KPI Tháng {period.slice(5)}/{period.slice(0, 4)}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                isDraft
                  ? 'bg-blue-50 text-[#2F6FA8] border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isDraft ? 'Đang thực hiện' : 'Đã nộp bài'}
              </span>
            </div>
          </div>

          {/* Cột phải: Nút quay lại */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/kpi"
              className="px-3.5 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
            >
              <ChevronLeft size={14} />
              <span>Về Trang KPI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          NỘI DUNG CHÍNH (FULL WIDTH CONTAINER)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 max-w-4xl mx-auto space-y-5">
        {/* Step progress track */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 text-center">
              <div className="h-1.5 rounded-full mb-1.5 transition-all" style={{
                background: s.active ? '#2F6FA8' : s.done ? '#10B981' : '#E5E7EB',
              }} />
              <div className="flex items-center justify-center gap-1">
                {s.done ? (
                  <CheckCircle2 size={12} className="text-emerald-600" />
                ) : (
                  <span className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                    s.active ? 'bg-[#2F6FA8] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                )}
                <span className={`text-xs font-bold ${
                  s.active ? 'text-[#2F6FA8]' : s.done ? 'text-emerald-700' : 'text-gray-400'
                }`}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Auto-save timestamp */}
        {isDraft && lastSaved && (
          <div className="text-right text-xs text-gray-500 font-medium flex items-center justify-end gap-1">
            <Save size={12} className="text-[#2F6FA8]" />
            <span>Tự động lưu lúc {lastSaved}</span>
          </div>
        )}

        {/* Form or Completed banner */}
        {isDraft ? (
          <SelfEvaluationForm
            optionType={evaluation.option_type}
            employeeId={empId}
            period={period}
            existingScores={evaluation.category_scores.flatMap(c => c.scores)}
            violationScore={violationSummary.violation_score}
            draftKey={draftKey}
            onAutoSave={(ts) => setLastSaved(ts)}
            onSubmit={(scores, comment) => {
              submitSelfEvaluation(evaluation!.id, scores, comment)
              if (typeof window !== 'undefined') localStorage.removeItem(draftKey)
              toast.success('Đã gửi tự đánh giá thành công! Đang chờ Quản lý review.')
              refresh()
            }}
            onCancel={() => router.push('/kpi')}
          />
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#001D3D]">
                {evaluation.status === 'self_submitted'
                  ? 'Bạn Đã Gửi Bài Tự Đánh Giá'
                  : 'Đánh Giá KPI Tháng Đã Hoàn Tất'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {evaluation.status === 'self_submitted'
                  ? 'Quản lý cửa hàng đang tiến hành chấm điểm đối chiếu và phản hồi nhận xét.'
                  : 'Kết quả đánh giá chính thức đã được công bố.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 max-w-sm mx-auto flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Điểm tự đánh giá của bạn:</span>
              <span className="text-lg font-bold font-mono tabular-nums text-[#2F6FA8]">
                {evaluation.total_score} đ
              </span>
            </div>

            {evaluation.self_comment && (
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 max-w-md mx-auto text-left">
                <div className="text-[11px] font-bold text-[#2F6FA8] uppercase mb-0.5">Nhận xét của bạn:</div>
                <p className="text-xs text-gray-700 italic">&ldquo;{evaluation.self_comment}&rdquo;</p>
              </div>
            )}

            <div className="pt-2">
              <Link
                href={evaluation.status === 'published' ? '/kpi/result' : '/kpi'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition shadow-2xs"
              >
                <span>{evaluation.status === 'published' ? 'Xem Kết Quả Chi Tiết' : 'Về Trang Tổng Quan KPI'}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
