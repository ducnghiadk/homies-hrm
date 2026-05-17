import { Employee, mockEmployees } from './mock-data'
import { addDays, format, startOfWeek, endOfWeek, differenceInHours, parseISO, isSameDay } from 'date-fns'

// --- Types ---

export type StaffAttribute = {
  employeeId: string
  name: string
  position: 'barista' | 'cashier' | 'support' | 'store_manager'
  type: 'fulltime' | 'parttime'
  maxHoursPerWeek: number
  hourlyRate: number
  unavailableDates?: string[] // ISO date strings
  preferredShifts?: 'morning' | 'evening' | 'any'
}

export type SchedulingConstraint = {
  id: string
  type: 'max_overtime' | 'no_clopening' | 'min_seniority' | 'max_consecutive_days'
  isActive: boolean
  value?: number // e.g., max OT hours
  label: string
}

export type HourlyTrafficPattern = {
  dayOfWeek: number // 0 (Sun) - 6 (Sat)
  hour: number // 0-23
  staffNeeded: number
}

export type ScheduleJob = {
  weekStart: Date
  storeId: string
  availableStaff: StaffAttribute[]
  constraints: SchedulingConstraint[]
  trafficPattern?: HourlyTrafficPattern[] // Optional, can be derived or mocked if missing
}

export type ScheduleShift = {
  id: string
  employeeId: string
  employeeName: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  position: 'barista' | 'cashier' | 'support' | 'store_manager'
  isOvertime: boolean
  breakMinutes: number
}

export type ScheduleStats = {
  totalShifts: number
  totalHours: number
  totalCost: number
  budgetVariance: number // Difference from budget (positive = over budget)
  coveragePercent: number
  ftHours: number
  ptHours: number
}

export type Warning = {
  id: string
  type: 'overtime' | 'clopening' | 'understaffed' | 'overstaffed' | 'compliance'
  severity: 'error' | 'warning' | 'info'
  message: string
  affectedShifts?: string[] // Shift IDs
  suggestion?: string
}

export type CostBreakdown = {
  byEmployee: {
    employeeId: string
    name: string
    hours: number
    cost: number
    isOvertime: boolean
  }[]
  byPosition: Record<string, number>
  totalCost: number
  totalHours: number
}

export type ScheduleResult = {
  id: string
  status: 'draft' | 'published'
  weekStart: string
  weekEnd: string
  shifts: ScheduleShift[]
  stats: ScheduleStats
  warnings: Warning[]
  costBreakdown: CostBreakdown
  generatedAt: string
}

export type ComparisonResult = {
  costDiff: number
  hourDiff: number
  efficiencyChange: number // % change
}

// --- Mock Data Helpers ---

export const MOCK_CONSTRAINTS: SchedulingConstraint[] = [
  { id: 'c1', type: 'max_overtime', isActive: true, value: 48, label: 'Không quá 48h/tuần (OT)' },
  { id: 'c2', type: 'no_clopening', isActive: true, label: 'Không xếp Clopening (Đóng tối -> Mở sáng)' },
  { id: 'c3', type: 'min_seniority', isActive: true, label: 'Tối thiểu 1 Senior/ca' },
  { id: 'c4', type: 'max_consecutive_days', isActive: true, value: 6, label: 'Nghỉ ít nhất 1 ngày/tuần' },
]

export const MOCK_TRAFFIC_PATTERN: HourlyTrafficPattern[] = []
// Generate mock traffic: peaks at 11-13h and 18-20h
for (let d = 0; d <= 6; d++) {
  for (let h = 7; h <= 22; h++) {
    let needed = 2
    if ((h >= 11 && h <= 13) || (h >= 18 && h <= 20)) needed = 4
    if (h >= 14 && h <= 17) needed = 3
    MOCK_TRAFFIC_PATTERN.push({ dayOfWeek: d, hour: h, staffNeeded: needed })
  }
}

