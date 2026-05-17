'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import LeaveQuotaCard from '@/components/leave/LeaveQuotaCard'
import LeaveRequestList from '@/components/leave/LeaveRequestList'
import LeaveRequestForm from '@/components/leave/LeaveRequestForm'
import LeaveCalendar from '@/components/leave/LeaveCalendar'
import { StatCard, TabBar, ConfirmDialog } from '@/components/ui'
import {
  mockLeaveRequests, mockLeaveQuotas, mockLeaveCalendar, mockBlackoutDates,
  getLeaveStats, LEAVE_TYPE_MAP,
} from '@/lib/mock-data-leave'
import type { LeaveRequest, LeaveType } from '@/lib/mock-data-leave'
import {
  addPendingQuota, approveQuotaDeduct, rejectQuotaRestore, cancelQuotaRestore,
} from '@/lib/quota-service'
import {
  createLeaveAttendanceRecords, removeLeaveAttendanceRecords,
} from '@/lib/leave-attendance-sync'
import {
  Plus, Calendar,
  ClipboardList, CheckCircle2, Clock, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Suspense } from 'react'
import { checkLeaveImpactOnStaffing, type LeaveStaffingImpact } from '@/lib/understaffing-alert'

// ─── TYPES ───
type TabKey = 'my' | 'approval' | 'calendar'



