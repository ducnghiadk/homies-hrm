'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import PromotionEligibilityCard from '@/components/kpi/PromotionEligibilityCard'
import { mockEmployees } from '@/lib/mock-data'
import { promotionStore, approvePromotion, rejectPromotion, initStores } from '@/lib/kpi-evaluation-service'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function PromotionPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [confirmAction, setConfirmAction] = useState<{
    reviewId: string
    action: 'approve' | 'reject'
  } | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  // Seed store
  useEffect(() => {
    initStores()
  }, [])

  if (!user || !['store_manager', 'area_manager', 'ceo'].includes(user.role)) return null

  void tick
  const pending = promotionStore.filter(r => r.status === 'pending')
  const decided = promotionStore.filter(r => r.status !== 'pending')

  const getEmpName = (id: string) => mockEmployees.find(e => e.id === id)?.full_name || id

  return (
    <AppShell title="🚀 Xét thăng tiến" backHref="/kpi">
      <div className="space-y-4">
        <Link href="/kpi/review" className="inline-flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--primary)' }}>
          <ChevronLeft size={16} /> Quay lại
        </Link>

        {/* Pending */}
        {pending.length > 0 && (
          <>
            <h3 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              ⏳ Chờ xét duyệt ({pending.length})
            </h3>
            {pending.map(r => (
              <PromotionEligibilityCard key={r.id} review={r}
                employeeName={getEmpName(r.employee_id)}
                onApprove={() => setConfirmAction({ reviewId: r.id, action: 'approve' })}
                onReject={() => setConfirmAction({ reviewId: r.id, action: 'reject' })}
              />
            ))}
          </>
        )}

        {pending.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            ✅ Không có hồ sơ thăng tiến nào cần xét
          </div>
        )}

        {/* Decided */}
        {decided.length > 0 && (
          <>
            <h3 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              📋 Đã quyết định ({decided.length})
            </h3>
            {decided.map(r => (
              <PromotionEligibilityCard key={r.id} review={r}
                employeeName={getEmpName(r.employee_id)} />
            ))}
          </>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4 space-y-3 animate-slide-up">
            <h3 className="text-sm font-bold">
              {confirmAction.action === 'approve' ? '✅ Phê duyệt thăng tiến' : '❌ Từ chối thăng tiến'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              NV: <strong>{getEmpName(promotionStore.find(r => r.id === confirmAction.reviewId)?.employee_id || '')}</strong>
            </p>
            <textarea value={decisionNote} onChange={e => setDecisionNote(e.target.value)}
              rows={3} placeholder="Ghi chú quyết định (bắt buộc)..."
              className="w-full px-3 py-2 rounded-xl text-xs resize-none outline-none"
              style={{ border: '1px solid var(--gray-200)' }} />
            <div className="flex gap-2">
              <button onClick={() => { setConfirmAction(null); setDecisionNote('') }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--gray-100)' }}>
                Huỷ
              </button>
              <button disabled={!decisionNote.trim()}
                onClick={() => {
                  if (confirmAction.action === 'approve') {
                    approvePromotion(confirmAction.reviewId, user.id, decisionNote)
                    toast.success('✅ Đã phê duyệt thăng tiến!')
                  } else {
                    rejectPromotion(confirmAction.reviewId, user.id, decisionNote)
                    toast.info('❌ Đã từ chối thăng tiến')
                  }
                  setConfirmAction(null)
                  setDecisionNote('')
                  refresh()
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                style={{
                  background: confirmAction.action === 'approve' ? '#10b981' : '#ef4444',
                }}>
                {confirmAction.action === 'approve' ? 'Phê duyệt' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
