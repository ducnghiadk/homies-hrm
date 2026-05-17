'use client'

import { ArrowLeftRight, ArrowUpDown, RefreshCw, Trash2, Plus, FileEdit } from 'lucide-react'
import type { ScheduleShift } from '@/lib/mock-data-smart-schedule'

interface ChangesSummaryProps {
  originalShifts: ScheduleShift[]
  currentShifts: ScheduleShift[]
}

interface Change {
  type: 'moved' | 'resized' | 'swapped' | 'deleted' | 'added'
  description: string
  employeeName: string
}

export default function ChangesSummary({ originalShifts, currentShifts }: ChangesSummaryProps) {
  const changes: Change[] = []

  // Detect modifications
  for (const orig of originalShifts) {
    const curr = currentShifts.find(s => s.id === orig.id)
    if (!curr) {
      changes.push({
        type: 'deleted',
        employeeName: orig.employeeName,
        description: `Xóa ca ${orig.startTime}-${orig.endTime} ngày ${orig.date}`,
      })
      continue
    }

    if (curr.employeeId !== orig.employeeId) {
      changes.push({
        type: 'swapped',
        employeeName: orig.employeeName,
        description: `Ca ${orig.startTime}-${orig.endTime} → chuyển cho ${curr.employeeName}`,
      })
    } else if (curr.startTime !== orig.startTime && curr.endTime !== orig.endTime) {
      changes.push({
        type: 'moved',
        employeeName: curr.employeeName,
        description: `${orig.startTime}-${orig.endTime} → ${curr.startTime}-${curr.endTime}`,
      })
    } else if (curr.endTime !== orig.endTime) {
      changes.push({
        type: 'resized',
        employeeName: curr.employeeName,
        description: `Kéo dài/ngắn: ${orig.endTime} → ${curr.endTime}`,
      })
    } else if (curr.startTime !== orig.startTime) {
      changes.push({
        type: 'moved',
        employeeName: curr.employeeName,
        description: `Đổi giờ: ${orig.startTime} → ${curr.startTime}`,
      })
    }
  }

  // Detect new shifts
  for (const curr of currentShifts) {
    if (!originalShifts.find(s => s.id === curr.id)) {
      changes.push({
        type: 'added',
        employeeName: curr.employeeName,
        description: `Thêm ca ${curr.startTime}-${curr.endTime} ngày ${curr.date}`,
      })
    }
  }

  if (changes.length === 0) return null

  const typeIcon: Record<Change['type'], React.ReactNode> = {
    moved: <ArrowLeftRight size={12} className="text-blue-500" />,
    resized: <ArrowUpDown size={12} className="text-purple-500" />,
    swapped: <RefreshCw size={12} className="text-orange-500" />,
    deleted: <Trash2 size={12} className="text-red-500" />,
    added: <Plus size={12} className="text-green-500" />,
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-3 bg-gray-50 border-b font-bold text-sm text-gray-700">
        <FileEdit size={14} className="inline mr-1" /> Tóm tắt thay đổi ({changes.length})
      </div>
      <div className="p-3 max-h-[200px] overflow-y-auto space-y-1.5">
        {changes.map((c, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span>{typeIcon[c.type]}</span>
            <div>
              <span className="font-bold text-gray-900">{c.employeeName}: </span>
              <span className="text-gray-600">{c.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
