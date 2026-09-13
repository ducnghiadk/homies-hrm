'use client'

import React from 'react'
import type { BSCRevenueTarget } from '@/lib/bsc-types'
import { CheckCircle2, XCircle, TrendingUp } from 'lucide-react'

interface BSCGateStatusProps {
  target: BSCRevenueTarget
}

export default function BSCGateStatus({ target }: BSCGateStatusProps) {
  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  const formatShortMillion = (amount: number) => `${(amount / 1000000).toFixed(2)} tr`

  const percentThreshold = Math.round((target.actual_revenue_daily / target.profit_threshold_daily) * 100)
  const percentTarget = Math.round((target.actual_revenue_daily / target.target_daily) * 100)

  return (
    <div
      className={`p-5 rounded-2xl border transition-all animate-slide-up shadow-xs ${
        target.is_unlocked
          ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/30 to-white border-emerald-200/80'
          : 'bg-gradient-to-r from-rose-50/90 via-orange-50/30 to-white border-rose-200/80'
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
              target.is_unlocked
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {target.is_unlocked ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold tracking-tight text-gray-900">
                {target.is_unlocked ? 'ĐÃ MỞ QUỸ THƯỞNG BSC CỬA HÀNG' : 'CHƯA ĐỦ ĐIỀU KIỆN MỞ QUỸ THƯỞNG'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                  target.is_unlocked
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                    : 'bg-rose-100 text-rose-800 border border-rose-300/80'
                }`}
              >
                {target.is_unlocked ? 'Đạt Mốc Hòa Vốn' : 'Dưới Mốc Hòa Vốn'}
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-600 font-medium">
              Doanh thu TB ngày: <strong className="text-gray-900 font-mono tabular-nums">{formatShortMillion(target.actual_revenue_daily)}/ngày</strong> (Mốc lợi nhuận: ≥<span className="font-mono tabular-nums">{formatShortMillion(target.profit_threshold_daily)}</span>)
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0 sm:self-center">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tiến Độ Mục Tiêu Tháng</div>
          <div className="text-base font-bold text-[#2F6FA8] font-mono tabular-nums">
            {percentTarget}%
          </div>
        </div>
      </div>

      {/* Progress Bar Mốc Lợi Nhuận */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-gray-600">
          <span className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[#2F6FA8]" /> Doanh thu thuần tháng: <strong className="text-gray-900 font-mono tabular-nums">{formatVnd(target.actual_revenue_monthly)}</strong>
          </span>
          <span className="font-mono tabular-nums text-gray-700 font-medium">
            {percentThreshold}% mốc lợi nhuận ({target.days_in_month} ngày)
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-gray-200/70 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              target.is_unlocked
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-rose-500 to-amber-400'
            }`}
            style={{
              width: `${Math.min(percentThreshold, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
