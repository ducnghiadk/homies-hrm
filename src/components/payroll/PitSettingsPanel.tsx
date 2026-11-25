'use client'

import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { DEFAULT_PIT_SETTINGS, normalizePitBrackets, type PitBracket } from '@/lib/payroll/pit'
import type { PayrollPolicy } from '@/lib/services/payroll/payroll-policy-service'

type Legal = PayrollPolicy['legal']

/** Mức giảm trừ cũ (trước Nghị quyết 110/2025) — nếu còn lưu thì nhắc kế toán kiểm tra lại. */
const OLD_PERSONAL_DEDUCTION = 11_000_000
const OLD_DEPENDENT_DEDUCTION = 4_400_000

function toMoney(text: string): number {
  return parseInt(text.replace(/\D/g, ''), 10) || 0
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function MoneyField({
  label,
  value,
  disabled,
  onChange,
  hint,
}: {
  label: string
  value: number
  disabled?: boolean
  onChange: (value: number) => void
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-1.5">
      <label className="text-[11px] font-bold text-gray-700 block">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={formatMoney(value)}
          onChange={e => onChange(toMoney(e.target.value))}
          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-[#001D3D] disabled:bg-gray-100"
        />
        <span className="text-xs text-gray-500">đ</span>
      </div>
      {hint && <p className="text-[11px] text-gray-500 leading-snug">{hint}</p>}
    </div>
  )
}

export default function PitSettingsPanel({
  legal,
  canEdit,
  onChange,
}: {
  legal: Legal
  canEdit: boolean
  onChange: (patch: Partial<Legal>) => void
}) {
  const personal = legal.personalDeduction ?? DEFAULT_PIT_SETTINGS.personalDeduction
  const dependent = legal.dependentDeduction ?? DEFAULT_PIT_SETTINGS.dependentDeduction
  const brackets: PitBracket[] = legal.taxBrackets && legal.taxBrackets.length > 0 ? legal.taxBrackets : DEFAULT_PIT_SETTINGS.brackets
  const flatEnabled = legal.partTimeFlatTaxEnabled ?? DEFAULT_PIT_SETTINGS.partTimeFlatTaxEnabled
  const flatRate = legal.partTimeFlatTaxRate ?? DEFAULT_PIT_SETTINGS.partTimeFlatTaxRate
  const flatThreshold = legal.partTimeFlatTaxThreshold ?? DEFAULT_PIT_SETTINGS.partTimeFlatTaxThreshold

  const usesOldDeductions = personal === OLD_PERSONAL_DEDUCTION || dependent === OLD_DEPENDENT_DEDUCTION

  const updateBracket = (index: number, patch: Partial<PitBracket>) => {
    const next = brackets.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onChange({ taxBrackets: next })
  }

  const addBracket = () => {
    const limited = brackets.filter(b => b.upTo !== null)
    const lastLimit = limited.length > 0 ? (limited[limited.length - 1].upTo as number) : 0
    const open = brackets.find(b => b.upTo === null)
    const newRow: PitBracket = { upTo: lastLimit + 10_000_000, rate: open ? open.rate : 0.05 }
    onChange({ taxBrackets: normalizePitBrackets([...limited, newRow, ...(open ? [open] : [])]) })
  }

  const removeBracket = (index: number) => {
    const next = brackets.filter((_, i) => i !== index)
    onChange({ taxBrackets: normalizePitBrackets(next) })
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs mt-4 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#001D3D]">Thuế thu nhập cá nhân (TNCN)</h3>
        <p className="text-xs text-gray-500">
          Mọi mức giảm trừ và biểu thuế dưới đây được dùng khi tính lương. Kế toán đối chiếu văn bản hiện hành và chỉnh tại đây khi luật thay đổi.
        </p>
      </div>

      {usesOldDeductions && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            Đang dùng mức giảm trừ cũ (11 triệu / 4,4 triệu). Từ kỳ tính thuế 2026, mức theo Nghị quyết 110/2025/UBTVQH15 là
            15,5 triệu cho bản thân và 6,2 triệu cho mỗi người phụ thuộc. Vui lòng kiểm tra lại với kế toán rồi lưu.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <MoneyField
          label="Giảm trừ gia cảnh cho bản thân (mỗi tháng)"
          value={personal}
          disabled={!canEdit}
          onChange={value => onChange({ personalDeduction: value })}
        />
        <MoneyField
          label="Giảm trừ cho mỗi người phụ thuộc (mỗi tháng)"
          value={dependent}
          disabled={!canEdit}
          onChange={value => onChange({ dependentDeduction: value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-700">Biểu thuế lũy tiến từng phần (thu nhập tính thuế mỗi tháng)</p>
          {canEdit && (
            <button
              type="button"
              onClick={addBracket}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-semibold text-[#2F6FA8] hover:bg-gray-50"
            >
              <Plus size={12} /> Thêm bậc
            </button>
          )}
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Bậc</th>
                <th className="px-3 py-2 text-left font-semibold">Đến mức (đ)</th>
                <th className="px-3 py-2 text-left font-semibold">Thuế suất (%)</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {brackets.map((row, index) => (
                <tr key={index} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-semibold text-gray-700">{index + 1}</td>
                  <td className="px-3 py-2">
                    {row.upTo === null ? (
                      <span className="text-gray-500">Phần còn lại (không giới hạn)</span>
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={!canEdit}
                        value={formatMoney(row.upTo)}
                        onChange={e => updateBracket(index, { upTo: toMoney(e.target.value) })}
                        onBlur={() => onChange({ taxBrackets: normalizePitBrackets(brackets) })}
                        className="w-36 rounded-lg border border-gray-200 px-2 py-1 disabled:bg-gray-100"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      disabled={!canEdit}
                      value={Math.round(row.rate * 1000) / 10}
                      onChange={e => updateBracket(index, { rate: Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100 })}
                      className="w-20 rounded-lg border border-gray-200 px-2 py-1 disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {canEdit && row.upTo !== null && brackets.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeBracket(index)}
                        className="text-gray-400 hover:text-rose-600"
                        aria-label={`Xóa bậc ${index + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={flatEnabled}
            onChange={e => onChange({ partTimeFlatTaxEnabled: e.target.checked })}
          />
          Khấu trừ cố định cho nhân viên bán thời gian / hợp đồng dưới 3 tháng
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-700 block">Tỷ lệ khấu trừ (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              disabled={!canEdit || !flatEnabled}
              value={Math.round(flatRate * 1000) / 10}
              onChange={e => onChange({ partTimeFlatTaxRate: Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100 })}
              className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm disabled:bg-gray-100"
            />
          </div>
          <MoneyField
            label="Chỉ khấu trừ khi thu nhập trong tháng từ"
            value={flatThreshold}
            disabled={!canEdit || !flatEnabled}
            onChange={value => onChange({ partTimeFlatTaxThreshold: value })}
            hint="Nhân viên có cam kết thu nhập dưới ngưỡng chịu thuế có thể không bị khấu trừ, kế toán xử lý riêng."
          />
        </div>
      </div>
    </div>
  )
}
