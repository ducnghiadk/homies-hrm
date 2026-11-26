'use client'

import type { CareerGradeKpi, CareerKpiConfig, CareerPathSettings, CareerReminderConfig, KpiWhenNotMet } from '@/lib/career-path/settings'
import { GRADE_BADGE, ROLE_LABEL, cardClass, inputClass } from './career-ui'

interface Props {
  settings: CareerPathSettings
  readOnly: boolean
  onChange: (next: CareerPathSettings) => void
}

type NumKey = 'max_late_count' | 'max_late_minutes' | 'max_no_show' | 'max_missing_checkout' | 'max_error_points'

const KPI_COLUMNS: [NumKey, string][] = [
  ['max_late_count', 'Đi trễ tối đa (lần)'],
  ['max_late_minutes', 'Tổng phút trễ tối đa'],
  ['max_no_show', 'Vắng ca không phép tối đa (ngày)'],
  ['max_missing_checkout', 'Quên tan ca tối đa (lần)'],
  ['max_error_points', 'Điểm lỗi cá nhân tối đa'],
]

const WHEN_NOT_MET: [KpiWhenNotMet, string][] = [
  ['exception', 'Vẫn cho đề xuất ngoại lệ, kèm lý do'],
  ['block', 'Chặn, không cho đề xuất'],
]

const ESCALATE_ROLES = ['ceo', 'hr_admin', 'area_manager']

/** Để trống = null (không xét); có nhập thì là số nguyên không âm (0 = không được phép lần nào). */
const optNum = (raw: string): number | null => (raw.trim() === '' ? null : Math.max(0, Math.round(Number(raw) || 0)))
const num = (raw: string) => (raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0)))

