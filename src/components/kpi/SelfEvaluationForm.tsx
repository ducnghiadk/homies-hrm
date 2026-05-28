'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import CriteriaInput from './CriteriaInput'
import EvaluationScorePreview from './EvaluationScorePreview'
import { mockKPICategories, mockKPICriteria } from '@/lib/mock-data-kpi'
import { calculateCategoryScore, determineGrade } from '@/lib/kpi-evaluation-service'
import type { EvaluationScore, CategoryScore, KPIOptionType } from '@/lib/kpi-types'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from 'sonner'

interface Props {
  optionType: KPIOptionType
  employeeId: string
  period: string
  existingScores?: EvaluationScore[]
  violationScore: number
  onSubmit: (scores: EvaluationScore[], comment?: string) => void
  onCancel?: () => void
  /** localStorage key for auto-save draft */
  draftKey?: string
  /** Callback with timestamp string when auto-saved */
  onAutoSave?: (timestamp: string) => void
}

export default function SelfEvaluationForm({
  optionType, existingScores, violationScore, onSubmit, onCancel,
  draftKey, onAutoSave,
}: Props) {
  const categories = mockKPICategories.filter(c => c.option_type === optionType && c.is_active)
  const criteria = mockKPICriteria.filter(c => c.is_active)
  const restoredRef = useRef(false)
  const restoredDraft = useMemo(() => {
    if (!draftKey || typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem(draftKey)
      return saved ? JSON.parse(saved) as { scores: Record<string, number>; comment: string } : null
    } catch {
      return null
    }
  }, [draftKey])

  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (restoredDraft?.scores && Object.keys(restoredDraft.scores).length > 0) {
      return restoredDraft.scores
    }
    const init: Record<string, number> = {}
    existingScores?.forEach(s => { init[s.criteria_id] = s.final_score })
    return init
  })
  const [comment, setComment] = useState(() => restoredDraft?.comment || '')
  const [showConfirm, setShowConfirm] = useState(false)

  // Restore draft from localStorage on mount
  useEffect(() => {
    if (!restoredDraft || restoredRef.current) return
    restoredRef.current = true
    if (restoredDraft.scores && Object.keys(restoredDraft.scores).length > 0) {
      toast.info('📝 Đã khôi phục bản nháp từ phiên trước')
    }
  }, [restoredDraft])

  // Auto-save to localStorage with 2s debounce
  useEffect(() => {
    if (!draftKey) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ scores, comment }))
        const now = new Date()
        const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        onAutoSave?.(ts)
      } catch { /* quota exceeded, ignore */ }
    }, 2000)
    return () => clearTimeout(timer)
  }, [scores, comment, draftKey, onAutoSave])

  const setScore = (criteriaId: string, value: number) => {
    setScores(prev => ({ ...prev, [criteriaId]: value }))
  }

  // Calculate real-time preview
  const previewCategories = useMemo<CategoryScore[]>(() => {
    return categories.map(cat => {
      const catCriteria = criteria.filter(c => c.category_id === cat.id)
      const catScores: EvaluationScore[] = catCriteria.map(crit => {
        const val = scores[crit.id] ?? 0
        return {
          criteria_id: crit.id,
          self_score: cat.type === 'auto' ? undefined : val,
          final_score: cat.type === 'auto' ? val : val,
          source: cat.type === 'auto' ? 'auto' : 'self',
        }
      })
      const raw = calculateCategoryScore(catScores, catCriteria)
      return {
        category_id: cat.id,
        category_name: cat.name,
        weight: cat.weight,
        raw_score: cat.type === 'deduction' ? violationScore : raw,
        weighted_score: Math.round((cat.type === 'deduction' ? violationScore : raw) * cat.weight / 100),
        scores: catScores,
      }
    })
  }, [scores, categories, criteria, violationScore])

  const totalScore = previewCategories.reduce((sum, c) => sum + c.weighted_score, 0)
  const gradeCode = determineGrade(totalScore)

  // Validation: all manual criteria must have scores
  const manualCriteria = criteria.filter(c => {
    const cat = categories.find(ct => ct.id === c.category_id)
    return cat && cat.type !== 'auto' && cat.type !== 'deduction'
  })
  const allFilled = manualCriteria.every(c => (scores[c.id] ?? 0) > 0)

  const handleSubmit = () => {
    const evalScores: EvaluationScore[] = Object.entries(scores).map(([criteriaId, val]) => ({
      criteria_id: criteriaId,
      self_score: val,
      final_score: val,
      source: 'self' as const,
    }))
    onSubmit(evalScores, comment || undefined)
  }

  return (
    <div className="space-y-4">
      {/* Real-time preview */}
      <EvaluationScorePreview
        categoryScores={previewCategories}
        violationScore={violationScore}
        totalScore={totalScore}
        gradeCode={gradeCode}
      />

      {/* Category forms */}
      {categories.map(cat => {
        const catCriteria = criteria.filter(c => c.category_id === cat.id)
        if (catCriteria.length === 0 && cat.type !== 'deduction') return null

        return (
          <div key={cat.id} className="card overflow-hidden">
            <div className="px-3 py-2 flex items-center gap-2"
              style={{ background: 'var(--gray-50)' }}>
              <span>{cat.icon}</span>
              <span className="text-xs font-bold flex-1">{cat.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                {cat.weight}%
              </span>
            </div>

            <div className="px-3 py-1 divide-y" style={{ borderColor: 'var(--gray-50)' }}>
              {cat.type === 'deduction' ? (
                <div className="py-2 text-center">
                  <span className="text-2xl font-black" style={{
                    color: violationScore >= 80 ? '#1E9E57' : violationScore >= 60 ? '#F6C85F' : '#D9381E',
                  }}>
                    {violationScore}/100
                  </span>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Tự động tính từ lỗi vi phạm
                  </p>
                </div>
              ) : (
                catCriteria.map(crit => (
                  <CriteriaInput
                    key={crit.id}
                    label={crit.name}
                    description={crit.description}
                    type={cat.type === 'auto' ? 'percent' : (crit.max_value <= 5 ? 'star' : 'number')}
                    value={scores[crit.id] ?? 0}
                    maxValue={crit.max_value}
                    readOnly={cat.type === 'auto'}
                    onChange={val => setScore(crit.id, val)}
                    source={cat.type === 'auto' ? 'auto' : undefined}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}

      {/* Comment */}
      <div className="card p-3">
        <label className="text-xs font-bold block mb-1">💬 Nhận xét chung (tuỳ chọn)</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          rows={3} placeholder="Nhận xét về tháng làm việc..."
          className="w-full px-3 py-2 rounded-lg text-xs resize-none outline-none"
          style={{ border: '1px solid var(--gray-200)' }} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onCancel && (
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
            Huỷ
          </button>
        )}
        <button onClick={() => setShowConfirm(true)} disabled={!allFilled}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: allFilled ? 'var(--primary)' : 'var(--gray-300)' }}>
          ✅ Gửi đánh giá
        </button>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); handleSubmit() }}
        title="Xác nhận gửi tự đánh giá"
        description={`Điểm dự kiến: ${totalScore} (${gradeCode}). Sau khi gửi, bạn không thể chỉnh sửa.`}
        confirmLabel="Gửi đánh giá"
        cancelLabel="Quay lại"
      />
    </div>
  )
}
