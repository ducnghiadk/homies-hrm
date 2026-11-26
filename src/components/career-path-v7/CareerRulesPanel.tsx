'use client'

import type { CareerPathSettings, CareerRulesConfig, FtMidMonth, HoursFrom, HoursSource, LegacyHoursRule, MonthsFrom } from '@/lib/career-path/settings'
import { cardClass, inputClass } from './career-ui'

interface Props {
  settings: CareerPathSettings
  readOnly: boolean
  onChange: (next: CareerPathSettings) => void
}

const WEEKDAYS: [number, string][] = [[1, 'Thứ 2'], [2, 'Thứ 3'], [3, 'Thứ 4'], [4, 'Thứ 5'], [5, 'Thứ 6'], [6, 'Thứ 7'], [0, 'Chủ nhật']]

const MONTHS_FROM: [MonthsFrom, string][] = [
  ['hire_date', 'Từ ngày vào làm'],
  ['first_placement', 'Từ ngày được xếp bậc lần đầu'],
]
const HOURS_FROM: [HoursFrom, string][] = [
  ['all_attendance', 'Toàn bộ giờ chấm công đã có'],
  ['since_first_placement', 'Chỉ giờ chấm công từ ngày xếp bậc lần đầu'],
]
const HOURS_SOURCE: [HoursSource, string][] = [
  ['all_attendance', 'Mọi lượt chấm công đã tan ca'],
  ['confirmed_schedule', 'Chỉ ca nằm trong lịch đã chốt'],
  ['confirmed_plus_approved', 'Ca trong lịch đã chốt + ca ngoài lịch được quản lý duyệt'],
]
const LEGACY: [LegacyHoursRule, string][] = [
  ['count', 'Tính hết'],
  ['skip', 'Bỏ qua'],
]
const FT_MID: [FtMidMonth, string][] = [
  ['prorate_days', 'Chia theo số ngày ở mỗi bậc'],
  ['grade_at_period_end', 'Tính trọn tháng theo bậc cuối kỳ'],
]

/** Tab "Quy tắc tính": các quy tắc nhỏ khi xét bậc, đề xuất và cộng lương. Đều do CEO/HR chọn. */
export default function CareerRulesPanel({ settings, readOnly, onChange }: Props) {
  const r = settings.rules
  const set = (patch: Partial<CareerRulesConfig>) => onChange({ ...settings, rules: { ...r, ...patch } })
  const num = (raw: string) => (raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0)))
  const toggleDay = (d: number) =>
    set({ non_working_weekdays: r.non_working_weekdays.includes(d) ? r.non_working_weekdays.filter((x) => x !== d) : [...r.non_working_weekdays, d].sort() })

  return (
    <div className="space-y-4">
      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Lý do khi đề xuất / từ chối</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-gray-600">Lý do đề xuất hoặc từ chối ít nhất (ký tự)</span>
            <input type="number" min={0} className={`${inputClass} mt-1`} disabled={readOnly} placeholder="Để trống = không bắt buộc" value={r.reason_min_chars || ''} onChange={(e) => set({ reason_min_chars: num(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Lý do đề xuất ngoại lệ ít nhất (ký tự)</span>
            <input type="number" min={0} className={`${inputClass} mt-1`} disabled={readOnly || !r.allow_exception} placeholder="Để trống = không bắt buộc" value={r.exception_reason_min_chars || ''} onChange={(e) => set({ exception_reason_min_chars: num(e.target.value) })} />
          </label>
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" className="mt-1" disabled={readOnly} checked={r.allow_exception} onChange={(e) => set({ allow_exception: e.target.checked })} />
          <span>
            Cho phép đề xuất ngoại lệ
            <span className="block text-xs text-gray-500">Quản lý vẫn đề xuất được khi nhân viên chưa đủ điều kiện, người duyệt quyết định.</span>
          </span>
        </label>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Ngày nghỉ khi đếm hạn</h2>
        <p className="mt-1 text-sm text-gray-500">Các thứ được chọn không tính là ngày làm việc khi đếm hạn phản hồi, đánh giá, báo kết quả.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WEEKDAYS.map(([d, label]) => (
            <button
              key={d}
              type="button"
              disabled={readOnly}
              onClick={() => toggleDay(d)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold disabled:opacity-60 ${r.non_working_weekdays.includes(d) ? 'border-[#001D3D] bg-[#001D3D] text-white' : 'border-gray-200 bg-white text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Cách tính thời gian và giờ làm</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-gray-600">Số tháng làm việc tính</span>
            <select className={`${inputClass} mt-1`} disabled={readOnly} value={r.months_from} onChange={(e) => set({ months_from: e.target.value as MonthsFrom })}>
              {MONTHS_FROM.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Số giờ đã làm tính</span>
            <select className={`${inputClass} mt-1`} disabled={readOnly} value={r.hours_from} onChange={(e) => set({ hours_from: e.target.value as HoursFrom })}>
              {HOURS_FROM.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <span className="mt-1 block text-xs text-gray-500">Luôn cộng thêm số giờ HR nhập lúc xếp bậc.</span>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Giờ nào được tính</span>
            <select className={`${inputClass} mt-1`} disabled={readOnly} value={r.hours_source} onChange={(e) => set({ hours_source: e.target.value as HoursSource })}>
              {HOURS_SOURCE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <span className="mt-1 block text-xs text-gray-500">
              Ca ngoài lịch được tính là duyệt khi quản lý chấm công thay, hoặc nhân viên có đơn bổ sung chấm công đã duyệt cho ngày đó.
              Giờ mỗi ca đã tính đến sớm / ở muộn giống bảng lương.
            </span>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Giờ chấm công cũ (iPOS) chưa đánh dấu có trong lịch</span>
            <select className={`${inputClass} mt-1`} disabled={readOnly || r.hours_source === 'all_attendance'} value={r.legacy_hours} onChange={(e) => set({ legacy_hours: e.target.value as LegacyHoursRule })}>
              {LEGACY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <span className="mt-1 block text-xs text-gray-500">Chỉ áp dụng khi không chọn &quot;Mọi lượt chấm công&quot;.</span>
          </label>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Cộng lương theo bậc</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-gray-600">Full-time (cộng cố định) đổi bậc giữa tháng</span>
            <select className={`${inputClass} mt-1`} disabled={readOnly} value={r.ft_mid_month} onChange={(e) => set({ ft_mid_month: e.target.value as FtMidMonth })}>
              {FT_MID.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="flex items-start gap-2 pt-6 text-sm text-gray-700">
            <input type="checkbox" className="mt-1" disabled={readOnly} checked={r.pay_taxable} onChange={(e) => set({ pay_taxable: e.target.checked })} />
            <span>
              Tiền cộng theo bậc có tính thuế TNCN
              <span className="block text-xs text-gray-500">Bỏ chọn nếu kế toán xác định khoản này không chịu thuế.</span>
            </span>
          </label>
        </div>
      </section>
    </div>
  )
}
