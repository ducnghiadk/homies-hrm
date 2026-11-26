'use client'

import type { CareerGradeConfig, CareerPathSettings, FullTimePayMethod } from '@/lib/career-path/settings'
import { GRADE_BADGE, cardClass, inputClass } from './career-ui'

interface Props {
  settings: CareerPathSettings
  readOnly: boolean
  onChange: (next: CareerPathSettings) => void
}

type NumField = 'min_months' | 'min_hours' | 'hourly_step_vnd' | 'ft_monthly_vs_g1_vnd'
type LevelField = 'main_min_level' | 'support_min_level' | 'second_min_level' | 'advanced_min_level'

const LEVEL_COLUMNS: { key: LevelField; label: string }[] = [
  { key: 'main_min_level', label: 'Vị trí chính' },
  { key: 'support_min_level', label: 'Hỗ trợ' },
  { key: 'second_min_level', label: 'Vị trí thứ hai' },
  { key: 'advanced_min_level', label: 'Nâng cao' },
]

export default function CareerGradesPanel({ settings, readOnly, onChange }: Props) {
  const updateGrade = (code: string, patch: (g: CareerGradeConfig) => CareerGradeConfig) =>
    onChange({ ...settings, grades: settings.grades.map((g) => (g.code === code ? patch(g) : g)) })

  const setNum = (code: string, key: NumField, raw: string) =>
    updateGrade(code, (g) => ({ ...g, [key]: raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0)) }))

  const setLevel = (code: string, key: LevelField, raw: string) =>
    updateGrade(code, (g) => ({ ...g, requirement: { ...g.requirement, [key]: raw === '' ? null : Number(raw) } }))

  const setPayMethod = (m: FullTimePayMethod) => onChange({ ...settings, ft_pay_method: m })

  const field = (g: CareerGradeConfig, key: NumField, label: string, unit: string) => (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="relative mt-1">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className={`${inputClass} pr-12`}
          placeholder="Nhập số"
          value={g[key] || ''}
          disabled={readOnly}
          onChange={(e) => setNum(g.code, key, e.target.value)}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">{unit}</span>
      </div>
    </label>
  )

  return (
    <div className="space-y-4">
      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Điều kiện và mức cộng lương từng bậc</h2>
        <p className="mt-1 text-sm text-gray-500">Tháng và giờ tính từ ngày vào làm. Mức cộng lương giờ là phần cộng thêm so với bậc trước.</p>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {settings.grades.map((g) => (
            <div key={g.code} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${GRADE_BADGE[g.code]}`}>{g.code}</span>
                <span className="text-sm font-semibold text-[#001D3D]">{g.label}</span>
              </div>
              {g.code === 'T0' ? (
                <p className="mt-2 text-xs text-gray-500">Bậc khởi đầu, không cần điều kiện và không cộng lương.</p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {field(g, 'min_months', 'Làm tối thiểu', 'tháng')}
                    {field(g, 'min_hours', 'Tổng giờ tối thiểu', 'giờ')}
                    {field(g, 'hourly_step_vnd', 'Cộng lương giờ', 'đ/giờ')}
                    {field(g, 'ft_monthly_vs_g1_vnd', 'Full-time cộng so với G1', 'đ/tháng')}
                  </div>
                  <details className="group mt-3">
                    <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-[#2F6FA8]">
                      <span className="transition group-open:rotate-90">›</span> Mức kỹ năng cần đạt
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {LEVEL_COLUMNS.map((c) => (
                        <label key={c.key} className="block">
                          <span className="text-xs text-gray-500">{c.label}</span>
                          <select className={`${inputClass} mt-1`} disabled={readOnly} value={g.requirement[c.key] ?? ''} onChange={(e) => setLevel(g.code, c.key, e.target.value)}>
                            <option value="">Không xét</option>
                            {[0, 1, 2, 3].map((lv) => <option key={lv} value={lv}>Mức {lv}</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                    <label className="mt-2 flex items-center gap-2 text-sm text-[#001D3D]">
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={g.requirement.common_required}
                        onChange={(e) => updateGrade(g.code, (x) => ({ ...x, requirement: { ...x.requirement, common_required: e.target.checked } }))}
                      />
                      Bắt buộc đạt SOP / ATTP
                    </label>
                  </details>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">Mức kỹ năng: 0 chưa biết · 1 làm được khi có người kèm · 2 tự làm được · 3 thành thạo, kèm được người khác.</p>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Cách tính tiền cộng</h2>
        <p className="mt-1 text-sm text-gray-500">Nhân viên Full-time được cộng theo cách nào?</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {([
            ['fixed_monthly', 'Cố định mỗi tháng', 'Dùng ô “Full-time cộng so với G1”.'],
            ['hourly_x_hours', 'Theo giờ làm thực tế', 'Cộng lương giờ × số giờ làm, giống Part-time.'],
          ] as [FullTimePayMethod, string, string][]).map(([value, title, hint]) => (
            <label
              key={value}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${settings.ft_pay_method === value ? 'border-[#2F6FA8] bg-[#2F6FA8]/5' : 'border-gray-200'}`}
            >
              <input type="radio" name="ft_pay_method" checked={settings.ft_pay_method === value} disabled={readOnly} onChange={() => setPayMethod(value)} className="mt-1" />
              <span>
                <span className="block text-sm font-semibold text-[#001D3D]">{title}</span>
                <span className="block text-xs text-gray-500">{hint}</span>
              </span>
            </label>
          ))}
        </div>

        <label className={`mt-3 flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${settings.payroll_link_enabled ? 'border-emerald-300 bg-emerald-50/60' : 'border-gray-200'}`}>
          <input
            type="checkbox"
            className="mt-1"
            checked={settings.payroll_link_enabled}
            disabled={readOnly}
            onChange={(e) => onChange({ ...settings, payroll_link_enabled: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-semibold text-[#001D3D]">Đưa tiền cộng theo bậc vào bảng lương</span>
            <span className="block text-xs text-gray-500">Chỉ áp dụng cho kỳ lương chưa khóa. Hệ thống không bao giờ tự hạ lương hay hạ bậc.</span>
          </span>
        </label>
      </section>
    </div>
  )
}
