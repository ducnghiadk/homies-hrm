'use client'

import { format } from 'date-fns'
import { Briefcase } from 'lucide-react'
import { getPositionById, getShiftById, type Schedule } from '@/lib/mock-data'
import { getEmployeeWeeklyHours } from '@/lib/mock-data-schedule-rules'
import { laborCostSettings, getHourlyRate, fmt } from '@/lib/mock-data-labor-cost'
import { getOpenShiftsByStoreWeek, getOpenShiftStateMeta } from '@/lib/mock-data-open-shifts'
import { getShiftPreferenceAvailability, type ShiftPreference } from '@/lib/mock-data-preferences'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'

interface Props {
  selectedStoreId: string
  weekDates: string[]
  employees: Array<{ id: string; full_name: string; position_id: string }>
  schedules: Schedule[]
  viewMode: 'staff' | 'cost' | 'both'
  staffingSummary: any
  costSummary: any
  showPrefs: boolean
  allPrefs: ShiftPreference[]
  handleCellClick: (empId: string, date: string) => void
  setShowCreateOS: (val: { date: string } | null) => void
  setOsShift: (val: string) => void
  setOsPosition: (val: string) => void
  setOsSlots: (val: number) => void
  setOsNote: (val: string) => void
  setOsAutoApprove: (val: boolean) => void
  handleCancelOpenShift: (id: string) => void
  setShowStaffingDetail: (val: string | null) => void
  showStaffingDetail: string | null
}

const staffColor = (req: number, asg: number) => {
  if (req === 0) return '#1E9E57'
  const diff = req - asg
  if (diff <= 0) return '#1E9E57'
  if (diff <= 2) return '#F6C85F'
  return '#D9381E'
}

export default function AssignScheduleGrid({
  selectedStoreId,
  weekDates,
  employees,
  schedules,
  viewMode,
  staffingSummary,
  costSummary,
  showPrefs,
  allPrefs,
  handleCellClick,
  setShowCreateOS,
  setOsShift,
  setOsPosition,
  setOsSlots,
  setOsNote,
  setOsAutoApprove,
  handleCancelOpenShift,
  setShowStaffingDetail,
  showStaffingDetail,
}: Props) {
  const getPref = (empId: string, date: string) => allPrefs.find(p => p.user_id === empId && p.date === date)
  const getScheduleCell = (empId: string, date: string) => schedules.find(s => s.employee_id === empId && s.date === date)

  const daySummary = weekDates.map(date => {
    const counts: Record<string, number> = {}
    ShiftTemplateService.getActiveForStore(selectedStoreId).forEach(s => { counts[s.id] = 0 })
    schedules.filter(s => s.date === date).forEach(s => {
      counts[s.shift_id] = (counts[s.shift_id] || 0) + 1
    })
    return counts
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-xs">
          <thead>
            <tr className="bg-vanilla-50">
              <th className="text-left p-2 pl-3 w-[140px] text-gray-500 font-bold sticky left-0 bg-vanilla-50 z-10">Nhân viên</th>
              {weekDates.map((date) => {
                const d = new Date(date)
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                const isToday = date === format(new Date(), 'yyyy-MM-dd')
                const dayStaff = staffingSummary?.daily.find((ds: any) => ds.date === date)
                const dayCost = costSummary?.daily.find((dc: any) => dc.date === date)
                return (
                  <th key={date} className={`text-center p-2 w-[80px] ${isToday ? 'bg-primary-50 text-primary-700' : isWeekend ? 'text-gray-400' : 'text-gray-600'} font-bold`}>
                    <div>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]}</div>
                    <div className="text-xs font-normal">{format(d, 'dd/MM')}</div>
                    {viewMode !== 'cost' && dayStaff && (
                      <div className="text-[9px] font-bold mt-0.5 cursor-pointer" style={{ color: staffColor(dayStaff.totalRequired, dayStaff.totalAssigned) }}
                        onClick={() => setShowStaffingDetail(showStaffingDetail === date ? null : date)}>
                        {dayStaff.totalAssigned}/{dayStaff.totalRequired}
                      </div>
                    )}
                    {viewMode !== 'staff' && dayCost && laborCostSettings.show_cost_on_schedule && (
                      <div className="text-[8px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {fmt(dayCost.totalCost)}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const pos = getPositionById(emp.position_id)
              return (
                <tr key={emp.id} className="border-t border-gray-50 hover:bg-vanilla-50/50">
                  <td className="p-2 pl-3 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
                        {emp.full_name.split(' ').pop()?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-dark-700 truncate text-xs">{emp.full_name.split(' ').slice(-2).join(' ')}</p>
                        {(() => {
                          const hrs = getEmployeeWeeklyHours(emp.id, weekDates, schedules)
                          const hrsColor = hrs > 48 ? 'text-error-500' : hrs > 40 ? 'text-warning-500' : 'text-gray-400'
                          const rate = laborCostSettings.show_hourly_rate ? getHourlyRate(emp.id) : 0
                          return (
                            <p className={`text-[9px] ${hrsColor}`}>
                              {pos?.name} • {hrs}h
                              {rate > 0 && <span className="text-gray-300 ml-1">({(rate/1000).toFixed(0)}k/h)</span>}
                            </p>
                          )
                        })()}
                      </div>
                    </div>
                  </td>

                  {weekDates.map(date => {
                    const schedule = getScheduleCell(emp.id, date)
                    const shift = schedule ? getShiftById(schedule.shift_id) : null
                    const d = new Date(date)
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6

                    return (
                      <td key={date} className="p-1 text-center">
                        <button
                          onClick={() => handleCellClick(emp.id, date)}
                          className={`w-full py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                            shift
                              ? 'border border-transparent hover:shadow-sm'
                              : 'bg-vanilla-50 text-gray-300 hover:bg-primary-50 hover:text-gray-400 border border-dashed border-gray-200'
                          }`}
                          style={shift ? { backgroundColor: `${shift.color}15`, color: shift.color, borderColor: `${shift.color}30` } : undefined}
                        >
                          {shift ? shift.name.replace('Ca ', '') : isWeekend ? '—' : '+'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
