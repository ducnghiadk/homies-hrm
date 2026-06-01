'use client'

import { AlertTriangle, Briefcase, Copy, Eye, MapPin, Phone, RotateCcw, Send, X } from 'lucide-react'
import { mockPositions, mockStores } from '@/lib/mock-data'
import {
  getInvitationSendStatusColor,
  getInvitationSendStatusLabel,
  getInvitationStatusColor,
  getInvitationStatusLabel,
  type EmployeeInvitation,
} from '@/lib/mock-data-employee-ext'
import { EmployeeService } from '@/lib/services/employee-service'
import { INVITATIONS_COPY } from './invitations-copy'
import { formatInvitationDate } from './invitations-helpers'
import type { InvitationActionHandlers } from './invitations-types'

interface InvitationsTableProps extends InvitationActionHandlers {
  invitations: EmployeeInvitation[]
  sendingId: string | null
  activeTab: string
  onCreate: () => void
}

const formatEmploymentType = (value?: string) => {
  switch (value) {
    case 'full_time':
      return 'Full-time'
    case 'part_time':
      return 'Part-time'
    case 'seasonal':
      return 'Thời vụ'
    case 'intern':
      return 'Thực tập'
    default:
      return value || 'Chưa chọn'
  }
}

const canSendInvitation = (invitation: EmployeeInvitation) => invitation.send_status === 'not_sent' || invitation.status === 'draft'

const canResendInvitation = (invitation: EmployeeInvitation) =>
  ['sent_success', 'sent_failed'].includes(invitation.send_status || '') && ['sent', 'needs_revision'].includes(invitation.status)

const canCancelInvitation = (invitation: EmployeeInvitation) =>
  ['sent', 'submitted', 'pending_approval', 'needs_revision', 'draft'].includes(invitation.status)

const canApproveInvitation = (invitation: EmployeeInvitation) => invitation.status === 'pending_approval'

const canRequestRevision = (invitation: EmployeeInvitation) => ['pending_approval', 'submitted', 'sent'].includes(invitation.status)

const canRejectInvitation = (invitation: EmployeeInvitation) => ['pending_approval', 'submitted', 'needs_revision'].includes(invitation.status)

