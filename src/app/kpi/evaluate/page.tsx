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
import Link from 'next/link'
import type { EmployeeLevel } from '@/lib/kpi-types'

/** Derive KPI EmployeeLevel from Employee role + status */
function getEmployeeLevel(empId: string): EmployeeLevel {
  const emp = mockEmployees.find(e => e.id === empId)
  if (!emp) return 'L1'
  if (emp.status === 'probation') return 'L0'
  switch (emp.role) {
    case 'ceo': return 'L5'
    case 'store_manager': return 'L4'
    case 'shift_leader': return 'L3'
    default: return 'L1' // employee
  }
}

export default function SelfEvaluatePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tick, setTick] = useState(0)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  // Seed evaluationStore from localStorage/mock data
  useEffect(() => {
    initStores()
  }, [])

  if (!user) return null

  void tick
  const period = getCurrentPeriod()
  const empId = user.id
  const level = getEmployeeLevel(empId)

  let evaluation = evaluationStore.find(e => e.employee_id === empId && e.period === period)

  // Create draft if not exists
  if (!evaluation) {
    evaluation = createEvaluation(empId, period, user.store_id, level)
  }

  const violationSummary = getViolationSummary(empId, period)
  const isDraft = evaluation.status === 'draft'
  const isSubmitted = ['self_submitted', 'under_review', 'published', 'finalized'].includes(evaluation.status)

  // Auto-save key
  const draftKey = `kpi-eval-draft-${empId}-${period}`

  // Steps
  const steps = [
    { label: 'Tự đánh giá', active: isDraft },
    { label: 'Chờ review', active: evaluation.status === 'self_submitted' || evaluation.status === 'under_review' },
    { label: 'Kết quả', active: ['published', 'finalized'].includes(evaluation.status) },
  ]

  return (
    <AppShell title={`📝 Tự đánh giá KPI T${period.slice(5)}/${period.slice(0, 4)}`} backHref="/kpi">
      <div className="space-y-4">

        {/* Step indicator */}
        <div className="flex gap-1">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 text-center">
              <div className="h-1 rounded-full mb-1" style={{
                background: s.active ? 'var(--primary)' : 'var(--gray-200)',
              }} />
              <span className="text-[10px] font-semibold" style={{
                color: s.active ? 'var(--primary)' : 'var(--text-muted)',
              }}>{i + 1}. {s.label}</span>
            </div>
          ))}
        </div>

        {/* Auto-save indicator */}
        {isDraft && lastSaved && (
          <div className="text-right text-[10px]" style={{ color: 'var(--text-muted)' }}>
            💾 Tự động lưu lúc {lastSaved}
          </div>
        )}

        {/* Status banner */}
        {isSubmitted && (
          <div className="card p-3 text-center" style={{
            background: evaluation.status === 'published' ? '#dcfce7' : '#eff6ff',
            color: evaluation.status === 'published' ? '#166534' : '#1e40af',
          }}>
            <span className="text-sm font-bold">
              {evaluation.status === 'self_submitted' && '⏳ Đã gửi, chờ Manager review'}
              {evaluation.status === 'under_review' && '🔍 Manager đang review'}
              {evaluation.status === 'published' && '✅ Kết quả đã công bố'}
              {evaluation.status === 'finalized' && '📋 Đã hoàn tất'}
            </span>
            {evaluation.status === 'published' && (
              <Link href="/kpi/result" className="block text-xs font-semibold mt-1 underline"
                style={{ color: '#166534' }}>
                Xem kết quả →
              </Link>
            )}
          </div>
        )}

        {/* Form */}
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
              // Clear draft on successful submit
              if (typeof window !== 'undefined') localStorage.removeItem(draftKey)
              toast.success('✅ Đã gửi tự đánh giá! Chờ Manager review.')
              refresh()
            }}
            onCancel={() => router.push('/kpi')}
          />
        ) : (
          <div className="card p-4 text-center">
            <div className="text-3xl mb-2">
              {evaluation.status === 'self_submitted' ? '⏳' : '✅'}
            </div>
            <p className="text-sm font-bold mb-1">
              {evaluation.status === 'self_submitted'
                ? 'Bạn đã gửi tự đánh giá'
                : 'Đánh giá đã hoàn thành'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Điểm tự đánh giá: <strong>{evaluation.total_score}</strong>
            </p>
            {evaluation.self_comment && (
              <p className="text-xs mt-2 p-2 rounded-lg" style={{ background: 'var(--gray-50)' }}>
                &quot;{evaluation.self_comment}&quot;
              </p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
