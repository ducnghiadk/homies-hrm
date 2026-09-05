'use client'

import React from 'react'
import type { BSCCriteriaScore } from '@/lib/bsc-types'
import { bscCriteriaCatalog } from '@/lib/mock-data-bsc'
import { TrendingUp, Package, Settings, Users, Lightbulb } from 'lucide-react'

interface BSCCriteriaCardProps {
  score: BSCCriteriaScore
}

export default function BSCCriteriaCard({ score }: BSCCriteriaCardProps) {
  const meta = bscCriteriaCatalog.find(c => c.key === score.key) || {
    icon: 'TrendingUp',
    color: '#2F6FA8',
    how_to_excel: '',
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp size={18} />
      case 'Package': return <Package size={18} />
      case 'Settings': return <Settings size={18} />
      case 'Users': return <Users size={18} />
      default: return <TrendingUp size={18} />
    }
  }

  const isExcellent = score.converted_score >= 4
  const isFair = score.converted_score >= 3

  return (
    <div className="p-4 transition-all hover:border-primary-200 hover:shadow-md rounded-2xl border border-gray-100 bg-white space-y-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${meta.color}15`, color: meta.color }}
          >
            {renderIcon(meta.icon)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-900">
                {score.name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono tabular-nums">
                {Math.round(score.weight * 100)}%
              </span>
            </div>
            <div className="text-xs mt-0.5 text-gray-500 font-medium font-mono tabular-nums">
              {score.raw_value_label}
            </div>
          </div>
        </div>

        {/* Score Ring / Pill */}
        <div className="text-right flex-shrink-0">
          <div className={`text-base font-bold font-mono tabular-nums ${
            isExcellent ? 'text-emerald-600' : isFair ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {score.converted_score} <span className="text-xs font-normal text-gray-400">/ 5đ</span>
          </div>
          <div className="text-[10px] font-semibold text-gray-500 font-mono tabular-nums">
            Điểm nhân TS: <strong className="text-gray-900">+{score.weighted_score}</strong>
          </div>
        </div>
      </div>

      {/* Progress Bar 1-5 */}
      <div className="flex gap-1.5 pt-0.5">
        {[1, 2, 3, 4, 5].map(step => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              step <= score.converted_score
                ? isExcellent
                  ? 'bg-emerald-500'
                  : isFair
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
                : 'bg-gray-100'
            }`}
          />
        ))}
      </div>

      {/* How to excel hint */}
      {meta.how_to_excel && (
        <div className="text-[11px] flex items-start gap-1.5 text-gray-500 leading-tight pt-0.5 font-medium">
          <Lightbulb size={13} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <span>{meta.how_to_excel}</span>
        </div>
      )}
    </div>
  )
}
