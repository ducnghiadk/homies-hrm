'use client'

import { Clock, Banknote, Plus, BarChart3 } from 'lucide-react'

interface MobileSummaryBarProps {
  totalShifts: number
  totalHours: number
  estimatedCost: number
  onAddShift: () => void
}

export default function MobileSummaryBar({
  totalShifts,
  totalHours,
  estimatedCost,
  onAddShift,
}: MobileSummaryBarProps) {
  return (
    <div className="
      fixed bottom-0 inset-x-0 z-40
      bg-white/95 backdrop-blur-md border-t border-gray-200
      px-4 py-3
      safe-bottom
    ">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1 font-medium">
            <BarChart3 size={13} className="text-primary" />
            {totalShifts} ca
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-gray-400" />
            {totalHours}h
          </span>
          <span className="flex items-center gap-1">
            <Banknote size={13} className="text-gray-400" />
            ~{(estimatedCost / 1_000_000).toFixed(1)}tr
          </span>
        </div>

        {/* Add button */}
        <button
          onClick={onAddShift}
          className="
            flex items-center gap-1.5 px-4 py-2.5
            bg-primary text-white text-xs font-bold
            rounded-full shadow-md
            active:scale-95
            transition-all duration-150
          "
        >
          <Plus size={14} />
          Thêm ca
        </button>
      </div>
    </div>
  )
}
