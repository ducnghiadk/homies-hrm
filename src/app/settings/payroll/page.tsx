'use client'

import { useState, type ReactNode } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useSettingPermissions } from '@/hooks/usePermissions'
import { settingsPayroll, settingsSystem } from '@/lib/mock-data-settings'
import {
  comparePayrollPolicies,
  getActivePayrollPolicy,
  getStoredPayrollPolicy,
  getStoredPayrollPolicyHistory,
  MIN_REGION_1_SALARY,
  recordPayrollPolicyChange,
  rollbackPayrollPolicy,
  type PayrollPolicy,
  type PayrollPolicyStatus,
  type PayrollSalaryGrade,
} from '@/lib/services/payroll-policy-service'
import { AlertTriangle, BadgeCheck, Banknote, Calculator, Clock3, FileClock, Landmark, LockKeyhole, ShieldCheck, SlidersHorizontal, Store, Utensils } from 'lucide-react'

const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`
const percent = (value: number) => `${Math.round(value * 1000) / 10}%`

type TabKey = 'grades' | 'allowances' | 'fnb' | 'insurance' | 'preview' | 'history'
type SalaryGrade = PayrollSalaryGrade

const tabs: { key: TabKey; label: string; note: string }[] = [
  { key: 'grades', label: 'Bậc lương', note: 'Khung lương theo vị trí' },
  { key: 'allowances', label: 'Phụ cấp & OT', note: 'Khoản cộng và tăng ca' },
  { key: 'fnb', label: 'F&B Việt Nam', note: 'Cơm ca, tip, ca đóng/mở' },
  { key: 'insurance', label: 'BH & Thuế', note: 'Bảo hiểm, thuế, thử việc' },
  { key: 'preview', label: 'Xem trước', note: 'Test gross/net trước khi áp dụng' },
  { key: 'history', label: 'Lịch sử', note: 'Phiên bản và duyệt thay đổi' },
]

const previewProfile = {
  position: 'Pha chế',
  baseSalary: 5500000,
  workDays: 26,
  otHours: 8,
  allowance: 650000,
  kpi: 500000,
  dependents: 0,
}

export default function SettingsPayrollPage() {
  const { canManagePayroll, isCEO, role } = useSettingPermissions()
  const [activeTab, setActiveTab] = useState<TabKey>('grades')
  const [policy, setPolicy] = useState<PayrollPolicy>(() => getStoredPayrollPolicy())
  const [history, setHistory] = useState(() => getStoredPayrollPolicyHistory())
  const [savedNotice, setSavedNotice] = useState('')
  const canEdit = canManagePayroll

  const savePolicy = (nextPolicy: PayrollPolicy, notice: string) => {
    const nextHistory = recordPayrollPolicyChange(nextPolicy, notice)
    setPolicy(nextPolicy)
    setHistory(nextHistory)
    setSavedNotice(notice)
  }

  const updateVersion = (version: string) => {
    if (!canEdit) return
    setPolicy((current) => ({
      ...current,
      version,
      status: current.status === 'active' ? 'draft' : current.status,
    }))
  }

  const updateGrade = (gradeId: string, field: keyof Pick<SalaryGrade, 'base_salary' | 'minSalary' | 'maxSalary' | 'kpiPool'>, value: number) => {
    if (!canEdit) return
    setPolicy((current) => ({
      ...current,
      status: current.status === 'active' ? 'draft' : current.status,
      grades: current.grades.map((grade) => {
        if (grade.id !== gradeId) return grade
        const next = { ...grade, [field]: value }
        return {
          ...next,
          probation: Math.round(next.base_salary * current.rates.probation),
          status: next.base_salary >= MIN_REGION_1_SALARY ? 'Đạt sàn vùng I' : 'Cần kiểm tra',
        }
      }),
    }))
  }

  const updateAllowance = (name: string, value: number) => {
    if (!canEdit) return
    setPolicy((current) => ({
      ...current,
      status: current.status === 'active' ? 'draft' : current.status,
      allowances: current.allowances.map((allowance) => allowance.name === name ? { ...allowance, amount: value } : allowance),
    }))
  }

  const updateRate = (field: keyof PayrollPolicy['rates'], value: number) => {
    if (!canEdit) return
    setPolicy((current) => ({
      ...current,
      status: current.status === 'active' ? 'draft' : current.status,
      rates: { ...current.rates, [field]: value },
      grades: current.grades.map((grade) => ({
        ...grade,
        probation: Math.round(grade.base_salary * (field === 'probation' ? value : current.rates.probation)),
      })),
    }))
  }

  const updateFnb = (field: keyof PayrollPolicy['fnb'], value: number | boolean) => {
    if (!canEdit) return
    setPolicy((current) => ({
      ...current,
      status: current.status === 'active' ? 'draft' : current.status,
      fnb: { ...current.fnb, [field]: value },
    }))
  }

  const handleRollback = (version: string) => {
    if (!isCEO) return
    const rollbackPolicy = rollbackPayrollPolicy(version, 'CEO')
    if (!rollbackPolicy) return
    setPolicy(rollbackPolicy)
    setHistory(getStoredPayrollPolicyHistory())
    setSavedNotice(`Đã khôi phục cấu hình từ ${version}.`)
  }

  const handleSaveDraft = () => {
    savePolicy({
      ...policy,
      status: 'draft',
      updatedBy: role === 'ceo' ? 'CEO' : 'HR Admin',
      updatedAt: new Date().toLocaleString('vi-VN'),
    }, 'Đã lưu nháp cấu hình lương trên máy này.')
  }

  const handleSendApproval = () => {
    savePolicy({
      ...policy,
      status: 'pending_ceo',
      updatedBy: 'HR Admin',
      updatedAt: new Date().toLocaleString('vi-VN'),
    }, 'Đã gửi cấu hình lương sang trạng thái chờ CEO duyệt.')
  }

  const handleApprove = () => {
    savePolicy({
      ...policy,
      status: 'active',
      updatedBy: 'CEO',
      updatedAt: new Date().toLocaleString('vi-VN'),
    }, 'CEO đã áp dụng phiên bản lương mới.')
  }

  const insuranceBase = Math.min(previewProfile.baseSalary, 29800000)
  const insurance = Math.round(insuranceBase * (
    policy.rates.bhxhEmployee +
    policy.rates.bhytEmployee +
    policy.rates.bhtnEmployee
  ))
  const otAmount = Math.round((previewProfile.baseSalary / settingsPayroll.standard_work_days.days_per_month / settingsPayroll.standard_work_days.hours_per_day) * previewProfile.otHours * policy.rates.otWeekday)
  const fnbPreview = policy.fnb.mealAllowancePerShift * previewProfile.workDays + policy.fnb.closingShiftAllowance * 4 + policy.fnb.peakHourBonus * 6
  const gross = previewProfile.baseSalary + previewProfile.allowance + previewProfile.kpi + otAmount + fnbPreview
  const taxable = Math.max(0, gross - insurance - 11000000 - previewProfile.dependents * 4400000)
  const pit = taxable <= 0 ? 0 : Math.round(taxable * policy.rates.taxBracket1)
  const net = gross - insurance - pit
  const overtimeRules = [
    { name: 'Ngày thường', rate: policy.rates.otWeekday, field: 'otWeekday' as const, note: 'Theo giờ công thực tế sau ca' },
    { name: 'Ban đêm', rate: policy.rates.otNight, field: 'otNight' as const, note: 'Cộng thêm khi làm sau khung đêm' },
    { name: 'Ngày lễ', rate: policy.rates.otHoliday, field: 'otHoliday' as const, note: 'Áp dụng khi được duyệt lịch lễ' },
  ]
  const statusLabel: Record<PayrollPolicyStatus, string> = {
    active: 'Đang áp dụng',
    draft: 'Bản nháp',
    pending_ceo: 'Chờ CEO duyệt',
  }
  const activePolicy = getActivePayrollPolicy()
  const policyDiffs = comparePayrollPolicies(activePolicy, policy)

  return (
    <AppShell title="Cấu hình lương">
      <div className="mx-auto w-full max-w-[1480px] space-y-5 pb-8">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f8f4e8] shadow-sm">
          <div className="grid gap-6 p-5 lg:grid-cols-[1.4fr_0.9fr] lg:p-7">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#113b32] px-3 py-1 text-xs font-bold text-[#f8d36b]">
                <ShieldCheck size={14} /> Phiên bản luật lương: {policy.version} · {statusLabel[policy.status]}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#17362f] md:text-4xl">Bảng cấu hình lương Homies</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#57635d]">
                Trang này gom các loại lương, phụ cấp, tăng ca, bảo hiểm và thuế vào một nơi để HR cấu hình trước khi chạy bảng lương thật. Các mốc luật được lưu theo phiên bản để CEO duyệt và truy vết.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <SummaryCard icon={<Banknote size={18} />} label="Ngân sách tháng" value={money(settingsPayroll.payroll_budget.monthly_budget)} tone="bg-white" />
                <SummaryCard icon={<Clock3 size={18} />} label="Khóa sau ngày" value={`Ngày ${settingsPayroll.payroll_budget.auto_lock_day}`} tone="bg-[#fff7d7]" />
                <SummaryCard icon={<LockKeyhole size={18} />} label="Quyền xem/sửa" value="CEO · HR · Payroll" tone="bg-[#e8f3ee]" />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <div className="min-w-[220px] rounded-full border border-white bg-white px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Mã phiên bản</div>
                  <TextInput value={policy.version} disabled={!canEdit} onChange={updateVersion} />
                </div>
                <button type="button" disabled={!canEdit} onClick={handleSaveDraft} className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#17362f] shadow-sm disabled:cursor-not-allowed disabled:opacity-50">Lưu nháp</button>
                <button type="button" disabled={!canEdit || policy.status === 'pending_ceo'} onClick={handleSendApproval} className="rounded-full bg-[#f8d36b] px-4 py-2 text-xs font-black text-[#17362f] shadow-sm disabled:cursor-not-allowed disabled:opacity-50">Gửi CEO duyệt</button>
                <button type="button" disabled={!isCEO || policy.status !== 'pending_ceo'} onClick={handleApprove} className="rounded-full bg-[#17362f] px-4 py-2 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">CEO áp dụng</button>
                <span className="text-xs font-bold text-[#57635d]">{canEdit ? `Cập nhật bởi ${policy.updatedBy} · ${policy.updatedAt}` : 'Bạn chỉ có quyền xem cấu hình lương'}</span>
              </div>
              {savedNotice && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">{savedNotice}</p>}
            </div>
            <div className="rounded-3xl bg-[#17362f] p-5 text-white shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f8d36b]">Salary health</p>
              <div className="mt-5 space-y-4">
                <HealthRow label="Sàn lương vùng I" value="Đã kiểm tra" good />
                <HealthRow label="Lương thử việc tối thiểu" value={percent(policy.rates.probation)} good />
                <HealthRow label="BH bắt buộc nhân viên" value={percent(policy.rates.bhxhEmployee + policy.rates.bhytEmployee + policy.rates.bhtnEmployee)} good />
                <HealthRow label="Trạng thái duyệt" value={statusLabel[policy.status]} />
                <HealthRow label="F&B pack" value={`${money(policy.fnb.mealAllowancePerShift)}/ca`} good />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm xl:sticky xl:top-4 xl:self-start">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`mb-1 w-full rounded-2xl px-4 py-3 text-left transition ${activeTab === tab.key ? 'bg-[#17362f] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="block text-sm font-extrabold">{tab.label}</span>
                <span className={`mt-1 block text-xs ${activeTab === tab.key ? 'text-[#f8d36b]' : 'text-slate-400'}`}>{tab.note}</span>
              </button>
            ))}
          </aside>

          <main className="min-w-0 space-y-5">
            {activeTab === 'grades' && (
              <Panel title="Bậc lương theo vị trí" icon={<SlidersHorizontal size={18} />} action="Áp dụng cho kỳ lương tiếp theo">
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <tr className="border-b border-slate-100">
                        <th className="py-3">Vị trí</th><th>Nhóm</th><th>Bậc</th><th>Lương chuẩn</th><th>Min - Max</th><th>Thử việc</th><th>KPI tối đa</th><th>Kiểm tra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {policy.grades.map((grade) => (
                        <tr key={grade.id} className="text-slate-700">
                          <td className="py-4 font-bold text-slate-900">{grade.name}</td>
                          <td>{grade.band}</td>
                          <td>Level {grade.level}</td>
                          <td className="font-bold text-[#0f766e]">
                            <NumberInput value={grade.base_salary} disabled={!canEdit} onChange={(value) => updateGrade(grade.id, 'base_salary', value)} />
                          </td>
                          <td className="min-w-[220px]">
                            <div className="flex items-center gap-2">
                              <NumberInput value={grade.minSalary} disabled={!canEdit} onChange={(value) => updateGrade(grade.id, 'minSalary', value)} />
                              <span className="text-slate-300">-</span>
                              <NumberInput value={grade.maxSalary} disabled={!canEdit} onChange={(value) => updateGrade(grade.id, 'maxSalary', value)} />
                            </div>
                          </td>
                          <td>{money(grade.probation)}</td>
                          <td><NumberInput value={grade.kpiPool} disabled={!canEdit} onChange={(value) => updateGrade(grade.id, 'kpiPool', value)} /></td>
                          <td><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{grade.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {activeTab === 'allowances' && (
              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <Panel title="Loại phụ cấp" icon={<BadgeCheck size={18} />} action="Có gắn thuế/BH">
                  <div className="space-y-3">
                    {policy.allowances.map((rule) => (
                      <div key={rule.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="font-extrabold text-slate-900">{rule.name}</p><p className="mt-1 text-xs text-slate-500">{rule.appliesTo}</p></div>
                          <NumberInput value={rule.amount} disabled={!canEdit} onChange={(value) => updateAllowance(rule.name, value)} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-2.5 py-1 font-bold text-slate-600">{rule.type}</span><span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700">{rule.taxable}</span></div>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Quy tắc OT" icon={<Calculator size={18} />} action="Theo giờ được duyệt">
                  <div className="space-y-3">
                    {overtimeRules.map((rule) => (
                      <div key={rule.name} className="rounded-2xl bg-[#17362f] p-4 text-white">
                        <div className="flex justify-between"><span className="font-bold">{rule.name}</span><span className="text-xl font-black text-[#f8d36b]">x{rule.rate}</span></div>
                        <div className="mt-3">
                          <DecimalInput value={rule.rate} disabled={!canEdit} onChange={(value) => updateRate(rule.field, value)} />
                        </div>
                        <p className="mt-2 text-xs text-slate-200">{rule.note}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {activeTab === 'fnb' && (
              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <Panel title="Quy tắc F&B Việt Nam" icon={<Utensils size={18} />} action="Tối ưu cho cửa hàng phục vụ nhanh">
                  <div className="grid gap-4 md:grid-cols-2">
                    <RuleCard label="Cơm ca / shift" value={money(policy.fnb.mealAllowancePerShift)} note="Tự cộng theo ngày công trong payroll engine">
                      <NumberInput value={policy.fnb.mealAllowancePerShift} disabled={!canEdit} onChange={(value) => updateFnb('mealAllowancePerShift', value)} />
                    </RuleCard>
                    <RuleCard label="Ca mở cửa" value={money(policy.fnb.openingShiftAllowance)} note="Áp dụng cho ca mở sớm / chuẩn bị quầy">
                      <NumberInput value={policy.fnb.openingShiftAllowance} disabled={!canEdit} onChange={(value) => updateFnb('openingShiftAllowance', value)} />
                    </RuleCard>
                    <RuleCard label="Ca đóng cửa" value={money(policy.fnb.closingShiftAllowance)} note="Dành cho ca dọn chốt và kiểm tiền">
                      <NumberInput value={policy.fnb.closingShiftAllowance} disabled={!canEdit} onChange={(value) => updateFnb('closingShiftAllowance', value)} />
                    </RuleCard>
                    <RuleCard label="Ca gãy" value={money(policy.fnb.splitShiftAllowance)} note="Hỗ trợ ca tách buổi trưa / chiều">
                      <NumberInput value={policy.fnb.splitShiftAllowance} disabled={!canEdit} onChange={(value) => updateFnb('splitShiftAllowance', value)} />
                    </RuleCard>
                    <RuleCard label="Ca đêm" value={money(policy.fnb.nightShiftAllowance)} note="Bổ sung cho khung muộn / chốt store">
                      <NumberInput value={policy.fnb.nightShiftAllowance} disabled={!canEdit} onChange={(value) => updateFnb('nightShiftAllowance', value)} />
                    </RuleCard>
                    <RuleCard label="Ca huấn luyện" value={money(policy.fnb.trainingShiftAllowance)} note="Dành cho ca train nhân viên mới">
                      <NumberInput value={policy.fnb.trainingShiftAllowance} disabled={!canEdit} onChange={(value) => updateFnb('trainingShiftAllowance', value)} />
                    </RuleCard>
                  </div>
                </Panel>
                <Panel title="Tip, service charge và kiểm soát tiền" icon={<Store size={18} />} action="Ngành F&B cần khóa rủi ro rõ ràng">
                  <div className="space-y-3">
                    <RuleCard label="Service charge pool" value={percent(policy.fnb.serviceChargePoolRate)} note="Tỷ lệ chia quỹ phục vụ từ store / doanh thu">
                      <DecimalInput value={policy.fnb.serviceChargePoolRate} disabled={!canEdit} onChange={(value) => updateFnb('serviceChargePoolRate', value)} />
                    </RuleCard>
                    <RuleCard label="Tip pool team" value={percent(policy.fnb.tipPoolRate)} note="Tỷ lệ phân tip cho team tuyến đầu">
                      <DecimalInput value={policy.fnb.tipPoolRate} disabled={!canEdit} onChange={(value) => updateFnb('tipPoolRate', value)} />
                    </RuleCard>
                    <RuleCard label="Lễ / giờ cao điểm" value={money(policy.fnb.peakHourBonus)} note="Bonus theo khung trưa, tối, cuối tuần">
                      <NumberInput value={policy.fnb.peakHourBonus} disabled={!canEdit} onChange={(value) => updateFnb('peakHourBonus', value)} />
                    </RuleCard>
                    <RuleCard label="Lễ cao điểm" value={percent(policy.fnb.holidayPeakBonusRate)} note="Hệ số cộng thêm cho ngày lễ / Tết">
                      <DecimalInput value={policy.fnb.holidayPeakBonusRate} disabled={!canEdit} onChange={(value) => updateFnb('holidayPeakBonusRate', value)} />
                    </RuleCard>
                    <RuleCard label="Trần khấu trừ lệch tiền" value={money(policy.fnb.cashShortageAutoDeductionLimit)} note="Quá trần thì bắt buộc duyệt của quản lý">
                      <NumberInput value={policy.fnb.cashShortageAutoDeductionLimit} disabled={!canEdit} onChange={(value) => updateFnb('cashShortageAutoDeductionLimit', value)} />
                    </RuleCard>
                    <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                      <SwitchRow label="Cần duyệt lệch tiền" checked={policy.fnb.requireCashShortageApproval} onChange={(checked) => updateFnb('requireCashShortageApproval', checked)} disabled={!canEdit} />
                      <SwitchRow label="Cần duyệt hủy/hỏng" checked={policy.fnb.requireInventoryBreakageApproval} onChange={(checked) => updateFnb('requireInventoryBreakageApproval', checked)} disabled={!canEdit} />
                    </div>
                  </div>
                </Panel>
              </div>
            )}

            {activeTab === 'insurance' && (
              <Panel title="Bảo hiểm, thuế và thử việc" icon={<Landmark size={18} />} action="Lưu theo phiên bản luật">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <RuleCard label="BHXH nhân viên" value={percent(policy.rates.bhxhEmployee)} note="Khấu trừ từ lương đóng BH">
                    <DecimalInput value={policy.rates.bhxhEmployee} disabled={!canEdit} onChange={(value) => updateRate('bhxhEmployee', value)} />
                  </RuleCard>
                  <RuleCard label="BHYT nhân viên" value={percent(policy.rates.bhytEmployee)} note="Khấu trừ từ lương đóng BH">
                    <DecimalInput value={policy.rates.bhytEmployee} disabled={!canEdit} onChange={(value) => updateRate('bhytEmployee', value)} />
                  </RuleCard>
                  <RuleCard label="BHTN nhân viên" value={percent(policy.rates.bhtnEmployee)} note="Khấu trừ từ lương đóng BH">
                    <DecimalInput value={policy.rates.bhtnEmployee} disabled={!canEdit} onChange={(value) => updateRate('bhtnEmployee', value)} />
                  </RuleCard>
                  <RuleCard label="BH công ty dự kiến" value={percent(settingsPayroll.salary_coefficients.bhxh_company + settingsPayroll.salary_coefficients.bhyt_company + settingsPayroll.salary_coefficients.bhtn_company)} note="Dùng để xem tổng chi phí nhân sự" />
                  <RuleCard label="Lương thử việc" value={percent(policy.rates.probation)} note="Không cho thấp hơn ngưỡng hệ thống">
                    <DecimalInput value={policy.rates.probation} disabled={!canEdit} onChange={(value) => updateRate('probation', value)} />
                  </RuleCard>
                  <RuleCard label="Thuế PIT bậc đầu" value={percent(policy.rates.taxBracket1)} note="Demo bậc đầu, backend thật sẽ dùng biểu lũy tiến">
                    <DecimalInput value={policy.rates.taxBracket1} disabled={!canEdit} onChange={(value) => updateRate('taxBracket1', value)} />
                  </RuleCard>
                </div>
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertTriangle className="mr-2 inline" size={16} /> Các chỉ số luật đang để dạng cấu hình phiên bản. Khi chạy thật cần khóa bằng dữ liệu pháp lý đã được kế toán/HR xác nhận.</div>
              </Panel>
            )}

            {activeTab === 'preview' && (
              <Panel title="Xem trước phiếu lương" icon={<Calculator size={18} />} action="Không ghi vào bảng lương thật">
                <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">Nhân viên mẫu</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">{previewProfile.position} · Homies Q.1</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <PreviewItem label="Lương cơ bản" value={money(previewProfile.baseSalary)} />
                      <PreviewItem label="Công chuẩn" value={`${previewProfile.workDays} ngày`} />
                      <PreviewItem label="OT đã duyệt" value={`${previewProfile.otHours} giờ · ${money(otAmount)}`} />
                      <PreviewItem label="Phụ cấp + KPI" value={money(previewProfile.allowance + previewProfile.kpi)} />
                      <PreviewItem label="F&B extras" value={money(fnbPreview)} />
                      <PreviewItem label="BH nhân viên" value={`-${money(insurance)}`} />
                      <PreviewItem label="Thuế PIT tạm tính" value={`-${money(pit)}`} />
                    </div>
                  </div>
                  <div className="rounded-3xl bg-[#113b32] p-5 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f8d36b]">Net salary preview</p>
                    <p className="mt-4 text-sm text-slate-200">Gross salary</p><p className="text-2xl font-black">{money(gross)}</p>
                    <div className="my-5 h-px bg-white/15" />
                    <p className="text-sm text-slate-200">Thực nhận dự kiến</p><p className="text-4xl font-black text-[#f8d36b]">{money(net)}</p>
                    <p className="mt-4 text-xs leading-5 text-slate-300">Kết quả này giúp HR test trước khi chốt kỳ lương. Khi nối backend, phần này sẽ chọn nhân viên/tháng/cửa hàng thật.</p>
                  </div>
                </div>
              </Panel>
            )}

            {activeTab === 'history' && (
              <Panel title="Phiên bản và lịch sử duyệt" icon={<FileClock size={18} />} action={`Ngày trả lương: ${settingsSystem.payroll_general.pay_day} hàng tháng`}>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm font-black text-amber-900">So sánh bản đang sửa với bản active</p>
                    <p className="mt-1 text-xs text-amber-800">Có {policyDiffs.length} thay đổi ảnh hưởng đến lương, F&B hoặc tỷ lệ tính. CEO nên xem mục này trước khi áp dụng.</p>
                    <DiffList diffs={policyDiffs} />
                  </div>
                  {history.map((log) => (
                    <div key={log.id} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:grid-cols-[140px_1fr_150px_110px]">
                      <div><p className="text-xs text-slate-400">Version</p><p className="font-black text-[#17362f]">{log.version}</p></div>
                      <div><p className="font-bold text-slate-900">{log.note}</p><p className="mt-1 text-xs text-slate-500">{log.updatedBy} · {log.updatedAt}</p></div>
                      <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-bold text-slate-600">{statusLabel[log.status]}</span>
                      <button type="button" disabled={!isCEO} onClick={() => handleRollback(log.version)} className="self-start rounded-full bg-[#17362f] px-3 py-1 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Khôi phục</button>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  )
}

function SummaryCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return <div className={`rounded-2xl border border-black/5 ${tone} p-4`}><div className="mb-3 text-[#17362f]">{icon}</div><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-[#17362f]">{value}</p></div>
}

function HealthRow({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-200">{label}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${good ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-300/15 text-amber-200'}`}>{value}</span></div>
}

function Panel({ title, icon, action, children }: { title: string; icon: ReactNode; action: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-2xl bg-[#e8f3ee] p-2 text-[#17362f]">{icon}</div><h2 className="text-lg font-black text-slate-900">{title}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{action}</span></div>{children}</section>
}

function RuleCard({ label, value, note, children }: { label: string; value: string; note: string; children?: ReactNode }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-[#17362f]">{value}</p>{children && <div className="mt-3">{children}</div>}<p className="mt-2 text-xs leading-5 text-slate-500">{note}</p></div>
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-extrabold text-slate-800">{value}</p></div>
}

function NumberInput({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value || 0))}
      className="w-full min-w-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-[#17362f] disabled:bg-slate-100 disabled:text-slate-500"
    />
  )
}

function DecimalInput({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step={0.005}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value || 0))}
      className="w-full rounded-xl border border-white/30 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-[#f8d36b] disabled:bg-slate-100 disabled:text-slate-500"
    />
  )
}

function TextInput({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-[#17362f] disabled:bg-slate-100 disabled:text-slate-500"
    />
  )
}

function SwitchRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm font-bold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${checked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{checked ? 'Bật' : 'Tắt'}</span>
    </button>
  )
}

function DiffList({ diffs }: { diffs: { group: string; label: string; before: string; after: string; trend: 'up' | 'down' | 'neutral' }[] }) {
  if (!diffs.length) {
    return <p className="mt-3 text-xs text-emerald-700">Không có khác biệt giữa bản đang sửa và bản active.</p>
  }

  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2">
      {diffs.slice(0, 8).map((diff) => (
        <div key={`${diff.group}-${diff.label}`} className="rounded-xl bg-white px-3 py-2 text-xs">
          <div className="font-black text-slate-800">{diff.group}: {diff.label}</div>
          <div className="mt-1 text-slate-500">{diff.before} → {diff.after}</div>
        </div>
      ))}
    </div>
  )
}
