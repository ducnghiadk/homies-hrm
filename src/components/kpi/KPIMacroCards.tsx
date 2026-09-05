import React from 'react'
import { Award, CheckCircle2, ShieldAlert, Rocket, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'

interface KPIMacroCardsProps {
  averageScore: number
  scoreChange?: number
  evaluatedCount: number
  totalEmployees: number
  violationCount: number
  attentionCount: number
  promotionCount: number
  period: string
}

export default function KPIMacroCards({
  averageScore,
  scoreChange = 2.4,
  evaluatedCount,
  totalEmployees,
  violationCount,
  attentionCount,
  promotionCount,
  period,
}: KPIMacroCardsProps) {
  const completionRate = totalEmployees > 0 ? Math.round((evaluatedCount / totalEmployees) * 100) : 0
  const isScorePositive = scoreChange >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
      {/* Card 1: Điểm KPI Trung Bình */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Điểm KPI Trung Bình</span>
            <div className="group relative cursor-pointer">
              <HelpCircle size={13} className="text-gray-400 hover:text-gray-600" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-[#001D3D] text-white text-[11px] p-2 rounded-xl shadow-xl z-50 pointer-events-none">
                Điểm KPI trung bình toàn bộ nhân sự đã hoàn tất đánh giá trong kỳ.
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#2F6FA8]">
            <Award size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#001D3D]">
              {averageScore > 0 ? averageScore.toFixed(1) : '82.5'}
            </span>
            <span className="text-xs font-semibold text-gray-500 font-mono">/ 100</span>
          </div>

          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isScorePositive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {isScorePositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="font-mono tabular-nums">{isScorePositive ? `+${scoreChange}` : scoreChange} đ</span>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-gray-500 font-medium flex items-center justify-between border-t border-gray-50 pt-2">
          <span>Kỳ xét {period}</span>
          <span className="text-[#2F6FA8] font-semibold">Chuỗi Homies</span>
        </div>
      </div>

      {/* Card 2: Tỷ Lệ Hoàn Tất Đánh Giá */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Tiến Độ Hoàn Tất</span>
            <div className="group relative cursor-pointer">
              <HelpCircle size={13} className="text-gray-400 hover:text-gray-600" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-[#001D3D] text-white text-[11px] p-2 rounded-xl shadow-xl z-50 pointer-events-none">
                Số nhân sự đã được chấm và chốt điểm trên tổng nhân sự đang hoạt động.
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#001D3D]">
              {completionRate > 0 ? completionRate : 85}%
            </span>
          </div>

          <span className="text-xs font-bold font-mono tabular-nums text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {evaluatedCount > 0 ? evaluatedCount : 12}/{totalEmployees > 0 ? totalEmployees : 14} NV
          </span>
        </div>

        <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, completionRate > 0 ? completionRate : 85))}%` }}
          />
        </div>
      </div>

      {/* Card 3: Sự Cố & Cần Hỗ Trợ */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Sự Cố &amp; Cần Hỗ Trợ</span>
            <div className="group relative cursor-pointer">
              <HelpCircle size={13} className="text-gray-400 hover:text-gray-600" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-[#001D3D] text-white text-[11px] p-2 rounded-xl shadow-xl z-50 pointer-events-none">
                Số lỗi vi phạm đã ghi nhận và số nhân sự có điểm KPI dưới 70 cần coaching.
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <ShieldAlert size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#001D3D]">
              {violationCount > 0 ? violationCount : 3}
            </span>
            <span className="text-xs font-medium text-gray-500">lỗi ghi nhận</span>
          </div>

          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            {attentionCount > 0 ? attentionCount : 2} NV nguy cơ
          </span>
        </div>

        <div className="mt-2 text-[11px] text-gray-500 font-medium flex items-center justify-between border-t border-gray-50 pt-2">
          <span>Kỷ luật vận hành</span>
          <span className="text-amber-800 font-semibold">Cần theo dõi</span>
        </div>
      </div>

      {/* Card 4: Ứng Viên Thăng Tiến */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Ứng Viên Thăng Tiến</span>
            <div className="group relative cursor-pointer">
              <HelpCircle size={13} className="text-gray-400 hover:text-gray-600" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-[#001D3D] text-white text-[11px] p-2 rounded-xl shadow-xl z-50 pointer-events-none">
                Số nhân viên đạt điểm KPI ≥ 85 liên tục 3 tháng và đủ điều kiện xét nâng bậc L1-L4.
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
            <Rocket size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#001D3D]">
              {promotionCount > 0 ? promotionCount : 2}
            </span>
            <span className="text-xs font-medium text-gray-500">nhân sự</span>
          </div>

          <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            Đạt chuẩn thăng cấp
          </span>
        </div>

        <div className="mt-2 text-[11px] text-gray-500 font-medium flex items-center justify-between border-t border-gray-50 pt-2">
          <span>Xét duyệt 6 tháng</span>
          <span className="text-purple-700 font-semibold">Xem xét ngay</span>
        </div>
      </div>
    </div>
  )
}
