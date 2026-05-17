'use client'

import { Users, DollarSign, Briefcase, Coffee, Package, AlertTriangle, BarChart3, ClipboardList, FileText, Rocket, Calculator } from 'lucide-react'
import { QuickEstimateResult, BusinessModel } from '@/lib/staffing/types'
import MetricCard from '@/components/ui/MetricCard'
import CollapsibleSection from '@/components/ui/CollapsibleSection'

interface HeroResultCardProps {
  result: QuickEstimateResult | null
  businessModel: BusinessModel
  dailyCups: number
  operatingHours: number
  isLoading?: boolean
  error?: string
  className?: string
  onApply: () => void
  onAnalyzeDetail: () => void
}

function getContextualDescription(
  totalPerShift: number,
  dailyCups: number,
  hours: number
): string {
  if (totalPerShift <= 2) {
    return `Quy mô nhỏ gọn, phù hợp với ${dailyCups} ly/ngày`
  } else if (totalPerShift <= 4) {
    return `Đủ để phục vụ ${dailyCups} ly/ngày trong ${hours} tiếng`
  } else {
    return `Đội ngũ lớn, sẵn sàng cho ${dailyCups}+ ly/ngày`
  }
}

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
    />
  )
}

export default function HeroResultCard({
  result,
  businessModel,
  dailyCups,
  operatingHours,
  isLoading = false,
  error,
  className = '',
  onApply,
  onAnalyzeDetail,
}: HeroResultCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
        <div className="p-8 space-y-6">
          {/* Hero skeleton */}
          <div className="text-center space-y-3">
            <SkeletonPulse className="w-24 h-16 mx-auto" />
            <SkeletonPulse className="w-32 h-4 mx-auto" />
            <SkeletonPulse className="w-48 h-3 mx-auto" />
          </div>
          {/* Metrics skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-xl border border-gray-100">
                <SkeletonPulse className="w-8 h-8 mb-2" />
                <SkeletonPulse className="w-20 h-6 mb-1" />
                <SkeletonPulse className="w-16 h-3" />
              </div>
            ))}
          </div>
          {/* Button skeleton */}
          <div className="space-y-3">
            <SkeletonPulse className="w-full h-12 rounded-xl" />
            <SkeletonPulse className="w-full h-10 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Có lỗi xảy ra</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  // No result yet
  if (!result) {
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <BarChart3 size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Kết quả sẽ hiện ở đây</h3>
          <p className="text-sm text-gray-400">Điều chỉnh thông số bên trái để xem ước tính</p>
        </div>
      </div>
    )
  }

  const showPackers = businessModel === 'app-delivery' && result.packers > 0

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
      {/* ═══════════ LEVEL 1: HERO ═══════════ */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8 text-center">
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide font-medium">
          Kết quả ước tính
        </div>

        {/* Hero number */}
        <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-1 motion-safe:animate-in motion-safe:zoom-in motion-safe:duration-500">
          {result.totalPerShift}
        </div>

        {/* Unit */}
        <div className="text-xl text-gray-300 font-medium mb-3">người / ca</div>

        {/* Contextual description */}
        <div className="text-sm text-gray-400 max-w-xs mx-auto">
          {getContextualDescription(result.totalPerShift, dailyCups, operatingHours)}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ═══════════ LEVEL 2: KEY METRICS ═══════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            icon={<Users size={20} className="text-blue-500" />}
            value={`${result.totalHires.min}-${result.totalHires.max}`}
            label="TỔNG TUYỂN"
            sublabel="người"
          />
          <MetricCard
            icon={<DollarSign size={20} className="text-green-500" />}
            value={`${(result.costRange.min / 1000000).toFixed(0)}-${(result.costRange.max / 1000000).toFixed(0)}`}
            label="CHI PHÍ"
            sublabel="triệu/tháng"
          />
          <MetricCard
            icon={<Briefcase size={20} className="text-purple-500" />}
            value={`${result.fulltime} FT + ${result.parttime.min}-${result.parttime.max} PT`}
            label="ĐỀ XUẤT"
          />
        </div>

        {/* ═══════════ LEVEL 3: DETAILS (Collapsible) ═══════════ */}
        <CollapsibleSection
          title="Xem chi tiết phân bổ"
          subtitle="Vị trí cụ thể và công thức tính"
          icon={<ClipboardList size={16} className="text-gray-500" />}
        >
          {/* Position breakdown table */}
          <div className="space-y-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Vị trí</th>
                  <th className="pb-2 font-medium text-center">Số người</th>
                  <th className="pb-2 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="py-2.5 flex items-center gap-2">
                    <Coffee size={14} className="text-orange-400" />
                    <span className="text-gray-700">Pha chế</span>
                  </td>
                  <td className="py-2.5 text-center font-bold text-gray-900">
                    {result.baristas}
                  </td>
                  <td className="py-2.5 text-gray-500 text-xs">25 ly/giờ</td>
                </tr>
                <tr>
                  <td className="py-2.5 flex items-center gap-2">
                    <DollarSign size={14} className="text-green-400" />
                    <span className="text-gray-700">Thu ngân</span>
                  </td>
                  <td className="py-2.5 text-center font-bold text-gray-900">
                    {result.cashiers}
                  </td>
                  <td className="py-2.5 text-gray-500 text-xs">Cố định</td>
                </tr>
                {showPackers && (
                  <tr>
                    <td className="py-2.5 flex items-center gap-2">
                      <Package size={14} className="text-blue-400" />
                      <span className="text-gray-700">Đóng gói</span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-gray-900">
                      {result.packers}
                    </td>
                    <td className="py-2.5 text-gray-500 text-xs">App &gt; 40%</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Calculation formula */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <FileText size={12} className="inline mr-1" /> Công thức: {dailyCups} ly ÷ {operatingHours}h ÷ 25 ly/giờ ={' '}
              {(dailyCups / operatingHours / 25).toFixed(1)} → {result.baristas} pha chế
            </div>
          </div>
        </CollapsibleSection>

        {/* ═══════════ CTAs ═══════════ */}
        <div className="space-y-3 pt-2">
          {/* PRIMARY CTA */}
          <button
            onClick={onApply}
            className="
              w-full py-3.5 rounded-xl font-bold text-base
              bg-primary text-white shadow-md
              hover:bg-primary/90 hover:shadow-lg
              active:scale-[0.98]
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            <Rocket size={16} /> Áp dụng ngay
          </button>

          {/* SECONDARY CTA */}
          <button
            onClick={onAnalyzeDetail}
            className="
              w-full py-3 rounded-xl font-medium text-sm
              bg-gray-100 text-gray-700
              hover:bg-gray-200
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            <Calculator size={16} /> Phân tích chi tiết →
          </button>
        </div>
      </div>
    </div>
  )
}
