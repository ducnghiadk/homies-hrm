'use client'

import type { CareerGradeConfig, CareerPathSettings, FullTimePayMethod } from '@/lib/career-path/settings'
import { GRADE_BADGE, cardClass, formatVnd, inputClass } from './career-ui'

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

  return (
    <div className="space-y-4">
      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Bậc, mốc tối thiểu và mức cộng lương</h2>
        <p className="mt-1 text-sm text-gray-500">
          Số tháng và số giờ tính từ ngày vào làm, áp dụng như nhau cho Part-time và Full-time. Mức cộng lương chỉ là cài đặt,
          chưa tự động đưa vào bảng lương ở bước này.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-3">Bậc</th>
                <th className="py-2 pr-3">Tháng tối thiểu</th>
                <th className="py-2 pr-3">Giờ tối thiểu</th>
                <th className="py-2 pr-3">Cộng lương giờ (đ/giờ)</th>
                <th className="py-2 pr-3">Full-time cộng/tháng so với G1 (đ)</th>
              </tr>
            </thead>
            <tbody>
              {settings.grades.map((g) => (
                <tr key={g.code} className="border-b border-gray-50 align-top">
                  <td className="py-2.5 pr-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${GRADE_BADGE[g.code]}`}>{g.code}</span>
                    <div className="mt-1 font-semibold text-[#001D3D]">{g.label}</div>
                    <div className="max-w-[220px] text-xs text-gray-500">{g.description}</div>
                  </td>
                  {(['min_months', 'min_hours', 'hourly_step_vnd', 'ft_monthly_vs_g1_vnd'] as NumField[]).map((key) => (
                    <td key={key} className="py-2.5 pr-3">
                      <input
                        type="number"
                        min={0}
                        className={inputClass}
                        value={g[key]}
                        disabled={readOnly || g.code === 'T0'}
                        onChange={(e) => setNum(g.code, key, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Cách cộng lương cho nhân viên Full-time</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {([
            ['fixed_monthly', 'Cộng cố định mỗi tháng', 'Dùng cột “Full-time cộng/tháng so với G1”. Lương không đổi theo số giờ làm trong tháng.'],
            ['hourly_x_hours', 'Cộng theo giờ × số giờ làm', 'Dùng cột “Cộng lương giờ” nhân với số giờ thực tế trong tháng, giống Part-time.'],
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
        <p className="mt-3 text-xs text-gray-500">
          Ví dụ G4 so với G1: cộng {formatVnd(settings.grades.find((g) => g.code === 'G4')?.ft_monthly_vs_g1_vnd || 0)}/tháng theo cách cố định.
          Hệ thống không bao giờ tự hạ lương hay hạ bậc.
        </p>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Mức kỹ năng tối thiểu để lên bậc</h2>
        <p className="mt-1 text-sm text-gray-500">Mức 0 = chưa biết, 1 = làm được khi có người kèm, 2 = tự làm được, 3 = thành thạo / kèm người khác. Để trống = không xét.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-3">Bậc</th>
                {LEVEL_COLUMNS.map((c) => <th key={c.key} className="py-2 pr-3">{c.label}</th>)}
                <th className="py-2 pr-3">Đạt SOP / ATTP</th>
              </tr>
            </thead>
            <tbody>
              {settings.grades.filter((g) => g.code !== 'T0').map((g) => (
                <tr key={g.code} className="border-b border-gray-50">
                  <td className="py-2 pr-3 font-bold text-[#001D3D]">{g.code}</td>
                  {LEVEL_COLUMNS.map((c) => (
                    <td key={c.key} className="py-2 pr-3">
                      <select className={inputClass} disabled={readOnly} value={g.requirement[c.key] ?? ''} onChange={(e) => setLevel(g.code, c.key, e.target.value)}>
                        <option value="">Không xét</option>
                        {[0, 1, 2, 3].map((lv) => <option key={lv} value={lv}>Mức {lv}</option>)}
                      </select>
                    </td>
                  ))}
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={g.requirement.common_required}
                      onChange={(e) => updateGrade(g.code, (x) => ({ ...x, requirement: { ...x.requirement, common_required: e.target.checked } }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
