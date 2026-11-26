'use client'

import { CAREER_GRADE_CODES, type CareerApprovalConfig, type CareerGradeCode, type CareerPathSettings } from '@/lib/career-path/settings'
import { ROLE_LABEL, cardClass, inputClass } from './career-ui'

interface Props {
  settings: CareerPathSettings
  readOnly: boolean
  onChange: (next: CareerPathSettings) => void
}

const ASSESSOR_CHOICES = ['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo']
const APPROVER_CHOICES = ['store_manager', 'area_manager', 'hr_admin', 'ceo']

type NumKey = 'review_rounds_per_month' | 'respond_within_working_days' | 'assess_within_working_days' | 'notify_within_working_days'
const NUM_FIELDS: { key: NumKey; label: string }[] = [
  { key: 'review_rounds_per_month', label: 'Số đợt xét bậc mỗi tháng' },
  { key: 'respond_within_working_days', label: 'Phản hồi đề xuất trong (ngày làm việc)' },
  { key: 'assess_within_working_days', label: 'Đánh giá xong trong (ngày làm việc)' },
  { key: 'notify_within_working_days', label: 'Báo kết quả trong (ngày làm việc)' },
]

export default function CareerApprovalPanel({ settings, readOnly, onChange }: Props) {
  const a = settings.approval
  const setApproval = (patch: Partial<CareerApprovalConfig>) => onChange({ ...settings, approval: { ...a, ...patch } })
  const toggleRole = (key: 'assessor_roles' | 'approver_roles', role: string) => {
    const list = a[key]
    setApproval({ [key]: list.includes(role) ? list.filter((r) => r !== role) : [...list, role] })
  }

  const roleChips = (key: 'assessor_roles' | 'approver_roles', choices: string[]) => (
    <div className="mt-2 flex flex-wrap gap-2">
      {choices.map((role) => {
        const on = a[key].includes(role)
        return (
          <button
            key={role}
            type="button"
            disabled={readOnly}
            onClick={() => toggleRole(key, role)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? 'border-[#2F6FA8] bg-[#2F6FA8] text-white' : 'border-gray-200 bg-white text-gray-600'} disabled:opacity-60`}
          >
            {ROLE_LABEL[role] || role}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Ai đánh giá, ai duyệt</h2>
        <div className="mt-3 space-y-4">
          <div>
            <div className="text-sm font-semibold text-[#001D3D]">Người được chấm kỹ năng</div>
            {roleChips('assessor_roles', ASSESSOR_CHOICES)}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#001D3D]">Người được duyệt nâng bậc</div>
            {roleChips('approver_roles', APPROVER_CHOICES)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-[#001D3D]">Quản lý cửa hàng được tự duyệt tới bậc</span>
              <select
                className={`${inputClass} mt-1`}
                disabled={readOnly}
                value={a.store_manager_can_approve_up_to ?? ''}
                onChange={(e) => setApproval({ store_manager_can_approve_up_to: (e.target.value || null) as CareerGradeCode | null })}
              >
                <option value="">Không được tự duyệt</option>
                {CAREER_GRADE_CODES.filter((c) => c !== 'T0').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex items-start gap-2 rounded-xl border border-gray-200 p-3">
              <input type="checkbox" className="mt-1" disabled={readOnly} checked={a.require_different_approver} onChange={(e) => setApproval({ require_different_approver: e.target.checked })} />
              <span>
                <span className="block text-sm font-semibold text-[#001D3D]">Người duyệt phải khác người đánh giá</span>
                <span className="block text-xs text-gray-500">Không cho một người vừa chấm vừa tự duyệt (theo Playbook).</span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Nhịp xét bậc</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {NUM_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm text-gray-600">{f.label}</span>
              <input
                type="number"
                min={0}
                className={`${inputClass} mt-1`}
                disabled={readOnly}
                placeholder="Để trống = không áp dụng"
                value={a[f.key] || ''}
                onChange={(e) => setApproval({ [f.key]: Math.max(0, Math.round(Number(e.target.value) || 0)) } as Partial<CareerApprovalConfig>)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-bold text-[#001D3D]">Chức danh Trưởng ca (M1)</h2>
        <p className="mt-1 text-sm text-gray-500">M1 là bổ nhiệm riêng, không phải bậc. Bậc G4 không tự có quyền quản lý người khác.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={readOnly} checked={settings.m1.enabled} onChange={(e) => onChange({ ...settings, m1: { ...settings.m1, enabled: e.target.checked } })} />
            Đang dùng M1
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={readOnly} checked={settings.m1.full_time_only} onChange={(e) => onChange({ ...settings, m1: { ...settings.m1, full_time_only: e.target.checked } })} />
            Chỉ nhân viên Full-time
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Bậc tối thiểu</span>
            <select
              className={`${inputClass} mt-1`}
              disabled={readOnly}
              value={settings.m1.min_grade}
              onChange={(e) => onChange({ ...settings, m1: { ...settings.m1, min_grade: e.target.value as CareerGradeCode } })}
            >
              {CAREER_GRADE_CODES.filter((c) => c !== 'T0').map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
      </section>
    </div>
  )
}
