'use client'

import { useEffect, useState } from 'react'
import type { CareerPathSettings } from '@/lib/career-path/settings'
import type { CareerPlacement } from '@/lib/career-path/placement'
import { applicableSkills, type ApplicableBucket, type SkillAssessmentEntry } from '@/lib/career-path/assessment'
import type { CareerProgressSummary } from '@/lib/career-path/eligibility'
import EligibilityPanel from './EligibilityPanel'
import { BUCKET_LABEL, GRADE_BADGE, POSITION_LABEL, SKILL_LEVEL_BADGE, SKILL_LEVEL_LABEL, cardClass, formatDateTime, inputClass } from './career-ui'

interface Props {
  employeeName: string
  placement: CareerPlacement
  settings: CareerPathSettings
  summary: CareerProgressSummary | null
  canAssess: boolean
  isSelf: boolean
  onSaved: () => void
  onClose: () => void
}

const BUCKET_ORDER: ApplicableBucket[] = ['common', 'main', 'support', 'second', 'advanced']

async function fetchEntries(employeeId: string): Promise<SkillAssessmentEntry[]> {
  const res = await fetch(`/api/career-path/assessments?employee_id=${encodeURIComponent(employeeId)}`, { cache: 'no-store' })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'Không tải được phiếu đánh giá.')
  return json.entries || []
}

export default function AssessmentEditor({ employeeName, placement, settings, summary, canAssess, isSelf, onSaved, onClose }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState<SkillAssessmentEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const editable = canAssess && !isSelf

  useEffect(() => {
    let alive = true
    fetchEntries(placement.employee_id)
      .then((list) => { if (alive) setEntries(list) })
      .catch(() => { if (alive) setEntries([]) })
    return () => { alive = false }
  }, [placement.employee_id, summary?.assessments_count])

  const skills = applicableSkills(settings, placement.primary_position)
  const levels = summary?.levels || {}
  const filled = Object.values(scores).filter((v) => v !== '').length

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/career-path/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: placement.employee_id, scores, note }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Không lưu được đánh giá.')
      setScores({})
      setNote('')
      setMessage({ kind: 'ok', text: 'Đã lưu phiếu đánh giá.' })
      onSaved()
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Không lưu được đánh giá.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#001D3D]">{employeeName}</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {POSITION_LABEL[placement.primary_position]} ·{' '}
              <span className={`rounded px-1.5 py-0.5 font-bold ${GRADE_BADGE[placement.grade_code]}`}>{placement.grade_code}</span>
              {summary?.last_assessed_at ? ` · Đánh giá gần nhất ${formatDateTime(summary.last_assessed_at)}` : ' · Chưa có đánh giá'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-gray-400">Đóng</button>
        </div>
        {isSelf && <p className="mt-2 text-xs text-amber-700">Bạn không thể tự đánh giá kỹ năng của mình.</p>}
        {!canAssess && !isSelf && <p className="mt-2 text-xs text-gray-500">Vai trò của bạn chỉ được xem, chưa được phép đánh giá.</p>}

        <div className="mt-3 space-y-4">
          {BUCKET_ORDER.map((bucket) => {
            const list = skills.filter((s) => s.bucket === bucket)
            if (list.length === 0) return null
            return (
              <div key={bucket}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{BUCKET_LABEL[bucket]}</h3>
                <ul className="mt-1.5 space-y-1.5">
                  {list.map(({ skill }) => {
                    const cur = levels[skill.code]
                    return (
                      <li key={skill.code} className="grid items-center gap-2 sm:grid-cols-[1fr_auto_170px]">
                        <span className="text-sm text-[#001D3D]">
                          <span className="font-semibold">{skill.code}</span> {skill.name}
                          {skill.standard && <span className="block text-xs text-gray-500">{skill.standard}</span>}
                        </span>
                        <span className={`justify-self-start rounded-md px-2 py-0.5 text-xs font-semibold ${cur ? SKILL_LEVEL_BADGE[cur.level] : 'bg-gray-50 text-gray-400'}`}>
                          {cur ? `Mức ${cur.level}` : 'Chưa chấm'}
                        </span>
                        {editable && (
                          <select className={inputClass} value={scores[skill.code] ?? ''} onChange={(e) => setScores({ ...scores, [skill.code]: e.target.value })}>
                            <option value="">Giữ nguyên</option>
                            {[0, 1, 2, 3].map((l) => <option key={l} value={l}>{SKILL_LEVEL_LABEL[l]}</option>)}
                          </select>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>

        {editable && (
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
            <textarea className={inputClass} rows={2} placeholder="Nhận xét (không bắt buộc)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Đã chọn mức cho {filled} kỹ năng</span>
              <button type="button" disabled={saving || filled === 0} onClick={() => void save()} className="rounded-lg bg-[#001D3D] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Đang lưu…' : 'Lưu phiếu đánh giá'}
              </button>
            </div>
          </div>
        )}
        {message && <p className={`mt-2 text-sm ${message.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>}
      </section>

      {summary && <EligibilityPanel summary={summary} />}

      <section className={cardClass}>
        <h3 className="text-sm font-bold text-[#001D3D]">Lịch sử đánh giá</h3>
        {entries.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">Chưa có phiếu đánh giá nào.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="rounded-lg border border-gray-100 p-2.5 text-sm">
                <div className="text-xs text-gray-500">{formatDateTime(e.assessed_at)} · {e.assessed_by_name}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(e.scores).map(([code, level]) => (
                    <span key={code} className={`rounded px-1.5 py-0.5 text-xs ${SKILL_LEVEL_BADGE[level]}`}>{code}: {level}</span>
                  ))}
                </div>
                {e.note && <p className="mt-1 text-xs text-gray-600">{e.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
