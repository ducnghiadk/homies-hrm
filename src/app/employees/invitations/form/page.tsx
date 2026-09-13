'use client'

import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { EmployeeService } from '@/lib/services/employee-service'
import { EmployeeInvitation } from '@/lib/mock-data-employee-ext'
import { mockPositions, mockStores } from '@/lib/mock-data'
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Info,
  Send,
  CheckCircle,
  HeartHandshake,
  AlertTriangle,
  ArrowRight,
  Save,
} from 'lucide-react'

type CandidateGender = NonNullable<EmployeeInvitation['gender']>

type CandidateFormData = {
  full_name: string
  phone: string
  email: string
  date_of_birth: string
  gender: CandidateGender | ''
  address: string
  cccd: string
  emergency_contact: string
  candidate_notes: string
}

function buildCandidateFormData(invitation: EmployeeInvitation): CandidateFormData {
  return {
    full_name: invitation.full_name || '',
    phone: invitation.phone || '',
    email: invitation.email || '',
    date_of_birth: invitation.date_of_birth || '',
    gender: invitation.gender || '',
    address: invitation.address || '',
    cccd: invitation.cccd || '',
    emergency_contact: invitation.emergency_contact || '',
    candidate_notes: invitation.candidate_notes || '',
  }
}

function calculateCompleteness(form: CandidateFormData) {
  const fields = [
    { value: form.full_name, weight: 15 },
    { value: form.phone, weight: 15 },
    { value: form.email, weight: 10 },
    { value: form.date_of_birth, weight: 15 },
    { value: form.gender, weight: 10 },
    { value: form.cccd, weight: 15 },
    { value: form.address, weight: 10 },
    { value: form.emergency_contact, weight: 10 },
  ]

  return fields.reduce((total, field) => total + (String(field.value).trim() !== '' ? field.weight : 0), 0)
}

function getDraftKey(invitationId: string) {
  return `candidate_form_draft_${invitationId}`
}

