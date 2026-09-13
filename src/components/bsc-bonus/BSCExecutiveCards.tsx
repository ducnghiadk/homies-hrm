'use client'

import React from 'react'
import { TrendingUp, Award, Wallet, Users, AlertTriangle, ShieldCheck } from 'lucide-react'
import type { BSCTeamBonusSummary } from '@/lib/bsc-types'

interface BSCExecutiveCardsProps {
  summary: BSCTeamBonusSummary
}

export default function BSCExecutiveCards({ summary }: BSCExecutiveCardsProps) {
  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  const target = summary.store_result.revenue_target
  const storeResult = summary.store_result

  const completionPct = target.target_monthly > 0
    ? Math.round((target.actual_revenue_monthly / target.target_monthly) * 100)
    : 0

  const qualificationPct = summary.total_employee_count > 0
    ? Math.round((summary.eligible_employee_count / summary.total_employee_count) * 100)
    : 0

  const avgBonusPerEligible = summary.eligible_employee_count > 0
    ? Math.round(summary.total_distributed_bonus_amount / summary.eligible_employee_count)
    : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* ── CARD 1: Doanh Thu & Target ── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-md transition-all shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500">
              Doanh Thu / Mục Tiêu
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#001D3D] font-mono tabular-nums tracking-tight">
              {formatVnd(target.actual_revenue_monthly)}
            </h3>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            target.is_unlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-500">
            Đạt <strong className="text-gray-800 font-mono tabular-nums">{completionPct}%</strong> · Hòa vốn: <strong className="text-gray-800 font-mono tabular-nums">{(target.actual_revenue_daily / 1000000).toFixed(1)}tr</strong>
          </span>
          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold font-mono tabular-nums ${
            target.is_unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {target.is_unlocked ? '● Mở Quỹ' : '○ Khóa Quỹ'}
          </span>
        </div>
      </div>

      {/* ── CARD 2: Điểm Tổng Hợp & Bậc Xếp Hạng ── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-md transition-all shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500">
              Điểm Đánh Giá BSC
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-[#2F6FA8] font-mono tabular-nums tracking-tight">
                {storeResult.total_bsc_score}
                <span className="text-sm text-gray-400 font-medium">/5.0đ</span>
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary-50 text-[#2F6FA8]">
                {storeResult.coefficient_label}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0">
            <Award size={20} />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-500">Trạng thái quỹ:</span>
          {target.is_unlocked ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
              <ShieldCheck size={14} className="text-emerald-600" /> Đã mở quỹ
            </span>
          ) : (
            <span className="text-rose-600 font-bold flex items-center gap-1 text-xs">
              <AlertTriangle size={14} className="text-rose-500" /> Chưa đạt ngưỡng
            </span>
          )}
        </div>
      </div>

      {/* ── CARD 3: Dòng Tiền & Ngân Sách Quỹ ── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-md transition-all shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500">
              Thực Chi Nhân Viên
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono tabular-nums tracking-tight">
              {formatVnd(summary.total_distributed_bonus_amount)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Wallet size={20} />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-500">
            Tổng quỹ: <strong className="text-gray-800 font-mono tabular-nums">{formatVnd(storeResult.store_bonus_pool)}</strong>
          </span>
          <span className="text-amber-800 text-[11px] font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/70 font-mono tabular-nums">
            Giữ: {formatVnd(summary.retained_bonus_amount)}
          </span>
        </div>
      </div>

      {/* ── CARD 4: Tỷ Lệ Đạt Chuẩn & Bình Quân/Người ── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-md transition-all shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500">
              Nhân Sự Đạt Chuẩn
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-[#001D3D] font-mono tabular-nums tracking-tight">
                {summary.eligible_employee_count}
                <span className="text-sm text-gray-400 font-medium">/{summary.total_employee_count}</span>
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono tabular-nums">
                {qualificationPct}%
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-500">Bình quân người đạt:</span>
          <span className="text-[#001D3D] font-bold font-mono tabular-nums">
            {formatVnd(avgBonusPerEligible)}
          </span>
        </div>
      </div>
    </div>
  )
}
