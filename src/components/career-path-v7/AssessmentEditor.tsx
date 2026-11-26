'use client'

import { useEffect, useState } from 'react'
import type { CareerPathSettings } from '@/lib/career-path/settings'
import type { CareerPlacement } from '@/lib/career-path/placement'
import { applicableSkills, type ApplicableBucket, type SkillAssessmentEntry } from '@/lib/career-path/assessment'
import type { CareerProgressSummary } from '@/lib/career-path/eligibility'
import EligibilityPanel from './EligibilityPanel'
import SkillGroupList, { SkillLevelLegend } from './SkillGroupList'
import { GRADE_BADGE, POSITION_LABEL, SKILL_LEVEL_BADGE, SKILL_LEVEL_LABEL, cardClass, formatDateTime, inputClass } from './career-ui'

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

async function fetchEntries(employeeId: string): Promise<SkillAssessmentEntry[]> {
  const res = await fetch(`/api/career-path/assessments?employee_id=${encodeURIComponent(employeeId)}`, { cache: 'no-store' })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'Không tải được phiếu đánh giá.')
  return json.entries || []
}

const PICK_ON: Record<number, string> = {
  0: 'border-gray-500 bg-gray-500 text-white',
  1: 'border-amber-500 bg-amber-500 text-white',
  2: 'border-sky-600 bg-sky-600 text-white',
  3: 'border-emerald-600 bg-emerald-600 text-white',
}

/** Chọn mức 0–3 bằng một chạm; mức đang có được viền đậm, bấm lại mức vừa chọn để bỏ chọn. */
function LevelPicker({ current, value, onChange }: { current?: number; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex shrink-0 gap-1" role="radiogroup">
      {[0, 1, 2, 3].map((l) => {
        const picked = value === String(l)
        const isCurrent = value === '' && current === l
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={picked}
            title={SKILL_LEVEL_LABEL[l]}
            onClick={() => onChange(picked ? '' : String(l))}
            className={`h-8 w-8 rounded-lg border text-sm font-semibold transition ${
              picked ? PICK_ON[l] : isCurrent ? `${SKILL_LEVEL_BADGE[l]} border-current` : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
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
  const pendingIn = (bucket: ApplicableBucket) =>
    skills.filter((s) => s.bucket === bucket && (scores[s.skill.code] ?? '') !== '').length

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
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
              <span className={`rounded px-1.5 py-0.5 font-bold ${GRADE_BADGE[placement.grade_code]}`}>{placement.grade_code}</span>
              {POSITION_LABEL[placement.primary_position]}
              <span>·</span>
              {summary?.last_assessed_at ? `Đánh giá gần nhất ${formatDateTime(summary.last_assessed_at)}` : 'Chưa có đánh giá'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-gray-50">Đóng</button>
        </div>

        {summary && (
          <div className="mt-4 rounded-xl bg-[#FFF8E8]/70 p-3">
            <EligibilityPanel summary={summary} bare />
          </div>
        )}
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#001D3D]">{editable ? 'Chấm mức kỹ năng' : 'Mức kỹ năng hiện tại'}</h3>
          <SkillLevelLegend />
        </div>
        {editable && <p className="mt-1 text-xs text-gray-500">Mở từng nhóm, bấm 0–3 cho kỹ năng cần cập nhật. Kỹ năng không bấm giữ nguyên mức cũ.</p>}
        {isSelf && <p className="mt-1 text-xs text-amber-700">Bạn không thể tự đánh giá kỹ năng của mình.</p>}
        {!canAssess && !isSelf && <p className="mt-1 text-xs text-gray-500">Vai trò của bạn chỉ được xem, chưa được phép đánh giá.</p>}

        <div className="mt-3">
          <SkillGroupList
            skills={skills}
            levels={levels}
            openBuckets={['main']}
            pendingCount={editable ? pendingIn : undefined}
            renderAction={
              editable
                ? (code) => (
                    <LevelPicker current={levels[code]?.level} value={scores[code] ?? ''} onChange={(v) => setScores({ ...scores, [code]: v })} />
                  )
                : undefined
            }
          />
        </div>

        {editable && (
          <div className="sticky bottom-0 -mx-4 mt-4 space-y-2 border-t border-gray-100 bg-white/95 px-4 pb-1 pt-3 backdrop-blur sm:-mx-5 sm:px-5">
            <textarea className={inputClass} rows={1} placeholder="Nhận xét (không bắt buộc)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">{filled === 0 ? 'Chưa chọn mức mới nào' : `Đã chọn mức mới cho ${filled} kỹ năng`}</span>
              <button type="button" disabled={saving || filled === 0} onClick={() => void save()} className="rounded-lg bg-[#001D3D] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                {saving ? 'Đang lưu…' : 'Lưu phiếu đánh giá'}
              </button>
            </div>
          </div>
        )}
        {message && <p className={`mt-2 text-sm ${message.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>}
      </section>

      <details className={`${cardClass} group`}>
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-[#001D3D]">
          Lịch sử đánh giá ({entries.length})
          <span className="text-gray-400 transition group-open:rotate-90">›</span>
        </summary>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Chưa có phiếu đánh giá nào.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="rounded-lg border border-gray-100 p-2.5 text-sm">
                <div className="text-xs text-gray-500">{formatDateTime(e.assessed_at)} · {e.assessed_by_name} · {Object.keys(e.scores).length} kỹ năng</div>
                {e.note && <p className="mt-1 text-sm text-[#001D3D]">{e.note}</p>}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Object.entries(e.scores).map(([code, level]) => (
                    <span key={code} className={`rounded px-1.5 py-0.5 text-xs ${SKILL_LEVEL_BADGE[level]}`}>{code}: {level}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  )
}
