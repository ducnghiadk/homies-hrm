'use client'

import { useState } from 'react'
import type { ViolationType, EvaluatorRole } from '@/lib/kpi-types'
import ViolationTypeSelector from './ViolationTypeSelector'

interface Props {
  employees: { id: string; name: string; avatar?: string }[]
  storeId: string
  loggedBy: string
  loggedByRole: EvaluatorRole
  onSubmit: (data: {
    employee_id: string
    store_id: string
    violation_type_id: string
    logged_by: string
    logged_by_role: EvaluatorRole
    log_mode: 'realtime' | 'end_of_month'
    occurred_at: string
    description: string
    evidence_url?: string
  }) => void
  onCancel: () => void
}

export default function ViolationLogForm({ employees, storeId, loggedBy, loggedByRole, onSubmit, onCancel }: Props) {
  const [step, setStep] = useState(1) // 1: employee, 2: type, 3: details, 4: confirm
  const [empId, setEmpId] = useState('')
  const [selectedType, setSelectedType] = useState<ViolationType | null>(null)
  const [logMode, setLogMode] = useState<'realtime' | 'end_of_month'>('realtime')
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16))
  const [description, setDescription] = useState('')

  const selectedEmp = employees.find(e => e.id === empId)

  const handleSubmit = () => {
    if (!empId || !selectedType) return
    onSubmit({
      employee_id: empId,
      store_id: storeId,
      violation_type_id: selectedType.id,
      logged_by: loggedBy,
      logged_by_role: loggedByRole,
      log_mode: logMode,
      occurred_at: new Date(occurredAt).toISOString(),
      description: description || selectedType.name,
    })
  }

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex-1 h-1 rounded-full transition-all"
            style={{ background: s <= step ? 'var(--primary)' : 'var(--gray-200)' }} />
        ))}
      </div>

      {/* Step 1: Select employee */}
      {step === 1 && (
        <div className="space-y-2 animate-fade-in">
          <h4 className="text-sm font-bold">1. Chọn nhân viên</h4>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {employees.map(emp => (
              <button key={emp.id} onClick={() => { setEmpId(emp.id); setStep(2) }}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-all"
                style={{
                  background: empId === emp.id ? 'var(--primary-light)' : 'var(--gray-50)',
                  border: empId === emp.id ? '2px solid var(--primary)' : '2px solid transparent',
                }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: 'var(--gray-200)' }}>
                  {emp.avatar || emp.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold">{emp.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select violation type */}
      {step === 2 && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold">2. Chọn loại lỗi</h4>
            <button onClick={() => setStep(1)} className="text-xs" style={{ color: 'var(--primary)' }}>← Quay lại</button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <ViolationTypeSelector
              selected={selectedType?.id}
              onSelect={vt => { setSelectedType(vt); setDescription(vt.description); setStep(3) }}
            />
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && selectedType && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold">3. Chi tiết</h4>
            <button onClick={() => setStep(2)} className="text-xs" style={{ color: 'var(--primary)' }}>← Quay lại</button>
          </div>

          {/* Selected info */}
          <div className="p-2 rounded-xl text-xs" style={{ background: 'var(--gray-50)' }}>
            <strong>{selectedEmp?.name}</strong> · {selectedType.code}: {selectedType.name}
            <span className="text-error-600 font-bold ml-1">(-{selectedType.penalty_points})</span>
          </div>

          {/* Critical warning */}
          {selectedType.severity === 'critical' && (
            <div className="p-2 rounded-xl text-xs font-semibold" style={{ background: '#fee2e2', color: '#991b1b' }}>
              ⚠️ Đây là lỗi nghiêm trọng! CEO sẽ được thông báo.
            </div>
          )}

          {/* Log mode */}
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Chế độ log</label>
            <div className="flex gap-2">
              {(['realtime', 'end_of_month'] as const).map(mode => (
                <button key={mode} onClick={() => setLogMode(mode)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: logMode === mode ? 'var(--primary)' : 'var(--gray-100)',
                    color: logMode === mode ? '#fff' : 'var(--text-secondary)',
                  }}>
                  {mode === 'realtime' ? '⚡ Real-time' : '📅 Bổ sung cuối tháng'}
                </button>
              ))}
            </div>
          </div>

          {/* Occurred at */}
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Thời điểm xảy ra</label>
            <input type="datetime-local" value={occurredAt} onChange={e => setOccurredAt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: '1px solid var(--gray-200)' }} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Mô tả chi tiết</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ border: '1px solid var(--gray-200)' }} />
          </div>

          <button onClick={() => setStep(4)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--primary)' }}>
            Tiếp theo →
          </button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && selectedType && (
        <div className="space-y-3 animate-fade-in">
          <h4 className="text-sm font-bold">4. Xác nhận</h4>
          <div className="card p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Nhân viên</span>
              <span className="text-xs font-bold">{selectedEmp?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loại lỗi</span>
              <span className="text-xs font-bold">{selectedType.code}: {selectedType.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Điểm trừ</span>
              <span className="text-xs font-black text-error-600">-{selectedType.penalty_points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Chế độ</span>
              <span className="text-xs font-semibold">{logMode === 'realtime' ? '⚡ Real-time' : '📅 Cuối tháng'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Thời điểm</span>
              <span className="text-xs font-semibold">{new Date(occurredAt).toLocaleString('vi-VN')}</span>
            </div>
            {description && (
              <div className="text-xs pt-1" style={{ borderTop: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mô tả: </span>{description}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(3)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
              ← Quay lại
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#D9381E' }}>
              ⚠️ Ghi nhận lỗi
            </button>
          </div>
          <button onClick={onCancel} className="w-full text-center text-xs py-1" style={{ color: 'var(--text-muted)' }}>
            Hủy bỏ
          </button>
        </div>
      )}
    </div>
  )
}
