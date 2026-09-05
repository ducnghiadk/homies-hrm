'use client'

import React from 'react'
import type { LeaderboardEntry } from '@/lib/kpi-report-service'
import { Trophy, Medal, Award, Sparkles, TrendingUp } from 'lucide-react'

interface AnimatedPodiumProps {
  top3: LeaderboardEntry[]
}

export default function AnimatedPodium({ top3 }: AnimatedPodiumProps) {
  if (top3.length < 3) return null

  const [first, second, third] = top3
  const order = [second, first, third]
  const rankIndices = [2, 1, 3]

  const rankConfig: Record<number, {
    border: string
    avatarBg: string
    badgeBg: string
    badgeText: string
    label: string
    height: string
    icon: React.ComponentType<{ size?: number; className?: string }>
  }> = {
    1: {
      border: 'border-amber-300 ring-2 ring-amber-300/40 shadow-md',
      avatarBg: 'bg-linear-to-br from-amber-400 to-amber-600 text-white',
      badgeBg: 'bg-amber-100 border-amber-300 text-amber-900',
      badgeText: 'Top 1 Xuất Sắc',
      label: 'Hạng 1',
      height: 'h-32',
      icon: Trophy,
    },
    2: {
      border: 'border-slate-200 shadow-xs',
      avatarBg: 'bg-linear-to-br from-slate-400 to-slate-600 text-white',
      badgeBg: 'bg-slate-100 border-slate-300 text-slate-800',
      badgeText: 'Top 2',
      label: 'Hạng 2',
      height: 'h-24',
      icon: Medal,
    },
    3: {
      border: 'border-amber-200/80 shadow-xs',
      avatarBg: 'bg-linear-to-br from-amber-600 to-amber-800 text-white',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
      badgeText: 'Top 3',
      label: 'Hạng 3',
      height: 'h-18',
      icon: Award,
    },
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Trophy size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#001D3D] uppercase tracking-wider">
              Bục Vinh Danh Top 3 Hiệu Suất Cao Nhất
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">Nhân sự dẫn đầu kỳ đánh giá</p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <Sparkles size={11} />
          Top Performers
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end justify-center pt-4 pb-2">
        {order.map((entry, idx) => {
          const rank = rankIndices[idx]
          const cfg = rankConfig[rank]
          const Icon = cfg.icon
          const isFirst = rank === 1

          return (
            <div
              key={entry.employee_id}
              className={`flex flex-col items-center p-3 sm:p-4 rounded-2xl border transition-all ${
                isFirst
                  ? 'bg-linear-to-b from-amber-50/60 to-white ' + cfg.border
                  : 'bg-gray-50/50 ' + cfg.border
              }`}
            >
              {/* Badge rank */}
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border mb-2 flex items-center gap-1 ${cfg.badgeBg}`}>
                <Icon size={11} />
                <span>{cfg.label}</span>
              </div>

              {/* Avatar */}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs mb-2 ${cfg.avatarBg}`}>
                {entry.name.charAt(0)}
              </div>

              {/* Name */}
              <div className="font-bold text-xs sm:text-sm text-gray-900 text-center truncate max-w-[110px]">
                {entry.name}
              </div>

              {/* Score */}
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-[#001D3D]">
                  {entry.score}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 font-mono">đ</span>
              </div>

              {/* Grade */}
              <div className="mt-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Xuất sắc
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
