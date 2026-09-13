'use client'

import { useState, useMemo } from 'react'
import { quickCalc, QUICK_CALC_TABLE, applyCalculation, fmtVND } from '@/lib/mock-data-staffing-calc'
import { mockShifts } from '@/lib/mock-data'
import { ChevronDown, ChevronUp, Zap, Coffee, Clock, BarChart3, Users, DollarSign, CheckCircle, Lightbulb, Sparkles } from 'lucide-react'

const CUP_OPTIONS = [50, 100, 200, 300, 500]
const HOUR_OPTIONS = [
  { value: 8, label: '8 tiếng' },
  { value: 10, label: '10 tiếng' },
  { value: 12, label: '12 tiếng' },
  { value: 14, label: '14+ tiếng' },
]

interface Props {
  onApply?: () => void
  onViewDetail?: (cups: number, hours: number) => void
}

export default function StaffingQuickCalc({ onApply, onViewDetail }: Props) {
  const [selectedCups, setSelectedCups] = useState<number | null>(null)
  const [customCups, setCustomCups] = useState('')
  const [selectedHours, setSelectedHours] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const cups = selectedCups ?? (customCups ? Number(customCups) : null)
  const hours = selectedHours

  const result = useMemo(() => {
    if (cups && cups > 0 && hours && hours > 0) {
      return quickCalc({ cupsPerDay: cups, hoursPerDay: hours })
    }
    return null
  }, [cups, hours])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleApply = () => {
    if (!result) return
    // Build shift results for apply
    const shifts = mockShifts.map(shift => ({
      shift_id: shift.id,
      shift_name: shift.name,
      shift_hours: 0,
      positions: [
        { position_id: 'pos-001', position_name: 'Pha chế', count: result.barista, reasoning: [] },
        { position_id: 'pos-002', position_name: 'Thu ngân', count: result.cashier, reasoning: [] },
        ...(result.helper > 0 ? [{ position_id: 'pos-003', position_name: 'Phụ việc', count: result.helper, reasoning: [] }] : []),
      ],
      total: result.perShift,
    }))
    applyCalculation('store-001', shifts)
    showToast('✅ Đã cập nhật định biên thành công')
    onApply?.()
  }

  const handleViewDetail = () => {
    onViewDetail?.(cups || 200, hours || 10)
  }

  const fmtCost = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu`
    return fmtVND(n)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <h2 className="text-lg font-bold flex items-center justify-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap size={20} className="text-warning-500" />
          Tính nhanh định biên
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Chỉ 2 bước, có kết quả ngay</p>
      </div>

      {/* Q1: Cups per day */}
      <div className="card space-y-2.5">
        <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Coffee size={16} className="text-warning-600" />
          Quán bạn bán khoảng bao nhiêu ly/ngày?
        </label>
        <div className="flex gap-2">
          {CUP_OPTIONS.map(c => (
            <button key={c}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all"
              style={{
                borderColor: selectedCups === c ? 'var(--primary)' : 'var(--gray-200)',
                background: selectedCups === c ? 'var(--primary)' : 'transparent',
                color: selectedCups === c ? '#fff' : 'var(--text-secondary)',
              }}
              onClick={() => { setSelectedCups(c); setCustomCups('') }}>
              {c}{c === 500 ? '+' : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Hoặc nhập số cụ thể:</span>
          <input type="number" className="w-20 p-1.5 rounded-lg border text-sm text-center"
            style={{ borderColor: 'var(--gray-200)' }}
            placeholder="..."
            value={customCups}
            onChange={e => { setCustomCups(e.target.value); setSelectedCups(null) }}
            min={1} />
        </div>
      </div>

      {/* Q2: Hours per day */}
      <div className="card space-y-2.5">
        <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Clock size={16} className="text-primary-600" />
          Quán mở cửa mấy tiếng/ngày?
        </label>
        <div className="flex gap-2">
          {HOUR_OPTIONS.map(h => (
            <button key={h.value}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
              style={{
                borderColor: selectedHours === h.value ? 'var(--primary)' : 'var(--gray-200)',
                background: selectedHours === h.value ? 'var(--primary)' : 'transparent',
                color: selectedHours === h.value ? '#fff' : 'var(--text-secondary)',
              }}
              onClick={() => setSelectedHours(h.value)}>
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result - appears when both selected */}
      {result && (
        <div className="card overflow-hidden" style={{ border: '2px solid var(--primary)', background: 'var(--primary-light)' }}>
          <div className="p-3 text-center" style={{ background: 'var(--primary)', color: '#fff' }}>
            <span className="text-sm font-bold flex items-center gap-1.5">
              <BarChart3 size={16} />
              Kết quả: Bạn cần khoảng
            </span>
            <span className="text-xl font-black">{result.perShift}</span>
            <span className="text-sm font-bold"> người/ca</span>
          </div>

          <div className="p-3 space-y-3">
            {/* Role cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 rounded-xl" style={{ background: '#fff', border: '1px solid var(--gray-200)' }}>
                <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center mb-1">
                  <Coffee size={20} className="text-warning-600" />
                </div>
                <div className="text-xl font-black" style={{ color: 'var(--primary)' }}>{result.barista}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Pha chế</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: '#fff', border: '1px solid var(--gray-200)' }}>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                  <DollarSign size={20} className="text-emerald-600" />
                </div>
                <div className="text-xl font-black" style={{ color: 'var(--primary)' }}>{result.cashier}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Thu ngân</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{
                background: result.helper > 0 ? '#fff' : 'var(--gray-50)',
                border: `1px solid ${result.helper > 0 ? 'var(--gray-200)' : 'var(--gray-100)'}`,
                opacity: result.helper > 0 ? 1 : 0.5,
              }}>
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mb-1">
                  <Sparkles size={20} className="text-gray-500" />
                </div>
                <div className="text-xl font-black" style={{ color: result.helper > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {result.helper > 0 ? `+${result.helper}` : '—'}
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Phụ việc{result.helper > 0 ? '' : ''}
                </div>
                {result.helper > 0 && (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>(cao điểm)</div>
                )}
              </div>
            </div>

            {/* Summary lines */}
            <div className="space-y-1.5 py-2" style={{ borderTop: '1px solid var(--gray-200)' }}>
              <div className="flex items-center gap-2 text-sm">
                <Users size={16} className="text-primary-500" />
                <span style={{ color: 'var(--text-secondary)' }}>Tổng cần tuyển (để xoay ca):</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{result.totalMin}-{result.totalMax} người</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign size={16} className="text-emerald-500" />
                <span style={{ color: 'var(--text-secondary)' }}>Chi phí lương ước tính:</span>
                <span className="font-bold" style={{ color: 'var(--primary)' }}>{fmtCost(result.costMin)}-{fmtCost(result.costMax)}/tháng</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button onClick={handleApply}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                style={{ background: 'var(--primary)' }}>
                <CheckCircle size={14} />
                Áp dụng vào Định biên
              </button>
              <button onClick={handleViewDetail}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                style={{ borderColor: 'var(--gray-300)', color: 'var(--text-secondary)' }}>
                <BarChart3 size={14} />
                Xem chi tiết hơn →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference table (collapsible) */}
      <div className="card">
        <button onClick={() => setShowTable(!showTable)}
          className="w-full flex items-center justify-between py-1">
          <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            <Lightbulb size={14} className="text-warning-500" />
            Bảng tham khảo theo số ly/ngày
          </span>
          {showTable ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </button>
        {showTable && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                  <th className="text-left py-1.5" style={{ color: 'var(--text-muted)' }}>Số ly/ngày</th>
                  <th className="text-center py-1.5" style={{ color: 'var(--text-muted)' }}>Người/ca</th>
                  <th className="text-center py-1.5" style={{ color: 'var(--text-muted)' }}>Tổng tuyển</th>
                  <th className="text-right py-1.5" style={{ color: 'var(--text-muted)' }}>Lương/tháng</th>
                </tr>
              </thead>
              <tbody>
                {QUICK_CALC_TABLE.map((row, i) => {
                  const isActive = cups !== null && cups >= row.min && cups <= row.max
                  return (
                    <tr key={i} style={{
                      borderBottom: '1px solid var(--gray-100)',
                      background: isActive ? 'var(--primary-light)' : 'transparent',
                    }}>
                      <td className="py-2 font-medium" style={{ color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>{row.range}</td>
                      <td className="text-center py-2 font-bold" style={{ color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }}>{row.perShift}</td>
                      <td className="text-center py-2" style={{ color: 'var(--text-secondary)' }}>{row.totalMin}-{row.totalMax}</td>
                      <td className="text-right py-2" style={{ color: 'var(--text-muted)' }}>{row.costLabel}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg animate-fade-in z-50"
          style={{ background: '#1f2937' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
