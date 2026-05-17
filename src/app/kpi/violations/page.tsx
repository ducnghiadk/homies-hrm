'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { getViolationsByEmployee, getViolationSummary, mockViolationTypes } from '@/lib/mock-data-kpi'
import { acknowledgeViolation, appealViolation } from '@/lib/violation-service'
import ViolationCard from '@/components/kpi/ViolationCard'
import EmployeeViolationSummary from '@/components/kpi/EmployeeViolationSummary'
import AppealDialog from '@/components/kpi/AppealDialog'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { ViolationRecordStatus } from '@/lib/kpi-types'

export default function ViolationsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [period, setPeriod] = useState('2026-02')
  const [statusFilter, setStatusFilter] = useState<'all' | ViolationRecordStatus>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [appealTargetId, setAppealTargetId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user) return null

  void tick
  const isManager = user.role !== 'employee'
  const empId = user.id

  const allViolations = getViolationsByEmployee(empId, period)
  const violations = statusFilter === 'all'
    ? allViolations
    : allViolations.filter(v => v.status === statusFilter)
  const summary = getViolationSummary(empId, period)

  const appealTarget = allViolations.find(v => v.id === appealTargetId)
  const appealViolationName = appealTarget
    ? mockViolationTypes.find(vt => vt.id === appealTarget.violation_type_id)?.name || ''
    : ''

  const periods = ['2026-02', '2026-01', '2025-12']

  return (
    <AppShell title="⚠️ Lỗi vận hành" backHref="/kpi">
      <div className="space-y-4">

        {/* Manager quick links */}
        {isManager && (
          <div className="flex gap-2">
            <Link href="/kpi/violations/log"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white text-center flex items-center justify-center gap-1 no-underline"
              style={{ background: '#ef4444' }}>
              <Plus size={14} /> Log lỗi
            </Link>
            <Link href="/kpi/violations/appeals"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-center no-underline"
              style={{ background: '#ede9fe', color: '#6d28d9' }}>
              ⚖️ Khiếu nại ({summary.pending_appeals})
            </Link>
            <Link href="/kpi/violations/store"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-center no-underline"
              style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
              📊 Tổng hợp
            </Link>
          </div>
        )}

        {/* Summary card */}
        <EmployeeViolationSummary summary={summary} />

        {/* Filters */}
        <div className="flex gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold outline-none"
            style={{ border: '1px solid var(--gray-200)' }}>
            {periods.map(p => (
              <option key={p} value={p}>Tháng {p.slice(5)}/{p.slice(0, 4)}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none"
            style={{ border: '1px solid var(--gray-200)' }}>
            <option value="all">Tất cả ({allViolations.length})</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="acknowledged">Đã xác nhận</option>
            <option value="appealed">Đang khiếu nại</option>
            <option value="appeal_approved">Chấp nhận KN</option>
            <option value="appeal_rejected">Từ chối KN</option>
            <option value="finalized">Hoàn tất</option>
          </select>
        </div>

        {/* Violation list */}
        {violations.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            🎉 Chưa có lỗi nào trong kỳ này
          </div>
        ) : (
          <div className="space-y-2">
            {violations.map(v => (
              <ViolationCard
                key={v.id}
                record={v}
                showActions={!isManager}
                expanded={expandedId === v.id}
                onToggleExpand={() => setExpandedId(expandedId === v.id ? null : v.id)}
                onAcknowledge={id => {
                  acknowledgeViolation(id)
                  toast.success('✅ Đã xác nhận lỗi')
                  refresh()
                }}
                onAppeal={id => setAppealTargetId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Appeal Dialog */}
      <AppealDialog
        isOpen={!!appealTargetId}
        onClose={() => setAppealTargetId(null)}
        violationName={appealViolationName}
        onSubmit={reason => {
          if (appealTargetId) {
            appealViolation(appealTargetId, reason)
            toast.success('🔔 Đã gửi khiếu nại. Chờ xét duyệt trong 48h.')
            setAppealTargetId(null)
            refresh()
          }
        }}
      />
    </AppShell>
  )
}
