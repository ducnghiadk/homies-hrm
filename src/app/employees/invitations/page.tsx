'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import AppShell from '@/components/layout/AppShell'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { type EmployeeInvitation } from '@/lib/mock-data-employee-ext'
import { EmployeeService } from '@/lib/services/employee-service'
import { useAuthStore } from '@/store/auth-store'
import { InvitationDetailModal } from './_components/InvitationDetailModal'
import { INVITATIONS_COPY } from './_components/invitations-copy'
import { InvitationsTable } from './_components/InvitationsTable'
import { InvitationsToolbar } from './_components/InvitationsToolbar'
import type { InvitationTab } from './_components/invitations-types'

async function sendInvitationEmailRequest(input: {
  id: string
  full_name: string
  email: string
  store_id: string
  position_id: string
  email_subject?: string
  email_personal_note?: string
  email_deadline?: string
  email_support_name?: string
  email_support_info?: string
  hire_date?: string
  department_name?: string
  employee_type?: string
  job_level?: string
  official_salary?: number
  kpi_salary?: number
  is_probationary?: boolean
  probation_end_date?: string
  probation_salary_value?: number
}) {
  const response = await fetch('/api/invitations/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invitation: input,
    }),
  })

  return await response.json() as { ok: boolean; error?: string }
}

function buildCandidateFormUrl(invitation: EmployeeInvitation) {
  const shareKey = invitation.public_access_token || invitation.id
  return `${window.location.origin}/employees/invitations/form?token=${encodeURIComponent(shareKey)}`
}

type InvitationConfirmState =
  | { kind: 'approve' | 'reject' | 'cancel'; invitationId: string }
  | { kind: 'request_revision'; invitationId: string; initialReason?: string }
  | null

