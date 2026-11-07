'use client'

import { Suspense, useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
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
  ShieldCheck,
  CreditCard,
  Camera,
  Upload,
  Sparkles,
  Store,
  Shirt,
  FileCheck2,
  Trash2,
  Lock,
} from 'lucide-react'

// Danh sách ngân hàng phổ biến tại Việt Nam
const VIETNAM_BANKS = [
  'Vietcombank (VCB)',
  'MB Bank (Quân Đội)',
  'Techcombank (TCB)',
  'ACB (Á Châu)',
  'VPBank (Việt Nam Thịnh Vượng)',
  'TPBank (Tiên Phong)',
  'BIDV (Đầu tư & Phát triển)',
  'VietinBank (Công Thương)',
  'Agribank (Nông Nghiệp)',
  'Sacombank (Sài Gòn Thương Tín)',
  'HDBank (Phát Triển TP.HCM)',
  'VIB (Quốc Tế)',
  'MSB (Hàng Hải)',
  'OCB (Phương Đông)',
  'MoMo (Ví điện tử)',
  'Khác',
]

// Size áo đồng phục F&B Homies
const SHIRT_SIZES = [
  { size: 'S', weight: 'Dưới 48 kg', desc: 'Form ôm gọn' },
  { size: 'M', weight: '48 - 58 kg', desc: 'Vừa vặn chuẩn' },
  { size: 'L', weight: '58 - 68 kg', desc: 'Thoải mái hoạt động' },
  { size: 'XL', weight: '68 - 78 kg', desc: 'Rộng rãi thoáng mát' },
  { size: 'XXL', weight: 'Trên 78 kg', desc: 'Form lớn đặc biệt' },
]

// Hàm chuyển đổi Họ tên sang CHỮ IN HOA KHÔNG DẤU
function toNonAccentUppercase(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .trim()
}

