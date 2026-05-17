'use client'

import { useState, useMemo } from 'react'
import CriteriaInput from './CriteriaInput'
import ScoreComparison, { ScoreComparisonLegend } from './ScoreComparison'
import ScoreDiffView from './ScoreDiffView'
import { mockKPICategories, mockKPICriteria } from '@/lib/mock-data-kpi'
import { calculateCategoryScore, determineGrade } from '@/lib/kpi-evaluation-service'
import type { EvaluationScore, KPIEvaluation } from '@/lib/kpi-types'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Props {
  evaluation: KPIEvaluation
  onSubmitReview: (scores: EvaluationScore[], comment: string) => void
  onPublish?: () => void
  onSaveDraft?: (scores: EvaluationScore[], comment: string) => void
}

export default function ManagerReviewForm({
  evaluation, onSubmitReview, onPublish, onSaveDraft,
}: Props) {
  const categories = mockKPICategories.filter(c => c.option_type === evaluation.option_type && c.is_active)
  const allCriteria = mockKPICriteria.filter(c => c.is_active)

  const [mgrScores, setMgrScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    evaluation.category_scores.forEach(cat => {
      cat.scores.forEach(s => {
        init[s.criteria_id] = s.manager_score ?? s.self_score ?? s.final_score
      })
    })
    return init
  })
  const [comment, setComment] = useState(evaluation.manager_comment || '')
  const [showConfirm, setShowConfirm] = useState(false)

  const setScore = (criteriaId: string, value: number) => {
    setMgrScores(prev => ({ ...prev, [criteriaId]: value }))
  }

  const previewTotal = useMemo(() => {
    let total = 0
    for (const cat of categories) {
      const catCriteria = allCriteria.filter(c => c.category_id === cat.id)
      const catDef = mockKPICategories.find(c => c.id === cat.id)
      if (catDef?.type === 'deduction') {
        total += Math.round(evaluation.violation_score * cat.weight / 100)
        continue
      }
      const catScores: EvaluationScore[] = catCriteria.map(crit => ({
        criteria_id: crit.id,
        manager_score: mgrScores[crit.id] ?? 0,
        final_score: mgrScores[crit.id] ?? 0,
        source: catDef?.type === 'auto' ? 'auto' : 'manager',
      }))
      const raw = calculateCategoryScore(catScores, catCriteria)
      total += Math.round(raw * cat.weight / 100)
    }
    return total
  }, [mgrScores, categories, allCriteria, evaluation.violation_score])

  const gradeCode = determineGrade(previewTotal)

  const handleSubmit = () => {
    const evalScores: EvaluationScore[] = Object.entries(mgrScores).map(([criteriaId, val]) => ({
      criteria_id: criteriaId,
      manager_score: val,
      final_score: val,
      source: 'manager' as const,
    }))
    onSubmitReview(evalScores, comment)
  }

  return (
    <div className="space-y-4">
      {/* Comparison header */}
      <div className="card p-3 flex items-center gap-3">
        <div className="text-center flex-1">
          <div className="text-lg font-black" style={{ color: '#3b82f6' }}>
            {evaluation.total_score}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tự đánh giá</div>
        </div>
        <div className="text-lg font-bold" style={{ color: 'var(--text-muted)' }}>→</div>
        <div className="text-center flex-1">
          <div className="text-lg font-black" style={{ color: '#7c3aed' }}>
            {previewTotal}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Manager ({gradeCode})</div>
        </div>
      </div>

      {/* Category by category */}
      {categories.map(cat => {
        const catCriteria = allCriteria.filter(c => c.category_id === cat.id)
        const catDef = mockKPICategories.find(c => c.id === cat.id)
        const existingCat = evaluation.category_scores.find(c => c.category_id === cat.id)

        return (
          <div key={cat.id} className="card overflow-hidden">
            <div className="px-3 py-2 flex items-center gap-2"
              style={{ background: 'var(--gray-50)' }}>
              <span>{cat.icon}</span>
              <span className="text-xs font-bold flex-1">{cat.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}>{cat.weight}%</span>
            </div>

            <div className="px-3 py-2">
              {catDef?.type === 'deduction' ? (
                <div className="text-center py-2">
                  <span className="text-xl font-black" style={{
                    color: evaluation.violation_score >= 80 ? '#10b981' : '#ef4444',
                  }}>{evaluation.violation_score}/100</span>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tự động</p>
                </div>
              ) : catDef?.type === 'auto' ? (
                <div className="space-y-1">
                  {catCriteria.map(crit => (
                    <CriteriaInput key={crit.id} label={crit.name} description={crit.description}
                      type="percent" value={mgrScores[crit.id] ?? 0} maxValue={100}
                      readOnly source="auto" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <ScoreComparisonLegend />
                  {catCriteria.map(crit => {
                    const existing = existingCat?.scores.find(s => s.criteria_id === crit.id)
                    return (
                      <div key={crit.id}>
                        <ScoreComparison
                          criteriaId={crit.id} criteriaName={crit.name}
                          selfScore={existing?.self_score} managerScore={mgrScores[crit.id]}
                          maxValue={crit.max_value}
                        />
                        <CriteriaInput label="" type={crit.max_value <= 5 ? 'star' : 'number'}
                          value={mgrScores[crit.id] ?? 0} maxValue={crit.max_value}
                          onChange={val => setScore(crit.id, val)} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Score Diff Summary */}
      <ScoreDiffView
        categories={categories}
        criteria={allCriteria}
        selfScores={evaluation.category_scores.flatMap(c => c.scores.map(s => ({
          criteria_id: s.criteria_id,
          self_score: s.self_score,
          final_score: s.self_score ?? s.final_score,
          source: 'self' as const,
        })))}
        managerScores={Object.entries(mgrScores).map(([criteriaId, val]) => ({
          criteria_id: criteriaId,
          manager_score: val,
          final_score: val,
          source: 'manager' as const,
        }))}
        deductionPoints={evaluation.violation_score < 100 ? Math.round((100 - evaluation.violation_score) * (categories.find(c => c.type === 'deduction')?.weight ?? 0) / 100) : 0}
        onManagerScoreChange={(criteriaId, val) => setScore(criteriaId, val)}
      />

      {/* Self comment */}
      {evaluation.self_comment && (
        <div className="card p-3 text-xs" style={{ background: '#eff6ff', color: '#1e40af' }}>
          <strong>💬 NV tự nhận xét:</strong> {evaluation.self_comment}
        </div>
      )}

      {/* Manager comment */}
      <div className="card p-3">
        <label className="text-xs font-bold block mb-1">💬 Nhận xét của Manager *</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          rows={3} placeholder="Nhận xét về hiệu suất nhân viên..."
          className="w-full px-3 py-2 rounded-lg text-xs resize-none outline-none"
          style={{ border: '1px solid var(--gray-200)' }} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onSaveDraft && (
          <button onClick={() => {
            const evalScores = Object.entries(mgrScores).map(([criteriaId, val]) => ({
              criteria_id: criteriaId, manager_score: val, final_score: val, source: 'manager' as const,
            }))
            onSaveDraft(evalScores, comment)
          }}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
            💾 Lưu nháp
          </button>
        )}
        <button onClick={() => setShowConfirm(true)} disabled={!comment.trim()}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
          style={{ background: comment.trim() ? '#7c3aed' : 'var(--gray-300)' }}>
          ✅ Hoàn thành review
        </button>
      </div>

      {onPublish && (
        <button onClick={onPublish}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
          style={{ background: '#10b981' }}>
          📢 Công bố kết quả
        </button>
      )}

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); handleSubmit() }}
        title="Xác nhận hoàn thành review"
        description={`Điểm Manager: ${previewTotal}. Nhận xét sẽ hiện cho nhân viên khi công bố.`}
        confirmLabel="Hoàn thành" cancelLabel="Quay lại" />
    </div>
  )
}
