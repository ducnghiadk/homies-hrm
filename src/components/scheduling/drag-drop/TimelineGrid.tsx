'use client'

import type { ScheduleShift, StaffAttribute } from '@/lib/mock-data-smart-schedule'
import type { HourlyStaffing } from '@/lib/scheduling/shift-calculator'
import EmployeeRow from './EmployeeRow'
import StaffingLevelBar from './StaffingLevelBar'

interface TimelineGridProps {
  employees: StaffAttribute[]
  shifts: ScheduleShift[]       // All shifts for selected day
  staffing: HourlyStaffing[]
  modifiedShiftIds: Set<string>
  warningShiftIds: Set<string>
  errorShiftIds: Set<string>
  selectedShiftId: string | null
  dragOverEmployeeId: string | null
  onSelectShift: (shiftId: string) => void
  onDragMove: (shiftId: string, newStart: number, newEnd: number) => void
  onDragSwap: (shiftId: string, deltaY: number) => void
  onResize: (shiftId: string, newEnd: number) => void
  onDoubleClick: (shiftId: string) => void
}

const GRID_START = 7
const GRID_END = 23
const HOURS = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i)

export default function TimelineGrid({
  employees, shifts, staffing,
  modifiedShiftIds, warningShiftIds, errorShiftIds,
  selectedShiftId, dragOverEmployeeId,
  onSelectShift, onDragMove, onDragSwap, onResize, onDoubleClick
}: TimelineGridProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header: Hour labels */}
      <div className="flex border-b-2 border-gray-200 bg-gray-50 sticky top-0 z-20">
        <div className="w-[140px] shrink-0 px-3 py-2 text-xs font-bold text-gray-500 border-r border-gray-200">
          NHÂN VIÊN
        </div>
        <div className="flex-1 flex">
          {HOURS.map(h => (
            <div
              key={h}
              className={`flex-1 text-center py-2 text-xs font-semibold border-r border-gray-100 last:border-0
                ${(h >= 11 && h <= 13) || (h >= 17 && h <= 20) ? 'text-error-500 bg-error-50/50' : 'text-gray-400'}
              `}
            >
              {h}h
            </div>
          ))}
        </div>
      </div>

      {/* Employee Rows */}
      <div className="divide-y-0">
        {employees.map(emp => {
          const empShifts = shifts.filter(s => s.employeeId === emp.employeeId)
          return (
            <EmployeeRow
              key={emp.employeeId}
              employee={emp}
              shifts={empShifts}
              gridStartHour={GRID_START}
              gridEndHour={GRID_END}
              modifiedShiftIds={modifiedShiftIds}
              warningShiftIds={warningShiftIds}
              errorShiftIds={errorShiftIds}
              selectedShiftId={selectedShiftId}
              isDragOver={dragOverEmployeeId === emp.employeeId}
              onSelectShift={onSelectShift}
              onDragMove={onDragMove}
              onDragSwap={onDragSwap}
              onResize={onResize}
              onDoubleClick={onDoubleClick}
            />
          )
        })}
      </div>

      {/* Staffing Level Bar (bottom) */}
      <StaffingLevelBar staffing={staffing} />
    </div>
  )
}
