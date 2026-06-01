'use client'

import type { KPICriteria, EvaluationScore, KPICategory } from '@/lib/kpi-types'

interface Props {
  categories: KPICategory[]
  criteria: KPICriteria[]
  selfScores: EvaluationScore[]
  managerScores: EvaluationScore[]
  deductionPoints?: number
  onManagerScoreChange?: (criteriaId: string, score: number) => void
}

function getScoreForCriteria(scores: EvaluationScore[], criteriaId: string): number {
  return scores.find(s => s.criteria_id === criteriaId)?.final_score ?? 0
}

function getDiffColor(diff: number): string {
  if (diff >= 2) return '#D9381E'
  if (diff <= -2) return '#D9381E'
  if (diff > 0) return '#1E9E57'
  if (diff < 0) return '#F6C85F'
  return '#9ca3af'
}

function generateInsight(criteriaName: string, selfScore: number, mgrScore: number): string | null {
  const diff = mgrScore - selfScore
  if (Math.abs(diff) < 2) return null
  if (diff > 0) return `Bạn đánh giá "${criteriaName}" cao hơn NV ${diff} điểm. NV có thể cần feedback cụ thể.`
  return `NV tự đánh giá "${criteriaName}" cao hơn bạn ${-diff} điểm. Xem xét góp ý.`
}

export default function ScoreDiffView({
  categories, criteria, selfScores, managerScores, deductionPoints = 0, onManagerScoreChange,
}: Props) {
  const selfTotal = selfScores.reduce((sum, s) => sum + (s.final_score ?? 0), 0)
  const mgrTotal = managerScores.reduce((sum, s) => sum + (s.final_score ?? 0), 0)

  const insights: string[] = []
  criteria.forEach(c => {
    const s = getScoreForCriteria(selfScores, c.id)
    const m = getScoreForCriteria(managerScores, c.id)
    const ins = generateInsight(c.name, s, m)
    if (ins) insights.push(ins)
  })

  return (
    <div className="space-y-3 animate-fade-in">
      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        ⚖️ So sánh điểm đánh giá
      </h3>

      {categories.filter(cat => cat.type !== 'deduction').map(cat => {
        const catCriteria = criteria.filter(c => c.category_id === cat.id)
        if (catCriteria.length === 0) return null

        return (
          <div key={cat.id} className="card p-3 space-y-2">
            <h4 className="text-xs font-bold flex items-center gap-1" style={{ color: cat.color }}>
              {cat.icon} {cat.name} ({cat.weight}%)
            </h4>
            <div className="divide-y" style={{ borderColor: 'var(--gray-100)' }}>
              {/* Header */}
              <div className="flex items-center gap-2 py-1 text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                <span className="flex-1">Tiêu chí</span>
                <span className="w-10 text-center">NV</span>
                <span className="w-10 text-center">Bạn</span>
                <span className="w-12 text-center">Chênh</span>
              </div>
              {catCriteria.map(cri => {
                const selfVal = getScoreForCriteria(selfScores, cri.id)
                const mgrVal = getScoreForCriteria(managerScores, cri.id)
                const diff = mgrVal - selfVal
                const diffColor = getDiffColor(diff)

                return (
                  <div key={cri.id} className="flex items-center gap-2 py-1.5">
                    <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-primary)' }}>{cri.name}</span>
                    {/* Self score */}
                    <div className="w-10 flex justify-center">
                      {cri.input_type === 'star' ? (
                        <span className="text-[10px] font-bold">⭐{selfVal}</span>
                      ) : (
                        <span className="text-[10px] font-bold">{selfVal}</span>
                      )}
                    </div>
                    {/* Manager score */}
                    <div className="w-10 flex justify-center">
                      {onManagerScoreChange && cri.input_type === 'star' ? (
                        <button onClick={() => {
                          const next = mgrVal >= (cri.max_value || 5) ? 1 : mgrVal + 1
                          onManagerScoreChange(cri.id, next)
                        }} className="text-[10px] font-bold hover:scale-110 transition-transform">
                          ⭐{mgrVal}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold">
                          {cri.input_type === 'star' ? `⭐${mgrVal}` : mgrVal}
                        </span>
                      )}
                    </div>
                    {/* Diff */}
                    <div className="w-12 text-center">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
                        background: `${diffColor}15`, color: diffColor,
                      }}>
                        {diff > 0 ? '+' : ''}{diff} {diff > 0 ? '🟢' : diff < 0 ? '🔴' : '⚪'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="px-3 py-2 rounded-xl text-[11px] space-y-1" style={{ background: '#fffbeb', color: '#92400e' }}>
          <div className="font-bold">💡 Nhận xét</div>
          {insights.map((ins, i) => <div key={i}>• {ins}</div>)}
        </div>
      )}

      {/* Summary */}
      <div className="card p-3 space-y-1.5">
        <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>📊 Tổng kết</h4>
        <div className="flex justify-between text-xs">
          <span>NV tự đánh giá:</span>
          <span className="font-bold">{Math.round(selfTotal)} điểm</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Bạn đánh giá:</span>
          <span className="font-bold">{Math.round(mgrTotal)} điểm
            <span style={{ color: getDiffColor(mgrTotal - selfTotal), marginLeft: 4 }}>
              ({mgrTotal >= selfTotal ? '+' : ''}{Math.round(mgrTotal - selfTotal)})
            </span>
          </span>
        </div>
        {deductionPoints > 0 && (
          <div className="flex justify-between text-xs">
            <span>Điểm lỗi:</span>
            <span className="font-bold" style={{ color: '#D9381E' }}>-{deductionPoints} điểm</span>
          </div>
        )}
        <div className="border-t pt-1.5 flex justify-between text-xs font-bold" style={{ borderColor: 'var(--gray-200)' }}>
          <span>ĐIỂM CUỐI CÙNG:</span>
          <span style={{ color: 'var(--primary)' }}>{Math.round(mgrTotal - deductionPoints)} điểm</span>
        </div>
      </div>
    </div>
  )
}