function CandidateInvitationForm({
  invitation,
  onSubmitted,
}: {
  invitation: EmployeeInvitation
  onSubmitted: (data: CandidateFormData) => void
}) {
  const [form, setForm] = useState<CandidateFormData>(() => {
    if (typeof window === 'undefined') return buildCandidateFormData(invitation)

    const stored = localStorage.getItem(getDraftKey(invitation.id))
    if (!stored) return buildCandidateFormData(invitation)

    try {
      return JSON.parse(stored) as CandidateFormData
    } catch {
      localStorage.removeItem(getDraftKey(invitation.id))
      return buildCandidateFormData(invitation)
    }
  })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(getDraftKey(invitation.id)) ? 'Đã khôi phục bản nháp đang dở của bạn.' : null
  })

  const completeness = calculateCompleteness(form)
  const requiredChecks = useMemo(() => ([
    { label: 'Họ và tên', done: Boolean(form.full_name.trim()) },
    { label: 'Số điện thoại', done: Boolean(form.phone.trim()) },
    { label: 'Email', done: Boolean(form.email.trim()) },
    { label: 'Ngày sinh', done: Boolean(form.date_of_birth) },
    { label: 'Giới tính', done: Boolean(form.gender) },
    { label: 'CCCD', done: Boolean(form.cccd.trim()) },
    { label: 'Địa chỉ', done: Boolean(form.address.trim()) },
    { label: 'Liên hệ khẩn cấp', done: Boolean(form.emergency_contact.trim()) },
  ]), [form.address, form.cccd, form.date_of_birth, form.email, form.emergency_contact, form.full_name, form.gender, form.phone])
  const completedChecks = requiredChecks.filter((item) => item.done).length

  const update = <K extends keyof CandidateFormData>(key: K, value: CandidateFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(getDraftKey(invitation.id), JSON.stringify(next))
      return next
    })
    setDraftMessage('Đã lưu tạm trên thiết bị này.')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const validation = EmployeeService.canCandidateSubmitInvitation(invitation)
    if (!validation.ok) {
      setErrorMsg(validation.reason || 'Lời mời không còn hợp lệ để nộp hồ sơ.')
      return
    }

    if (
      !form.full_name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.date_of_birth ||
      !form.gender ||
      !form.cccd.trim() ||
      !form.address.trim() ||
      !form.emergency_contact.trim()
    ) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc trước khi gửi.')
      return
    }

    if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, ''))) {
      setErrorMsg('Số điện thoại chưa đúng định dạng.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setErrorMsg('Email liên hệ chưa đúng định dạng.')
      return
    }

    if (!/^\d{9,12}$/.test(form.cccd.replace(/\s/g, ''))) {
      setErrorMsg('CCCD / hộ chiếu chưa đúng định dạng.')
      return
    }

    const success = EmployeeService.submitCandidateData(invitation.id, {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender as CandidateGender,
      address: form.address.trim(),
      cccd: form.cccd.trim(),
      emergency_contact: form.emergency_contact.trim(),
      candidate_notes: form.candidate_notes.trim() || undefined,
    })

    if (!success) {
      setErrorMsg('Không thể xử lý hồ sơ. Vui lòng kiểm tra lại link lời mời hoặc liên hệ HR.')
      return
    }

    localStorage.removeItem(getDraftKey(invitation.id))
    onSubmitted(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.95fr)]">
          <div className="space-y-4">
            <div>
              <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                Hồ sơ tự điền
              </span>
              <h2 className="mt-3 text-2xl font-bold font-['Poppins'] text-gray-900">Điền thông tin nhận việc</h2>
              <p className="mt-2 text-sm text-gray-500">
                Bạn chỉ cần hoàn thành đủ các mục bắt buộc bên dưới. Hệ thống sẽ tự lưu tạm trên thiết bị này trong lúc bạn điền.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Tiến độ hồ sơ</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{completeness}%</p>
                <p className="mt-1 text-sm text-slate-600">Tính theo các mục bắt buộc cần hoàn tất.</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Đã hoàn thành</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{completedChecks}/{requiredChecks.length}</p>
                <p className="mt-1 text-sm text-slate-600">Số mục đã điền đủ để HR có thể duyệt nhanh.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Mã lời mời</p>
                <p className="mt-2 break-all text-sm font-bold text-slate-900">{invitation.id}</p>
                <p className="mt-1 text-sm text-slate-600">Dùng khi cần đối chiếu lại với bộ phận nhân sự.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Thông tin công việc dự kiến</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Vị trí: <span className="font-semibold text-slate-900">{mockPositions.find((p) => p.id === invitation.position_id)?.name || invitation.position_id}</span></p>
              <p>Chi nhánh: <span className="font-semibold text-slate-900">{mockStores.find((s) => s.id === invitation.store_id)?.name.replace('Homies Milk Tea - ', '') || invitation.store_id}</span></p>
              <p>Ngày vào làm: <span className="font-semibold text-slate-900">{invitation.hire_date || 'HR sẽ xác nhận lại'}</span></p>
            </div>

            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${completeness}%` }} />
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {requiredChecks.map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                    item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.done ? '✓' : '!'}
                  </span>
                  <span className={item.done ? 'text-gray-800' : 'text-gray-500'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {draftMessage ? (
        <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
          <Save size={14} className="text-blue-600" />
          <span>{draftMessage}</span>
        </div>
      ) : null}

      {invitation.status === 'needs_revision' && invitation.revision_request_note ? (
        <div className="flex gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-purple-950">
          <AlertTriangle className="shrink-0 text-purple-600" size={20} />
          <div className="space-y-1 text-sm">
            <div className="font-bold text-purple-900">HR đang cần bạn bổ sung thêm thông tin</div>
            <p className="italic">&ldquo;{invitation.revision_request_note}&rdquo;</p>
          </div>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} className="text-red-500" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-900">Thông tin cá nhân và liên hệ</p>
          <p className="mt-1 text-xs text-gray-500">Điền đúng để HR có thể xác nhận hồ sơ và liên hệ lại cho bạn.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={16} />
              <input type="text" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Nguyễn Văn A" className="input w-full pl-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
              <input type="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="09xxxxxxxx" className="input w-full pl-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              Email liên hệ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
              <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@example.com" className="input w-full pl-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              Ngày sinh <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
              <input type="date" required value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} className="input w-full pl-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              Giới tính <span className="text-red-500">*</span>
            </label>
            <select required value={form.gender} onChange={(e) => update('gender', e.target.value as CandidateFormData['gender'])} className="input w-full">
              <option value="">-- Chọn giới tính --</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              Số CCCD / Hộ chiếu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={16} />
              <input type="text" required value={form.cccd} onChange={(e) => update('cccd', e.target.value)} placeholder="CCCD 12 chữ số" className="input w-full pl-9" />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              Địa chỉ thường trú <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
              <input type="text" required value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" className="input w-full pl-9" />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              Thông tin người liên hệ khẩn cấp <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <HeartHandshake className="absolute left-3 top-3 text-gray-400" size={16} />
              <input type="text" required value={form.emergency_contact} onChange={(e) => update('emergency_contact', e.target.value)} placeholder="Họ tên - số điện thoại - mối quan hệ" className="input w-full pl-9" />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-700">
              Ghi chú hoặc phản hồi thêm cho nhân sự
            </label>
            <textarea
              value={form.candidate_notes}
              onChange={(e) => update('candidate_notes', e.target.value)}
              placeholder="Thời gian có thể bắt đầu làm việc, nguyện vọng đặc biệt..."
              rows={3}
              className="input w-full py-2"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-blue-50/80 p-4">
        <div className="flex gap-2 text-sm text-blue-800">
          <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
          <p>Bằng việc bấm nút gửi, bạn xác nhận các thông tin khai báo ở trên là chính xác và đồng ý để bộ phận nhân sự dùng thông tin này cho bước xét duyệt hồ sơ.</p>
        </div>

        <button
          type="submit"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-opacity"
          disabled={completeness < 100}
          style={{
            opacity: completeness < 100 ? 0.6 : 1,
            cursor: completeness < 100 ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={16} /> Gửi hồ sơ nhận việc {completeness < 100 ? `(Chưa hoàn tất: ${completeness}%)` : ''}
        </button>
      </section>
    </form>
  )
}

function CandidateSelfFillPageInner() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || searchParams.get('id') || ''
  const [selectedInvId, setSelectedInvId] = useState(tokenFromUrl)
  const [submittedData, setSubmittedData] = useState<CandidateFormData | null>(null)
  const isDirectInvitationMode = Boolean(tokenFromUrl)

  const invitations = EmployeeService.getPublicInvitationsForCandidate()
  const invitation = selectedInvId ? EmployeeService.getPublicInvitationByToken(selectedInvId) || null : null

  if (submittedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-4 font-['Inter']">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
          <div className="card-elevated w-full animate-scale-up space-y-6 rounded-3xl p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-500 shadow-inner">
              <CheckCircle size={44} />
            </div>
            <div className="space-y-2">
              <h1 className="font-['Poppins'] text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>
                Nộp hồ sơ thành công
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Cảm ơn bạn <strong>{submittedData.full_name}</strong> đã hoàn thành việc tự cung cấp thông tin. Hồ sơ của bạn đã được chuyển tới bộ phận nhân sự của <strong>Homies Milk Tea</strong> để phê duyệt.
              </p>
            </div>
            <div className="space-y-1 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left text-sm text-amber-800">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                <Info size={14} /> Trạng thái hồ sơ
              </div>
              <p>Hệ thống đã cập nhật trạng thái: <span className="font-bold underline">Chờ duyệt</span>.</p>
              <p>HR sẽ liên hệ trực tiếp với bạn qua email <strong>{submittedData.email}</strong> hoặc số điện thoại <strong>{submittedData.phone}</strong> sau khi hoàn tất đối soát.</p>
            </div>
            <button onClick={() => setSubmittedData(null)} className="btn btn-primary flex w-full items-center justify-center gap-2">
              Quay lại biểu mẫu <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-amber-50 px-4 py-10 font-['Inter']">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-3xl font-extrabold tracking-tight" style={{ color: 'var(--primary)' }}>
            Homies Milk Tea
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Biểu mẫu tự điền thông tin nhận việc
          </p>
        </div>

        {!isDirectInvitationMode ? (
          <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
                  Môi trường demo onboarding
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Chọn một lời mời để mô phỏng ứng viên mở link từ email</p>
                  <p className="mt-1 text-xs text-slate-500">Ở môi trường thật, ứng viên sẽ đi thẳng vào biểu mẫu này bằng link riêng trong email lời mời.</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <select
                value={selectedInvId}
                onChange={(e) => {
                  setSelectedInvId(e.target.value)
                  setSubmittedData(null)
                }}
                className="input w-full bg-white text-sm"
              >
                <option value="">-- Chọn ứng viên được mời --</option>
                {invitations.map((inv) => (
                  <option key={inv.id} value={inv.public_access_token || inv.id}>
                    [{inv.id}] {inv.full_name} - {inv.phone} ({inv.status === 'needs_revision' ? 'Cần bổ sung' : 'Đã gửi'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur-sm sm:p-4">
          {invitation ? (
            <CandidateInvitationForm key={invitation.id} invitation={invitation} onSubmitted={setSubmittedData} />
          ) : (
            <div className="space-y-4 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-500">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-gray-900">Liên kết không hợp lệ hoặc đã hết hạn</h3>
                <p className="mx-auto max-w-sm text-sm text-gray-500">
                  {isDirectInvitationMode
                    ? 'Không tìm thấy thông tin lời mời tương ứng. Vui lòng liên hệ lại bộ phận nhân sự để được cấp lại link mới.'
                    : 'Không tìm thấy thông tin lời mời tương ứng. Vui lòng chọn một lời mời trong khu demo phía trên để tiếp tục điền hồ sơ.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CandidateSelfFillPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Đang tải biểu mẫu...</div>}>
      <CandidateSelfFillPageInner />
    </Suspense>
  )
}