// Helper to convert existing employees to StaffAttribute
export const getMockStaffAttributes = (): StaffAttribute[] => {
  return mockEmployees.slice(0, 8).map((emp, index) => ({
    employeeId: emp.id,
    name: emp.full_name,
    position: index === 0 ? 'store_manager' : (index < 3 ? 'barista' : (index < 5 ? 'cashier' : 'support')),
    type: index < 4 ? 'fulltime' : 'parttime',
    maxHoursPerWeek: index < 4 ? 48 : 24,
    hourlyRate: index === 0 ? 35000 : (index < 4 ? 25000 : 20000),
    preferredShifts: 'any'
  }))
}

// --- Core Logic ---

export function getSmartSchedule(job: ScheduleJob): ScheduleResult {
  const shifts: ScheduleShift[] = []
  const weekStart = job.weekStart
  const warnings: Warning[] = []
  
  // 1. Generate Shifts (Mock Logic)
  // Logic: 
  // - FT staff works 5-6 days, 8h shifts
  // - PT staff fills gaps/peaks
  
  job.availableStaff.forEach((staff, idx) => {
    // Determine days off based on index to rotate
    const dayOff = (idx % 7) 
    
    for (let i = 0; i < 7; i++) {
      if (i === dayOff && staff.type === 'fulltime') continue // FT gets 1 day off
      if (staff.type === 'parttime' && i % 2 === 0) continue // PT works every other day (mock)

      const currentDate = addDays(weekStart, i)
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      
      // Check unavailable dates
      if (staff.unavailableDates?.includes(dateStr)) continue

      let start = '07:00'
      let end = '15:00'

      // Rotate shifts: even index morning, odd index evening
      if (idx % 2 !== 0) {
        start = '14:30'
        end = '22:30'
      }
      
      // PT shifts shorter / specific times
      if (staff.type === 'parttime') {
         if (idx % 2 === 0) { start = '11:00'; end = '15:00' } // Peak lunch
         else { start = '17:00'; end = '21:00' } // Peak dinner
      }

      shifts.push({
        id: `sh-${Math.random().toString(36).substr(2, 9)}`,
        employeeId: staff.employeeId,
        employeeName: staff.name,
        date: dateStr,
        startTime: start,
        endTime: end,
        position: staff.position,
        isOvertime: false,
        breakMinutes: staff.type === 'fulltime' ? 60 : 0
      })
    }
  })

  // 2. Validate Constraints
  const complianceWarnings = checkCompliance(shifts, job.availableStaff, job.constraints)
  warnings.push(...complianceWarnings)

  // 3. Calculate Stats & Cost
  const costBreakdown = calculateCostBreakdown(shifts, job.availableStaff)
  
  const stats: ScheduleStats = {
    totalShifts: shifts.length,
    totalHours: costBreakdown.totalHours,
    totalCost: costBreakdown.totalCost,
    budgetVariance: 0, // Mock
    coveragePercent: 95, // Mock
    ftHours: costBreakdown.byEmployee.filter(s => job.availableStaff.find(st => st.employeeId === s.employeeId)?.type === 'fulltime').reduce((acc, curr) => acc + curr.hours, 0),
    ptHours: costBreakdown.byEmployee.filter(s => job.availableStaff.find(st => st.employeeId === s.employeeId)?.type === 'parttime').reduce((acc, curr) => acc + curr.hours, 0),
  }

  return {
    id: `sched-${Date.now()}`,
    status: 'draft',
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
    shifts,
    stats,
    warnings,
    costBreakdown,
    generatedAt: new Date().toISOString()
  }
}