// ─── INNER ───
function LeavePageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<TabKey>(
    initialTab === 'approval' ? 'approval' : initialTab === 'calendar' ? 'calendar' : 'my'
  )
  const [showForm, setShowForm] = useState(false)
  const [formInitialType, setFormInitialType] = useState<LeaveType | undefined>()
  const [requests, setRequests] = useState<LeaveRequest[]>(mockLeaveRequests)

  // Mock logged-in user
  const currentEmployeeId = 'emp-005'
  const currentQuota = mockLeaveQuotas.find(q => q.employee_id === currentEmployeeId)!

  const stats = useMemo(() => getLeaveStats(requests), [requests])

  const myRequests = useMemo(
    () => requests.filter(r => r.employee_id === currentEmployeeId),
    [requests, currentEmployeeId]
  )



  // ─── HANDLERS ───
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabKey)
    router.push(`/leave/request?tab=${tab}`, { scroll: false })
  }, [router])

  const handleOpenForm = useCallback((type?: LeaveType) => {
    setFormInitialType(type)
    setShowForm(true)
  }, [])

  // Dialog state for approve/reject/cancel/submit
  const [approveDialog, setApproveDialog] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false, id: null, name: '',
  })
  const [rejectDialog, setRejectDialog] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false, id: null, name: '',
  })
  const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false, id: null,
  })
  const [submitDialog, setSubmitDialog] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<LeaveRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [staffingImpact, setStaffingImpact] = useState<LeaveStaffingImpact | null>(null)
  const [showImpactWarning, setShowImpactWarning] = useState(false)
  const [impactPendingId, setImpactPendingId] = useState<string | null>(null)

  const handleSubmit = useCallback((draft: Partial<LeaveRequest>) => {
    const newRequest: LeaveRequest = {
      id: `LR-${String(requests.length + 1).padStart(3, '0')}`,
      employee_id: currentEmployeeId,
      employee_name: 'Nguyễn Văn An',
      employee_position: 'Barista',
      store_id: 'store-001',
      leave_type: draft.leave_type || 'annual',
      leave_type_label: LEAVE_TYPE_MAP[draft.leave_type || 'annual'].name,
      status: 'pending',
      start_date: draft.start_date || '',
      end_date: draft.end_date || '',
      days: draft.days || 1,
      isHalfDay: draft.isHalfDay || false,
      halfDayPeriod: draft.halfDayPeriod,
      reason: draft.reason || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      hasScheduleConflict: draft.hasScheduleConflict || false,
      conflictingShifts: draft.conflictingShifts,
    }
    setPendingSubmit(newRequest)
    setSubmitDialog(true)
  }, [requests.length, currentEmployeeId])

  const confirmSubmit = useCallback(() => {
    if (!pendingSubmit) return

    // Auto-deduct: tăng pending quota
    const quotaResult = addPendingQuota(
      pendingSubmit.employee_id,
      pendingSubmit.leave_type,
      pendingSubmit.days,
    )
    if (!quotaResult.success) {
      toast.error('❌ Không thể gửi đơn', { description: quotaResult.error })
      setSubmitDialog(false)
      return
    }

    setRequests(prev => [pendingSubmit, ...prev])
    setShowForm(false)
    setSubmitDialog(false)
    toast.success('📤 Đã gửi đơn xin nghỉ!', {
      description: `${pendingSubmit.leave_type_label} • ${pendingSubmit.days} ngày (còn ${quotaResult.quota?.remaining ?? '?'} ngày)`,
    })
    setPendingSubmit(null)
  }, [pendingSubmit])

  const handleApprove = useCallback((id: string) => {
    const req = requests.find(r => r.id === id)
    if (!req) return

    // Check staffing impact before approving
    const impact = checkLeaveImpactOnStaffing(req.employee_id, req.start_date, req.end_date)
    if (impact.willCauseUnderstaffing) {
      setStaffingImpact(impact)
      setImpactPendingId(id)
      setShowImpactWarning(true)
    } else {
      setApproveDialog({ isOpen: true, id, name: req?.employee_name || '' })
    }
  }, [requests])

  const handleReject = useCallback((id: string) => {
    const req = requests.find(r => r.id === id)
    setRejectDialog({ isOpen: true, id, name: req?.employee_name || '' })
  }, [requests])

  const handleCancel = useCallback((id: string) => {
    setCancelDialog({ isOpen: true, id })
  }, [])

  const confirmApprove = useCallback(async () => {
    if (!approveDialog.id) return
    setIsProcessing(true)
    await new Promise(r => setTimeout(r, 800))

    const req = requests.find(r => r.id === approveDialog.id)

    // Auto-deduct: used += days, pending -= days
    if (req) {
      approveQuotaDeduct(req.employee_id, req.leave_type, req.days)
      // Sync: tạo attendance records status='leave'
      createLeaveAttendanceRecords(
        req.employee_id, req.start_date, req.end_date,
        req.id, req.leave_type, req.isHalfDay, req.halfDayPeriod,
      )
    }

    setRequests(prev => prev.map(r =>
      r.id === approveDialog.id ? {
        ...r, status: 'approved' as const,
        approver_id: 'emp-002', approver_name: 'Nguyễn Quản Lý',
        approved_at: new Date().toISOString(),
      } : r
    ))
    toast.success('✅ Đã duyệt đơn nghỉ', { description: `Đơn của ${approveDialog.name} đã được duyệt. Quota đã cập nhật.` })
    setApproveDialog({ isOpen: false, id: null, name: '' })
    setIsProcessing(false)
  }, [approveDialog, requests])

  const confirmReject = useCallback(async (data?: { reason?: string }) => {
    if (!rejectDialog.id) return
    setIsProcessing(true)
    await new Promise(r => setTimeout(r, 800))

    const req = requests.find(r => r.id === rejectDialog.id)

    // Auto-deduct: hoàn pending
    if (req) {
      rejectQuotaRestore(req.employee_id, req.leave_type, req.days)
      // Sync: xóa attendance records nếu có
      removeLeaveAttendanceRecords(req.id)
    }

    setRequests(prev => prev.map(r =>
      r.id === rejectDialog.id ? {
        ...r, status: 'rejected' as const,
        approver_id: 'emp-002', approver_name: 'Nguyễn Quản Lý',
        rejected_at: new Date().toISOString(),
        approver_comment: data?.reason || 'Không đủ điều kiện',
      } : r
    ))
    toast.success('❌ Đã từ chối đơn', {
      description: data?.reason ? `Lý do: ${data.reason}` : undefined,
    })
    setRejectDialog({ isOpen: false, id: null, name: '' })
    setIsProcessing(false)
  }, [rejectDialog, requests])

  const confirmCancel = useCallback(async () => {
    if (!cancelDialog.id) return
    setIsProcessing(true)
    await new Promise(r => setTimeout(r, 800))

    const req = requests.find(r => r.id === cancelDialog.id)

    // Auto-deduct: hoàn quota dựa trên status cũ
    if (req && (req.status === 'pending' || req.status === 'approved')) {
      cancelQuotaRestore(req.employee_id, req.leave_type, req.days, req.status)
      // Sync: xóa attendance records nếu đã approved
      if (req.status === 'approved') {
        removeLeaveAttendanceRecords(req.id)
      }
    }

    setRequests(prev => prev.map(r =>
      r.id === cancelDialog.id ? { ...r, status: 'cancelled' as const, updated_at: new Date().toISOString() } : r
    ))
    toast('🚫 Đã hủy đơn nghỉ. Quota đã hoàn lại.')
    setCancelDialog({ isOpen: false, id: null })
    setIsProcessing(false)
  }, [cancelDialog, requests])



  const tabs = [
    { key: 'my', label: 'Đơn của tôi', icon: <ClipboardList size={14} /> },
    { key: 'approval', label: 'Phê duyệt', badge: stats.pending, icon: <CheckCircle2 size={14} /> },
    { key: 'calendar', label: 'Lịch nghỉ', icon: <Calendar size={14} /> },
  ]

  return (
    <AppShell title="Nghỉ phép">
      <div className="space-y-5 pb-20">
        {/* Header + Create button */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <ClipboardList size={20} className="text-primary-600" />
            Quản lý nghỉ phép
          </h1>
          <button
            onClick={() => handleOpenForm()}
            className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center
              hover:bg-primary-600 active:scale-95 transition-all shadow-md"
            aria-label="Tạo đơn nghỉ phép"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Quota Banner */}
        <LeaveQuotaCard
          quota={currentQuota}
          variant="full"
          showPending
          onQuickRequest={handleOpenForm}
        />

        {/* Tabs — underline variant with TabBar component */}
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          variant="underline"
          size="sm"
          fullWidth
        />

        {/* Tab Content */}
        {activeTab === 'my' && (
          <div className="animate-fade-in">
            <LeaveRequestList
              requests={myRequests}
              viewMode="employee"
              onCancel={handleCancel}
              emptyMessage="Bạn chưa tạo đơn xin nghỉ nào"
              emptyAction={{ label: '+ Tạo đơn đầu tiên', onClick: () => handleOpenForm() }}
            />
          </div>
        )}

        {activeTab === 'approval' && (
          <div className="animate-fade-in space-y-4">
            {/* Stats row — using StatCard for consistency */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                icon={Clock}
                label="Chờ duyệt"
                value={stats.pending}
                iconColor="text-amber-600"
                iconBg="bg-amber-100"
                className="bg-amber-50 border-amber-200"
                valueClassName="text-amber-700"
              />
              <StatCard
                icon={CheckCircle2}
                label="Đã duyệt"
                value={stats.approved}
                iconColor="text-green-600"
                iconBg="bg-green-100"
                className="bg-green-50 border-green-200"
                valueClassName="text-green-700"
              />
              <StatCard
                icon={XCircle}
                label="Từ chối"
                value={stats.rejected}
                iconColor="text-red-600"
                iconBg="bg-red-100"
                className="bg-red-50 border-red-200"
                valueClassName="text-red-700"
              />
            </div>

            <LeaveRequestList
              requests={requests}
              viewMode="manager"
              onApprove={handleApprove}
              onReject={handleReject}
              emptyMessage="Không có đơn nào cần duyệt"
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <LeaveCalendar
            entries={mockLeaveCalendar}
            blackoutDates={mockBlackoutDates}
          />
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <LeaveRequestForm
          quota={currentQuota}
          existingRequests={requests}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          initialData={formInitialType ? { leave_type: formInitialType } : undefined}
        />
      )}

      {/* FAB */}
      <button
        onClick={() => handleOpenForm()}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary-500 text-white
          flex items-center justify-center shadow-[var(--shadow-float)]
          hover:bg-primary-600 active:scale-95 transition-all z-40"
        aria-label="Tạo đơn nghỉ phép"
      >
        <Plus size={24} />
      </button>

      {/* Approve Confirmation */}
      <ConfirmDialog
        isOpen={approveDialog.isOpen}
        onClose={() => setApproveDialog({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmApprove}
        title="Duyệt đơn nghỉ phép?"
        description={`Xác nhận duyệt đơn của ${approveDialog.name}. Nhân viên sẽ nhận thông báo.`}
        confirmLabel="Duyệt đơn"
        variant="success"
        isLoading={isProcessing}
      />

      {/* Staffing Impact Warning */}
      <ConfirmDialog
        isOpen={showImpactWarning}
        onClose={() => { setShowImpactWarning(false); setImpactPendingId(null); setStaffingImpact(null) }}
        onConfirm={() => {
          setShowImpactWarning(false)
          const req = requests.find(r => r.id === impactPendingId)
          setApproveDialog({ isOpen: true, id: impactPendingId, name: req?.employee_name || '' })
        }}
        title="⚠️ Cảnh báo thiếu người"
        description={staffingImpact ? [
          `Duyệt đơn này sẽ gây thiếu người ${staffingImpact.affectedDays.filter(d => d.status !== 'ok').length} ngày:`,
          '',
          ...staffingImpact.affectedDays
            .filter(d => d.status !== 'ok')
            .map(d => `• ${d.date} — ${d.shift_name}: ${d.afterLeave}/${d.required} người ${d.status === 'critical' ? '🔴' : '🟡'}`),
          '',
          staffingImpact.recommendation,
        ].join('\n') : 'Đang kiểm tra...'}
        confirmLabel="Vẫn duyệt"
        variant="warning"
      />

      {/* Reject Confirmation */}
      <ConfirmDialog
        isOpen={rejectDialog.isOpen}
        onClose={() => setRejectDialog({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmReject}
        title="Từ chối đơn nghỉ phép?"
        description={`Từ chối đơn của ${rejectDialog.name}.`}
        confirmLabel="Từ chối"
        variant="danger"
        showReasonInput
        reasonLabel="Lý do từ chối"
        reasonPlaceholder="Nhập lý do để nhân viên hiểu..."
        reasonRequired
        isLoading={isProcessing}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false, id: null })}
        onConfirm={confirmCancel}
        title="Hủy đơn nghỉ phép?"
        description="Bạn có chắc muốn hủy đơn này? Hành động này không thể hoàn tác."
        confirmLabel="Hủy đơn"
        variant="warning"
        isLoading={isProcessing}
      />

      {/* Submit Confirmation */}
      <ConfirmDialog
        isOpen={submitDialog}
        onClose={() => { setSubmitDialog(false); setPendingSubmit(null) }}
        onConfirm={confirmSubmit}
        title="Gửi đơn nghỉ phép?"
        description={pendingSubmit
          ? `Bạn đang xin nghỉ ${pendingSubmit.days} ngày (${pendingSubmit.start_date} – ${pendingSubmit.end_date}). Đơn sẽ được gửi đến quản lý.`
          : undefined
        }
        confirmLabel="Gửi đơn"
        variant="default"
      />
    </AppShell>
  )
}

// ─── PAGE ───
export default function LeaveRequestPage() {
  return (
    <Suspense fallback={
      <AppShell title="Nghỉ phép">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-100 rounded-xl w-48" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
          </div>
        </div>
      </AppShell>
    }>
      <LeavePageInner />
    </Suspense>
  )
}
