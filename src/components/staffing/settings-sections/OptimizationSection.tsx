'use client'

import { Calculator, ArrowRight, RefreshCw } from 'lucide-react'

interface OptimizationSectionProps {
  lastResult?: {
    planName: string
    fulltime: number
    parttime: number
    totalCost: number
    date: string
  }
  onStartOptimization: () => void
  onViewDetail?: () => void
}

export function OptimizationSection({
  lastResult,
  onStartOptimization,
  onViewDetail,
}: OptimizationSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Calculator size={20} className="text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
            <Calculator size={16} className="text-purple-600" />
            Phân tích & Tối ưu
          </h3>
          <p className="text-xs text-gray-500">
            Phân tích chi tiết để tìm phương án tối ưu chi phí nhân sự
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onStartOptimization}
        className="
          w-full py-3.5 mb-4 rounded-xl font-bold text-sm
          bg-primary text-white shadow-md
          hover:bg-primary/90 hover:shadow-lg
          active:scale-[0.98]
          transition-all duration-200
          flex items-center justify-center gap-2
        "
      >
        <Calculator size={14} /> Bắt đầu phân tích <ArrowRight size={16} />
      </button>

      {/* Last result (if any) */}
      {lastResult && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-xs text-gray-500 mb-2">
            Lần phân tích gần nhất: {lastResult.date}
          </div>

          <div className="space-y-1.5 text-sm mb-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Phương án đã chọn:</span>
              <span className="font-bold text-gray-800">{lastResult.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nhân sự:</span>
              <span className="font-medium">{lastResult.fulltime} FT + {lastResult.parttime} PT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chi phí:</span>
              <span className="font-bold text-primary">
                {(lastResult.totalCost / 1000000).toFixed(0)} triệu/tháng
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {onViewDetail && (
              <button
                onClick={onViewDetail}
                className="flex-1 py-2 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Xem chi tiết
              </button>
            )}
            <button
              onClick={onStartOptimization}
              className="flex-1 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw size={12} /> Phân tích lại
            </button>
          </div>
        </div>
      )}

      {/* No result */}
      {!lastResult && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-400">
            Chưa có kết quả phân tích. Nhấn nút trên để bắt đầu.
          </p>
        </div>
      )}
    </div>
  )
}
