'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { BSCStoreResult } from '@/lib/bsc-types'
import { Calendar, TrendingUp, Sliders } from 'lucide-react'

interface BSCHistoryChartProps {
  history: BSCStoreResult[]
}

export default function BSCHistoryChart({ history }: BSCHistoryChartProps) {
  const router = useRouter()
  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="p-5 space-y-4 rounded-2xl border border-gray-100 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h4 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
          <Calendar size={16} className="text-amber-600" />
          <span>Lịch Sử BSC 3 Tháng Gần Nhất</span>
        </h4>
        <button
          type="button"
          onClick={() => router.push('/settings/bsc?tab=targets')}
          className="text-gray-400 hover:text-[#2F6FA8] p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          title="Cài đặt mục tiêu lịch sử"
        >
          <Sliders size={13} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {history.map(item => {
          const monthLabel = `T${item.period.slice(5)}/${item.period.slice(0, 4)}`
          const isUnlocked = item.revenue_target.is_unlocked

          return (
            <div
              key={item.period}
              className={`p-3 rounded-xl border text-center transition-all ${
                isUnlocked ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50/70 border-gray-200'
              }`}
            >
              <div className="text-xs font-bold text-gray-500 font-mono">
                {monthLabel}
              </div>

              <div
                className={`text-base sm:text-lg font-black mt-1 font-mono tabular-nums ${
                  isUnlocked ? 'text-[#2F6FA8]' : 'text-gray-400'
                }`}
              >
                {isUnlocked ? `${item.total_bsc_score}/5` : 'Khóa'}
              </div>

              <div className="text-[10px] mt-0.5 font-bold text-gray-600 truncate">
                Hệ số: {item.coefficient_label}
              </div>

              <div
                className={`text-xs font-bold mt-2 pt-1.5 border-t font-mono tabular-nums ${
                  isUnlocked ? 'border-blue-100 text-emerald-700' : 'border-gray-200 text-gray-400'
                }`}
              >
                {formatVnd(item.store_bonus_pool)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-1.5 text-[11px] text-gray-500 italic pt-1 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <TrendingUp size={12} className="text-[#2F6FA8]" />
          <span>Chính sách xét duyệt lại target 6 tháng/lần.</span>
        </div>
        <button
          type="button"
          onClick={() => router.push('/settings/bsc?tab=targets')}
          className="font-bold not-italic text-[#2F6FA8] hover:underline cursor-pointer text-[10px]"
        >
          Cấu hình ↗
        </button>
      </div>
    </div>
  )
}

