'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import TrialEvaluationForm from '@/components/kpi/TrialEvaluationForm'
import { getCurrentPeriod } from '@/lib/mock-data-kpi'
import { mockEmployees, isStoreMatch } from '@/lib/mock-data'
import { EmployeeService } from '@/lib/services/employees/employee-service'
import { employeeAdapter } from '@/lib/adapters'
import { evaluationStore, submitEvaluatorScore, initStores, getRequiredEvaluators } from '@/lib/kpi-evaluation-service'
import EvaluatorTracker from '@/components/kpi/EvaluatorTracker'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { EvaluatorRole } from '@/lib/kpi-types'

export default function TrialEvaluatePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  // Seed store & sync employees
  useEffect(() => {
    initStores()
    employeeAdapter.getAllEmployees().then(res => {
      if (res && res.length) {
        EmployeeService.syncEmployeesFromAdapter(res)
        refresh()
      }
    })
  }, [refresh])

  if (!user || user.role === 'employee') return null

  void tick
  const period = getCurrentPeriod()
  const storeId = user.store_id || 'store-001'

  // L0 employees in store
  const allEmps = user ? EmployeeService.getEmployees(user) : []
  const trialEmployees = allEmps.filter(
    e => isStoreMatch(e.store_id, storeId) && (e.status === 'probation' || e.is_probationary),
  )
  const trialEvals = evaluationStore.filter(
    e => isStoreMatch(e.store_id, storeId) && e.period === period && e.employee_level === 'L0',
  )

  const selectedEval = selectedEmpId
    ? trialEvals.find(e => e.employee_id === selectedEmpId)
    : undefined

  const myRole: EvaluatorRole = user.role === 'ceo' ? 'ceo'
    : user.role === 'store_manager' ? 'manager' : 'mentor'

  return (
    <AppShell title="👶 Đánh giá thử việc" backHref="/kpi/evaluate">
      <div className="space-y-4">
        <Link href="/kpi/review" className="inline-flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--primary)' }}>
          <ChevronLeft size={16} /> Quay lại
        </Link>

        {/* Employee selector */}
        <div className="card p-3">
          <label className="text-xs font-bold block mb-2">Chọn nhân viên thử việc</label>
          <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: '1px solid var(--gray-200)' }}>
            <option value="">-- Chọn nhân viên --</option>
            {trialEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>
            ))}
          </select>
        </div>

        {/* No trial employees */}
        {trialEmployees.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Không có nhân viên thử việc nào trong cửa hàng
          </div>
        )}

        {/* Evaluation form */}
        {selectedEval && (
          <>
            {/* Evaluator Tracker */}
            <EvaluatorTracker
              evaluators={getRequiredEvaluators(selectedEval.employee_level).map(e => {
                const existing = selectedEval.evaluator_scores?.find(es => es.evaluator_role === e.role)
                const evaluator = mockEmployees.find(emp =>
                  e.role === 'manager' ? emp.role === 'store_manager' && emp.store_id === storeId :
                  e.role === 'mentor' ? emp.store_id === storeId && emp.role === 'shift_leader' :
                  e.role === 'self' ? emp.id === selectedEmpId : false
                )
                return {
                  id: evaluator?.id || e.role,
                  name: evaluator?.full_name || e.role,
                  role: e.role,
                  required: e.required,
                  submitted: !!existing,
                  submittedAt: existing?.submitted_at,
                  score: existing ? (existing.scores.reduce((s, sc) => s + (sc.final_score ?? 0), 0) / (existing.scores.length || 1)) : undefined,
                }
              })}
              employeeName={mockEmployees.find(e => e.id === selectedEmpId)?.full_name}
            />

            <TrialEvaluationForm
              evaluation={selectedEval}
              evaluatorRole={myRole}
              existingEvaluatorScores={selectedEval.evaluator_scores}
              onSubmit={(scores, comment) => {
                submitEvaluatorScore(selectedEval.id, user.id, myRole, scores, comment)
                toast.success('✅ Đã gửi đánh giá thử việc!')
                refresh()
              }}
            />
          </>
        )}

        {selectedEmpId && !selectedEval && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Chưa có bản đánh giá cho nhân viên này kỳ T{period.slice(5)}
          </div>
        )}
      </div>
    </AppShell>
  )
}
