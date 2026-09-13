'use client'

import React from 'react'
import type { BSCIndividualResult } from '@/lib/bsc-types'
import { Award, Clock, AlertTriangle, ShieldCheck, Calculator } from 'lucide-react'

interface BSCBonusBreakdownProps {
  result: BSCIndividualResult
  storeBonusPool: number
  totalTeamPoints: number
  isInspectorMode?: boolean
}

export default function BSCBonusBreakdown({
  result,
  storeBonusPool,
  totalTeamPoints,
  isInspectorMode = false,
}: BSCBonusBreakdownProps) {
  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  const isLocked = !result.is_eligible_hours || result.personal_coefficient === 0 || storeBonusPool === 0

  return (
    <div
      className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden animate-slide-up border border-white/10"
      style={{
        background: isLocked
          ? 'linear-gradient(135deg, #001D3D 0%, #000814 100%)'
          : 'linear-gradient(135deg, #001D3D 0%, #1a4971 50%, #2F6FA8 100%)',
      }}
    >
      {/* Background decoration icon */}
      <div className="absolute -right-6 -bottom-6 text-white/[0.04] font-black pointer-events-none select-none">
        <Award size={160} />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/70 font-bold flex items-center gap-1.5">
              <Award size={15} className="text-amber-300" />
              {isInspectorMode ? (
                <span>Thưởng BSC — Nhân Sự: <strong className="text-white underline underline-offset-2">{result.employee_name}</strong></span>
              ) : (
                <span>Thưởng BSC Cá Nhân — Tháng {result.period.slice(5)}/{result.period.slice(0, 4)}</span>
              )}
            </div>
            <h2 className="text-3xl font-bold mt-1 text-white tracking-tight font-mono tabular-nums">
              {isLocked ? '0 đ' : formatVnd(result.bonus_amount)}
            </h2>
          </div>

          <div className="text-right flex-shrink-0">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs backdrop-blur-md"
              style={{
                background: isLocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.22)',
                color: isLocked ? '#fca5a5' : '#86efac',
                border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`,
              }}
            >
              {isLocked ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />}
              {isLocked ? 'Không đủ điều kiện' : `Chiếm ${result.share_percentage}% quỹ`}
            </span>
          </div>
        </div>

        {/* Lock warning if any */}
        {isLocked && result.lock_reason && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/25 text-xs text-rose-200 flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
            <span className="font-medium">{result.lock_reason}</span>
          </div>
        )}

        {/* Formula Step-by-Step Breakdown */}
        <div className="pt-3 border-t border-white/10 space-y-3 text-xs">
          <div className="text-[11px] font-bold text-white/75 flex items-center gap-1.5 uppercase tracking-wider">
            <Calculator size={13} className="text-primary-200" /> Công thức chia nhanh:
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/10 hover:bg-white/15 transition-colors backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] text-white/70 flex items-center justify-center gap-1">
                <Clock size={11} /> Giờ làm
              </div>
              <div className="text-sm font-bold mt-0.5 font-mono tabular-nums">{result.work_hours}h</div>
              <div className="text-[9px] text-white/60">{result.is_eligible_hours ? '≥110h (Đạt)' : '<110h'}</div>
            </div>

            <div className="bg-white/10 hover:bg-white/15 transition-colors backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] text-white/70">Cấp bậc ({result.level_label})</div>
              <div className="text-sm font-bold mt-0.5 font-mono tabular-nums">× {result.rank_coefficient}</div>
              <div className="text-[9px] text-white/60">Hệ số cấp bậc</div>
            </div>

            <div className="bg-white/10 hover:bg-white/15 transition-colors backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] text-white/70">Hệ số lỗi ({result.personal_error_count}đ)</div>
              <div
                className="text-sm font-bold mt-0.5 font-mono tabular-nums"
                style={{ color: result.personal_coefficient === 1 ? '#86efac' : result.personal_coefficient > 0 ? '#fcd34d' : '#fca5a5' }}
              >
                × {result.personal_coefficient}
              </div>
              <div className="text-[9px] text-white/60">Hệ số kỷ luật</div>
            </div>
          </div>

          {/* Equal sign result */}
          <div className="bg-black/25 rounded-xl p-3 flex items-center justify-between text-xs border border-white/5">
            <span className="text-white/85 font-medium">
              Điểm chia cá nhân = {result.work_hours}h × {result.rank_coefficient} × {result.personal_coefficient}
            </span>
            <strong className="text-amber-300 font-mono text-sm tabular-nums font-bold">{result.personal_share_points} điểm</strong>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/70 pt-0.5 font-mono tabular-nums">
            <span>Quỹ chia tháng: <strong className="text-white font-bold">{formatVnd(storeBonusPool)}</strong></span>
            <span>Tổng điểm chia: <strong className="text-white font-bold">{totalTeamPoints} điểm</strong></span>
            <span>Tỷ lệ: <strong className="text-emerald-300 font-bold">{result.share_percentage}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
