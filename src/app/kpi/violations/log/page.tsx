'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockEmployees } from '@/lib/mock-data'
import { getViolationSummary } from '@/lib/mock-data-kpi'
import { logViolation, createViolationNotification } from '@/lib/violation-service'
import ViolationLogForm from '@/components/kpi/ViolationLogForm'
import EmployeeViolationSummary from '@/components/kpi/EmployeeViolationSummary'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function ViolationLogPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [showForm, setShowForm] = useState(true)
  const [previewEmpId, setPreviewEmpId] = useState('')
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user || user.role === 'employee') return null

  void tick
  const storeId = user.store_id || 'store-001'
  const storeEmployees = mockEmployees
    .filter(e => e.store_id === storeId && e.role === 'employee')
    .map(e => ({ id: e.id, name: e.full_name }))

  const period = '2026-02'
  const previewSummary = previewEmpId ? getViolationSummary(previewEmpId, period) : null

  return (
    <AppShell title="📝 Log lỗi vận hành" backHref="/kpi/violations">
      <div className="space-y-4">
        <Link href="/kpi/violations" className="inline-flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--primary)' }}>
          <ChevronLeft size={16} /> Quay lại danh sách
        </Link>

        {/* Preview summary of selected employee */}
        {previewSummary && (
          <EmployeeViolationSummary summary={previewSummary} />
        )}

        {showForm ? (
          <ViolationLogForm
            employees={storeEmployees}
            storeId={storeId}
            loggedBy={user.id}
            loggedByRole={user.role === 'ceo' ? 'ceo' : 'manager'}
            onSubmit={data => {
              const record = logViolation(data)
              createViolationNotification(record, 'new')
              toast.success('✅ Đã ghi nhận lỗi. Nhân viên sẽ nhận thông báo.')
              setPreviewEmpId(data.employee_id)
              setShowForm(false)
              refresh()
            }}
            onCancel={() => router.push('/kpi/violations')}
          />
        ) : (
          <div className="space-y-3 text-center py-4">
            <div className="text-3xl">✅</div>
            <p className="text-sm font-bold">Đã ghi nhận lỗi thành công!</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(true); setPreviewEmpId('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'var(--primary)' }}>
                Log thêm lỗi
              </button>
              <button onClick={() => router.push('/kpi/violations')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                Quay lại
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