// Nén ảnh gọn nhẹ trước khi lưu Data URL
function compressImageFile(file: File, maxDim = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(e.target?.result as string)
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface ServerInvitationData {
  id: string
  token: string
  full_name: string
  phone: string
  email: string
  store_id: string
  position_id: string
  status: string
  hire_date?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  cccd?: string
  emergency_contact?: string
  candidate_notes?: string
  shirt_size?: string
  id_card_front_url?: string
  id_card_back_url?: string
  bank_name?: string
  bank_account_number?: string
  bank_account_name?: string
  health_cert_date?: string
  policy_agreed?: boolean
}

interface InvitationFormPayload {
  invitation: ServerInvitationData
  store?: { id: string; name: string; address?: string }
  position?: { id: string; name: string }
}

interface CandidateFormData {
  full_name: string
  phone: string
  email: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other' | ''
  cccd: string
  address: string
  emergency_contact: string
  candidate_notes: string
  // F&B Modules
  shirt_size: string
  id_card_front_url: string
  id_card_back_url: string
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  health_cert_date: string
  policy_agreed: boolean
}

function CandidateFormInner({
  data,
  onSuccess,
}: {
  data: InvitationFormPayload
  onSuccess: (submitted: CandidateFormData) => void
}) {
  const { invitation, store, position } = data

  const [form, setForm] = useState<CandidateFormData>(() => ({
    full_name: invitation.full_name || '',
    phone: invitation.phone || '',
    email: invitation.email || '',
    date_of_birth: invitation.date_of_birth || '',
    gender: invitation.gender || 'male',
    cccd: invitation.cccd || '',
    address: invitation.address || '',
    emergency_contact: invitation.emergency_contact || '',
    candidate_notes: invitation.candidate_notes || '',
    shirt_size: invitation.shirt_size || 'M',
    id_card_front_url: invitation.id_card_front_url || '',
    id_card_back_url: invitation.id_card_back_url || '',
    bank_name: invitation.bank_name || 'Vietcombank (VCB)',
    bank_account_number: invitation.bank_account_number || '',
    bank_account_name: invitation.bank_account_name || toNonAccentUppercase(invitation.full_name || ''),
    health_cert_date: invitation.health_cert_date || '',
    policy_agreed: Boolean(invitation.policy_agreed),
  }))

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const frontInputRef = useRef<HTMLInputElement | null>(null)
  const backInputRef = useRef<HTMLInputElement | null>(null)

  // Tự động cập nhật tên chủ tài khoản in hoa không dấu khi ứng viên sửa họ và tên
  const handleFullNameChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      full_name: val,
      bank_account_name: prev.bank_account_name === toNonAccentUppercase(prev.full_name)
        ? toNonAccentUppercase(val)
        : prev.bank_account_name,
    }))
  }

  // Xử lý upload ảnh CCCD
  const handleFileUpload = async (file: File, side: 'front' | 'back') => {
    try {
      const compressed = await compressImageFile(file)
      if (side === 'front') {
        setForm((prev) => ({ ...prev, id_card_front_url: compressed }))
      } else {
        setForm((prev) => ({ ...prev, id_card_back_url: compressed }))
      }
    } catch {
      setErrorMsg('Không thể xử lý ảnh tải lên. Vui lòng thử lại với ảnh khác.')
    }
  }

  // Danh mục kiểm tra bắt buộc
  const requiredChecks = useMemo(() => [
    { label: 'Họ và tên', done: Boolean(form.full_name.trim()) },
    { label: 'Số điện thoại', done: Boolean(form.phone.trim()) },
    { label: 'Email', done: Boolean(form.email.trim()) },
    { label: 'Ngày sinh', done: Boolean(form.date_of_birth) },
    { label: 'Số CCCD', done: Boolean(form.cccd.trim()) },
    { label: 'Địa chỉ thường trú', done: Boolean(form.address.trim()) },
    { label: 'Liên hệ khẩn cấp', done: Boolean(form.emergency_contact.trim()) },
    { label: 'Size áo đồng phục', done: Boolean(form.shirt_size) },
    { label: 'Số tài khoản ngân hàng', done: Boolean(form.bank_account_number.trim()) },
    { label: 'Tên chủ tài khoản', done: Boolean(form.bank_account_name.trim()) },
    { label: 'Cam kết nội quy F&B', done: form.policy_agreed },
  ], [
    form.full_name,
    form.phone,
    form.email,
    form.date_of_birth,
    form.cccd,
    form.address,
    form.emergency_contact,
    form.shirt_size,
    form.bank_account_number,
    form.bank_account_name,
    form.policy_agreed,
  ])

  const completedCount = requiredChecks.filter((c) => c.done).length
  const completeness = Math.round((completedCount / requiredChecks.length) * 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!form.full_name.trim() || !form.phone.trim() || !form.email.trim() || !form.date_of_birth) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin cá nhân bắt buộc.')
      return
    }

    if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, ''))) {
      setErrorMsg('Số điện thoại chưa đúng định dạng (9 - 11 chữ số).')
      return
    }

    if (!form.cccd.trim()) {
      setErrorMsg('Vui lòng nhập số Căn cước công dân.')
      return
    }

    if (!form.bank_account_number.trim() || !form.bank_account_name.trim()) {
      setErrorMsg('Vui lòng cung cấp số tài khoản và tên chủ thẻ ngân hàng để nhận lương.')
      return
    }

    if (!form.policy_agreed) {
      setErrorMsg('Bạn cần tích đồng ý Cam kết nội quy và Bảo mật công thức trước khi gửi.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/invitations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.token || invitation.id,
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          address: form.address.trim(),
          cccd: form.cccd.trim(),
          emergency_contact: form.emergency_contact.trim(),
          candidate_notes: form.candidate_notes.trim(),
          shirt_size: form.shirt_size,
          id_card_front_url: form.id_card_front_url,
          id_card_back_url: form.id_card_back_url,
          bank_name: form.bank_name,
          bank_account_number: form.bank_account_number.trim(),
          bank_account_name: form.bank_account_name.trim(),
          health_cert_date: form.health_cert_date,
          policy_agreed: true,
        }),
      })

      const resData = await res.json()

      if (!res.ok || !resData.ok) {
        setErrorMsg(resData.error || 'Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.')
        setSubmitting(false)
        return
      }

      onSuccess(form)
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 sm:pb-8">
      {/* HEADER TỔNG QUAN VỊ TRÍ ỨNG TUYỂN */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-white to-amber-100/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-900">
              <Sparkles size={13} className="text-amber-600" />
              Gia nhập Homies Milk Tea
            </span>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Hồ sơ nhận việc F&B
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Chào mừng bạn đến với đại gia đình Homies. Hãy điền 5 khối thông tin chuẩn bên dưới để hoàn tất hồ sơ.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                <Store size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cơ sở làm việc</p>
                <p className="text-sm font-bold text-slate-900">{store?.name || 'Homies Milk Tea'}</p>
                <p className="text-xs text-slate-500">{store?.address || 'Cơ sở chuẩn F&B'}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
              <span className="text-slate-500">Vị trí:</span>
              <span className="font-bold text-amber-700">{position?.name || 'Nhân viên F&B'}</span>
            </div>
          </div>
        </div>

        {/* Thanh tiến độ hồ sơ */}
        <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              Tiến độ hoàn thiện: <span className="text-amber-600">{completeness}%</span>
            </span>
            <span className="font-medium text-slate-500">
              {completedCount}/{requiredChecks.length} mục bắt buộc
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </section>

      {errorMsg ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm animate-shake">
          <AlertTriangle size={18} className="shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {/* KHỐI 1: THÔNG TIN CÁ NHÂN & LIÊN HỆ */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">1. Thông tin cá nhân & Người liên hệ</h2>
            <p className="text-xs text-slate-500">Cung cấp đúng để làm hợp đồng và liên hệ khi cần</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => handleFullNameChange(e.target.value)}
                placeholder="Nguyễn Văn An"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0987654321"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Email nhận thông báo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="an.nguyen@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Ngày sinh <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="date"
                required
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Giới tính <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['male', 'female', 'other'] as const).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setForm({ ...form, gender: g })}
                  className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                    form.gender === g
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Số CCCD / Hộ chiếu (12 số) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ShieldCheck size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={form.cccd}
                onChange={(e) => setForm({ ...form, cccd: e.target.value })}
                placeholder="079201012345"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Địa chỉ thường trú <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Người liên hệ khẩn cấp (Họ tên - SĐT - Mối quan hệ) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <HeartHandshake size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={form.emergency_contact}
                onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                placeholder="Ví dụ: Nguyễn Văn Bố - 0912345678 - Bố ruột"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Ghi chú thêm cho bộ phận nhân sự (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={form.candidate_notes}
              onChange={(e) => setForm({ ...form, candidate_notes: e.target.value })}
              placeholder="Nguyện vọng ca làm việc, thời gian có thể bắt đầu..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </section>

      {/* KHỐI 2: SIZE ÁO ĐỒNG PHỤC F&B HOMIES */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Shirt size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">2. Size áo đồng phục F&B Homies</h2>
            <p className="text-xs text-slate-500">Chuỗi sẽ cấp 02 áo đồng phục trước buổi làm đầu tiên</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SHIRT_SIZES.map((item) => {
            const isSelected = form.shirt_size === item.size
            return (
              <button
                key={item.size}
                type="button"
                onClick={() => setForm({ ...form, shirt_size: item.size })}
                className={`relative flex flex-col items-center rounded-2xl border p-3.5 text-center transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/80 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-black text-lg ${
                    isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.size}
                </div>
                <p className="mt-2 text-xs font-bold text-slate-800">{item.weight}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{item.desc}</p>
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* KHỐI 3: HỒ SƠ PHÁP LÝ & VSATTP */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FileCheck2 size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">3. Hồ sơ pháp lý & Vệ sinh An toàn Thực phẩm (VSATTP)</h2>
            <p className="text-xs text-slate-500">Chụp rõ nét ảnh CCCD & Thẻ xanh y tế (nếu có) phục vụ lưu trữ thanh tra</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Mặt trước CCCD */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center">
            <p className="text-xs font-bold text-slate-800">Ảnh CCCD Mặt trước</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Chụp thẳng, rõ số và họ tên</p>

            <input
              type="file"
              ref={frontInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFileUpload(file, 'front')
              }}
            />

            {form.id_card_front_url ? (
              <div className="mt-3 relative">
                <img
                  src={form.id_card_front_url}
                  alt="Mặt trước CCCD"
                  className="mx-auto h-36 w-full rounded-xl object-cover border border-slate-200 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, id_card_front_url: '' })}
                  className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white hover:bg-red-600 transition-colors"
                  title="Xóa ảnh"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-center justify-center py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-slate-500">
                  <Camera size={22} />
                </div>
                <button
                  type="button"
                  onClick={() => frontInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-50"
                >
                  <Upload size={13} /> Chụp hoặc tải ảnh lên
                </button>
              </div>
            )}
          </div>

          {/* Mặt sau CCCD */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center">
            <p className="text-xs font-bold text-slate-800">Ảnh CCCD Mặt sau</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Chụp rõ đặc điểm nhận dạng & ngày cấp</p>

            <input
              type="file"
              ref={backInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFileUpload(file, 'back')
              }}
            />

            {form.id_card_back_url ? (
              <div className="mt-3 relative">
                <img
                  src={form.id_card_back_url}
                  alt="Mặt sau CCCD"
                  className="mx-auto h-36 w-full rounded-xl object-cover border border-slate-200 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, id_card_back_url: '' })}
                  className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white hover:bg-red-600 transition-colors"
                  title="Xóa ảnh"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-center justify-center py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-slate-500">
                  <Camera size={22} />
                </div>
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-50"
                >
                  <Upload size={13} /> Chụp hoặc tải ảnh lên
                </button>
              </div>
            )}
          </div>

          {/* Thẻ xanh y tế */}
          <div className="sm:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-950">Ngày hết hạn Thẻ xanh Y tế / Khám sức khỏe F&B</p>
                <p className="text-[11px] text-emerald-700">Được cấp theo Thông tư khám sức khỏe định kỳ ngành ăn uống</p>
              </div>
              <input
                type="date"
                value={form.health_cert_date}
                onChange={(e) => setForm({ ...form, health_cert_date: e.target.value })}
                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* KHỐI 4: TÀI KHOẢN NGÂN HÀNG CHI TRẢ LƯƠNG */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">4. Tài khoản ngân hàng chi trả lương</h2>
            <p className="text-xs text-slate-500">Phòng kế toán Homies chuyển khoản trực tiếp vào ngày 05 hàng tháng</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Ngân hàng thụ hưởng <span className="text-red-500">*</span>
            </label>
            <select
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {VIETNAM_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Số tài khoản ngân hàng <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={form.bank_account_number}
                onChange={(e) => setForm({ ...form, bank_account_number: e.target.value.replace(/\D/g, '') })}
                placeholder="Ví dụ: 1012345678"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-medium font-mono text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Tên chủ tài khoản (In hoa không dấu theo ngân hàng) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.bank_account_name}
              onChange={(e) => setForm({ ...form, bank_account_name: toNonAccentUppercase(e.target.value) })}
              placeholder="NGUYEN VAN AN"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm font-bold font-mono tracking-wider text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Hệ thống tự động in hoa và loại bỏ dấu tiếng Việt để đối soát chính xác với Ngân hàng.
            </p>
          </div>
        </div>
      </section>

      {/* KHỐI 5: CAM KẾT NỘI QUY & BẢO MẬT CÔNG THỨC */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">5. Cam kết nội quy & Bảo mật công thức</h2>
            <p className="text-xs text-slate-500">Quy chuẩn sống còn của thương hiệu Homies Milk Tea</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-xs leading-relaxed text-amber-950">
            <p className="font-bold text-amber-900 mb-1">Nội quy lao động & Bảo mật nghiệp vụ F&B:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              <li>Tuân thủ đúng định lượng và quy trình pha chế chuẩn của chuỗi.</li>
              <li>Tuyệt đối không tiết lộ công thức syrup, base trà và tỷ lệ độc quyền ra ngoài.</li>
              <li>Tuân thủ giờ giấc phân ca, mang đúng đồng phục và giữ vệ sinh cá nhân tại quầy bar.</li>
              <li>Trung thực, minh bạch trong thu ngân và quản lý nguyên vật liệu.</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              required
              checked={form.policy_agreed}
              onChange={(e) => setForm({ ...form, policy_agreed: e.target.checked })}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs leading-relaxed text-slate-800 font-medium select-none">
              Tôi xác nhận toàn bộ thông tin khai báo trên là chính xác. Tôi cam kết tuân thủ nghiêm túc Nội quy lao động, quy trình Vệ sinh an toàn thực phẩm và Bảo mật tuyệt đối công thức pha chế của chuỗi <strong>Homies Milk Tea</strong>.
            </span>
          </label>
        </div>
      </section>

      {/* NÚT XÁC NHẬN NỘP HỒ SƠ */}
      <div className="sticky bottom-4 z-20 rounded-3xl border border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:relative sm:bottom-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <button
          type="submit"
          disabled={submitting || completeness < 100}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-sm font-bold text-white shadow-lg transition-all ${
            completeness < 100 || submitting
              ? 'bg-slate-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/30 hover:brightness-105 active:scale-[0.99]'
          }`}
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Đang gửi hồ sơ lên hệ thống...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>
                {completeness < 100
                  ? `Vui lòng hoàn thành đủ 100% (Hiện tại: ${completeness}%)`
                  : 'XÁC NHẬN & GỬI HỒ SƠ ỨNG VIÊN'}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function CandidateSelfFillPageInner() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || searchParams.get('id') || ''

  const [currentToken, setCurrentToken] = useState(tokenFromUrl)
  const [loading, setLoading] = useState(Boolean(tokenFromUrl))
  const [data, setData] = useState<InvitationFormPayload | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submittedData, setSubmittedData] = useState<CandidateFormData | null>(null)

  // Danh sách lời mời demo (chỉ nạp khi không có token từ URL để tiện test)
  const [demoInvitations, setDemoInvitations] = useState<Array<{ id: string; token?: string; full_name: string; phone: string; status: string }>>([])

  // Nạp danh sách demo từ máy chủ
  useEffect(() => {
    if (!tokenFromUrl) {
      fetch('/api/invitations')
        .then((res) => res.json())
        .then((resData) => {
          if (resData.ok && Array.isArray(resData.data)) {
            setDemoInvitations(resData.data)
            if (resData.data.length > 0 && !currentToken) {
              const first = resData.data[0]
              setCurrentToken(first.token || first.id)
            }
          }
        })
        .catch(() => {})
    }
  }, [tokenFromUrl, currentToken])

  // Fetch chi tiết biểu mẫu từ máy chủ REST API
  useEffect(() => {
    if (!currentToken) return

    let isMounted = true

    const timer = setTimeout(() => {
      setLoading(true)
      setFetchError(null)

      fetch(`/api/invitations/form?token=${encodeURIComponent(currentToken)}`)
        .then((res) => res.json())
        .then((resData) => {
          if (!isMounted) return
          if (resData.ok && resData.invitation) {
            setData(resData)
          } else {
            setFetchError(resData.error || 'Không tìm thấy thông tin lời mời tương ứng.')
            setData(null)
          }
          setLoading(false)
        })
        .catch(() => {
          if (!isMounted) return
          setFetchError('Lỗi kết nối máy chủ khi tải lời mời.')
          setLoading(false)
        })
    }, 0)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [currentToken])

  // MÀN HÌNH NỘP THÀNH CÔNG
  if (submittedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-12 font-['Inter']">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-amber-200/80 bg-white p-8 text-center shadow-xl animate-scale-up">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border border-emerald-200 shadow-inner">
              <CheckCircle size={44} />
            </div>

            <h1 className="mt-6 text-2xl font-black text-slate-900">
              Nộp hồ sơ nhận việc thành công!
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Cảm ơn bạn <strong className="text-slate-900">{submittedData.full_name}</strong> đã hoàn tất biểu mẫu. Hồ sơ đã được gửi trực tiếp đến phòng nhân sự của <strong>Homies Milk Tea</strong>.
            </p>

            <div className="mt-6 space-y-2 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-left text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Info size={15} /> Bước tiếp theo:
              </div>
              <p>• Trạng thái hồ sơ: <span className="font-bold underline">Chờ phòng Nhân sự duyệt</span>.</p>
              <p>• Đồng phục: Size <strong>{submittedData.shirt_size}</strong> sẽ được chuẩn bị sẵn.</p>
              <p>• Lương tháng sẽ được chi trả vào tài khoản <strong>{submittedData.bank_account_number} ({submittedData.bank_name})</strong>.</p>
              <p>• Quản lý cửa hàng sẽ liên hệ qua số <strong>{submittedData.phone}</strong> trước ngày nhận việc.</p>
            </div>

            <button
              type="button"
              onClick={() => setSubmittedData(null)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Xem lại biểu mẫu vừa gửi <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 px-3 py-6 font-['Inter'] sm:px-4 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* THANH THƯƠNG HIỆU */}
        <div className="text-center">
          <span className="inline-block text-2xl font-black tracking-tight text-amber-800">
            HOMIES MILK TEA
          </span>
          <p className="text-xs font-medium text-slate-500">
            Hệ thống Onboarding & Quản lý Nhân sự F&B Nội bộ
          </p>
        </div>

        {/* BỘ CHỌN LỜI MỜI DEMO (Khi truy cập trực tiếp không qua link email) */}
        {!tokenFromUrl && demoInvitations.length > 0 && (
          <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-800">Chọn ứng viên mô phỏng mở link từ email:</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Chế độ Test
              </span>
            </div>
            <select
              value={currentToken}
              onChange={(e) => setCurrentToken(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {demoInvitations.map((inv) => (
                <option key={inv.id} value={inv.token || inv.id}>
                  [{inv.id}] {inv.full_name} - {inv.phone} ({inv.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <p className="mt-3 text-xs font-medium">Đang tải biểu mẫu từ máy chủ...</p>
          </div>
        ) : fetchError ? (
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle size={28} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Liên kết không hợp lệ hoặc đã hết hạn</h3>
            <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500">{fetchError}</p>
          </div>
        ) : data ? (
          data.invitation.status === 'approved' ? (
            <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <CheckCircle size={28} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Hồ sơ đã được phê duyệt</h3>
              <p className="mt-2 text-xs text-slate-500">
                Hồ sơ nhận việc của bạn đã được HR hoàn tất phê duyệt và tạo tài khoản nhân sự chính thức tại Homies Milk Tea.
              </p>
            </div>
          ) : (
            <CandidateFormInner
              key={data.invitation.id}
              data={data}
              onSuccess={(sub) => setSubmittedData(sub)}
            />
          )
        ) : null}
      </div>
    </div>
  )
}

export default function CandidateSelfFillPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Đang tải biểu mẫu...</div>}>
      <CandidateSelfFillPageInner />
    </Suspense>
  )
}
