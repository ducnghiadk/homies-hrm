'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { getAllPendingAppeals, mockViolationRecords, mockViolationTypes } from '@/lib/mock-data-kpi'
import { mockEmployees } from '@/lib/mock-data'
import { reviewAppeal, createViolationNotification } from '@/lib/violation-service'
import ReviewAppealDialog from '@/components/kpi/ReviewAppealDialog'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ViolationRecord } from '@/lib/kpi-types'

type TabKey = 'pending' | 'approved' | 'rejected'

export default function AppealsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('pending')
  const [reviewTarget, setReviewTarget] = useState<ViolationRecord | null>(null)
  const [tick, setTick] = useState(0)
  const [now] = useState(() => Date.now())
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user || user.role === 'employee') return null

  void tick
  const storeId = user.store_id || 'store-001'

  const pending = getAllPendingAppeals(storeId)
  const approved = mockViolationRecords.filter(v => v.status === 'appeal_approved' && v.store_id === storeId)
  const rejected = mockViolationRecords.filter(v => v.status === 'appeal_rejected' && v.store_id === storeId)

  const currentList = tab === 'pending' ? pending : tab === 'approved' ? approved : rejected

  const getEmpName = (id: string) => mockEmployees.find(e => e.id === id)?.full_name || id
  const getViolationName = (typeId: string) => mockViolationTypes.find(v => v.id === typeId)?.name || ''

  const TABS: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: 'pending', label: 'Chờ xét', count: pending.length, color: '#7c3aed' },
    { key: 'approved', label: 'Đã duyệt', count: approved.length, color: '#10b981' },
    { key: 'rejected', label: 'Đã từ chối', count: rejected.length, color: '#ef4444' },
  ]

  return (
    <AppShell title="⚖️ Xét khiếu nại" backHref="/kpi/violations">
      <div className="space-y-4">
        <Link href="/kpi/violations" className="inline-flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--primary)' }}>
          <ChevronLeft size={16} /> Quay lại
        </Link>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: tab === t.key ? t.color : 'var(--gray-100)',
                color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              }}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* List */}
        {currentList.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            {tab === 'pending' ? '✅ Không có khiếu nại nào cần xét' : 'Chưa có dữ liệu'}
          </div>
        ) : (
          <div className="space-y-2">
            {currentList.map(v => {
              const vTypeName = getViolationName(v.violation_type_id)
              const appealAge = v.appeal_at ? Math.round((now - new Date(v.appeal_at).getTime()) / 3600000) : 0
              return (
                <div key={v.id} className="card p-3 space-y-2">
                  {/* Employee + violation */}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'var(--gray-200)' }}>
                      {getEmpName(v.employee_id).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold">{getEmpName(v.employee_id)}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {vTypeName} · <span className="font-bold text-red-600">-{v.penalty_points} điểm</span>
                      </div>
                    </div>
                    {tab === 'pending' && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] font-bold" style={{ color: appealAge > 24 ? '#ef4444' : '#f59e0b' }}>
                          {appealAge}h trước
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Appeal reason */}
                  <div className="p-2 rounded-lg text-xs" style={{ background: '#ede9fe', color: '#4c1d95' }}>
                    <strong>Lý do:</strong> {v.appeal_reason}
                  </div>

                  {/* Dates */}
                  <div className="text-[10px] flex gap-3" style={{ color: 'var(--text-muted)' }}>
                    <span>📅 Log: {new Date(v.logged_at).toLocaleDateString('vi-VN')}</span>
                    <span>🔔 KN: {v.appeal_at ? new Date(v.appeal_at).toLocaleDateString('vi-VN') : '—'}</span>
                  </div>

                  {/* Decision (for approved/rejected) */}
                  {v.appeal_decision && (
                    <div className="p-2 rounded-lg text-xs" style={{
                      background: v.status === 'appeal_approved' ? '#dcfce7' : '#fee2e2',
                      color: v.status === 'appeal_approved' ? '#166534' : '#991b1b',
                    }}>
                      <strong>Quyết định:</strong> {v.appeal_decision}
                    </div>
                  )}

                  {/* Review button for pending */}
                  {tab === 'pending' && (
                    <button onClick={() => setReviewTarget(v)}
                      className="w-full py-2 rounded-xl text-xs font-bold text-white"
                      style={{ background: '#7c3aed' }}>
                      ⚖️ Xét duyệt
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <ReviewAppealDialog
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        violation={reviewTarget}
        onDecision={(id, decision, note) => {
          const updated = reviewAppeal(id, decision, note, user.id)
          if (updated) {
            createViolationNotification(updated, 'appeal_result')
            toast.success(
              decision === 'approved'
                ? '✅ Đã chấp nhận khiếu nại. Điểm đã hoàn.'
                : '❌ Đã từ chối khiếu nại.',
            )
          }
          setReviewTarget(null)
          refresh()
        }}
      />
    </AppShell>
  )
}
