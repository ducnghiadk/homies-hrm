'use client'

import { useEffect, useState } from 'react'
import { CAREER_GRADE_CODES, type CareerGradeCode, type CareerPathSettings, type CareerPositionCode } from '@/lib/career-path/settings'
import type { CareerGradeHistoryEntry, CareerPlacement, EntryAssessmentStatus } from '@/lib/career-path/placement'
import { GRADE_BADGE, POSITION_LABEL, cardClass, inputClass } from './career-ui'

export interface PlacementEmployee {
  id: string
  full_name: string
  employee_code?: string
  hire_date?: string
}

interface Props {
  employee: PlacementEmployee
  placement: CareerPlacement | null
  settings: CareerPathSettings
  onSaved: () => void
  onClose: () => void
}

const today = () => {
  const d = new Date(Date.now() + 7 * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}

const KIND_LABEL: Record<CareerGradeHistoryEntry['kind'], string> = {
  initial: 'Xếp bậc ban đầu',
  correction: 'Điều chỉnh',
  promotion: 'Nâng bậc',
}

export default function PlacementEditor({ employee, placement, settings, onSaved, onClose }: Props) {
  const [position, setPosition] = useState<CareerPositionCode>(placement?.primary_position || 'barista')
  const [grade, setGrade] = useState<CareerGradeCode>(placement?.grade_code || 'T0')
  const [effectiveDate, setEffectiveDate] = useState(placement?.effective_date || today())
  const [carriedHours, setCarriedHours] = useState(String(placement?.carried_hours ?? 0))
  const [assessment, setAssessment] = useState<EntryAssessmentStatus>(placement?.entry_assessment || 'pending')
  const [note, setNote] = useState(placement?.note || '')
  const [reason, setReason] = useState('')
  const [history, setHistory] = useState<CareerGradeHistoryEntry[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(`/api/career-path/placements?employee_id=${encodeURIComponent(employee.id)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => { if (alive && json.success) setHistory(json.history || []) })
      .catch(() => {})
    return () => { alive = false }
  }, [employee.id])

  const changingGrade = Boolean(placement && (placement.grade_code !== grade || placement.primary_position !== position))
  const gradeInfo = settings.grades.find((g) => g.code === grade)

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/career-path/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.id,
          primary_position: position,
          grade_code: grade,
          effective_date: effectiveDate,
          carried_hours: Number(carriedHours) || 0,
          entry_assessment: assessment,
          note,
          reason,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Không lưu được.')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không lưu được.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[#001D3D]">{employee.full_name}</h2>
          <p className="text-xs text-gray-500">
            {employee.employee_code || employee.id}
            {employee.hire_date ? ` · vào làm ${new Date(employee.hire_date).toLocaleDateString('vi-VN')}` : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-gray-500">Đóng</button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-gray-600">Vị trí chính</span>
          <select className={`${inputClass} mt-1`} value={position} onChange={(e) => setPosition(e.target.value as CareerPositionCode)}>
            {(Object.keys(POSITION_LABEL) as CareerPositionCode[]).map((p) => <option key={p} value={p}>{POSITION_LABEL[p]}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Bậc theo năng lực thực tế</span>
          <select className={`${inputClass} mt-1`} value={grade} onChange={(e) => setGrade(e.target.value as CareerGradeCode)}>
            {CAREER_GRADE_CODES.map((c) => <option key={c} value={c}>{c} · {settings.grades.find((g) => g.code === c)?.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Ngày bắt đầu tính bậc này</span>
          <input type="date" className={`${inputClass} mt-1`} value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Số giờ đã làm trước khi dùng hệ thống</span>
          <input type="number" min={0} className={`${inputClass} mt-1`} value={carriedHours} onChange={(e) => setCarriedHours(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Bài đánh giá đầu vào</span>
          <select className={`${inputClass} mt-1`} value={assessment} onChange={(e) => setAssessment(e.target.value as EntryAssessmentStatus)}>
            <option value="pending">Chưa đánh giá xác nhận</option>
            <option value="confirmed">Đã đánh giá, bậc đúng</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Ghi chú</span>
          <input className={`${inputClass} mt-1`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: đã làm 1 năm, pha chế thành thạo" />
        </label>
      </div>

      {gradeInfo && <p className="mt-2 text-xs text-gray-500">{gradeInfo.code}: {gradeInfo.description}</p>}

      {changingGrade && (
        <label className="mt-3 block text-sm">
          <span className="font-semibold text-amber-800">Lý do đổi bậc / vị trí (bắt buộc)</span>
          <input className={`${inputClass} mt-1 border-amber-300`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: xếp nhầm lúc đầu, đã kiểm tra lại tay nghề" />
        </label>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex justify-end">
        <button type="button" disabled={saving} onClick={save} className="rounded-lg bg-[#2F6FA8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? 'Đang lưu...' : placement ? 'Lưu thay đổi' : 'Xếp bậc'}
        </button>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <h3 className="text-sm font-bold text-[#001D3D]">Lịch sử bậc</h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Chưa có lịch sử.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-[#001D3D]">{KIND_LABEL[h.kind]}</span>
                  {h.from_grade && <span className={`rounded px-1.5 text-xs font-bold ${GRADE_BADGE[h.from_grade]}`}>{h.from_grade}</span>}
                  {h.from_grade && <span className="text-gray-400">→</span>}
                  <span className={`rounded px-1.5 text-xs font-bold ${GRADE_BADGE[h.to_grade]}`}>{h.to_grade}</span>
                  <span className="text-xs text-gray-500">{POSITION_LABEL[h.to_position]} · hiệu lực {new Date(h.effective_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="text-xs text-gray-500">{h.reason} · {h.decided_by_name}, {new Date(h.created_at).toLocaleString('vi-VN')}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
