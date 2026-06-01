'use client'


import { useAuthStore } from '@/store/auth-store'
import AppShell from '@/components/layout/AppShell'
import BatchViolationForm from '@/components/kpi/BatchViolationForm'

export default function BatchViolationPage() {
  const { user } = useAuthStore()
  if (!user || user.role === 'employee') return null

  return (
    <AppShell title="📋 Log lỗi cuối ca" backHref="/kpi/violations">
      <BatchViolationForm storeId={user.store_id} loggedBy={user.id} />
    </AppShell>
  )
}