export default function InvitationsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [activeTab, setActiveTab] = useState<InvitationTab>('all')
  const [selectedSendFilter, setSelectedSendFilter] = useState('all')
  const [selectedFocusFilter, setSelectedFocusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedInvitation, setSelectedInvitation] = useState<EmployeeInvitation | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<InvitationConfirmState>(null)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/employees/invitations')
    }
  }, [hasHydrated, isAuthenticated, router])

  const invitations = user ? EmployeeService.getInvitations(user) : []
  void refreshTrigger
  const today = new Date()

  const filteredInvitations = invitations
    .filter((invitation) => {
      if (activeTab === 'pending_approval') return invitation.status === 'pending_approval'
      if (activeTab === 'needs_revision') return invitation.status === 'needs_revision'
      if (activeTab === 'rejected') return invitation.status === 'rejected'
      if (activeTab === 'approved') return invitation.status === 'approved'
      if (activeTab === 'others') return !['pending_approval', 'needs_revision', 'rejected', 'approved'].includes(invitation.status)
      return true
    })
    .filter((invitation) => !selectedStore || invitation.store_id === selectedStore)
    .filter((invitation) => {
      if (selectedSendFilter === 'all') return true
      if (selectedSendFilter === 'sent_failed') return invitation.send_status === 'sent_failed'
      if (selectedSendFilter === 'sent_success') return invitation.send_status === 'sent_success'
      if (selectedSendFilter === 'not_sent') return invitation.send_status === 'not_sent'
      return true
    })
    .filter((invitation) => {
      const ready = EmployeeService.isInvitationReadyForApproval(invitation)
      if (selectedFocusFilter === 'all') return true
      if (selectedFocusFilter === 'needs_approval') return invitation.status === 'pending_approval'
      if (selectedFocusFilter === 'missing_info') return !ready.ready
      if (selectedFocusFilter === 'resend_failed') return invitation.send_status === 'sent_failed'
      if (selectedFocusFilter === 'scheduled_soon') {
        if (!invitation.hire_date) return false
        const hireDate = new Date(invitation.hire_date)
        const diffDays = Math.ceil((hireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 7
      }
      return true
    })
    .filter((invitation) => {
      const term = searchTerm.trim().toLowerCase()
      if (!term) return true
      return (
        invitation.full_name.toLowerCase().includes(term) ||
        invitation.email.toLowerCase().includes(term) ||
        invitation.phone.includes(term) ||
        (invitation.department_name || '').toLowerCase().includes(term) ||
        (invitation.job_level || '').toLowerCase().includes(term)
      )
    })
    .sort((left, right) => {
      const leftReady = EmployeeService.isInvitationReadyForApproval(left)
      const rightReady = EmployeeService.isInvitationReadyForApproval(right)
      const leftHire = left.hire_date ? new Date(left.hire_date).getTime() : Number.MAX_SAFE_INTEGER
      const rightHire = right.hire_date ? new Date(right.hire_date).getTime() : Number.MAX_SAFE_INTEGER
      const leftSent = left.last_sent_at ? new Date(left.last_sent_at).getTime() : 0
      const rightSent = right.last_sent_at ? new Date(right.last_sent_at).getTime() : 0
      const leftCreated = left.invited_at ? new Date(left.invited_at).getTime() : 0
      const rightCreated = right.invited_at ? new Date(right.invited_at).getTime() : 0

      if (sortBy === 'hire_date') return leftHire - rightHire
      if (sortBy === 'approval_queue') {
        const approvalScoreLeft = left.status === 'pending_approval' ? 0 : 1
        const approvalScoreRight = right.status === 'pending_approval' ? 0 : 1
        if (approvalScoreLeft !== approvalScoreRight) return approvalScoreLeft - approvalScoreRight
        return leftCreated - rightCreated
      }
      if (sortBy === 'send_failure') {
        const sendScoreLeft = left.send_status === 'sent_failed' ? 0 : 1
        const sendScoreRight = right.send_status === 'sent_failed' ? 0 : 1
        if (sendScoreLeft !== sendScoreRight) return sendScoreLeft - sendScoreRight
        return rightSent - leftSent
      }
      if (sortBy === 'completion') {
        return rightReady.completenessPercent - leftReady.completenessPercent
      }

      return rightCreated - leftCreated
    })

  if (!user) return null

  const canAccess = ['ceo', 'hr_admin'].includes(user.role)
  if (!canAccess) {
    return (
      <AppShell title={INVITATIONS_COPY.accessDeniedTitle}>
        <div className="py-20 text-center text-gray-500">
          {INVITATIONS_COPY.accessDeniedMessage}
        </div>
      </AppShell>
    )
  }

  const forceRefresh = () => setRefreshTrigger((prev) => prev + 1)

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedStore('')
    setActiveTab('all')
    setSelectedSendFilter('all')
    setSelectedFocusFilter('all')
    setSortBy('newest')
  }

  const syncSelectedInvitation = (invitationId: string) => {
    const latest = EmployeeService.getInvitationById(invitationId, user)
    if (latest && selectedInvitation?.id === invitationId) {
      setSelectedInvitation(latest)
    }
  }

  const handleApprove = (invitationId: string) => {
    const invitation = EmployeeService.getInvitationById(invitationId, user)
    if (!invitation || !EmployeeService.isInvitationReadyForApproval(invitation).ready) {
      toast.info('Hồ sơ chưa đủ thông tin để duyệt')
      return
    }

    setConfirmState({ kind: 'approve', invitationId })
    return
  }

  const handleApproveConfirmed = (invitationId: string) => {
    const employee = EmployeeService.confirmInvitation(invitationId, user)
    if (employee) {
      toast.success('Đã duyệt hồ sơ', {
        description: `Mã nhân viên mới: ${employee.employee_code}`,
      })
      setSelectedInvitation(null)
      forceRefresh()
    } else {
      toast.error('Không thể duyệt hồ sơ', {
        description: 'Lời mời có thể đã được xử lý hoặc chưa ở trạng thái chờ duyệt.',
      })
    }
  }

  const handleRequestRevision = (invitationId: string) => {
    const invitation = EmployeeService.getInvitationById(invitationId, user)
    setConfirmState({
      kind: 'request_revision',
      invitationId,
      initialReason: invitation?.revision_request_note || '',
    })
  }

  const handleRequestRevisionConfirmed = (invitationId: string, reason?: string) => {
    if (!reason?.trim()) {
      toast.info('Vui lòng nhập lý do bổ sung')
      return
    }

    EmployeeService.requestRevision(invitationId, reason)
    toast.success('Đã chuyển sang trạng thái cần bổ sung')
    forceRefresh()
    syncSelectedInvitation(invitationId)
  }

  const handleReject = (invitationId: string) => {
    setConfirmState({ kind: 'reject', invitationId })
  }

  const handleRejectConfirmed = (invitationId: string) => {
    EmployeeService.updateInvitationStatus(invitationId, 'rejected')
    toast.success('Đã từ chối hồ sơ')
    forceRefresh()
    syncSelectedInvitation(invitationId)
  }

  const handleCancel = (invitationId: string) => {
    setConfirmState({ kind: 'cancel', invitationId })
  }

  const handleCancelConfirmed = (invitationId: string) => {
    EmployeeService.updateInvitationStatus(invitationId, 'cancelled')
    toast.success('Đã hủy lời mời')
    forceRefresh()
  }

  const handleConfirmDialogClose = () => setConfirmState(null)

  const handleConfirmDialogSubmit = (data?: { reason?: string }) => {
    if (!confirmState) return

    if (confirmState.kind === 'approve') {
      handleApproveConfirmed(confirmState.invitationId)
    } else if (confirmState.kind === 'reject') {
      handleRejectConfirmed(confirmState.invitationId)
    } else if (confirmState.kind === 'cancel') {
      handleCancelConfirmed(confirmState.invitationId)
    } else {
      if (!data?.reason?.trim()) {
        toast.info('Vui lòng nhập lý do bổ sung')
        return
      }
      handleRequestRevisionConfirmed(confirmState.invitationId, data?.reason)
    }

    setConfirmState(null)
  }

  const handleSendInvitation = async (invitationId: string, isResend = false) => {
    const invitation = EmployeeService.getInvitationById(invitationId, user)
    if (!invitation) {
      toast.error('Không tìm thấy lời mời để gửi email')
      return
    }

    const validation = EmployeeService.validateInvitationDelivery(invitation, isResend ? 'resend' : 'send')
    if (!validation.ok) {
      toast.info(validation.reason || 'Lời mời chưa đủ điều kiện để gửi email')
      return
    }

    setSendingId(invitationId)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const sendResult = await sendInvitationEmailRequest({
      id: invitation.id,
      full_name: invitation.full_name,
      email: invitation.email,
      store_id: invitation.store_id,
      position_id: invitation.position_id,
      email_subject: invitation.email_subject,
      email_personal_note: invitation.email_personal_note,
      email_deadline: invitation.email_deadline,
      email_support_name: invitation.email_support_name,
      email_support_info: invitation.email_support_info,
      hire_date: invitation.hire_date,
      department_name: invitation.department_name,
      employee_type: invitation.employee_type,
      job_level: invitation.job_level,
      official_salary: invitation.official_salary,
      kpi_salary: invitation.kpi_salary,
      is_probationary: invitation.is_probationary,
      probation_end_date: invitation.probation_end_date,
      probation_salary_value: invitation.probation_salary_value,
    })

    const result = sendResult.ok
      ? (isResend
          ? EmployeeService.resendInvitation(invitationId, user)
          : EmployeeService.sendInvitation(invitationId, user))
      : EmployeeService.markInvitationSendFailed(
          invitationId,
          sendResult.error || 'Không thể gửi email lời mời.',
          user,
        )

    setSendingId(null)
    forceRefresh()

    if (sendResult.ok && result) {
      toast.success(isResend ? 'Đã gửi lại email lời mời' : 'Đã gửi email lời mời', {
        description: `Đã gửi tới ${invitation.email}.`,
      })
      if (selectedInvitation?.id === invitationId) {
        setSelectedInvitation(result)
      }
      return
    }

    syncSelectedInvitation(invitationId)
    const latest = EmployeeService.getInvitationById(invitationId, user)
    toast.error(isResend ? 'Gửi lại email không thành công' : 'Gửi email lời mời không thành công', {
      description: latest?.last_send_error || 'Vui lòng kiểm tra lại cấu hình hoặc thử lại sau.',
    })
  }

  const handleCopyLink = () => {
    if (!selectedInvitation) return
    navigator.clipboard.writeText(buildCandidateFormUrl(selectedInvitation))
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyLinkById = (invitationId: string) => {
    const invitation = EmployeeService.getInvitationById(invitationId, user)
    if (!invitation) return
    navigator.clipboard.writeText(buildCandidateFormUrl(invitation))
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const pendingApprovalCount = invitations.filter((invitation) => invitation.status === 'pending_approval').length
  const needsRevisionCount = invitations.filter((invitation) => invitation.status === 'needs_revision').length
  const sendFailedCount = invitations.filter((invitation) => invitation.send_status === 'sent_failed').length
  const scheduledSoonCount = invitations.filter((invitation) => {
    if (!invitation.hire_date) return false
    const hireDate = new Date(invitation.hire_date)
    const diffDays = Math.ceil((hireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }).length
  const draftCount = invitations.filter((invitation) => invitation.status === 'draft').length
  const candidateReviewCount = invitations.filter((invitation) => ['sent', 'opened', 'submitted'].includes(invitation.status)).length
  const completedCount = invitations.filter((invitation) => invitation.status === 'approved').length
  const filteredCount = filteredInvitations.length
  const actionNowCount = pendingApprovalCount + needsRevisionCount + sendFailedCount
  const activeViewSummary = [
    activeTab !== 'all' ? `Nhóm: ${activeTab}` : null,
    selectedSendFilter !== 'all' ? `Gửi mail: ${selectedSendFilter}` : null,
    selectedFocusFilter !== 'all' ? `Focus: ${selectedFocusFilter}` : null,
    searchTerm.trim() ? `Tìm: ${searchTerm.trim()}` : null,
  ].filter(Boolean) as string[]

  const pipelineCards = [
    {
      key: 'draft',
      title: 'Soạn lời mời',
      count: draftCount,
      description: 'HR đang chuẩn bị lời mời và thông tin đầu vào.',
      actionLabel: 'Xem bản nháp',
      onClick: () => setActiveTab('others'),
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    },
    {
      key: 'candidate_review',
      title: 'Ứng viên tự điền',
      count: candidateReviewCount,
      description: 'Ứng viên đang mở link, tự điền hoặc mới gửi hồ sơ.',
      actionLabel: 'Tập trung hồ sơ đang điền',
      onClick: () => {
        setActiveTab('others')
        setSelectedFocusFilter('missing_info')
        setSortBy('completion')
      },
      className: 'border-sky-100 bg-sky-50 text-sky-700',
    },
    {
      key: 'pending_approval',
      title: 'Chờ duyệt',
      count: pendingApprovalCount,
      description: 'HR cần kiểm tra đủ hồ sơ để chuyển thành nhân viên.',
      actionLabel: 'Mở hàng chờ duyệt',
      onClick: () => {
        setActiveTab('pending_approval')
        setSelectedFocusFilter('needs_approval')
        setSortBy('approval_queue')
      },
      className: 'border-amber-100 bg-amber-50 text-amber-700',
    },
    {
      key: 'approved',
      title: 'Đã thành nhân viên',
      count: completedCount,
      description: 'Đã duyệt xong và tạo nhân sự chính thức trong hệ thống.',
      actionLabel: 'Xem hồ sơ đã xong',
      onClick: () => setActiveTab('approved'),
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
  ]

  const priorityQueue = invitations
    .map((invitation) => {
      const readiness = EmployeeService.isInvitationReadyForApproval(invitation)
      let priorityLabel = 'Theo dõi'
      let priorityClassName = 'bg-slate-100 text-slate-700'
      let priorityRank = 99
      let priorityReason = 'Tiếp tục theo dõi tiến độ hồ sơ.'

      if (invitation.status === 'pending_approval') {
        priorityLabel = 'Cần duyệt'
        priorityClassName = 'bg-amber-100 text-amber-700'
        priorityRank = 0
        priorityReason = 'Hồ sơ đã đủ điều kiện chờ HR chốt để tạo nhân viên.'
      } else if (invitation.status === 'needs_revision') {
        priorityLabel = 'Cần bổ sung'
        priorityClassName = 'bg-orange-100 text-orange-700'
        priorityRank = 1
        priorityReason = 'Ứng viên đang cần cập nhật thêm giấy tờ hoặc thông tin thiếu.'
      } else if (invitation.send_status === 'sent_failed') {
        priorityLabel = 'Gửi lỗi'
        priorityClassName = 'bg-red-100 text-red-700'
        priorityRank = 2
        priorityReason = 'Email chưa gửi được, cần xử lý lại để không đứt luồng đầu vào.'
      } else if (!readiness.ready) {
        priorityLabel = 'Thiếu hồ sơ'
        priorityClassName = 'bg-yellow-100 text-yellow-700'
        priorityRank = 3
        priorityReason = 'Hồ sơ đang thiếu thông tin bắt buộc trước khi chuyển chờ duyệt.'
      } else if (invitation.hire_date) {
        const hireDate = new Date(invitation.hire_date)
        const diffDays = Math.ceil((hireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays <= 7) {
          priorityLabel = 'Sắp vào làm'
          priorityClassName = 'bg-blue-100 text-blue-700'
          priorityRank = 4
          priorityReason = 'Ngày vào làm đã gần, nên chốt hồ sơ và email trước hạn.'
        }
      }

      return {
        ...invitation,
        readiness,
        priorityLabel,
        priorityClassName,
        priorityRank,
        priorityReason,
      }
    })
    .filter((invitation) => invitation.priorityLabel !== 'Theo dõi')
    .sort((left, right) => {
      if (left.priorityRank !== right.priorityRank) {
        return left.priorityRank - right.priorityRank
      }
      const leftCreated = left.invited_at ? new Date(left.invited_at).getTime() : 0
      const rightCreated = right.invited_at ? new Date(right.invited_at).getTime() : 0
      return rightCreated - leftCreated
    })
    .slice(0, 5)

  if (!hasHydrated || !user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="animate-fade-in space-y-4 pb-20">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  Trung tâm lời mời nhân sự
                </span>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-900">Quét nhanh đầu vào, chốt đúng hồ sơ cần xử lý trước</h1>
                  <p className="max-w-3xl text-sm text-slate-600">
                    Màn này ưu tiên cho HR thấy ngay việc nào đang nghẽn, hồ sơ nào cần duyệt gấp và luồng nào sắp chạm ngày vào làm.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tổng lời mời</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{invitations.length}</p>
                  <p className="mt-1 text-sm text-slate-600">Toàn bộ hồ sơ đang đi qua luồng mời và tiếp nhận.</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Cần xử lý ngay</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{actionNowCount}</p>
                  <p className="mt-1 text-sm text-slate-600">Gồm chờ duyệt, cần bổ sung và các lời mời gửi lỗi.</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Đang hiện trên bảng</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{filteredCount}</p>
                  <p className="mt-1 text-sm text-slate-600">Số dòng sau khi áp dụng bộ lọc và tìm kiếm hiện tại.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Trọng tâm hôm nay</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activeViewSummary.length > 0 ? activeViewSummary.join(' • ') : 'Chưa khóa focus nào, đang xem toàn bộ luồng.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/employees/invitations/new')}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  Tạo lời mời mới
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('pending_approval')
                    setSelectedFocusFilter('needs_approval')
                    setSortBy('approval_queue')
                  }}
                  className="flex w-full items-start justify-between rounded-2xl border border-amber-100 bg-white px-4 py-3 text-left transition-colors hover:bg-amber-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Ưu tiên duyệt hồ sơ</p>
                    <p className="mt-1 text-xs text-slate-500">Đưa ngay hàng chờ duyệt lên đầu bảng để HR chốt nhanh.</p>
                  </div>
                  <span className="text-lg font-bold text-amber-700">{pendingApprovalCount}</span>
                </button>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex w-full items-start justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-vanilla-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Làm sạch bộ lọc</p>
                    <p className="mt-1 text-xs text-slate-500">Quay về góc nhìn tổng để rà lại toàn bộ đầu vào.</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reset</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Hàng chờ cần nhìn trước</p>
                <p className="text-xs text-gray-500">Những hồ sơ có nguy cơ làm chậm đầu vào hoặc cần HR chốt trong hôm nay.</p>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {priorityQueue.length} mục ưu tiên
              </span>
            </div>

            {priorityQueue.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-vanilla-50 px-4 py-8 text-center text-sm text-gray-400">
                Không có mục ưu tiên cao nào trong hàng chờ đầu vào.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {priorityQueue.map((invitation) => (
                  <button
                    key={invitation.id}
                    type="button"
                    onClick={() => setSelectedInvitation(invitation)}
                    className="flex w-full flex-col gap-3 rounded-2xl border border-gray-100 bg-vanilla-50 px-4 py-4 text-left transition-colors hover:bg-primary-50/50 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{invitation.full_name}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${invitation.priorityClassName}`}>
                          {invitation.priorityLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{invitation.email} • {invitation.phone || 'Chưa có số điện thoại'}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Tiến độ hồ sơ: {invitation.readiness.completenessPercent}% • Ngày vào làm: {invitation.hire_date || 'Chưa chọn'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{invitation.priorityReason}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                        {invitation.department_name || 'Chưa chọn bộ phận'}
                      </span>
                      <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                        {invitation.job_level || 'Chưa có cấp bậc'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-900">Bức tranh luồng đầu vào</p>
              <p className="text-xs text-gray-500">4 chặng chính để biết hồ sơ đang đứng ở đâu trong hành trình.</p>
            </div>

            <div className="mt-4 space-y-3">
              {pipelineCards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={card.onClick}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors hover:opacity-90 ${card.className}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide">{card.title}</p>
                      <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{card.count}</p>
                  </div>
                  <p className="mt-3 text-xs font-semibold">{card.actionLabel}</p>
                </button>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pending_approval')
              setSelectedFocusFilter('needs_approval')
              setSortBy('approval_queue')
            }}
            className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-left transition-colors hover:bg-amber-100/70"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Chờ duyệt</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{pendingApprovalCount}</p>
            <p className="mt-1 text-sm text-slate-600">Cần HR xác nhận để tạo nhân sự chính thức.</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('needs_revision')
              setSelectedFocusFilter('missing_info')
              setSortBy('completion')
            }}
            className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-left transition-colors hover:bg-orange-100/70"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Cần bổ sung</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{needsRevisionCount}</p>
            <p className="mt-1 text-sm text-slate-600">Đang đợi ứng viên cập nhật thêm thông tin.</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedSendFilter('sent_failed')
              setSelectedFocusFilter('resend_failed')
              setSortBy('send_failure')
            }}
            className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-left transition-colors hover:bg-red-100/70"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Gửi lỗi</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{sendFailedCount}</p>
            <p className="mt-1 text-sm text-slate-600">Cần gửi lại email hoặc kiểm tra địa chỉ nhận.</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFocusFilter('scheduled_soon')
              setSortBy('hire_date')
            }}
            className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-left transition-colors hover:bg-blue-100/70"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Sắp vào làm</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{scheduledSoonCount}</p>
            <p className="mt-1 text-sm text-slate-600">Nên ưu tiên xử lý trước ngày vào làm dự kiến.</p>
          </button>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Bộ lọc và cách nhìn bảng</p>
              <p className="text-xs text-slate-500">Dùng khi đã chốt được góc nhìn ưu tiên ở phần trên và cần rà sâu từng hồ sơ.</p>
            </div>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {filteredCount} dòng đang hiển thị
            </span>
          </div>

          <div className="mt-4">
            <InvitationsToolbar
              invitations={invitations}
              userRole={user.role}
              searchTerm={searchTerm}
              selectedStore={selectedStore}
              activeTab={activeTab}
              selectedSendFilter={selectedSendFilter}
              selectedFocusFilter={selectedFocusFilter}
              sortBy={sortBy}
              onSearchChange={setSearchTerm}
              onStoreChange={setSelectedStore}
              onTabChange={setActiveTab}
              onSendFilterChange={setSelectedSendFilter}
              onFocusFilterChange={setSelectedFocusFilter}
              onSortChange={setSortBy}
              onReset={resetFilters}
              onCreate={() => router.push('/employees/invitations/new')}
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Danh sách lời mời</p>
              <p className="text-xs text-slate-500">Phần làm việc chi tiết sau khi đã xác định đúng nhóm cần ưu tiên ở phía trên.</p>
            </div>
            {activeViewSummary.length > 0 && (
              <p className="text-xs font-medium text-slate-500">{activeViewSummary.join(' • ')}</p>
            )}
          </div>

          <InvitationsTable
            invitations={filteredInvitations}
            sendingId={sendingId}
            activeTab={activeTab}
            onCreate={() => router.push('/employees/invitations/new')}
            onOpenDetails={(invitation) => setSelectedInvitation(invitation)}
            onSendInvitation={handleSendInvitation}
            onCopyLink={handleCopyLinkById}
            onApprove={handleApprove}
            onRequestRevision={handleRequestRevision}
            onReject={handleReject}
            onCancel={handleCancel}
          />
        </section>

        {selectedInvitation && (
          <InvitationDetailModal
            invitation={selectedInvitation}
            copiedLink={copiedLink}
            onClose={() => setSelectedInvitation(null)}
            onCopyLink={handleCopyLink}
            onSendInvitation={async (invitationId, isResend) => {
              await handleSendInvitation(invitationId, isResend)
              syncSelectedInvitation(invitationId)
            }}
            onApprove={handleApprove}
            onRequestRevision={handleRequestRevision}
            onReject={handleReject}
          />
        )}

        <ConfirmDialog
          key={
            confirmState
              ? `${confirmState.kind}-${confirmState.invitationId}-${confirmState.kind === 'request_revision' ? confirmState.initialReason || '' : ''}`
              : 'invitation-confirm-closed'
          }
          isOpen={Boolean(confirmState)}
          onClose={handleConfirmDialogClose}
          onConfirm={handleConfirmDialogSubmit}
          title={
            confirmState?.kind === 'approve'
              ? 'Duyệt hồ sơ này?'
              : confirmState?.kind === 'reject'
                ? 'Từ chối hồ sơ này?'
                : confirmState?.kind === 'cancel'
                  ? 'Hủy lời mời này?'
                  : 'Yêu cầu ứng viên bổ sung'
          }
          description={
            confirmState?.kind === 'approve'
              ? 'Sau khi duyệt, hệ thống sẽ tạo nhân sự chính thức từ hồ sơ này.'
              : confirmState?.kind === 'reject'
                ? 'Dùng khi hồ sơ không đạt yêu cầu và không đi tiếp trong luồng duyệt.'
                : confirmState?.kind === 'cancel'
                  ? 'Lời mời sẽ được đóng lại và không tiếp tục trong luồng hiện tại.'
                  : 'Nhập rõ nội dung cần bổ sung để ứng viên cập nhật đúng ngay từ lần sau.'
          }
          confirmLabel={
            confirmState?.kind === 'approve'
              ? 'Duyệt ngay'
              : confirmState?.kind === 'reject'
                ? 'Từ chối hồ sơ'
                : confirmState?.kind === 'cancel'
                  ? 'Hủy lời mời'
                  : 'Gửi yêu cầu bổ sung'
          }
          cancelLabel="Quay lại"
          variant={
            confirmState?.kind === 'approve'
              ? 'success'
              : confirmState?.kind === 'request_revision'
                ? 'warning'
                : 'danger'
          }
          showReasonInput={confirmState?.kind === 'request_revision'}
          reasonLabel="Nội dung cần bổ sung"
          reasonPlaceholder="Ví dụ: vui lòng bổ sung ngày sinh, số CCCD và địa chỉ thường trú."
          reasonRequired={confirmState?.kind === 'request_revision'}
          initialReason={confirmState?.kind === 'request_revision' ? confirmState.initialReason || '' : ''}
        />
      </div>
    </AppShell>
  )
}
