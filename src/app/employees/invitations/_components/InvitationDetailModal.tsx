'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCheck,
  Copy,
  Link,
  RotateCcw,
  Send,
  UserCheck,
  UserX,
  X,
  Shirt,
  CreditCard,
  FileCheck2,
  Lock,
  ExternalLink,
} from 'lucide-react'
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
  const shareKey = invitation.public_access_token || invitation.id
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/employees/invitations/form?token=${encodeURIComponent(shareKey)}`
  const currency = (value?: number) => `${(value || 0).toLocaleString('vi-VN')} đ`

  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)

  const employmentType =
    invitation.employee_type === 'full_time'
      ? 'Toàn thời gian (Full-time)'
      : invitation.employee_type === 'part_time'
      ? 'Bán thời gian (Part-time)'
      : invitation.employee_type === 'seasonal'
      ? 'Thời vụ'
      : invitation.employee_type === 'intern'
      ? 'Thực tập'
      : 'Chưa chọn'

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-3 py-4 backdrop-blur-[2px] sm:px-5 sm:py-6 lg:px-8 lg:py-10 font-['Inter']">
        <div className="mx-auto flex min-h-full w-full items-start justify-center lg:items-center">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-scale-up sm:max-h-[calc(100vh-3rem)]">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Chi tiết lời mời ứng viên</h2>
                <p className="mt-0.5 text-xs text-slate-500">Mã: {invitation.id} • Theo dõi tiến độ hồ sơ onboarding F&B</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {/* Status Overview Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-400">Trạng thái hồ sơ</span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getInvitationStatusColor(invitation.status)}`}>
                      {getInvitationStatusLabel(invitation.status)}
                    </span>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-400">Ngày tạo lời mời</span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Calendar size={14} className="text-slate-400" />
                      {formatInvitationDate(invitation.invited_at)}
                    </span>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-400">Trạng thái gửi email</span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getInvitationSendStatusColor(invitation.send_status)}`}>
                      {getInvitationSendStatusLabel(invitation.send_status)}
                    </span>
                    {invitation.last_send_error ? (
                      <p className="mt-2 text-[11px] font-medium text-red-500">Lỗi: {invitation.last_send_error}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-medium text-slate-400">Độ hoàn thiện hồ sơ</span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                        ready ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ready ? 'Đủ điều kiện duyệt' : 'Cần bổ sung'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-slate-800">{completenessPercent}%</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full transition-all duration-300 ${ready ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${completenessPercent}%` }}
                      />
                    </div>
                  </div>

                  {missingFieldLabels.length > 0 ? (
                    <div className="text-[11px] font-medium text-red-500">
                      Còn thiếu: {missingFieldLabels.join(', ')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <CheckCheck size={14} /> Hồ sơ đã hoàn thành đầy đủ thông tin bắt buộc
                    </div>
                  )}
                </div>
              </div>

              {/* Link tự điền thông tin */}
              <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-blue-900">
                  <Link size={16} className="shrink-0 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <span className="block font-bold">Link tự điền thông tin cho ứng viên</span>
                    <p className="truncate font-mono text-[11px] text-blue-700">{shareUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(shareUrl, '_blank')}
                    className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <ExternalLink size={13} /> Mở thử
                  </button>
                  <button
                    type="button"
                    onClick={onCopyLink}
                    className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCheck size={14} className="text-emerald-600" />
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
              </div>

              {/* Thông tin ứng viên khai báo */}
              <div className="space-y-3 rounded-2xl border border-slate-100 p-4">
                <h3 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Thông tin cá nhân & Liên hệ
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs text-slate-400">Họ và tên</span>
                    <span className="text-sm font-bold text-slate-900">{invitation.full_name || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Số điện thoại</span>
                    <span className="text-sm font-semibold text-slate-900">{invitation.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Email</span>
                    <span className="text-sm font-medium text-slate-900">{invitation.email || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Ngày sinh</span>
                    <span className="text-sm font-medium text-slate-900">
                      {invitation.date_of_birth ? formatInvitationDate(invitation.date_of_birth) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Giới tính</span>
                    <span className="text-sm font-medium text-slate-900">
                      {invitation.gender === 'male' ? 'Nam' : invitation.gender === 'female' ? 'Nữ' : invitation.gender === 'other' ? 'Khác' : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Số CCCD / Hộ chiếu</span>
                    <span className="text-sm font-mono font-bold text-slate-900">{invitation.cccd || '—'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs text-slate-400">Địa chỉ thường trú</span>
                    <span className="text-sm font-medium text-slate-900">{invitation.address || '—'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs text-slate-400">Thông tin liên hệ khẩn cấp</span>
                    <span className="text-sm font-medium text-slate-900">{invitation.emergency_contact || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Hồ sơ F&B, size áo, CCCD & ngân hàng */}
              <div className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4">
                <h3 className="border-b border-amber-200/60 pb-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                  2. Hồ sơ nghiệp vụ F&B, Đồng phục & Chi trả lương
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Size áo đồng phục */}
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                      <Shirt size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Size áo đồng phục:</p>
                      <p className="text-sm font-black text-amber-800">
                        {invitation.shirt_size ? `Size ${invitation.shirt_size}` : 'Chưa chọn'}
                      </p>
                    </div>
                  </div>

                  {/* Thẻ xanh y tế */}
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                      <FileCheck2 size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Thẻ xanh Y tế / KSK:</p>
                      <p className="text-xs font-bold text-emerald-800">
                        {invitation.health_cert_date ? `Hạn đến: ${formatInvitationDate(invitation.health_cert_date)}` : 'Chưa có ngày hạn'}
                      </p>
                    </div>
                  </div>

                  {/* Tài khoản ngân hàng */}
                  <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                      <CreditCard size={16} className="text-amber-600" />
                      Tài khoản nhận lương:
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
                      <div>
                        <span className="text-slate-400">Ngân hàng:</span>{' '}
                        <strong className="text-slate-800">{invitation.bank_name || 'Chưa điền'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Số tài khoản:</span>{' '}
                        <strong className="font-mono text-slate-900">{invitation.bank_account_number || 'Chưa điền'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Chủ tài khoản:</span>{' '}
                        <strong className="font-mono text-slate-900">{invitation.bank_account_name || 'Chưa điền'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Ảnh CCCD 2 mặt */}
                  <div className="sm:col-span-2 space-y-2">
                    <span className="block text-xs font-bold text-slate-700">Ảnh Căn cước công dân (Mặt trước & Mặt sau):</span>
                    <div className="grid grid-cols-2 gap-3">
                      {invitation.id_card_front_url ? (
                        <div
                          className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                          onClick={() => setPreviewImage({ url: invitation.id_card_front_url!, title: 'CCCD Mặt trước' })}
                        >
                          <img
                            src={invitation.id_card_front_url}
                            alt="CCCD Trước"
                            className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute bottom-1 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            Mặt trước (Click xem to)
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                          Chưa tải ảnh mặt trước
                        </div>
                      )}

                      {invitation.id_card_back_url ? (
                        <div
                          className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                          onClick={() => setPreviewImage({ url: invitation.id_card_back_url!, title: 'CCCD Mặt sau' })}
                        >
                          <img
                            src={invitation.id_card_back_url}
                            alt="CCCD Sau"
                            className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute bottom-1 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            Mặt sau (Click xem to)
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                          Chưa tải ảnh mặt sau
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cam kết nội quy */}
                  <div className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-white p-3 text-xs">
                    <Lock size={15} className="text-amber-600 shrink-0" />
                    <span className="text-slate-700">
                      Cam kết bảo mật công thức & nội quy lao động:{' '}
                      <strong className={invitation.policy_agreed ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                        {invitation.policy_agreed ? '✓ Đã đồng ý cam kết' : 'Chưa cam kết'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Đề xuất công việc */}
              <div className="space-y-3 rounded-2xl border border-slate-100 p-4">
                <h3 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                  3. Thông tin vị trí & Cơ sở
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs text-slate-400">Cửa hàng tiếp nhận</span>
                    <span className="text-sm font-bold text-slate-800">
                      {mockStores.find((store) => store.id === invitation.store_id)?.name || invitation.store_id}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Vị trí đảm nhận</span>
                    <span className="text-sm font-bold text-slate-800">
                      {mockPositions.find((position) => position.id === invitation.position_id)?.name || invitation.position_id}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Hình thức làm việc</span>
                    <span className="text-sm font-medium text-slate-800">{employmentType}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Ngày gia nhập dự kiến</span>
                    <span className="text-sm font-medium text-slate-800">
                      {invitation.hire_date ? formatInvitationDate(invitation.hire_date) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Lương chính thức</span>
                    <span className="text-sm font-bold text-amber-700">{currency(invitation.official_salary)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Lương KPI</span>
                    <span className="text-sm font-medium text-slate-800">{currency(invitation.kpi_salary)}</span>
                  </div>
                </div>
              </div>

              {/* Phản hồi từ ứng viên / Ghi chú */}
              {invitation.candidate_notes && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Ghi chú từ ứng viên:</span>
                  <p className="text-xs text-slate-800 leading-relaxed italic">{invitation.candidate_notes}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="shrink-0 flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {(invitation.send_status === 'not_sent' || invitation.status === 'draft') ? (
                  <button
                    type="button"
                    onClick={() => onSendInvitation(invitation.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    <Send size={15} /> Gửi email
                  </button>
                ) : null}

                {['sent_success', 'sent_failed'].includes(invitation.send_status || '') &&
                ['sent', 'needs_revision'].includes(invitation.status) ? (
                  <button
                    type="button"
                    onClick={() => onSendInvitation(invitation.id, true)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    <RotateCcw size={15} /> Gửi lại email
                  </button>
                ) : null}

                {invitation.status === 'pending_approval' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onApprove(invitation.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <UserCheck size={16} /> Duyệt hồ sơ & Tạo nhân sự
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestRevision(invitation.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                    >
                      <AlertCircle size={15} /> Yêu cầu bổ sung
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(invitation.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
                    >
                      <UserX size={15} /> Từ chối
                    </button>
                  </>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PHÓNG TO ẢNH CCCD */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-800">{previewImage.title}</p>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <img src={previewImage.url} alt={previewImage.title} className="max-h-[75vh] w-auto mx-auto object-contain mt-2 rounded-lg" />
          </div>
        </div>
      )}
    </>
  )
}
