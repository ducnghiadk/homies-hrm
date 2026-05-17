'use client'

import type { ScheduleShift, StaffAttribute } from '@/lib/mock-data-smart-schedule'
import ShiftBar from './ShiftBar'
import type { ShiftValidationStatus } from './ShiftBar'

interface EmployeeRowProps {
  employee: StaffAttribute
  shifts: ScheduleShift[]  // Shifts for this employee on selected day
  gridStartHour: number
  gridEndHour: number
  modifiedShiftIds: Set<string>
  warningShiftIds: Set<string>
  errorShiftIds: Set<string>
  selectedShiftId: string | null
  isDragOver: boolean
  onSelectShift: (shiftId: string) => void
  onDragMove: (shiftId: string, newStart: number, newEnd: number) => void
  onDragSwap: (shiftId: string, deltaY: number) => void
  onResize: (shiftId: string, newEnd: number) => void
  onDoubleClick: (shiftId: string) => void
}

export default function EmployeeRow({
  employee, shifts, gridStartHour, gridEndHour,
  modifiedShiftIds, warningShiftIds, errorShiftIds,
  selectedShiftId, isDragOver,
  onSelectShift, onDragMove, onDragSwap, onResize, onDoubleClick
}: EmployeeRowProps) {

  const getValidationStatus = (shiftId: string): ShiftValidationStatus => {
    if (errorShiftIds.has(shiftId)) return 'error'
    if (warningShiftIds.has(shiftId)) return 'warning'
    if (modifiedShiftIds.has(shiftId)) return 'modified'
    return 'normal'
  }

  return (
    <div
      className={`
        flex border-b border-gray-100 transition-colors
        ${isDragOver ? 'bg-blue-50/60' : 'hover:bg-gray-50/50'}
      `}
      style={{ minHeight: '48px' }}
    >
      {/* Employee Label */}
      <div className="w-[140px] shrink-0 flex items-center gap-2 px-3 py-2 border-r border-gray-200 bg-white sticky left-0 z-10">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
          {employee.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-900 truncate">{employee.name}</div>
          <div className={`text-xs font-medium px-1 py-0.5 rounded inline-block ${
            employee.type === 'fulltime'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-orange-50 text-orange-600'
          }`}>
            {employee.type === 'fulltime' ? 'FT' : 'PT'}
          </div>
        </div>
      </div>

      {/* Timeline area (relative for absolute-positioned ShiftBars) */}
      <div className="flex-1 relative">
        {shifts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
            Không có ca
          </div>
        )}
        {shifts.map(shift => (
          <ShiftBar
            key={shift.id}
            shift={shift}
            gridStartHour={gridStartHour}
            gridEndHour={gridEndHour}
            validationStatus={getValidationStatus(shift.id)}
            isSelected={selectedShiftId === shift.id}
            onSelect={onSelectShift}
            onDragMove={onDragMove}
            onDragSwap={onDragSwap}
            onResize={onResize}
            onDoubleClick={onDoubleClick}
          />
        ))}
      </div>
    </div>
  )
}