/** Tab "KPI & vận hành": điều kiện KPI theo từng bậc và nhắc việc khi đề xuất quá hạn. */
export default function CareerKpiPanel({ settings, readOnly, onChange }: Props) {
  const k = settings.kpi
  const rm = settings.reminders
  const setKpi = (patch: Partial<CareerKpiConfig>) => onChange({ ...settings, kpi: { ...k, ...patch } })
  const setRm = (patch: Partial<CareerReminderConfig>) => onChange({ ...settings, reminders: { ...rm, ...patch } })
  const setGradeKpi = (code: string, patch: Partial<CareerGradeKpi>) =>
    onChange({ ...settings, grades: settings.grades.map((g) => (g.code === code ? { ...g, kpi: { ...g.kpi, ...patch } } : g)) })
  const toggleEscalate = (role: string) =>
    setRm({ escalate_roles: rm.escalate_roles.includes(role) ? rm.escalate_roles.filter((r) => r !== role) : [...rm.escalate_roles, role] })
  const targets = settings.grades.filter((g) => g.code !== 'T0')

  return (
    <div className="space-y-4">
      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">KPI vận hành khi xét lên bậc</h2>
        <p className="mt-1 text-sm text-gray-500">
          Hệ thống tự đếm từ chấm công, lịch đã chốt và sổ lỗi cá nhân đã duyệt. Ô để trống là không xét chỉ số đó; nhập 0 là không được phép lần nào.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-gray-600">Xét trong bao nhiêu tháng gần nhất</span>
            <input type="number" min={0} className={`${inputClass} mt-1`} disabled={readOnly} placeholder="Để trống = chưa xét KPI" value={k.lookback_months || ''} onChange={(e) => setKpi({ lookback_months: num(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Nhân viên chưa đạt KPI thì</span>
            <select className={`${inputClass} mt-1`} disabled={readOnly} value={k.when_not_met} onChange={(e) => setKpi({ when_not_met: e.target.value as KpiWhenNotMet })}>
              {WHEN_NOT_MET.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <span className="mt-1 block text-xs text-gray-500">Đề xuất ngoại lệ còn phụ thuộc ô &quot;Cho phép đề xuất ngoại lệ&quot; ở tab Quy tắc tính.</span>
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-semibold">Lên bậc</th>
                {KPI_COLUMNS.map(([key, label]) => <th key={key} className="py-2 pr-3 font-semibold">{label}</th>)}
                <th className="py-2 font-semibold">Lỗi nghiêm trọng</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((g) => (
                <tr key={g.code} className="border-t border-gray-100">
                  <td className="py-2 pr-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${GRADE_BADGE[g.code]}`}>{g.code}</span>
                    <span className="ml-1 text-xs text-gray-500">{g.label}</span>
                  </td>
                  {KPI_COLUMNS.map(([key]) => (
                    <td key={key} className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} w-24`}
                        disabled={readOnly}
                        placeholder="Trống"
                        value={g.kpi[key] ?? ''}
                        onChange={(e) => setGradeKpi(g.code, { [key]: optNum(e.target.value) })}
                      />
                    </td>
                  ))}
                  <td className="py-2">
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input type="checkbox" disabled={readOnly} checked={g.kpi.block_serious_error} onChange={(e) => setGradeKpi(g.code, { block_serious_error: e.target.checked })} />
                      Có là chưa đạt
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Vắng ca không phép: ngày có ca trong lịch đã chốt mà không có chấm công và không có đơn nghỉ phép đã duyệt. Lỗi cá nhân lấy từ sổ lỗi BSC đã được duyệt.
          BSC cửa hàng chỉ hiển thị để tham khảo, không dùng để xét bậc.
        </p>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Nhắc việc khi đề xuất quá hạn</h2>
        <p className="mt-1 text-sm text-gray-500">
          Gửi chuông thông báo cho người duyệt khi đề xuất nâng bậc chờ quá &quot;Hạn phản hồi&quot; ở tab Đánh giá &amp; duyệt. Mỗi đề xuất nhắc tối đa 1 lần mỗi ngày.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" disabled={readOnly} checked={rm.enabled} onChange={(e) => setRm({ enabled: e.target.checked })} />
          Bật nhắc việc
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-gray-600">Nhắc lại sau mỗi (ngày làm việc)</span>
            <input type="number" min={0} className={`${inputClass} mt-1`} disabled={readOnly || !rm.enabled} placeholder="Để trống = chỉ nhắc 1 lần" value={rm.repeat_every_days || ''} onChange={(e) => setRm({ repeat_every_days: num(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Nhắc tối đa (lần mỗi đề xuất)</span>
            <input type="number" min={0} className={`${inputClass} mt-1`} disabled={readOnly || !rm.enabled} placeholder="Để trống = không giới hạn" value={rm.max_times || ''} onChange={(e) => setRm({ max_times: num(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Gửi nhắc từ mấy giờ trở đi (0 - 23, giờ Việt Nam)</span>
            <input type="number" min={0} max={23} className={`${inputClass} mt-1`} disabled={readOnly || !rm.enabled} placeholder="Để trống = giờ nào cũng được" value={rm.send_hour ?? ''} onChange={(e) => setRm({ send_hour: e.target.value === '' ? null : Math.min(23, num(e.target.value)) })} />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Quá hạn thêm bao nhiêu ngày làm việc thì báo lên cấp trên</span>
            <input type="number" min={0} className={`${inputClass} mt-1`} disabled={readOnly || !rm.enabled} placeholder="Để trống = không báo lên" value={rm.escalate_after_days || ''} onChange={(e) => setRm({ escalate_after_days: num(e.target.value) })} />
          </label>
        </div>
        <div className="mt-3">
          <span className="text-sm text-gray-600">Báo lên cho</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ESCALATE_ROLES.map((role) => {
              const on = rm.escalate_roles.includes(role)
              return (
                <button
                  key={role}
                  type="button"
                  disabled={readOnly || !rm.enabled}
                  onClick={() => toggleEscalate(role)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? 'border-[#2F6FA8] bg-[#2F6FA8] text-white' : 'border-gray-200 bg-white text-gray-600'} disabled:opacity-60`}
                >
                  {ROLE_LABEL[role] || role}
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
