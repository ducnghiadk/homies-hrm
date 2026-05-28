'use client'

import { ArrowRight, Clock3, Eye, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { EmployeeService } from '@/lib/services/employee-service'
import type { InvitationEmailConfig, InvitationFormData } from './invitation-types'

interface InvitationEmailPreviewProps {
  form: InvitationFormData
  emailConfig: InvitationEmailConfig
}

function formatCurrency(value?: number | string) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString('vi-VN')} đ`
}

export function InvitationEmailPreview({ form, emailConfig }: InvitationEmailPreviewProps) {
  const positionLabel = mockPositions.find((position) => position.id === form.position_id)?.name || '[Chưa chọn]'
  const storeLabel =
    mockStores.find((store) => store.id === form.store_id)?.name.replace('Homies Milk Tea - ', '') || '[Chưa chọn]'
  const probationLabel = form.is_probationary
    ? `${formatCurrency(form.probation_salary_value)} đến ${form.probation_end_date || '[Chưa chọn ngày kết thúc]'}`
    : 'Không áp dụng thử việc'
  const previewLink = EmployeeService.getInvitationPublicFormUrl('preview-link')
  const deadlineLabel = emailConfig.deadline
    ? new Date(emailConfig.deadline).toLocaleDateString('vi-VN')
    : '[Chưa chọn]'

  return (
    <div className="w-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-slate-800">
            <Eye size={18} className="text-primary-500" />
            Xem trước email gửi đi
          </h3>
          <p className="mt-1 text-xs text-slate-500">Mẫu này mô phỏng đúng cảm giác ứng viên nhận được trong hộp thư.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#f8fafc] text-sm shadow-inner">
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Người gửi:</span> Homies Milk Tea HR &lt;no-reply@homies.vn&gt;
          </p>
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Người nhận:</span> {form.email || '[Chưa nhập email]'}
          </p>
          <p className="mt-2 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-900">
            <span className="font-normal text-slate-500">Tiêu đề:</span> {emailConfig.subject || '(Chưa nhập tiêu đề)'}
          </p>
        </div>

        <div className="bg-[linear-gradient(180deg,#fffaf2_0%,#ffffff_32%,#fffdf8_100%)] p-4 text-slate-800">
          <div className="rounded-[24px] border border-amber-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_42%),linear-gradient(135deg,#7c2d12_0%,#b45309_55%,#f59e0b_100%)] px-5 py-5 text-white shadow-[0_18px_45px_rgba(146,64,14,0.25)]">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-100">
              <Sparkles size={14} />
              Welcome Onboard
            </div>
            <h4 className="mt-3 text-2xl font-bold leading-tight">Thư mời hoàn tất hồ sơ nhận việc tại Homies Milk Tea</h4>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/90">
              Chúng tôi muốn ngay từ email đầu tiên, ứng viên cảm nhận được sự chỉn chu, chuyên nghiệp và năng lượng tích cực của đội ngũ Homies.
            </p>
          </div>

          <div className="mt-4 space-y-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div>
              <p>Kính gửi <strong className="text-slate-950">{form.full_name || '[Tên ứng viên]'}</strong>,</p>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-600">
                {emailConfig.personalNote || '[Lời nhắn cá nhân từ HR]'}
              </p>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                Homies Milk Tea trân trọng mời bạn hoàn tất thông tin nhận việc để đội ngũ nhân sự xác nhận hồ sơ và chuẩn bị bước chào đón bạn gia nhập cửa hàng.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Vai trò dự kiến</p>
                <p className="mt-2 text-base font-bold text-slate-900">{positionLabel}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={15} className="text-primary-500" />
                  {storeLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Mốc cần hoàn tất</p>
                <p className="mt-2 flex items-center gap-2 text-base font-bold text-slate-900">
                  <Clock3 size={16} className="text-emerald-600" />
                  {deadlineLabel}
                </p>
                <p className="mt-2 text-sm text-slate-600">HR sẽ ưu tiên kiểm tra hồ sơ ngay sau khi bạn gửi đủ thông tin.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Thông tin nhận việc dự kiến</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-3">
                  <span className="block text-slate-500">Bộ phận</span>
                  <strong className="mt-1 block text-slate-900">{form.department_name || '[Chưa chọn]'}</strong>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <span className="block text-slate-500">Ngày gia nhập</span>
                  <strong className="mt-1 block text-slate-900">{form.hire_date || '[Chưa chọn]'}</strong>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <span className="block text-slate-500">Loại nhân viên</span>
                  <strong className="mt-1 block text-slate-900">{form.employee_type}</strong>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <span className="block text-slate-500">Cấp bậc</span>
                  <strong className="mt-1 block text-slate-900">{form.job_level || '[Chưa chọn]'}</strong>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <span className="block text-slate-500">Lương chính thức</span>
                  <strong className="mt-1 block text-slate-900">{formatCurrency(form.official_salary)}</strong>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <span className="block text-slate-500">Lương KPI</span>
                  <strong className="mt-1 block text-slate-900">{formatCurrency(form.kpi_salary)}</strong>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-primary-800">
                <ShieldCheck size={16} />
                Chính sách thử việc
              </div>
              <p className="mt-2">{probationLabel}</p>
              {form.is_probationary && (
                <p className="mt-2 text-xs text-slate-500">
                  Cách tính: {form.probation_salary_mode === 'percent_of_official' ? 'Theo % lương chính thức' : 'Mức cố định'}
                  {form.auto_complete_probation ? ' · Tự động hoàn thành khi đủ điều kiện' : ''}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Ứng viên chỉ cần bấm nút bên dưới để đi thẳng vào biểu mẫu hoàn tất thông tin.</p>
              <p className="mt-2 text-amber-800">Sau khi gửi xong, hồ sơ sẽ chuyển sang trạng thái chờ duyệt để HR tiếp tục xác nhận.</p>
            </div>

            <div className="py-1 text-center">
              <a
                href={previewLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white shadow-[0_16px_30px_rgba(15,23,42,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Hoàn tất thông tin nhận việc
                <ArrowRight size={15} />
              </a>
              <p className="mt-3 break-all text-xs text-slate-400">{previewLink}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Liên hệ hỗ trợ tuyển dụng</p>
              <p className="mt-2">Người hỗ trợ: <strong>{emailConfig.supportName || '[Chưa nhập]'}</strong></p>
              <p className="mt-1">Liên hệ: <strong>{emailConfig.supportInfo || '[Chưa nhập]'}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