const getPriorityMeta = (invitation: EmployeeInvitation) => {
  const readiness = EmployeeService.isInvitationReadyForApproval(invitation)
  const hireDate = invitation.hire_date ? new Date(invitation.hire_date) : null
  const today = new Date()
  const diffDays = hireDate ? Math.ceil((hireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null

  if (invitation.send_status === 'sent_failed') {
    return { label: 'Gửi lỗi', className: 'bg-red-50 text-red-700' }
  }
  if (invitation.status === 'pending_approval') {
    return { label: 'Cần duyệt', className: 'bg-amber-50 text-amber-700' }
  }
  if (!readiness.ready) {
    return { label: `Thiếu ${readiness.missingFields.length} mục`, className: 'bg-yellow-50 text-yellow-700' }
  }
  if (diffDays !== null && diffDays >= 0 && diffDays <= 7) {
    return { label: 'Sắp vào làm', className: 'bg-blue-50 text-blue-700' }
  }

  return { label: 'Ổn định', className: 'bg-emerald-50 text-emerald-700' }
}

const getPrimaryActionLabel = (invitation: EmployeeInvitation) => {
  if (canApproveInvitation(invitation)) return 'Duyệt ngay'
  if (canSendInvitation(invitation)) return 'Gửi email'
  if (canResendInvitation(invitation)) return 'Gửi lại'
  return 'Mở chi tiết'
}

export function InvitationsTable({
  invitations,
  sendingId,
  activeTab,
  onCreate,
  onOpenDetails,
  onSendInvitation,
  onCopyLink,
  onApprove,
  onRequestRevision,
  onReject,
  onCancel,
}: InvitationsTableProps) {
  const currency = (value?: number) => `${(value || 0).toLocaleString('vi-VN')} đ`

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="hidden overflow-x-auto xl:block">
          <div className="min-w-[1060px]">
            <table className="w-full table-fixed border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="bg-primary-50 text-left text-xs font-bold uppercase tracking-wide text-dark-700">
                  <th className="w-14 border-b border-gray-100 px-4 py-3">#</th>
                  <th className="w-[224px] border-b border-gray-100 px-3 py-3">Ứng viên</th>
                  <th className="w-[192px] border-b border-gray-100 px-3 py-3">Cửa hàng và vai trò</th>
                  <th className="w-[180px] border-b border-gray-100 px-3 py-3">Ngày vào làm và lương</th>
                  <th className="w-[206px] border-b border-gray-100 px-3 py-3">Trạng thái xử lý</th>
                  <th className="w-[244px] border-b border-gray-100 px-3 py-3 text-right">Thao tác nhanh</th>
                </tr>
              </thead>
              <tbody>
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">
                      <p>{INVITATIONS_COPY.emptyMessage}</p>
                      {activeTab === 'all' ? (
                        <button
                          type="button"
                          onClick={onCreate}
                          className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                        >
                          {INVITATIONS_COPY.emptyCta}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : null}

                {invitations.map((invitation, index) => {
                  const storeName = mockStores.find((store) => store.id === invitation.store_id)?.name.replace('Homies Milk Tea - ', '') || invitation.store_id
                  const positionName = mockPositions.find((position) => position.id === invitation.position_id)?.name || invitation.position_id
                  const priority = getPriorityMeta(invitation)
                  const readiness = EmployeeService.isInvitationReadyForApproval(invitation)

                  return (
                    <tr key={invitation.id} className="align-top text-sm transition-colors hover:bg-primary-50/40">
                      <td className="border-b border-gray-50 px-4 py-4 font-medium text-gray-500">{index + 1}</td>

                      <td className="border-b border-gray-50 px-3 py-4">
                        <button
                          type="button"
                          onClick={() => onOpenDetails(invitation)}
                          className="block min-w-0 text-left"
                        >
                          <p className="truncate text-base font-semibold text-dark-700">{invitation.full_name}</p>
                          <p className="mt-1 truncate text-sm text-gray-500">{invitation.email}</p>
                        </button>
                        <div className="mt-3 space-y-2 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span>{invitation.phone || 'Chưa có số điện thoại'}</span>
                          </p>
                        </div>
                      </td>

                      <td className="border-b border-gray-50 px-3 py-4">
                        <div className="space-y-3">
                          <div>
                            <p className="flex items-center gap-2 font-medium text-dark-700">
                              <MapPin size={14} className="text-gray-400" />
                              <span>{storeName}</span>
                            </p>
                            <p className="mt-1 text-sm text-gray-500">{invitation.department_name || 'Chưa chọn bộ phận'}</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-2 font-medium text-dark-700">
                              <Briefcase size={14} className="text-gray-400" />
                              <span>{positionName}</span>
                            </p>
                            <p className="mt-1 text-sm text-gray-500">{formatEmploymentType(invitation.employee_type)} • {invitation.job_level || 'Chưa chọn cấp bậc'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-gray-50 px-3 py-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ngày vào làm</p>
                            <p className="mt-1 font-semibold text-dark-700">{invitation.hire_date ? formatInvitationDate(invitation.hire_date) : 'Chưa xác định'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Lương chính thức</p>
                            <p className="mt-1 text-sm text-gray-600">{currency(invitation.official_salary)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Thử việc</p>
                            <p className="mt-1 text-sm text-gray-600">
                              {invitation.is_probationary
                                ? `${currency(invitation.probation_salary_value)} • đến ${invitation.probation_end_date ? formatInvitationDate(invitation.probation_end_date) : 'chưa chọn'}`
                                : 'Không áp dụng'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-gray-50 px-3 py-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${getInvitationStatusColor(invitation.status)}`}>
                              {getInvitationStatusLabel(invitation.status)}
                            </span>
                            <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${getInvitationSendStatusColor(invitation.send_status)}`}>
                              {getInvitationSendStatusLabel(invitation.send_status)}
                            </span>
                            <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${priority.className}`}>
                              {priority.label}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tiến độ hồ sơ</p>
                            <p className="text-sm text-gray-600">{readiness.completenessPercent}% đầy đủ</p>
                            {!readiness.ready ? (
                              <p className="inline-flex items-center gap-1 text-xs text-warning-700">
                                <AlertTriangle size={12} />
                                Cần bổ sung trước khi duyệt
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Lần gửi cuối</p>
                            <p className="mt-1 text-sm text-gray-600">{invitation.last_sent_at ? formatInvitationDate(invitation.last_sent_at) : 'Chưa gửi'}</p>
                            <p className="mt-1 text-xs text-gray-400">Tạo lúc {invitation.invited_at ? formatInvitationDate(invitation.invited_at) : 'Chưa rõ'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-gray-50 px-3 py-4">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (canApproveInvitation(invitation)) {
                                onApprove(invitation.id)
                                return
                              }
                              if (canSendInvitation(invitation)) {
                                void onSendInvitation(invitation.id)
                                return
                              }
                              if (canResendInvitation(invitation)) {
                                void onSendInvitation(invitation.id, true)
                                return
                              }
                              onOpenDetails(invitation)
                            }}
                            disabled={sendingId === invitation.id}
                            className="inline-flex h-9 min-w-[112px] items-center justify-center rounded-xl bg-primary-500 px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                          >
                            {sendingId === invitation.id ? 'Đang xử lý' : getPrimaryActionLabel(invitation)}
                          </button>

                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenDetails(invitation)}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                            >
                              <Eye size={16} />
                              Mở chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => onCopyLink(invitation.id)}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              <Copy size={16} />
                              Sao chép link
                            </button>
                            {canRequestRevision(invitation) ? (
                              <button
                                type="button"
                                onClick={() => onRequestRevision(invitation.id)}
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-warning-200 bg-warning-50 px-2.5 text-sm font-semibold text-warning-700 transition-colors hover:bg-warning-100"
                              >
                                Yêu cầu bổ sung
                              </button>
                            ) : null}
                            {canRejectInvitation(invitation) ? (
                              <button
                                type="button"
                                onClick={() => onReject(invitation.id)}
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                              >
                                Từ chối
                              </button>
                            ) : null}
                            {canCancelInvitation(invitation) ? (
                              <button
                                type="button"
                                onClick={() => onCancel(invitation.id)}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                <X size={16} />
                                Hủy
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 p-3 xl:hidden">
          {invitations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
              <p>{INVITATIONS_COPY.emptyMessage}</p>
              {activeTab === 'all' ? (
                <button
                  type="button"
                  onClick={onCreate}
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                >
                  {INVITATIONS_COPY.emptyCta}
                </button>
              ) : null}
            </div>
          ) : null}

          {invitations.map((invitation) => {
            const storeName = mockStores.find((store) => store.id === invitation.store_id)?.name.replace('Homies Milk Tea - ', '') || invitation.store_id
            const positionName = mockPositions.find((position) => position.id === invitation.position_id)?.name || invitation.position_id
            const statusLabel = getInvitationStatusLabel(invitation.status)
            const statusColor = getInvitationStatusColor(invitation.status)
            const sendStatusLabel = getInvitationSendStatusLabel(invitation.send_status)
            const sendStatusColor = getInvitationSendStatusColor(invitation.send_status)
            const priority = getPriorityMeta(invitation)
            const readiness = EmployeeService.isInvitationReadyForApproval(invitation)

            return (
              <div key={invitation.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-dark-700">{invitation.full_name}</p>
                    <p className="mt-0.5 truncate text-sm text-gray-500">{invitation.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDetails(invitation)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-200 text-primary-600"
                    title="Mở chi tiết"
                  >
                    <Eye size={16} />
                  </button>
                </div>

                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>{invitation.phone || 'Chưa có số điện thoại'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{storeName}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Briefcase size={14} className="text-gray-400" />
                    <span>{invitation.department_name || 'Chưa chọn bộ phận'} • {positionName}</span>
                  </p>
                  <p className="text-xs text-gray-500">Ngày vào làm: {invitation.hire_date ? formatInvitationDate(invitation.hire_date) : 'Chưa xác định'}</p>
                  <p className="text-xs text-gray-500">Lương chính thức: {currency(invitation.official_salary)}</p>
                  <p className="text-xs text-gray-500">Tiến độ hồ sơ: {readiness.completenessPercent}%</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">{formatEmploymentType(invitation.employee_type)}</span>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${sendStatusColor}`}>{sendStatusLabel}</span>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priority.className}`}>{priority.label}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onCopyLink(invitation.id)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700"
                  >
                    <Copy size={16} />
                    Sao chép link
                  </button>

                  {canSendInvitation(invitation) ? (
                    <button
                      type="button"
                      onClick={() => onSendInvitation(invitation.id)}
                      disabled={sendingId === invitation.id}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 text-sm font-semibold text-primary-700 disabled:opacity-50"
                    >
                      <Send size={16} />
                      Gửi email
                    </button>
                  ) : null}

                  {canResendInvitation(invitation) ? (
                    <button
                      type="button"
                      onClick={() => onSendInvitation(invitation.id, true)}
                      disabled={sendingId === invitation.id}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 text-sm font-semibold text-primary-700 disabled:opacity-50"
                    >
                      <RotateCcw size={16} />
                      Gửi lại
                    </button>
                  ) : null}

                  {canApproveInvitation(invitation) ? (
                    <button
                      type="button"
                      onClick={() => onApprove(invitation.id)}
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-success-600 px-3 text-sm font-semibold text-white"
                    >
                      Duyệt
                    </button>
                  ) : null}

                  {canRequestRevision(invitation) ? (
                    <button
                      type="button"
                      onClick={() => onRequestRevision(invitation.id)}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-warning-200 bg-warning-50 px-3 text-sm font-semibold text-warning-700"
                    >
                      Yêu cầu bổ sung
                    </button>
                  ) : null}

                  {canCancelInvitation(invitation) ? (
                    <button
                      type="button"
                      onClick={() => onCancel(invitation.id)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700"
                    >
                      <X size={16} />
                      Hủy
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-center text-sm text-gray-400">
        {INVITATIONS_COPY.totalLabel}: {invitations.length} lời mời
      </div>
    </section>
  )
}