export function checkCompliance(shifts: ScheduleShift[], staffList: StaffAttribute[], constraints: SchedulingConstraint[]): Warning[] {
  const warnings: Warning[] = []
  
  // 1. OT Check
  const hoursMap = new Map<string, number>()
  shifts.forEach(s => {
    const h = calculateHours(s.startTime, s.endTime) - (s.breakMinutes / 60)
    hoursMap.set(s.employeeId, (hoursMap.get(s.employeeId) || 0) + h)
  })

  hoursMap.forEach((hours, empId) => {
    const staff = staffList.find(s => s.employeeId === empId)
    if (staff && hours > staff.maxHoursPerWeek) {
      warnings.push({
        id: `w-ot-${empId}`,
        type: 'overtime',
        severity: 'warning',
        message: `${staff.name} làm ${hours.toFixed(1)}h/tuần (Vượt max: ${staff.maxHoursPerWeek}h)`,
        suggestion: 'Giảm bớt 1 ca hoặc chuyển cho nhân viên khác.'
      })
    }
  })

  // 2. Clopening Check (Close then Open)
  // Mock logic: check if someone ends > 22:00 and starts < 08:00 next day
  if (constraints.find(c => c.type === 'no_clopening' && c.isActive)) {
    // Need sorted shifts by date/time per employee
    // Simplified: just scanning mock data
    const shiftsByEmp = shifts.reduce((acc, s) => {
      if (!acc[s.employeeId]) acc[s.employeeId] = []
      acc[s.employeeId].push(s)
      return acc
    }, {} as Record<string, ScheduleShift[]>)

    Object.entries(shiftsByEmp).forEach(([empId, empShifts]) => {
      empShifts.sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())
      
      for (let i = 0; i < empShifts.length - 1; i++) {
        const current = empShifts[i]
        const next = empShifts[i+1]
        
        const isNextDay = differenceInHours(parseISO(next.date), parseISO(current.date)) === 24
        if (isNextDay) {
           const endHour = parseInt(current.endTime.split(':')[0])
           const startHour = parseInt(next.startTime.split(':')[0])
           
           if (endHour >= 22 && startHour <= 7) {
             warnings.push({
               id: `w-clopen-${empId}-${current.date}`,
               type: 'clopening',
               severity: 'error',
               message: `Phát hiện Clopening: ${current.employeeName} kết thúc ${current.endTime} và bắt đầu ${next.startTime} hôm sau.`,
               suggestion: 'Đổi ca sáng hôm sau cho nhân viên khác.'
             })
           }
        }
      }
    })
  }

  return warnings
}

export function calculateCostBreakdown(shifts: ScheduleShift[], staffList: StaffAttribute[]): CostBreakdown {
  const byEmployee: CostBreakdown['byEmployee'] = []
  const byPosition: Record<string, number> = {}
  let totalCost = 0
  let totalHours = 0

  const shiftsByEmp = shifts.reduce((acc, s) => {
      if (!acc[s.employeeId]) acc[s.employeeId] = []
      acc[s.employeeId].push(s)
      return acc
  }, {} as Record<string, ScheduleShift[]>)

  Object.entries(shiftsByEmp).forEach(([empId, empShifts]) => {
    const staff = staffList.find(s => s.employeeId === empId)
    if (!staff) return

    let empHours = 0
    let empCost = 0

    empShifts.forEach(s => {
      const h = calculateHours(s.startTime, s.endTime) - (s.breakMinutes / 60)
      const cost = h * staff.hourlyRate
      
      empHours += h
      empCost += cost
      
      // Update by Position
      byPosition[s.position] = (byPosition[s.position] || 0) + cost
    })

    totalHours += empHours
    totalCost += empCost
    
    byEmployee.push({
      employeeId: empId,
      name: staff.name,
      hours: empHours,
      cost: empCost,
      isOvertime: empHours > staff.maxHoursPerWeek
    })
  })

  return {
    byEmployee,
    byPosition,
    totalCost,
    totalHours
  }
}

// Helper
function calculateHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh + em/60) - (sh + sm/60)
}

export function getOptimizationSuggestions(warnings: Warning[]): string[] {
  return warnings.map(w => w.suggestion || `Fix issue: ${w.message}`)
}

export function compareWithPreviousWeek(current: ScheduleResult): ComparisonResult {
    // Mock comparison
    return {
        costDiff: -500000,
        hourDiff: -10,
        efficiencyChange: 5
    }
}

export const mockExportFile = (type: 'pdf' | 'excel', schedule: ScheduleResult): void => {
    console.log(`Exporting ${type} for schedule ${schedule.id}`)
    alert(`Đã xuất file ${type.toUpperCase()} thành công! (Mock)`)
}
