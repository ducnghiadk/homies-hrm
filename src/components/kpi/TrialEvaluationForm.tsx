'use client'

import { useState } from 'react'
import CriteriaInput from './CriteriaInput'
import { mockKPICategories, mockKPICriteria } from '@/lib/mock-data-kpi'
import type { EvaluationScore, EvaluatorRole, KPIEvaluation } from '@/lib/kpi-types'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Props {
  evaluation: KPIEvaluation
  evaluatorRole: EvaluatorRole
  existingEvaluatorScores?: {
    evaluator_id: string
    evaluator_role: EvaluatorRole
    scores: EvaluationScore[]
    comment?: string
    submitted_at: string
  }[]
  onSubmit: (scores: EvaluationScore[], comment?: string) => void
}

export default function TrialEvaluationForm({
  evaluation, evaluatorRole, existingEvaluatorScores, onSubmit,
}: Props) {
  const categories = mockKPICategories.filter(
    c => c.option_type === evaluation.option_type && c.is_active && c.type !== 'deduction',
  )
  const allCriteria = mockKPICriteria.filter(c => c.is_active)

  const [scores, setScores] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="space-y-4">
      {/* Other evaluators' status */}
      {existingEvaluatorScores && existingEvaluatorScores.length > 0 && (
        <div className="card p-3">
          <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
            👥 Người đánh giá khác
          </h4>
          {existingEvaluatorScores.map((es, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="text-[10px] font-bold capitalize">{es.evaluator_role}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                — {new Date(es.submitted_at).toLocaleDateString('vi-VN')}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: '#dcfce7', color: '#166534' }}>
                ✅ Đã đánh giá
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Your role badge */}
      <div className="card p-3 flex items-center gap-2"
        style={{ background: '#eff6ff' }}>
        <span className="text-sm">🎭</span>
        <span className="text-xs font-bold capitalize" style={{ color: '#1d4ed8' }}>
          Vai trò của bạn: {evaluatorRole}
        </span>
      </div>

      {/* Category criteria */}
      {categories.map(cat => {
        const catCriteria = allCriteria.filter(c => c.category_id === cat.id)
        if (catCriteria.length === 0) return null

        return (
          <div key={cat.id} className="card overflow-hidden">
            <div className="px-3 py-2 flex items-center gap-2"
              style={{ background: 'var(--gray-50)' }}>
              <span>{cat.icon}</span>
              <span className="text-xs font-bold flex-1">{cat.name}</span>
            </div>
            <div className="px-3 py-1 divide-y" style={{ borderColor: 'var(--gray-50)' }}>
              {catCriteria.map(crit => (
                <CriteriaInput
                  key={crit.id}
                  label={crit.name}
                  description={crit.description}
                  type={crit.max_value <= 5 ? 'star' : 'number'}
                  value={scores[crit.id] ?? 0}
                  maxValue={crit.max_value}
                  readOnly={cat.type === 'auto'}
                  onChange={val => setScores(prev => ({ ...prev, [crit.id]: val }))}
                  source={cat.type === 'auto' ? 'auto' : undefined}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Comment */}
      <div className="card p-3">
        <label className="text-xs font-bold block mb-1">💬 Nhận xét (tuỳ chọn)</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          rows={3} placeholder="Nhận xét về nhân viên thử việc..."
          className="w-full px-3 py-2 rounded-lg text-xs resize-none outline-none"
          style={{ border: '1px solid var(--gray-200)' }} />
      </div>

      {/* Submit */}
      <button onClick={() => setShowConfirm(true)}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ background: 'var(--primary)' }}>
        ✅ Gửi đánh giá thử việc
      </button>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          const evalScores: EvaluationScore[] = Object.entries(scores).map(([id, val]) => ({
            criteria_id: id, final_score: val, source: evaluatorRole as EvaluationScore['source'],
          }))
          onSubmit(evalScores, comment || undefined)
          setShowConfirm(false)
        }}
        title="Xác nhận gửi đánh giá thử việc"
        description="Sau khi gửi, bạn không thể chỉnh sửa."
        confirmLabel="Gửi" cancelLabel="Huỷ" />
    </div>
  )
}
