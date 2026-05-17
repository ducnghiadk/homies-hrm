'use client'

import type { HourlyStaffing } from '@/lib/scheduling/shift-calculator'
import { AlertTriangle, Check, BarChart3 } from 'lucide-react'

interface StaffingLevelBarProps {
  staffing: HourlyStaffing[]
}

export default function StaffingLevelBar({ staffing }: StaffingLevelBarProps) {
  const maxCount = Math.max(...staffing.map(s => Math.max(s.count, s.required)), 5)

  return (
    <div className="bg-gray-50 border-t-2 border-gray-200 px-2 py-3">
      <div className="flex items-end" style={{ marginLeft: '140px' }}>
        {staffing.map(h => {
          const barHeight = (h.count / maxCount) * 40
          const reqHeight = (h.required / maxCount) * 40
          const isUnder = h.count < h.required
          const isOver = h.count > h.required + 1

          return (
            <div
              key={h.hour}
              className="flex-1 flex flex-col items-center gap-0.5"
            >
              {/* Bar */}
              <div className="relative w-full flex justify-center" style={{ height: 44 }}>
                {/* Required line */}
                <div
                  className="absolute w-4/5 border-t-2 border-dashed border-gray-300"
                  style={{ bottom: reqHeight + 2 }}
                />
                {/* Actual bar */}
                <div
                  className={`w-3/5 rounded-t transition-all ${
                    isUnder ? 'bg-red-400' : isOver ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}
                  style={{ height: Math.max(barHeight, 2) }}
                />
              </div>
              {/* Count */}
              <div className={`text-xs font-bold ${isUnder ? 'text-red-600' : 'text-gray-500'}`}>
                {h.count}
              </div>
              {/* Status icon */}
              <div className="text-xs flex justify-center">
                {isUnder ? <AlertTriangle size={10} className="text-red-500" /> : <Check size={10} className="text-green-500" />}
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-xs text-gray-400 font-medium mt-1" style={{ marginLeft: '140px' }}>
        <BarChart3 size={10} className="inline mr-1 text-gray-400" /> Số người theo giờ (─ ─ = yêu cầu)
      </div>
    </div>
  )
}
