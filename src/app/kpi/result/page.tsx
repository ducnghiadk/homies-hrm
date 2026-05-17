'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import EvaluationResultCard from '@/components/kpi/EvaluationResultCard'
import KPIHistoryChart from '@/components/kpi/KPIHistoryChart'
import PromotionEligibilityCard from '@/components/kpi/PromotionEligibilityCard'
import { mockEvaluations, getCurrentPeriod, getEvaluationsByEmployeeMock, mockPromotionReviews, mockLevelConfigs } from '@/lib/mock-data-kpi'
import { evaluationStore, appealEvaluation, initStores } from '@/lib/kpi-evaluation-service'
import { toast } from 'sonner'
import Link from 'next/link'

export default function KPIResultPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [appealReason, setAppealReason] = useState('')
  const [showAppealDialog, setShowAppealDialog] = useState(false)
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    initStores()
  }, [])

  if (!user) return null

  void tick
  const empId = user.id
  const period = getCurrentPeriod()

  // Get current evaluation (published or finalized)
  const currentEval = evaluationStore.find(
    e => e.employee_id === empId && e.period === period &&
    ['published', 'finalized'].includes(e.status),
  )

  // History from mock
  const allEvals = getEvaluationsByEmployeeMock(empId)
  const prevEval = allEvals.find(e => e.period === '2026-01' && ['published', 'finalized'].includes(e.status))

  // Promotion
  const promo = mockPromotionReviews.find(r => r.employee_id === empId)
  const empName = user.full_name

  // Promotion progress  
  const cfg = mockLevelConfigs.find(c => c.level === (currentEval?.employee_level || 'L1'))
  const _publishedMonths = allEvals.filter(e => ['published', 'finalized'].includes(e.status)).length
  void _publishedMonths
  const requiredMonths = cfg?.min_months_to_promote ?? 6
  const monthsMeetingTarget = allEvals.filter(
    e => ['published', 'finalized'].includes(e.status) && e.total_score >= (cfg?.required_kpi_average ?? 75),
  ).length

  return (
    <AppShell title="📊 Kết quả KPI" backHref="/kpi">
      <div className="space-y-4">

        {/* No result yet */}
        {!currentEval ? (
          <div className="card p-6 text-center space-y-3">
            <div className="text-3xl">⏳</div>
            <p className="text-sm font-bold">Chưa có kết quả tháng {period.slice(5)}/{period.slice(0, 4)}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Kết quả sẽ có sau khi Manager hoàn thành review và công bố.
            </p>
            <Link href="/kpi/evaluate"
              className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white no-underline"
              style={{ background: 'var(--primary)' }}>
              📝 Tự đánh giá
            </Link>
          </div>
        ) : (
          <>
            {/* Result card with big score */}
            <EvaluationResultCard
              evaluation={currentEval}
              previousScore={prevEval?.total_score}
              showAppeal={currentEval.status === 'published'}
              onAppeal={() => setShowAppealDialog(true)}
            />
          </>
        )}

        {/* History chart */}
        <KPIHistoryChart evaluations={allEvals} currentPeriod={period} />

        {/* Promotion progress */}
        <div className="card p-3">
          <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
            🚀 Tiến trình thăng tiến
          </h4>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold">
              {monthsMeetingTarget}/{requiredMonths} tháng đạt KPI ≥{cfg?.required_kpi_average ?? 75}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
            <div className="h-full rounded-full transition-all" style={{
              width: `${Math.min((monthsMeetingTarget / requiredMonths) * 100, 100)}%`,
              background: monthsMeetingTarget >= requiredMonths ? '#10b981' : '#3b82f6',
            }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Dự kiến đủ điều kiện: T{Math.min(2 + requiredMonths - monthsMeetingTarget, 12).toString().padStart(2, '0')}/2026
          </p>
        </div>

        {/* Promotion review if exists */}
        {promo && (
          <PromotionEligibilityCard review={promo} employeeName={empName} />
        )}

        {/* History list */}
        <div className="card overflow-hidden">
          <div className="px-3 py-2 text-xs font-bold" style={{ background: 'var(--gray-50)' }}>
            📅 Lịch sử đánh giá
          </div>
          {allEvals
            .filter(e => ['published', 'finalized'].includes(e.status))
            .sort((a, b) => b.period.localeCompare(a.period))
            .map(ev => {
              const g = mockEvaluations.find(m => m.id === ev.id)
              void g
              return (
                <div key={ev.id} className="flex items-center px-3 py-2.5 border-b"
                  style={{ borderColor: 'var(--gray-50)' }}>
                  <span className="text-xs font-semibold w-20">
                    T{ev.period.slice(5)}/{ev.period.slice(0, 4)}
                  </span>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--gray-100)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${ev.total_score}%`,
                        background: ev.total_score >= 80 ? '#10b981' : ev.total_score >= 60 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                  </div>
                  <span className="text-sm font-black ml-3 w-8 text-right">{ev.total_score}</span>
                </div>
              )
            })}
        </div>
      </div>

      {/* Appeal dialog */}
      {showAppealDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4 space-y-3 animate-slide-up">
            <h3 className="text-sm font-bold">⚖️ Khiếu nại kết quả KPI</h3>
            <textarea value={appealReason} onChange={e => setAppealReason(e.target.value)}
              rows={4} placeholder="Lý do khiếu nại (tối thiểu 20 ký tự)..."
              className="w-full px-3 py-2 rounded-xl text-xs resize-none outline-none"
              style={{ border: '1px solid var(--gray-200)' }} />
            <div className="flex gap-2">
              <button onClick={() => { setShowAppealDialog(false); setAppealReason('') }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--gray-100)' }}>
                Huỷ
              </button>
              <button disabled={appealReason.length < 20}
                onClick={() => {
                  if (currentEval) {
                    appealEvaluation(currentEval.id, appealReason)
                    toast.success('🔔 Khiếu nại đã được gửi!')
                    setShowAppealDialog(false)
                    setAppealReason('')
                    refresh()
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                style={{ background: '#7c3aed' }}>
                Gửi khiếu nại
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
