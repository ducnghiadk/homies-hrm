'use client'

import { useState, useMemo } from 'react'
import { mockStores } from '@/lib/mock-data'
import {
  type StoreProfile, type StoreType, type CustomerForecast,
  type ForecastInputMethod, type ProductivityStandard,
  type ShrinkageFactors, type ShiftResult, type FTPTSplit,
  type CostEstimate, type OptimizationSuggestion,
  TIME_SLOTS, DAY_GROUPS,
  industryTemplates,
  getDefaultStandards, defaultFactors,
  distributeCustomers, createEmptyForecast,
  calculateStaffingNeeds, calculateFTPTSplit, estimateCost,
  generateSuggestions, applyCalculation, saveCalculation,
  markCalculationApplied, fmtVND,
} from '@/lib/mock-data-staffing-calc'
import { getAdminSettings } from '@/lib/mock-data-staffing-calc'
import { ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp, X, Store, Users, Zap, BarChart3, RefreshCw, DollarSign, CheckCircle, Lightbulb, ClipboardList, TrendingUp, Ruler, Save, Rocket, AlertTriangle, Circle } from 'lucide-react'

const STEPS = [
  { n: 1, title: 'Cửa hàng', Icon: Store },
  { n: 2, title: 'Khách hàng', Icon: Users },
  { n: 3, title: 'Năng suất', Icon: Zap },
  { n: 4, title: 'Kết quả', Icon: BarChart3 },
  { n: 5, title: 'FT/PT', Icon: RefreshCw },
  { n: 6, title: 'Chi phí', Icon: DollarSign },
  { n: 7, title: 'Áp dụng', Icon: CheckCircle },
]

interface Props {
  /** Called after "Áp dụng" or "Lưu" to refresh parent data */
  onComplete?: () => void
}

