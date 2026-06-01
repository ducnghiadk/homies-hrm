'use client'

import { useState, useMemo } from 'react'
import { mockEmployees } from '@/lib/mock-data'
import { getViolationTypes } from '@/lib/mock-data-kpi'
import { logViolation } from '@/lib/violation-service'
import { toast } from 'sonner'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ViolationSeverity } from '@/lib/kpi-types'

interface EmployeeViolation {
  violation_type_id: string
  description: string
}

interface EmployeeEntry {
  employee_id: string
  name: string
  violations: EmployeeViolation[]
  expanded: boolean
}

interface Props {
  storeId: string
  loggedBy: string
}

const SEVERITY_CONFIG: Record<ViolationSeverity, { label: string; color: string; icon: string }> = {
  minor:    { label: 'Nhẹ',          color: '#eab308', icon: '🟡' },
  medium:   { label: 'Trung bình',   color: '#f97316', icon: '🟠' },
  major:    { label: 'Nặng',         color: '#D9381E', icon: '🔴' },
  critical: { label: 'Nghiêm trọng', color: '#991b1b', icon: '⚫' },
}

const SHIFT_OPTIONS = [
  { value: 'morning',   label: 'Ca sáng (6:00-14:00)' },
  { value: 'afternoon', label: 'Ca chiều (14:00-22:00)' },
  { value: 'evening',   label: 'Ca tối (18:00-23:00)' },
] as const

