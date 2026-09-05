'use client'

import { AlertCircle, Calendar, CheckCheck, Copy, Link, RotateCcw, Send, UserCheck, UserX, X } from 'lucide-react'
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

interface InvitationDetailModalProps {
  invitation: EmployeeInvitation
  copiedLink: boolean
  onClose: () => void
  onCopyLink: () => void
  onSendInvitation: (invitationId: string, isResend?: boolean) => Promise<void> | void
  onApprove: (invitationId: string) => void
  onRequestRevision: (invitationId: string) => void
  onReject: (invitationId: string) => void
}

export function InvitationDetailModal({
  invitation,
  copiedLink,
  onClose,
  onCopyLink,
  onSendInvitation,
  onApprove,
  onRequestRevision,
  onReject,
}: InvitationDetailModalProps) {
  const { ready, missingFields, completenessPercent } = EmployeeService.isInvitationReadyForApproval(invitation)
  const missingFieldLabels = missingFields.map((field) => field.label)
  const sendLogs = invitation.send_logs || []
  const shareKey = invitation.public_access_token || invitation.id
  const shareUrl = `${window.location.origin}/employees/invitations/form?token=${encodeURIComponent(shareKey)}`
  const currency = (value?: number) => `${(value || 0).toLocaleString('vi-VN')} d`
  const employmentType = invitation.employee_type === 'full_time'
    ? 'Full-time'
    : invitation.employee_type === 'part_time'
      ? 'Part-time'
      : invitation.employee_type === 'seasonal'
        ? 'Th?i v?'
        : invitation.employee_type === 'intern'
          ? 'Th?c t?p'
          : '�'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/24 px-3 py-4 backdrop-blur-[2px] sm:px-5 sm:py-6 lg:px-8 lg:py-10">
      <div className="mx-auto flex min-h-full w-full items-start justify-center lg:items-center">
        <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-gray-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] animate-scale-up sm:max-h-[calc(100vh-3rem)]">
          <div className="shrink-0 flex items-center justify-between border-b border-gray-100 bg-vanilla-50/95 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chi ti?t l?i m?i ?ng vi�n</h2>
            <p className="mt-0.5 text-xs text-gray-400">ID: {invitation.id} � Qu�t nhanh tr?ng th�i, d? s?n s�ng v� l?ch s? x? l�</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-fade-in">
            <div className="space-y-3 rounded-xl border border-gray-100 bg-vanilla-50/50 p-4">
              <div>
                <span className="mb-1 block text-xs text-gray-400">Tr?ng th�i h? so</span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getInvitationStatusColor(invitation.status)}`}>
                  {getInvitationStatusLabel(invitation.status)}
                </span>
              </div>
              <div>
                <span className="mb-1 block text-xs text-gray-400">Ng�y t?o l?i m?i</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                  <Calendar size={14} className="text-gray-400" />
                  {formatInvitationDate(invitation.invited_at)}
                </span>
              </div>
              <div>
                <span className="mb-1 block text-xs text-gray-400">Tr?ng th�i g?i email</span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getInvitationSendStatusColor(invitation.send_status)}`}>
                  {getInvitationSendStatusLabel(invitation.send_status)}
                </span>
                {invitation.last_send_error ? (
                  <p className="mt-2 text-[11px] text-red-500">L?i g?n nh?t: {invitation.last_send_error}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-100 bg-vanilla-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="block text-xs text-gray-400">�? ho�n thi?n h? so</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-bold ${
                    ready ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {ready ? '�? di?u ki?n duy?t' : 'C?n b? sung'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-800">{completenessPercent}%</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all duration-300 ${ready ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${completenessPercent}%` }}
                  />
                </div>
              </div>

              {missingFieldLabels.length > 0 ? (
                <div className="text-[11px] font-medium text-red-500">
                  Thi?u: {missingFieldLabels.join(', ')}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                  <CheckCheck size={12} /> H? so d� d? th�ng tin b?t bu?c
                </div>
              )}
            </div>
          </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-blue-900">
              <Link size={16} className="shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <span className="block font-bold">Link t? di?n th�ng tin c?a ?ng vi�n</span>
                <p className="truncate font-mono text-[11px] text-blue-700">{shareUrl}</p>
              </div>
            </div>
            <button
              onClick={onCopyLink}
              className="btn shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              {copiedLink ? (
                <>
                  <CheckCheck size={14} className="text-green-600" />
                  <span>{INVITATIONS_COPY.copyDoneLabel}</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>{INVITATIONS_COPY.copyLabel}</span>
                </>
              )}
            </button>
          </div>

            <div className="space-y-3">
            <h3 className="border-b border-gray-100 pb-1 text-xs font-bold uppercase tracking-wider text-gray-900">Th�ng tin ?ng vi�n khai b�o</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><span className="block text-xs text-gray-400">H? v� t�n</span><span className="text-sm font-medium text-gray-800">{invitation.full_name || '�'}</span></div>
              <div><span className="block text-xs text-gray-400">S? di?n tho?i</span><span className="text-sm font-medium text-gray-800">{invitation.phone || '�'}</span></div>
              <div><span className="block text-xs text-gray-400">�?a ch? email</span><span className="block truncate text-sm font-medium text-gray-800">{invitation.email || '�'}</span></div>
              <div><span className="block text-xs text-gray-400">Ng�y sinh</span><span className="text-sm font-medium text-gray-800">{invitation.date_of_birth ? formatInvitationDate(invitation.date_of_birth) : '�'}</span></div>
              <div><span className="block text-xs text-gray-400">Gi?i t�nh</span><span className="text-sm font-medium text-gray-800">{invitation.gender === 'male' ? 'Nam' : invitation.gender === 'female' ? 'N?' : invitation.gender === 'other' ? 'Kh�c' : '�'}</span></div>
              <div><span className="block text-xs text-gray-400">S? CCCD / h? chi?u</span><span className="text-sm font-medium text-gray-800">{invitation.cccd || '�'}</span></div>
              <div className="sm:col-span-2"><span className="block text-xs text-gray-400">�?a ch? thu?ng tr�</span><span className="text-sm font-medium text-gray-800">{invitation.address || '�'}</span></div>
              <div className="sm:col-span-2"><span className="block text-xs text-gray-400">Th�ng tin li�n h? kh?n c?p</span><span className="text-sm font-medium text-gray-800">{invitation.emergency_contact || '�'}</span></div>
            </div>
          </div>

            <div className="space-y-3">
            <h3 className="border-b border-gray-100 pb-1 text-xs font-bold uppercase tracking-wider text-gray-900">�? xu?t c�ng vi?c</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><span className="block text-xs text-gray-400">C?a h�ng d? ki?n</span><span className="text-sm font-medium text-gray-800">{mockStores.find((store) => store.id === invitation.store_id)?.name || invitation.store_id}</span></div>
              <div><span className="block text-xs text-gray-400">V? tr� d? ki?n</span><span className="text-sm font-medium text-gray-800">{mockPositions.find((position) => position.id === invitation.position_id)?.name || invitation.position_id}</span></div>
              <div><span className="block text-xs text-gray-400">Vai tr� ph�n quy?n</span><span className="text-sm font-medium uppercase text-primary-600">{invitation.role}</span></div>
              <div><span className="block text-xs text-gray-400">Ng�y gia nh?p</span><span className="text-sm font-medium text-gray-800">{invitation.hire_date ? formatInvitationDate(invitation.hire_date) : '�'}</span></div>
              <div><span className="block text-xs text-gray-400">B? ph?n</span><span className="text-sm font-medium text-gray-800">{invitation.department_name || '�'}</span></div>
              <div><span className="block text-xs text-gray-400">Lo?i nh�n vi�n</span><span className="text-sm font-medium text-gray-800">{employmentType}</span></div>
              <div><span className="block text-xs text-gray-400">C?p b?c</span><span className="text-sm font-medium text-gray-800">{invitation.job_level || '�'}</span></div>
              <div><span className="block text-xs text-gray-400">Luong ch�nh th?c</span><span className="text-sm font-medium text-gray-800">{currency(invitation.official_salary)}</span></div>
              <div><span className="block text-xs text-gray-400">Luong KPI</span><span className="text-sm font-medium text-gray-800">{currency(invitation.kpi_salary)}</span></div>
              <div><span className="block text-xs text-gray-400">C� th? vi?c</span><span className="text-sm font-medium text-gray-800">{invitation.is_probationary ? 'C�' : 'Kh�ng'}</span></div>
              <div><span className="block text-xs text-gray-400">Ng�y k?t th�c th? vi?c</span><span className="text-sm font-medium text-gray-800">{invitation.probation_end_date ? formatInvitationDate(invitation.probation_end_date) : '�'}</span></div>
              <div><span className="block text-xs text-gray-400">Ki?u luong th? vi?c</span><span className="text-sm font-medium text-gray-800">{invitation.probation_salary_mode === 'fixed_amount' ? 'M?c c? d?nh' : 'Theo % luong ch�nh th?c'}</span></div>
              <div><span className="block text-xs text-gray-400">Luong th? vi?c</span><span className="text-sm font-medium text-gray-800">{currency(invitation.probation_salary_value)}</span></div>
            </div>
          </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">Ghi ch� tuy?n d?ng (HR)</span>
              <div className="min-h-[60px] whitespace-pre-line rounded-lg border border-gray-100 bg-vanilla-50 p-3 text-xs text-gray-600">
                {invitation.hr_notes || 'Kh�ng c� ghi ch� tuy?n d?ng'}
              </div>
            </div>
            <div>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">� ki?n / ph?n h?i t? ?ng vi�n</span>
              <div className="min-h-[60px] whitespace-pre-line rounded-lg border border-gray-100 bg-vanilla-50 p-3 text-xs text-gray-600">
                {invitation.candidate_notes || 'Kh�ng c� ph?n h?i t? ?ng vi�n'}
              </div>
            </div>
          </div>

            {invitation.status === 'needs_revision' && invitation.revision_request_note ? (
              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-3">
              <span className="mb-1 block text-xs font-bold text-purple-950">N?i dung y�u c?u b? sung d� g?i</span>
              <p className="text-xs italic text-purple-800">&ldquo;{invitation.revision_request_note}&rdquo;</p>
              </div>
            ) : null}

            <div className="space-y-3">
            <h3 className="border-b border-gray-100 pb-1 text-xs font-bold uppercase tracking-wider text-gray-900">N?i dung email l?i m?i</h3>
            <div className="rounded-2xl border border-gray-200 bg-vanilla-50 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase text-gray-500">Template</span>
                <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700">
                  {invitation.email_template_version || 'v1'}
                </span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-700">
                {invitation.email_preview_snapshot || EmployeeService.buildInvitationEmailPreview(invitation)}
              </pre>
            </div>
          </div>

            <div className="space-y-3">
            <h3 className="border-b border-gray-100 pb-1 text-xs font-bold uppercase tracking-wider text-gray-900">L?ch s? g?i mock email</h3>
            <div className="space-y-3">
              {sendLogs.length > 0 ? (
                sendLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getInvitationSendStatusColor(log.status)}`}>
                        {getInvitationSendStatusLabel(log.status)}
                      </span>
                      <span className="text-xs text-gray-500">{formatInvitationDate(log.attempted_at)}</span>
                      {log.attempted_by ? <span className="text-xs text-gray-500">� B?i: {log.attempted_by}</span> : null}
                    </div>
                    {log.error ? <p className="mb-2 text-xs text-red-600">L?i: {log.error}</p> : null}
                    <pre className="whitespace-pre-wrap rounded-lg bg-vanilla-50 p-3 text-xs leading-relaxed text-gray-600">
                      {log.snapshot}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-vanilla-50 p-4 text-sm text-gray-500">
                  Chua c� l?n g?i email n�o du?c ghi nh?n.
                </div>
              )}
            </div>
          </div>
          </div>

          <div className="shrink-0 flex flex-col gap-3 border-t border-gray-100 bg-white/95 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
            {(invitation.send_status === 'not_sent' || invitation.status === 'draft') ? (
              <button
                onClick={() => onSendInvitation(invitation.id)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
              >
                <Send size={16} />
                G?i email
              </button>
            ) : null}
            {['sent_success', 'sent_failed'].includes(invitation.send_status || '') && ['sent', 'needs_revision'].includes(invitation.status) ? (
              <button
                onClick={() => onSendInvitation(invitation.id, true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
              >
                <RotateCcw size={16} />
                G?i l?i email
              </button>
            ) : null}
            {invitation.status === 'pending_approval' ? (
              <>
                <button
                  onClick={() => onApprove(invitation.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-600"
                  disabled={!ready}
                  style={{ opacity: ready ? 1 : 0.6, cursor: ready ? 'pointer' : 'not-allowed' }}
                  title={ready ? 'Duy?t h? so' : 'H? so chua ho�n thi?n d? 100% d? duy?t'}
                >
                  <UserCheck size={16} />
                  Duy?t h? so
                </button>
                <button
                  onClick={() => onRequestRevision(invitation.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600"
                >
                  <AlertCircle size={16} />
                  Y�u c?u b? sung
                </button>
                <button
                  onClick={() => onReject(invitation.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600"
                >
                  <UserX size={16} />
                  T? ch?i
                </button>
              </>
            ) : null}
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 sm:w-auto"
            >
              {INVITATIONS_COPY.backToCloseLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