export default function StaffingCalculator({ onComplete }: Props) {
  const [step, setStep] = useState(1)

  // Step 1
  const [storeId, setStoreId] = useState('store-001')
  const [openTime, setOpenTime] = useState('07:00')
  const [closeTime, setCloseTime] = useState('23:00')
  const [storeType, setStoreType] = useState<StoreType>('both')
  const [tables, setTables] = useState(20)
  const [area, setArea] = useState(50)

  // Step 2
  const [forecastMethod, setForecastMethod] = useState<ForecastInputMethod>('auto')
  const [forecast, setForecast] = useState<CustomerForecast>(createEmptyForecast())
  const [totalPerDay, setTotalPerDay] = useState(340)
  const [weekendBoost, setWeekendBoost] = useState(50)

  // Step 3
  const [standards, setStandards] = useState<ProductivityStandard[]>(getDefaultStandards())
  const [factors, setFactors] = useState<ShrinkageFactors>({ ...defaultFactors })
  const [selectedTemplate, setSelectedTemplate] = useState('')

  // Step 5
  const [ratioFT, setRatioFT] = useState(60)
  const [ftHours, setFtHours] = useState(48)
  const [ptHours, setPtHours] = useState(25)
  const [priority, setPriority] = useState<'stable' | 'cost' | 'flexible'>('stable')

  // Step 6
  const [revenue, setRevenue] = useState(300_000_000)

  const [applied, setApplied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedPos, setExpandedPos] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showOptModal, setShowOptModal] = useState(false)

  // ─── Computed ───
  const profile = useMemo<StoreProfile>(() => ({
    store_id: storeId, open_time: openTime, close_time: closeTime,
    store_type: storeType, tables: storeType === 'takeaway' ? 0 : tables, area_sqm: area,
  }), [storeId, openTime, closeTime, storeType, tables, area])

  const effectiveForecast = useMemo<CustomerForecast>(
    () => forecastMethod === 'auto' ? distributeCustomers(totalPerDay, weekendBoost / 100) : forecast,
    [forecastMethod, totalPerDay, weekendBoost, forecast],
  )

  const results = useMemo<ShiftResult[]>(
    () => calculateStaffingNeeds(profile, effectiveForecast, standards, factors),
    [profile, effectiveForecast, standards, factors],
  )

  const split = useMemo<FTPTSplit>(
    () => calculateFTPTSplit(results, ratioFT, ftHours, ptHours, priority),
    [results, ratioFT, ftHours, ptHours, priority],
  )

  const cost = useMemo<CostEstimate>(() => estimateCost(split, revenue), [split, revenue])

  const suggestions = useMemo<OptimizationSuggestion[]>(
    () => generateSuggestions(results, cost, storeId),
    [results, cost, storeId],
  )

  const storeName = mockStores.find(s => s.id === storeId)?.name || ''

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleApply = () => {
    applyCalculation(storeId, results)
    const calc = saveCalculation({
      store_id: storeId, store_name: storeName, profile,
      forecast: effectiveForecast, forecast_method: forecastMethod,
      standards, factors, results, split, cost, suggestions, applied: true,
    })
    markCalculationApplied(calc.id)
    setApplied(true)
    showToast('✅ Đã áp dụng định biên!')
    onComplete?.()
  }

  const handleSaveOnly = () => {
    saveCalculation({
      store_id: storeId, store_name: storeName, profile,
      forecast: effectiveForecast, forecast_method: forecastMethod,
      standards, factors, results, split, cost, suggestions, applied: false,
    })
    showToast('💾 Đã lưu kết quả tính')
  }

  const updateForecastCell = (slotLabel: string, dayGroup: string, value: number) => {
    setForecast(prev => ({ ...prev, [slotLabel]: { ...prev[slotLabel], [dayGroup]: value } }))
  }

  const applyTemplate = (tplId: string) => {
    const tpl = industryTemplates.find(t => t.id === tplId)
    if (!tpl) return
    setSelectedTemplate(tplId)
    setStandards(prev => prev.map(s => ({
      ...s, value: tpl.ratios[s.position_id] ?? s.value, unit: tpl.units[s.position_id] ?? s.unit,
    })))
  }

  const canNext = step < 7
  const canBack = step > 1

  // Filter positions with actual results for display
  const activePositions = standards.filter(s =>
    results.some(r => r.positions.some(p => p.position_id === s.position_id && p.count > 0))
  )

  return (
    <div className="space-y-3">
      {/* ─── Stepper ─── */}
      <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
        {STEPS.map(s => (
          <button key={s.n}
            onClick={() => s.n <= step + 1 && setStep(s.n)}
            className="flex flex-col items-center min-w-[44px] transition-all"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: step === s.n ? 'var(--primary)' : s.n < step ? '#10b981' : 'var(--gray-200)',
                color: step === s.n || s.n < step ? '#fff' : 'var(--text-muted)',
              }}>
              {s.n < step ? <Check size={14} /> : <s.Icon size={14} />}
            </div>
            <span className="text-xs mt-0.5 font-medium whitespace-nowrap" style={{
              color: step === s.n ? 'var(--primary)' : 'var(--text-muted)',
            }}>{s.title}</span>
          </button>
        ))}
      </div>

      {/* ─── STEP 1: Store Profile ─── */}
      {step === 1 && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Store size={16} className="text-blue-600" />
            Thông tin cửa hàng
          </h3>

          <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Cửa hàng</label>
          <select className="w-full p-2.5 rounded-xl border text-sm" style={{ borderColor: 'var(--gray-200)' }}
            value={storeId} onChange={e => setStoreId(e.target.value)}>
            {mockStores.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Giờ mở cửa</label>
              <input type="time" className="w-full p-2 rounded-xl border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                value={openTime} onChange={e => setOpenTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Giờ đóng cửa</label>
              <input type="time" className="w-full p-2 rounded-xl border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                value={closeTime} onChange={e => setCloseTime(e.target.value)} />
            </div>
          </div>

          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Loại hình</label>
          <div className="flex gap-2">
            {([['takeaway', 'Take-away'], ['dine_in', 'Dine-in'], ['both', 'Cả hai']] as const).map(([val, label]) => (
              <button key={val}
                className="flex-1 py-2 rounded-xl text-xs font-medium border transition-all"
                style={{
                  borderColor: storeType === val ? 'var(--primary)' : 'var(--gray-200)',
                  background: storeType === val ? 'var(--primary)' : 'transparent',
                  color: storeType === val ? '#fff' : 'var(--text-secondary)',
                }}
                onClick={() => setStoreType(val)}>{label}</button>
            ))}
          </div>

          {storeType !== 'takeaway' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Số bàn</label>
                <input type="number" className="w-full p-2 rounded-xl border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                  value={tables} onChange={e => setTables(Number(e.target.value))} min={1} max={100} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Diện tích (m²)</label>
                <input type="number" className="w-full p-2 rounded-xl border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                  value={area} onChange={e => setArea(Number(e.target.value))} min={10} max={500} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 2: Customer Forecast ─── */}
      {step === 2 && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Users size={16} className="text-blue-600" />
            Dự báo khách hàng
          </h3>

          <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: 'var(--gray-100)' }}>
            {([['auto', 'Tự động'], ['manual', 'Thủ công'], ['pos', 'POS']] as const).map(([key, label]) => (
              <button key={key}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                style={{
                  background: forecastMethod === key ? '#fff' : 'transparent',
                  color: forecastMethod === key ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: forecastMethod === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
                onClick={() => setForecastMethod(key)}>{label}</button>
            ))}
          </div>

          {forecastMethod === 'auto' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Tổng khách/ngày trung bình</label>
                <input type="number" className="w-full p-2.5 rounded-xl border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                  value={totalPerDay} onChange={e => setTotalPerDay(Number(e.target.value))} min={10} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Cuối tuần tăng (%)</label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="range" className="flex-1" min={0} max={100} value={weekendBoost}
                    onChange={e => setWeekendBoost(Number(e.target.value))} />
                  <span className="text-sm font-bold w-12 text-right" style={{ color: 'var(--primary)' }}>+{weekendBoost}%</span>
                </div>
              </div>
              <div className="p-2 rounded-xl text-xs flex items-center gap-1.5" style={{ background: 'var(--gray-50)', color: 'var(--text-muted)' }}>
                <Lightbulb size={12} className="text-amber-500 flex-shrink-0" />
                Hệ thống tự phân bổ theo pattern chuẩn ngành F&B (cao điểm trưa 28%, tối 35%)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                      <th className="text-left py-1" style={{ color: 'var(--text-muted)' }}>Khung giờ</th>
                      {DAY_GROUPS.map(g => <th key={g.key} className="text-center py-1" style={{ color: 'var(--text-muted)' }}>{g.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(slot => (
                      <tr key={slot.label} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td className="py-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>{slot.label}</td>
                        {DAY_GROUPS.map(g => (
                          <td key={g.key} className="text-center font-bold" style={{ color: 'var(--text-primary)' }}>
                            {effectiveForecast[slot.label]?.[g.key] || 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {forecastMethod === 'manual' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                    <th className="text-left py-1.5" style={{ color: 'var(--text-muted)' }}>Khung giờ</th>
                    {DAY_GROUPS.map(g => <th key={g.key} className="text-center py-1.5" style={{ color: 'var(--text-muted)' }}>{g.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map(slot => (
                    <tr key={slot.label} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td className="py-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>{slot.label}</td>
                      {DAY_GROUPS.map(g => (
                        <td key={g.key} className="text-center p-0.5">
                          <input type="number" className="w-14 p-1 rounded-lg border text-center text-xs"
                            style={{ borderColor: 'var(--gray-200)' }}
                            value={forecast[slot.label]?.[g.key] || 0}
                            onChange={e => updateForecastCell(slot.label, g.key, Number(e.target.value))}
                            min={0} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {forecastMethod === 'pos' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <BarChart3 size={28} className="text-blue-600" />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Kết nối POS</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tính năng đang phát triển.</p>
              <button className="px-4 py-2 rounded-xl text-xs font-bold opacity-50 cursor-not-allowed"
                style={{ background: 'var(--gray-200)', color: 'var(--text-muted)' }} disabled>
                Kết nối POS (Coming soon)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 3: Productivity Standards ─── */}
      {step === 3 && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Zap size={16} className="text-amber-500" />
            Cấu hình năng suất
          </h3>

          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Chọn template ngành</label>
            <select className="w-full p-2 rounded-xl border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
              value={selectedTemplate} onChange={e => applyTemplate(e.target.value)}>
              <option value="">— Tùy chỉnh —</option>
              {industryTemplates.map(t => <option key={t.id} value={t.id}>{t.name} — {t.description}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            {standards.map((std, i) => (
              <div key={std.position_id} className="p-2.5 rounded-xl border" style={{ borderColor: 'var(--gray-200)' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{std.position_name}</span>
                  {std.is_fixed && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--gray-100)', color: 'var(--text-muted)' }}>Cố định</span>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className="w-16 p-1.5 rounded-lg border text-sm text-center"
                    style={{ borderColor: 'var(--gray-200)' }}
                    value={std.value} disabled={std.is_fixed}
                    onChange={e => {
                      const v = Math.max(std.min, Math.min(std.max, Number(e.target.value)))
                      setStandards(prev => prev.map((s, j) => j === i ? { ...s, value: v } : s))
                    }}
                    min={std.min} max={std.max} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{std.unit}</span>
                  {!std.is_fixed && (
                    <span className="text-[9px] ml-auto" style={{ color: 'var(--text-muted)' }}>[{std.min}-{std.max}]</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h4 className="text-xs font-bold mt-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Ruler size={14} />
            Hệ số điều chỉnh
          </h4>
          {[
            { key: 'absence_rate' as const, label: 'Vắng mặt (shrinkage)', desc: 'Nghỉ phép, ốm, trễ' },
            { key: 'peak_buffer' as const, label: 'Buffer cao điểm', desc: 'Thêm người lúc đông' },
            { key: 'training_overhead' as const, label: 'Training overhead', desc: 'NV mới năng suất thấp hơn' },
          ].map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{f.label}</span>
                <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{f.desc}</div>
              </div>
              <div className="flex items-center gap-1">
                <input type="number" className="w-14 p-1 rounded-lg border text-xs text-center"
                  style={{ borderColor: 'var(--gray-200)' }}
                  value={Math.round(factors[f.key] * 100)}
                  onChange={e => setFactors(prev => ({ ...prev, [f.key]: Number(e.target.value) / 100 }))}
                  min={0} max={50} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── STEP 4: Results ─── */}
      {step === 4 && (
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BarChart3 size={16} className="text-blue-600" />
              Kết quả đề xuất
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                    <th className="text-left py-2" style={{ color: 'var(--text-muted)' }}>Ca</th>
                    {activePositions.map(s => (
                      <th key={s.position_id} className="text-center py-2" style={{ color: 'var(--text-muted)' }}>{s.position_name}</th>
                    ))}
                    <th className="text-center py-2 font-bold" style={{ color: 'var(--text-primary)' }}>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.shift_id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td className="py-2">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.shift_name}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{r.shift_hours}h</div>
                      </td>
                      {activePositions.map(s => {
                        const pos = r.positions.find(p => p.position_id === s.position_id)
                        return (
                          <td key={s.position_id} className="text-center py-2">
                            <button className="font-bold text-sm" style={{ color: pos && pos.count > 0 ? 'var(--primary)' : 'var(--text-muted)' }}
                              onClick={() => pos && setExpandedPos(expandedPos === `${r.shift_id}-${s.position_id}` ? null : `${r.shift_id}-${s.position_id}`)}>
                              {pos?.count || 0}
                            </button>
                          </td>
                        )
                      })}
                      <td className="text-center py-2 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--gray-200)' }}>
                    <td className="py-2 font-bold" style={{ color: 'var(--text-primary)' }}>Tổng/ca</td>
                    {activePositions.map(s => (
                      <td key={s.position_id} className="text-center py-2 font-bold" style={{ color: 'var(--primary)' }}>
                        {results.reduce((sum, r) => sum + (r.positions.find(p => p.position_id === s.position_id)?.count || 0), 0)}
                      </td>
                    ))}
                    <td className="text-center py-2 font-bold text-sm" style={{ color: 'var(--primary)' }}>
                      {results.reduce((s, r) => s + r.total, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {expandedPos && (() => {
            const [shiftId, posId] = expandedPos.split('-')
            const shift = results.find(r => r.shift_id === shiftId)
            const pos = shift?.positions.find(p => p.position_id === posId)
            if (!pos) return null
            return (
              <div className="card" style={{ background: 'var(--gray-50)' }}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Lightbulb size={14} className="text-amber-500" />
                    {pos.position_name} — {shift?.shift_name}
                  </h4>
                  <button onClick={() => setExpandedPos(null)} className="text-xs" style={{ color: 'var(--text-muted)' }}>✕</button>
                </div>
                <div className="space-y-1">
                  {pos.reasoning.map((line, i) => (
                    <div key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{i === pos.reasoning.length - 1 ? '→' : '•'}</span>
                      <span className={i === pos.reasoning.length - 1 ? 'font-bold' : ''}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
          <div className="text-xs text-center flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Lightbulb size={12} className="text-amber-500" />
            Nhấn vào số để xem lý do tính toán
          </div>
        </div>
      )}

      {/* ─── STEP 5: FT/PT Split ─── */}
      {step === 5 && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <RefreshCw size={16} className="text-blue-600" />
            Phân bổ Full-time / Part-time
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--primary)', color: '#fff' }}>
              <div className="text-lg font-bold">{split.total_weekly_hours}</div>
              <div className="text-xs opacity-80">Giờ/tuần</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--gray-100)' }}>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{split.total_monthly_hours}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Giờ/tháng</div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Tỷ lệ Full/Part-time</label>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-bold" style={{ color: '#2563eb' }}>FT {ratioFT}%</span>
              <input type="range" className="flex-1" min={20} max={100} value={ratioFT}
                onChange={e => setRatioFT(Number(e.target.value))} />
              <span className="text-xs font-bold text-amber-500">PT {100 - ratioFT}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>FT giờ/tuần</label>
              <input type="number" className="w-full p-2 rounded-xl border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                value={ftHours} onChange={e => setFtHours(Number(e.target.value))} min={40} max={48} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>PT giờ/tuần</label>
              <input type="number" className="w-full p-2 rounded-xl border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                value={ptHours} onChange={e => setPtHours(Number(e.target.value))} min={10} max={35} />
            </div>
          </div>

          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Ưu tiên</label>
          <div className="flex gap-2">
            {([['stable', 'Ổn định'], ['cost', 'Chi phí thấp'], ['flexible', 'Linh hoạt']] as const).map(([val, label]) => (
              <button key={val} className="flex-1 py-2 rounded-xl text-xs font-medium border transition-all"
                style={{
                  borderColor: priority === val ? 'var(--primary)' : 'var(--gray-200)',
                  background: priority === val ? 'var(--primary)' : 'transparent',
                  color: priority === val ? '#fff' : 'var(--text-secondary)',
                }}
                onClick={() => setPriority(val)}>{label}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="p-3 rounded-xl border" style={{ borderColor: '#2563eb', background: '#eff6ff' }}>
              <div className="text-xl font-bold" style={{ color: '#2563eb' }}>{split.fulltime_count}</div>
              <div className="text-xs" style={{ color: '#1d4ed8' }}>Full-time ({ftHours}h/tuần)</div>
            </div>
            <div className="p-3 rounded-xl border" style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
              <div className="text-xl font-bold text-amber-500">{split.parttime_count}</div>
              <div className="text-xs" style={{ color: '#b45309' }}>Part-time ({ptHours}h/tuần)</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 6: Cost Estimate ─── */}
      {step === 6 && (
        <div className="space-y-3">
          <div className="card space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <DollarSign size={16} className="text-emerald-600" />
              Chi phí ước tính
            </h3>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Doanh thu/tháng (VNĐ)</label>
              <input type="number" className="w-full p-2.5 rounded-xl border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                value={revenue} onChange={e => setRevenue(Number(e.target.value))} step={10_000_000} />
            </div>
            <div className="space-y-2">
              {[
                { label: 'Lương Full-time', value: cost.fulltime_salary, color: '#2563eb' },
                { label: 'Lương Part-time', value: cost.parttime_salary, color: '#f59e0b' },
                { label: 'BHXH, BHYT (21%)', value: cost.insurance, color: '#6b7280' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: item.color }}>{fmtVND(item.value)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2" style={{ borderTop: '2px solid var(--gray-200)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Tổng chi phí lương</span>
                <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{fmtVND(cost.total)}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{
            background: cost.status === 'good' ? '#d1fae5' : cost.status === 'warning' ? '#fef3c7' : '#fee2e2',
            borderColor: cost.status === 'good' ? '#a7f3d0' : cost.status === 'warning' ? '#fde68a' : '#fecaca',
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg flex items-center">
                {cost.status === 'good'
                  ? <CheckCircle size={20} className="text-emerald-600" />
                  : cost.status === 'warning'
                    ? <AlertTriangle size={20} className="text-amber-500" />
                    : <Circle size={20} className="fill-red-500 text-red-500" />}
              </span>
              <span className="text-sm font-bold" style={{
                color: cost.status === 'good' ? '#065f46' : cost.status === 'warning' ? '#92400e' : '#991b1b',
              }}>{cost.percent_revenue}% doanh thu</span>
            </div>
            <div className="w-full h-3 rounded-full relative" style={{ background: 'rgba(255,255,255,0.5)' }}>
              <div className="absolute top-0 h-3 rounded-full" style={{ left: '0%', width: `${cost.benchmark_max}%`, background: 'rgba(16,185,129,0.2)' }} />
              <div className="h-3 rounded-full" style={{
                width: `${Math.min(cost.percent_revenue, 50)}%`,
                background: cost.status === 'good' ? '#10b981' : cost.status === 'warning' ? '#f59e0b' : '#ef4444',
              }} />
            </div>
            <div className="flex justify-between text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>0%</span><span>F&B chuẩn: {cost.benchmark_min}-{cost.benchmark_max}%</span><span>50%</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 7: Apply ─── */}
      {step === 7 && (
        <div className="space-y-3">
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), #1a56db)', color: '#fff' }}>
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              <ClipboardList size={16} />
              Tóm tắt — {storeName}
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-lg font-bold">{results.reduce((s, r) => s + r.total, 0)}</div><div className="text-[9px] opacity-70">Tổng NV/ca</div></div>
              <div><div className="text-lg font-bold">{split.fulltime_count + split.parttime_count}</div><div className="text-[9px] opacity-70">FT + PT</div></div>
              <div><div className="text-lg font-bold">{fmtVND(cost.total)}</div><div className="text-[9px] opacity-70">Chi phí/tháng</div></div>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="card">
              <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Lightbulb size={14} className="text-amber-500" />
                Gợi ý tối ưu
              </h4>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span>{s.icon}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{s.title}</span>
                    </div>
                    <p className="text-xs ml-6" style={{ color: 'var(--text-muted)' }}>{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button onClick={handleApply} disabled={applied}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: applied ? '#10b981' : 'var(--primary)', opacity: applied ? 0.8 : 1 }}>
              {applied
                ? <><CheckCircle size={14} /> Đã áp dụng</>
                : <><Rocket size={14} /> Áp dụng định biên này</>}
            </button>
            <button onClick={handleSaveOnly}
              className="w-full py-2.5 rounded-xl text-xs font-medium border transition-all"
              style={{ borderColor: 'var(--gray-200)', color: 'var(--text-secondary)' }}>
              <Save size={14} />
              Lưu kết quả (không áp dụng)
            </button>
          </div>
        </div>
      )}

      {/* ─── PHÂN TÍCH NÂNG CAO (after Step 4+ results) ─── */}
      {step >= 4 && (
        <div className="card">
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between py-1">
            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp size={14} />
              Phân tích nâng cao (dành cho quản lý)
            </span>
            {showAdvanced ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-3">
              {/* Benchmark comparison */}
              <div className="p-3 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <BarChart3 size={14} />
                  So sánh với chuẩn ngành F&B Việt Nam
                </h4>
                {(() => {
                  const costPct = cost.percent_revenue
                  const costStatus = costPct < 15 ? 'good' : costPct <= 20 ? 'warning' : 'danger'
                  const revenuePerHour = revenue > 0 ? Math.round(revenue / 30 / (parseInt(closeTime) - parseInt(openTime) || 16) / 1000) : 0
                  const revStatus = revenuePerHour >= 200 && revenuePerHour <= 300 ? 'good' : revenuePerHour > 300 ? 'good' : 'warning'
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span style={{ color: 'var(--text-secondary)' }}>Chi phí lương:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{costPct}%</span>
                          <span style={{ color: 'var(--text-muted)' }}>/ chuẩn 12-18%</span>
                          <span className="flex items-center gap-1">
                            {costStatus === 'good'
                              ? <><CheckCircle size={12} className="text-emerald-600" /> Tốt</>
                              : costStatus === 'warning'
                                ? <><Circle size={8} className="fill-amber-500 text-amber-500" /> TB</>
                                : <><AlertTriangle size={12} className="text-amber-500" /> Cao</>}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span style={{ color: 'var(--text-secondary)' }}>Doanh thu/giờ:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{revenuePerHour}K</span>
                          <span style={{ color: 'var(--text-muted)' }}>/ chuẩn 200-300K</span>
                          <span className="flex items-center gap-1">
                            {revStatus === 'good'
                              ? <><CheckCircle size={12} className="text-emerald-600" /> Tốt</>
                              : <><Circle size={8} className="fill-amber-500 text-amber-500" /> TB</>}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Optimization suggestion - only show when cost > 20% */}
              {cost.percent_revenue > getAdminSettings().cost_warning_pct && (
                <div className="p-3 rounded-xl" style={{ background: '#fefce8', borderLeft: '4px solid #eab308' }}>
                  <h4 className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: '#92400e' }}>
                    <Lightbulb size={14} className="text-amber-600" />
                    Gợi ý tiết kiệm
                  </h4>
                  <p className="text-xs mb-2" style={{ color: '#78716c' }}>
                    Chi phí lương của bạn hơi cao. Bạn có thể giảm 1 người part-time ca sáng để tiết kiệm ~3.5 triệu/tháng
                  </p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'var(--gray-100)', color: 'var(--text-muted)' }}>
                      Bỏ qua
                    </button>
                    <button onClick={() => setShowOptModal(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ background: '#2563eb' }}>
                      Xem cách thực hiện
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── OPTIMIZATION MODAL ─── */}
      {showOptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-[95%] max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Lightbulb size={16} className="text-amber-500" />
                Chi tiết gợi ý tối ưu
              </h3>
              <button onClick={() => setShowOptModal(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>

            {/* Before / After columns */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl" style={{ background: '#fff', border: '1px solid var(--gray-200)' }}>
                <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>HIỆN TẠI</div>
                {results.map(r => (
                  <div key={r.shift_id} className="flex justify-between text-xs py-0.5">
                    <span style={{ color: 'var(--text-secondary)' }}>{r.shift_name}:</span>
                    <span className="font-bold">{r.total} người</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold mt-2 pt-2" style={{ borderTop: '1px solid var(--gray-200)', color: 'var(--text-primary)' }}>
                  <span>Lương:</span>
                  <span>{fmtVND(cost.total)}/tháng</span>
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: '#eff6ff', border: '1px solid #93c5fd' }}>
                <div className="text-xs font-bold mb-2" style={{ color: '#2563eb' }}>SAU KHI TỐI ƯU</div>
                {results.map((r, i) => {
                  const optimized = i === 0 ? r.total - 1 : r.total
                  return (
                    <div key={r.shift_id} className="flex justify-between text-xs py-0.5">
                      <span style={{ color: 'var(--text-secondary)' }}>{r.shift_name}:</span>
                      <span className="font-bold" style={{ color: i === 0 ? '#2563eb' : 'var(--text-primary)' }}>
                        {optimized} người
                      </span>
                    </div>
                  )
                })}
                <div className="flex justify-between text-xs font-bold mt-2 pt-2" style={{ borderTop: '1px solid #93c5fd', color: '#2563eb' }}>
                  <span>Lương:</span>
                  <span>{fmtVND(Math.round(cost.total * 0.95))}/tháng</span>
                </div>
              </div>
            </div>

            {/* Savings */}
            <div className="text-center p-3 rounded-xl" style={{ background: '#d1fae5' }}>
              <div className="text-xs" style={{ color: '#065f46' }}>Tiết kiệm mỗi tháng</div>
              <div className="text-xl font-black" style={{ color: '#059669' }}>3.500.000đ</div>
              <div className="text-xs text-gray-500">~42 triệu/năm</div>
            </div>

            {/* Notes */}
            <div className="p-3 rounded-xl" style={{ background: 'var(--gray-50)' }}>
              <div className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Lightbulb size={14} className="text-amber-500" />
                Lưu ý khi áp dụng:
              </div>
              <ul className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <li>• Ca sáng sẽ bận hơn một chút</li>
                <li>• Nên cho thu ngân học pha chế cơ bản</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={() => setShowOptModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium border"
                style={{ borderColor: 'var(--gray-200)', color: 'var(--text-secondary)' }}>Hủy</button>
              <button onClick={() => {
                handleApply()
                setShowOptModal(false)
                showToast('✅ Đã cập nhật định biên')
              }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: '#2563eb' }}>Áp dụng thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Navigation ─── */}
      <div className="flex gap-3">
        {canBack && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition-all"
            style={{ borderColor: 'var(--gray-200)', color: 'var(--text-secondary)' }}>
            <ChevronLeft size={14} /> Quay lại
          </button>
        )}
        {canNext && (
          <button onClick={() => setStep(s => s + 1)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1 transition-all"
            style={{ background: 'var(--primary)' }}>
            Tiếp theo <ChevronRight size={14} />
          </button>
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
