'use client'

import React from 'react'
import type { ViolationSummary } from '@/lib/kpi-types'
import {
  ShieldAlert,
  Award,
  AlertTriangle,
  MessageSquare,
  Clock,
} from 'lucide-react'

interface Props {
  summary: ViolationSummary
}

export default function EmployeeViolationSummary({ summary }: Props) {
  const score = summary.violation_score
  const scoreColor =
    score >= 85 ? 'text-emerald-700' : score >= 70 ? 'text-amber-700' : 'text-rose-700'
  const barBg =
    score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500'

  // Estimate BSC bonus deduction
  const estimatedBscDeduction =
    summary.total_penalty_points >= 30 ? 25 : summary.total_penalty_points >= 15 ? 15 : summary.total_penalty_points > 0 ? 5 : 0

  return (
    <div className="card p-5 sm:p-6 rounded-3xl border border-gray-200/80 bg-white shadow-xs space-y-4 font-['Inter']">
      {/* Header & Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center border border-blue-100">
              <Award size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#001D3D]">Điểm Kỷ Luật &amp; KPI Cá Nhân Tháng Này</h3>
              <p className="text-[11px] text-gray-500 font-medium">Thang điểm 100 — Dùng để đánh giá năng lực &amp; xét thăng cấp</p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-2xl font-black font-mono ${scoreColor}`}>
              {score}/100
            </span>
            <span className="text-[10px] text-gray-400 block font-medium">Điểm chuẩn</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 rounded-full overflow-hidden bg-gray-100 border border-gray-200/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barBg}`}
            style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
          />
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/70 space-y-0.5">
          <div className="text-lg font-black text-gray-900 font-mono">{summary.total_violations}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tổng Sự Cố</div>
        </div>

        <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200/70 space-y-0.5">
          <div className="text-lg font-black text-rose-600 font-mono">-{summary.total_penalty_points}đ</div>
          <div className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Điểm KPI Bị Trừ</div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 space-y-0.5">
          <div className="text-lg font-black text-amber-800 font-mono">
            {estimatedBscDeduction > 0 ? `-${estimatedBscDeduction}%` : '0%'}
          </div>
          <div className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">Giảm Thưởng BSC</div>
        </div>

        <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200/70 space-y-0.5">
          <div className="text-lg font-black text-purple-700 font-mono">{summary.pending_appeals}</div>
          <div className="text-[10px] text-purple-900 font-bold uppercase tracking-wider">Đang Khiếu Nại</div>
        </div>
      </div>

      {/* Severity Breakdown Badges */}
      <div className="grid grid-cols-4 gap-1.5 pt-1">
        {[
          { key: 'minor', label: 'Nhẹ', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { key: 'medium', label: 'Trung Bình', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
          { key: 'major', label: 'Nặng', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
          { key: 'critical', label: 'Nghiêm Trọng', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
        ].map(s => {
          const count = summary.by_severity[s.key as keyof typeof summary.by_severity] || 0
          return (
            <div
              key={s.key}
              className={`text-center py-1.5 px-2 rounded-xl text-[11px] font-bold border ${s.bg} ${s.color} ${s.border}`}
            >
              {count} {s.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
