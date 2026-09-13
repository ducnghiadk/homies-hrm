'use client'

import React from 'react'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Award,
  Database,
  UserCheck,
  CheckSquare,
  Share2,
  Scale,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import { getEvaluationTimeline } from '@/lib/mock-data-kpi'
import { mockStores } from '@/lib/mock-data'
import { getStoreKPISummary } from '@/lib/kpi-report-service'

// ── 1. DÒNG THỜI GIAN CHU KỲ ĐÁNH GIÁ (SAAS TIMELINE WIDGET) ──
export function ExecutiveTimelineWidget({ period }: { period: string }) {
  const phases = getEvaluationTimeline()
  const now = new Date()
  const currentPeriodStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const isCurrentPeriod = period === currentPeriodStr
  const today = isCurrentPeriod ? now.getDate() : 30

  const phaseIcons = {
    data_collection: Database,
    self_evaluation: UserCheck,
    review: CheckSquare,
    publish: Share2,
    appeal: Scale,
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F6FA8] flex items-center justify-center">
            <Calendar size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#001D3D] uppercase tracking-wider">
              Tiến Độ Chu Kỳ Đánh Giá
            </h3>
            <div className="text-[11px] text-gray-500 font-medium">
              Tháng {period.slice(5)}/{period.slice(0, 4)}
            </div>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2F6FA8] border border-blue-200">
          Ngày {today}/30
        </span>
      </div>

      {/* Progress track */}
      <div className="space-y-2">
        {phases.map((phase) => {
          const isDone = today > phase.end_day || !isCurrentPeriod
          const isActive = isCurrentPeriod && today >= phase.start_day && today <= phase.end_day
          const Icon = phaseIcons[phase.phase as keyof typeof phaseIcons] || Calendar

          return (
            <div
              key={phase.id}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isActive
                  ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-200/50'
                  : isDone
                  ? 'bg-gray-50/60 border-gray-100 opacity-90'
                  : 'bg-white border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-[#2F6FA8] text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                </div>

                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${
                    isActive ? 'text-[#2F6FA8]' : isDone ? 'text-gray-700' : 'text-gray-500'
                  }`}>
                    {phase.name}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">
                    Từ ngày {phase.start_day} đến {phase.end_day} hàng tháng
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#2F6FA8] text-white'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isActive ? 'Đang diễn ra' : isDone ? 'Hoàn tất' : 'Sắp tới'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 2. SO SÁNH 3 CƠ SỞ (STORE COMPARISON WIDGET) ──
export function ExecutiveStoreComparisonWidget({
  period,
  selectedStoreId,
  onSelectStore,
}: {
  period: string
  selectedStoreId: string
  onSelectStore: (storeId: string) => void
}) {
  const storeData = mockStores.map((store) => {
    const summary = getStoreKPISummary(store.id, period)
    const completion = summary.total_employees > 0
      ? Math.round((summary.evaluated_count / summary.total_employees) * 100)
      : 85
    return {
      store,
      summary,
      completion,
      avgScore: summary.average_score > 0 ? summary.average_score : 82,
    }
  }).sort((a, b) => b.avgScore - a.avgScore)

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Building2 size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#001D3D] uppercase tracking-wider">
              Xếp Hạng Cơ Sở (3 Chi Nhánh)
            </h3>
            <div className="text-[11px] text-gray-500 font-medium">So sánh điểm trung bình kỳ này</div>
          </div>
        </div>

        <span className="text-[11px] font-bold text-[#2F6FA8]">Chuỗi Homies</span>
      </div>

      <div className="space-y-2">
        {storeData.map((item, index) => {
          const isSelected = selectedStoreId === item.store.id
          return (
            <div
              key={item.store.id}
              onClick={() => onSelectStore(item.store.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/40 border-[#2F6FA8] ring-1 ring-[#2F6FA8]/30 shadow-2xs'
                  : 'bg-white hover:bg-gray-50/70 border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 font-mono ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800'
                        : index === 1
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">
                      {item.store.name.replace('Homies Milk Tea - ', '')}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">
                      Đã chấm {item.summary.evaluated_count}/{item.summary.total_employees} NV ({item.completion}%)
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-mono tabular-nums text-[#001D3D]">
                    {item.avgScore.toFixed(1)} đ
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 flex items-center justify-end gap-0.5">
                    <TrendingUp size={10} />
                    <span>Đạt chuẩn</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-[#2F6FA8] h-1 rounded-full"
                  style={{ width: `${Math.min(100, item.avgScore)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 3. TÁC VỤ ƯU TIÊN & CẢNH BÁO (PRIORITY ACTIONS WIDGET) ──
export function ExecutivePriorityActionsWidget({
  pendingReviewCount,
  attentionCount,
  promotionCount,
}: {
  pendingReviewCount: number
  attentionCount: number
  promotionCount: number
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
            <ShieldAlert size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#001D3D] uppercase tracking-wider">
              Việc Cần Xử Lý Ngay
            </h3>
            <div className="text-[11px] text-gray-500 font-medium">Hành động điều hành trực tiếp</div>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          Ưu tiên cao
        </span>
      </div>

      <div className="space-y-2">
        {/* Item 1: Review chờ duyệt */}
        <Link
          href="/kpi/review"
          className="p-3 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 transition flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2F6FA8] text-white flex items-center justify-center shrink-0">
              <CheckSquare size={14} />
            </div>
            <div>
              <div className="font-bold text-gray-900">
                {pendingReviewCount > 0 ? `${pendingReviewCount} bài tự đánh giá chờ review` : 'Xét duyệt đánh giá nhân viên'}
              </div>
              <div className="text-[11px] text-gray-500">Chấm điểm và phản hồi nhận xét</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[#2F6FA8] font-bold text-[11px] shrink-0 hover:bg-[#2F6FA8] hover:text-white transition">
            Duyệt ngay
          </span>
        </Link>

        {/* Item 2: Cảnh báo nhân viên nguy cơ */}
        <div className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle size={14} />
            </div>
            <div>
              <div className="font-bold text-gray-900">
                {attentionCount > 0 ? `${attentionCount} nhân sự có nguy cơ KPI < 70` : 'Kế hoạch coaching nhân sự'}
              </div>
              <div className="text-[11px] text-rose-700 font-medium">Cần hướng dẫn và kèm cặp ca</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 font-bold text-[11px] shrink-0">
            Xem danh sách
          </span>
        </div>

        {/* Item 3: Ứng viên thăng tiến */}
        <Link
          href="/kpi/promotion"
          className="p-3 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0">
              <Sparkles size={14} />
            </div>
            <div>
              <div className="font-bold text-gray-900">
                {promotionCount > 0 ? `${promotionCount} nhân sự đủ điều kiện thăng cấp` : 'Xét nâng bậc L1-L4'}
              </div>
              <div className="text-[11px] text-purple-700 font-medium">Đạt KPI ≥ 85 trong 3 tháng liên tiếp</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 font-bold text-[11px] shrink-0 hover:bg-purple-700 hover:text-white transition">
            Xét duyệt
          </span>
        </Link>
      </div>
    </div>
  )
}
