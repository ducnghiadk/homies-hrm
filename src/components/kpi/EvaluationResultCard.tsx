'use client'

import type { KPIEvaluation } from '@/lib/kpi-types'
import { mockKPIGrades } from '@/lib/mock-data-kpi'
import CategoryScoreCard from './CategoryScoreCard'
import { useState } from 'react'

interface Props {
  evaluation: KPIEvaluation
  showAppeal?: boolean
  onAppeal?: () => void
  previousScore?: number
}

export default function EvaluationResultCard({
  evaluation, showAppeal, onAppeal, previousScore,
}: Props) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const grade = mockKPIGrades.find(g => g.code === evaluation.grade_code)
  const trend = previousScore !== undefined ? evaluation.total_score - previousScore : undefined

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    published: { label: 'Đã công bố', color: '#1E9E57' },
    finalized: { label: 'Đã hoàn tất', color: '#6b7280' },
    appealed: { label: 'Đang khiếu nại', color: '#7c3aed' },
  }

  const statusInfo = STATUS_LABELS[evaluation.status] || { label: evaluation.status, color: '#6b7280' }

  return (
    <div className="card overflow-hidden">
      {/* Header with big score */}
      <div className="p-4 text-center" style={{
        background: `linear-gradient(135deg, ${grade?.color}15, ${grade?.color}05)`,
      }}>
        <div className="relative inline-flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none"
              stroke={grade?.color || '#6b7280'} strokeWidth="6"
              strokeDasharray={`${Math.min(evaluation.total_score, 100) * 2.64} 264`}
              strokeLinecap="round" transform="rotate(-90 50 50)"
              className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black" style={{ color: grade?.color }}>
              {evaluation.total_score}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>điểm</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-bold text-white"
            style={{ background: grade?.color }}>
            {grade?.icon} {grade?.name}
          </span>
          {trend !== undefined && trend !== 0 && (
            <span className="text-xs font-bold" style={{
              color: trend > 0 ? '#1E9E57' : '#D9381E',
            }}>
              {trend > 0 ? '↑' : '↓'}{Math.abs(trend)} vs tháng trước
            </span>
          )}
        </div>

        <div className="text-[10px] mt-1" style={{ color: statusInfo.color }}>
          {statusInfo.label}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="p-3 space-y-2">
        <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
          📊 Chi tiết theo hạng mục
        </h4>
        {evaluation.category_scores.map(cat => (
          <CategoryScoreCard
            key={cat.category_id}
            category={cat}
            expanded={expandedCat === cat.category_id}
            onToggle={() => setExpandedCat(
              expandedCat === cat.category_id ? null : cat.category_id,
            )}
          />
        ))}
      </div>

      {/* Manager comment */}
      {evaluation.manager_comment && (
        <div className="mx-3 mb-3 p-2 rounded-lg text-xs" style={{ background: '#f0fdf4', color: '#166534' }}>
          <strong>💬 Nhận xét Manager:</strong> {evaluation.manager_comment}
        </div>
      )}

      {/* Appeal section */}
      {showAppeal && evaluation.status === 'published' && (
        <div className="px-3 pb-3">
          <button onClick={onAppeal}
            className="w-full py-2 rounded-xl text-xs font-bold"
            style={{ background: '#ede9fe', color: '#7c3aed' }}>
            ⚖️ Khiếu nại kết quả
          </button>
        </div>
      )}

      {/* Appeal result */}
      {evaluation.appeal_result && (
        <div className="mx-3 mb-3 p-2 rounded-lg text-xs" style={{
          background: evaluation.appeal_result === 'approved' ? '#dcfce7' : '#fee2e2',
          color: evaluation.appeal_result === 'approved' ? '#166534' : '#991b1b',
        }}>
          <strong>⚖️ Kết quả KN:</strong> {evaluation.appeal_result === 'approved' ? 'Chấp nhận' : 'Từ chối'}
        </div>
      )}
    </div>
  )
}
