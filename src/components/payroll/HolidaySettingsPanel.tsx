'use client'

import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import type { PayrollHoliday } from '@/lib/services/payroll/payroll-policy-service'

// Gợi ý ngày lễ năm 2026 theo Điều 112 BLLĐ. Tết Âm lịch và Giỗ Tổ đổi theo năm,
// nên luôn phải đối chiếu với thông báo nghỉ lễ chính thức của Chính phủ trước khi lưu.
const SUGGESTED_2026: PayrollHoliday[] = [
  { date: '2026-01-01', name: 'Tết Dương lịch' },
  { date: '2026-02-16', name: 'Tết Âm lịch (29 Tết)' },
  { date: '2026-02-17', name: 'Tết Âm lịch (Mùng 1)' },
  { date: '2026-02-18', name: 'Tết Âm lịch (Mùng 2)' },
  { date: '2026-02-19', name: 'Tết Âm lịch (Mùng 3)' },
  { date: '2026-02-20', name: 'Tết Âm lịch (Mùng 4)' },
  { date: '2026-04-26', name: 'Giỗ Tổ Hùng Vương' },
  { date: '2026-04-30', name: 'Ngày Giải phóng miền Nam' },
  { date: '2026-05-01', name: 'Quốc tế Lao động' },
  { date: '2026-09-01', name: 'Quốc khánh' },
  { date: '2026-09-02', name: 'Quốc khánh' },
]

type Props = {
  holidays: PayrollHoliday[]
  canEdit: boolean
  onChange: (next: PayrollHoliday[]) => void
}

export default function HolidaySettingsPanel({ holidays, canEdit, onChange }: Props) {
  const sorted = [...holidays].sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const updateRow = (index: number, patch: Partial<PayrollHoliday>) => {
    onChange(sorted.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const removeRow = (index: number) => {
    onChange(sorted.filter((_, i) => i !== index))
  }

  const addRow = () => {
    onChange([...sorted, { date: '', name: '' }])
  }

  const fillSuggestion = () => {
    const existing = new Set(sorted.map(h => h.date))
    const merged = [...sorted, ...SUGGESTED_2026.filter(h => !existing.has(h.date))]
    onChange(merged)
  }

  const duplicateDates = new Set(
    sorted.map(h => h.date).filter((d, i, arr) => d && arr.indexOf(d) !== i),
  )

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs mt-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#001D3D] mb-1 flex items-center gap-2">
            <CalendarDays size={16} className="text-[#2F6FA8]" />
            <span>Danh sách ngày lễ, Tết</span>
          </h3>
          <p className="text-xs text-gray-500">
            Ngày có trong danh sách được tính lương ngày lễ (hệ số ở mục Tăng ca). Nhân viên toàn thời gian nghỉ đúng ngày lễ vẫn được trả lương ngày đó. Để trống = không có ngày lễ nào.
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={fillSuggestion}
              className="rounded-lg border border-[#2F6FA8]/30 bg-[#2F6FA8]/5 px-3 py-1.5 text-xs font-bold text-[#2F6FA8] hover:bg-[#2F6FA8]/10"
            >
              Điền gợi ý 2026
            </button>
            <button
              type="button"
              onClick={addRow}
              className="rounded-lg bg-[#001D3D] px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"
            >
              <Plus size={14} /> Thêm ngày
            </button>
          </div>
        )}
      </div>

      {canEdit && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          Gợi ý chỉ để tham khảo. Ngày nghỉ Tết và Giỗ Tổ thay đổi theo năm, hãy đối chiếu với thông báo nghỉ lễ chính thức của Chính phủ trước khi bấm Lưu.
        </p>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
          Chưa có ngày lễ nào. Bấm &quot;Thêm ngày&quot; hoặc &quot;Điền gợi ý 2026&quot;.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((row, index) => (
            <div key={`${row.date}-${index}`} className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="date"
                disabled={!canEdit}
                value={row.date}
                onChange={e => updateRow(index, { date: e.target.value })}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-mono bg-white disabled:bg-gray-100 ${
                  duplicateDates.has(row.date) || !row.date ? 'border-rose-300' : 'border-gray-200'
                }`}
              />
              <input
                type="text"
                disabled={!canEdit}
                value={row.name}
                placeholder="Tên ngày lễ"
                onChange={e => updateRow(index, { name: e.target.value })}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs disabled:bg-gray-100"
              />
              {canEdit && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  aria-label="Xóa ngày lễ"
                  className="self-start sm:self-auto rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {duplicateDates.size > 0 && (
            <p className="text-[11px] text-rose-600">Có ngày bị trùng. Ngày trùng chỉ được tính một lần.</p>
          )}
        </div>
      )}
    </div>
  )
}
