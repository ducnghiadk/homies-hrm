'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import ManagerReviewForm from '@/components/kpi/ManagerReviewForm'
import { getCurrentPeriod } from '@/lib/mock-data-kpi'
import { mockEmployees } from '@/lib/mock-data'
import {
  evaluationStore, submitManagerReview, publishEvaluation,
  publishBatchEvaluations, initStores,
} from '@/lib/kpi-evaluation-service'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

type TabKey = 'pending' | 'reviewed' | 'all'

export default function ManagerReviewPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('pending')
  const [period, setPeriod] = useState(getCurrentPeriod())
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    initStores()
  }, [])

  if (!user || user.role === 'employee') return null

  void tick
  const storeId = user.store_id || 'store-001'

  const allEvals = evaluationStore.filter(e => e.store_id === storeId && e.period === period)
  const pending = allEvals.filter(e => ['self_submitted', 'under_review'].includes(e.status))
  const reviewed = allEvals.filter(e => ['published', 'finalized'].includes(e.status))

  const currentList = tab === 'pending' ? pending : tab === 'reviewed' ? reviewed : allEvals

  const getEmpName = (id: string) => mockEmployees.find(e => e.id === id)?.full_name || id

  const reviewingEval = reviewingId ? evaluationStore.find(e => e.id === reviewingId) : undefined

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending', label: 'Chờ review', count: pending.length },
    { key: 'reviewed', label: 'Đã review', count: reviewed.length },
    { key: 'all', label: 'Tất cả', count: allEvals.length },
  ]

  const periods = ['2026-02', '2026-01', '2025-12']

  if (reviewingEval) {
    return (
      <AppShell title={`🔍 Review: ${getEmpName(reviewingEval.employee_id)}`} backHref="/kpi/review">
        <div className="space-y-4">
          <button onClick={() => setReviewingId(null)}
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: 'var(--primary)' }}>
            <ChevronLeft size={16} /> Quay lại danh sách
          </button>

          {/* Employee info */}
          <div className="card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--gray-200)' }}>
              {getEmpName(reviewingEval.employee_id).charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold">{getEmpName(reviewingEval.employee_id)}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Level {reviewingEval.employee_level} · Option {reviewingEval.option_type} · Vi phạm: {reviewingEval.violation_score}/100
              </div>
            </div>
          </div>

          <ManagerReviewForm
            evaluation={reviewingEval}
            onSubmitReview={(scores, comment) => {
              submitManagerReview(reviewingEval.id, scores, comment, user.id)
              toast.success('✅ Review hoàn thành!')
              setReviewingId(null)
              refresh()
            }}
            onPublish={() => {
              publishEvaluation(reviewingEval.id, user.id)
              toast.success('📢 Đã công bố kết quả!')
              setReviewingId(null)
              refresh()
            }}
            onSaveDraft={(scores, comment) => {
              submitManagerReview(reviewingEval.id, scores, comment, user.id)
              toast.info('💾 Đã lưu nháp')
              refresh()
            }}
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="🔍 Manager Review" backHref="/kpi">
      <div className="space-y-4">
        <Link href="/kpi" className="inline-flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--primary)' }}>
          <ChevronLeft size={16} /> KPI Dashboard
        </Link>

        {/* Trial eval link */}
        <Link href="/kpi/evaluate/trial"
          className="card p-3 flex items-center gap-2 no-underline"
          style={{ background: '#eff6ff' }}>
          <span>👶</span>
          <span className="text-xs font-bold" style={{ color: '#1d4ed8' }}>
            Đánh giá nhân viên thử việc
          </span>
        </Link>

        {/* Filters */}
        <div className="flex gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold outline-none"
            style={{ border: '1px solid var(--gray-200)' }}>
            {periods.map(p => (
              <option key={p} value={p}>Tháng {p.slice(5)}/{p.slice(0, 4)}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: tab === t.key ? 'var(--primary)' : 'var(--gray-100)',
                color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              }}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Batch publish */}
        {tab === 'reviewed' && selected.size > 0 && (
          <button onClick={() => {
            publishBatchEvaluations([...selected], user.id)
            toast.success(`📢 Đã công bố ${selected.size} đánh giá!`)
            setSelected(new Set())
            refresh()
          }}
            className="w-full py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: '#10b981' }}>
            📢 Công bố hàng loạt ({selected.size})
          </button>
        )}

        {/* Employee list */}
        {currentList.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Không có đánh giá nào
          </div>
        ) : (
          <div className="space-y-2">
            {currentList.map(ev => {
              const STATUS: Record<string, { label: string; color: string }> = {
                draft: { label: 'Nháp', color: '#6b7280' },
                self_submitted: { label: 'Chờ review', color: '#f59e0b' },
                under_review: { label: 'Đang review', color: '#3b82f6' },
                published: { label: 'Đã công bố', color: '#10b981' },
                finalized: { label: 'Hoàn tất', color: '#6b7280' },
              }
              const status = STATUS[ev.status] || { label: ev.status, color: '#6b7280' }

              return (
                <div key={ev.id} className="card p-3 flex items-center gap-3">
                  {tab === 'reviewed' && ev.status === 'under_review' && (
                    <input type="checkbox" checked={selected.has(ev.id)}
                      onChange={e => {
                        const next = new Set(selected)
                        if (e.target.checked) next.add(ev.id)
                        else next.delete(ev.id)
                        setSelected(next)
                      }}
                      className="w-4 h-4 rounded" />
                  )}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--gray-200)' }}>
                    {getEmpName(ev.employee_id).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold">{getEmpName(ev.employee_id)}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Level {ev.employee_level} · Self: {ev.total_score}
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: `${status.color}20`, color: status.color }}>
                    {status.label}
                  </span>
                  {(ev.status === 'self_submitted' || ev.status === 'under_review') && (
                    <button onClick={() => setReviewingId(ev.id)}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white"
                      style={{ background: 'var(--primary)' }}>
                      {ev.status === 'under_review' ? 'Tiếp tục' : 'Review'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