export default function BatchViolationForm({ storeId, loggedBy }: Props) {
  const [shift, setShift] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const violationTypes = useMemo(() => getViolationTypes(), [])
  const storeEmployees = useMemo(() =>
    mockEmployees.filter(e => e.store_id === storeId && e.role === 'employee'),
  [storeId])

  const [entries, setEntries] = useState<EmployeeEntry[]>(() =>
    storeEmployees.map(e => ({
      employee_id: e.id, name: e.full_name,
      violations: [], expanded: false,
    }))
  )

  const totalViolations = entries.reduce((s, e) => s + e.violations.length, 0)
  const totalPoints = entries.reduce((s, e) =>
    s + e.violations.reduce((vs, v) => vs + (violationTypes.find(vt => vt.id === v.violation_type_id)?.penalty_points ?? 0), 0),
  0)
  const affectedCount = entries.filter(e => e.violations.length > 0).length

  const addViolation = (empId: string, vtId: string, desc: string) => {
    setEntries(prev => prev.map(e =>
      e.employee_id === empId ? { ...e, violations: [...e.violations, { violation_type_id: vtId, description: desc }] } : e
    ))
    setAddingFor(null)
  }

  const removeViolation = (empId: string, idx: number) => {
    setEntries(prev => prev.map(e =>
      e.employee_id === empId ? { ...e, violations: e.violations.filter((_, i) => i !== idx) } : e
    ))
  }

  const toggleExpand = (empId: string) => {
    setEntries(prev => prev.map(e =>
      e.employee_id === empId ? { ...e, expanded: !e.expanded } : e
    ))
  }

  const handleSubmit = () => {
    let count = 0
    entries.forEach(entry => {
      entry.violations.forEach(v => {
        logViolation({
          employee_id: entry.employee_id,
          store_id: storeId,
          violation_type_id: v.violation_type_id,
          logged_by: loggedBy,
          logged_by_role: 'manager',
          log_mode: 'end_of_month',
          occurred_at: `${date}T${shift === 'morning' ? '08' : shift === 'afternoon' ? '16' : '20'}:00:00Z`,
          description: v.description || violationTypes.find(vt => vt.id === v.violation_type_id)?.name || '',
        })
        count++
      })
    })
    toast.success(`✅ Đã ghi nhận ${count} lỗi cho ${affectedCount} nhân viên`)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">✅</div>
        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Đã ghi nhận thành công!</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {totalViolations} lỗi cho {affectedCount} nhân viên
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Shift + date */}
      <div className="flex gap-2">
        <select value={shift} onChange={e => setShift(e.target.value as typeof shift)}
          className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold outline-none"
          style={{ border: '1px solid var(--gray-200)' }}>
          {SHIFT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm font-semibold outline-none"
          style={{ border: '1px solid var(--gray-200)' }} />
      </div>

      {/* Employee list */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
          👥 Nhân viên trong ca ({storeEmployees.length} người)
        </h4>
        {entries.map(entry => {
          const vioCount = entry.violations.length
          const points = entry.violations.reduce((s, v) =>
            s + (violationTypes.find(vt => vt.id === v.violation_type_id)?.penalty_points ?? 0), 0)

          return (
            <div key={entry.employee_id} className="card overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => vioCount > 0 ? toggleExpand(entry.employee_id) : null}>
                <span className="text-lg">👤</span>
                <span className="flex-1 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                {vioCount > 0 && (
                  <>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#fef2f2', color: '#D9381E' }}>
                      {vioCount} lỗi • -{points}đ
                    </span>
                    {entry.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </>
                )}
                <button onClick={e => { e.stopPropagation(); setAddingFor(entry.employee_id) }}
                  className="text-[10px] px-2 py-1 rounded-lg font-bold"
                  style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                  <Plus size={12} />
                </button>
              </div>

              {/* Expanded violations */}
              {entry.expanded && vioCount > 0 && (
                <div className="px-3 pb-3 space-y-1 border-t" style={{ borderColor: 'var(--gray-100)' }}>
                  {entry.violations.map((v, i) => {
                    const vt = violationTypes.find(vt2 => vt2.id === v.violation_type_id)
                    const cfg = SEVERITY_CONFIG[vt?.severity ?? 'minor']
                    return (
                      <div key={i} className="flex items-center gap-2 text-[11px] py-1">
                        <span>{cfg.icon}</span>
                        <span className="flex-1">{vt?.name ?? v.violation_type_id}</span>
                        <span className="font-bold" style={{ color: cfg.color }}>-{vt?.penalty_points ?? 0}đ</span>
                        <button onClick={() => removeViolation(entry.employee_id, i)}>
                          <X size={12} className="text-gray-400 hover:text-error-500" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add violation dialog */}
      {addingFor && (
        <AddViolationDialog
          employeeName={entries.find(e => e.employee_id === addingFor)?.name ?? ''}
          violationTypes={violationTypes}
          onAdd={(vtId, desc) => addViolation(addingFor, vtId, desc)}
          onClose={() => setAddingFor(null)}
        />
      )}

      {/* Summary */}
      <div className="card p-3 space-y-1.5">
        <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>📊 Tổng kết ca này</h4>
        <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
          • {totalViolations} lỗi cho {affectedCount} nhân viên
        </div>
        <div className="text-xs" style={{ color: '#D9381E' }}>• Tổng điểm trừ: -{totalPoints} điểm</div>
        <div className="text-xs" style={{ color: '#1E9E57' }}>
          • {entries.length - affectedCount} nhân viên không có lỗi ✅
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 rounded-xl text-sm font-bold"
          style={{ border: '1px solid var(--gray-200)', color: 'var(--text-secondary)' }}
          onClick={() => setEntries(prev => prev.map(e => ({ ...e, violations: [] })))}>
          Hủy
        </button>
        <button disabled={totalViolations === 0} onClick={handleSubmit}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{ background: 'var(--primary)' }}>
          Xác nhận & Gửi tất cả
        </button>
      </div>
    </div>
  )
}

// ── Inline Add Dialog ──
function AddViolationDialog({ employeeName, violationTypes, onAdd, onClose }: {
  employeeName: string
  violationTypes: { id: string; name: string; severity: ViolationSeverity; penalty_points: number }[]
  onAdd: (vtId: string, desc: string) => void
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const bySeverity = violationTypes.reduce((acc, vt) => {
    if (!acc[vt.severity]) acc[vt.severity] = []
    acc[vt.severity].push(vt)
    return acc
  }, {} as Record<string, typeof violationTypes>)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative w-full max-w-lg rounded-t-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto animate-slide-up"
        style={{ background: 'var(--bg-primary)' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: 'var(--gray-300)' }} />
        <h3 className="text-sm font-bold mb-3">➕ Thêm lỗi cho: {employeeName}</h3>

        <div className="space-y-3">
          {Object.entries(bySeverity).map(([sev, types]) => {
            const cfg = SEVERITY_CONFIG[sev as ViolationSeverity]
            return (
              <div key={sev}>
                <div className="text-[11px] font-bold mb-1" style={{ color: cfg.color }}>
                  {cfg.icon} {cfg.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {types.map(vt => (
                    <button key={vt.id} onClick={() => onAdd(vt.id, note)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105"
                      style={{ background: `${cfg.color}10`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                      {vt.name} (-{vt.penalty_points}đ)
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tùy chọn)..."
            className="w-full px-3 py-2 rounded-xl text-xs outline-none"
            style={{ border: '1px solid var(--gray-200)' }} />
        </div>
      </div>
    </div>
  )
}
