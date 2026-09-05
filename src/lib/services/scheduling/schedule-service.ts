import {
  initSchedules,
  saveSchedulesToStorage,
  getAllSchedulesByEmployee,
  getSchedulesByStoreWeek,
  getScheduleByEmployeeDate,
  addSchedule as apiAddSchedule,
  removeSchedule as apiRemoveSchedule,
  type Schedule,
  mockSchedules,
  isStoreMatch,
} from '@/lib/mock-data'
import { AuthUser } from '@/store/auth-store'
import { EmployeeService } from '@/lib/services/employee-service'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { ScheduleEmailService } from '@/lib/services/schedule-email-service'
import { notifyScheduleChangedAfterPublish, notifySchedulePublished } from '@/lib/notifications/schedule-notifications'
import { getPositionById, getShiftById, getStoreById } from '@/lib/mock-data'
import {
  createOrUpdateRegistrationWeek,
  getRegistrationWeekByWeek,
  getShiftQuotas,
  saveShiftQuotas,
  updateRegistrationStatus,
} from '@/lib/mock-data-registration-weeks'
import {
  getAllPreferencesForWeek,
  getShiftPreferenceLevel,
  savePreferences,
} from '@/lib/mock-data-preferences'
import { checkScheduleWarnings, scanWeekWarnings, type WarningLevel } from '@/lib/mock-data-schedule-rules'
import { scheduleAdapter } from '@/lib/adapters/schedule-adapter'
import { isRealDbMode } from '@/lib/adapters/repository-config'
import { getImportWeekStarts } from '@/lib/services/scheduling/schedule-import-batch'

type ScheduleWeekStatus = 'draft' | 'published' | 'locked'

export type ScheduleCycleStatus = 'registration_open' | 'registration_closed' | 'drafting' | 'published'
export type ShiftRegistrationPreference = 'preferred' | 'available' | 'unavailable'
export type ScheduleDbSyncStatus = 'da_luu_db' | 'chi_luu_may' | 'that_bai'

export type ScheduleDbSyncResult = {
  trangThai: ScheduleDbSyncStatus
  soGhiThanhCong: number
  soBiLoai: number
  lyDo?: string[]
}

export type ScheduleAssignResult = ScheduleDbSyncResult & {
  schedule: Schedule | null
  warnings: ScheduleValidationWarning[]
}

export type ScheduleImportResult = ScheduleDbSyncResult & {
  count: number
  valueOf: () => number
}

function buildLocalOnlyResult(count: number): ScheduleDbSyncResult {
  return {
    trangThai: 'chi_luu_may',
    soGhiThanhCong: count,
    soBiLoai: 0,
  }
}

function mapAdapterSyncResult(result: { ok: boolean; soGhiThanhCong: number; soBiLoai: number; lyDo?: string[] }): ScheduleDbSyncResult {
  if (!isRealDbMode()) return buildLocalOnlyResult(result.soGhiThanhCong)
  return {
    trangThai: result.ok ? 'da_luu_db' : 'that_bai',
    soGhiThanhCong: result.soGhiThanhCong,
    soBiLoai: result.soBiLoai,
    lyDo: result.lyDo,
  }
}

export type ScheduleWeekMeta = {
  store_id: string
  week_start: string
  week_end: string
  status: ScheduleWeekStatus
  published_at?: string
  published_by?: string
  updated_at: string
  updated_by: string
}

export type ScheduleWeek = ScheduleWeekMeta & {
  registration_open_at?: string
  registration_deadline?: string
  target_publish_at?: string
  cycle_status: ScheduleCycleStatus
  registration_week_id?: string
}

export type ScheduleWeekStateMeta = {
  key: ScheduleCycleStatus
  label: string
  description: string
  tone: string
}

export type ScheduleAssignmentStateMeta = {
  key: 'draft' | 'published' | 'changed_after_publish'
  label: string
  description: string
  tone: string
}

export type ShiftDemand = {
  id: string
  registration_week_id: string
  store_id: string
  week_start: string
  date: string
  shift_template_id: string
  position_id: string
  required_count: number
  min_count: number
  notes?: string
}

export type ShiftRegistration = {
  id: string
  employee_id: string
  store_id: string
  week_start: string
  date: string
  shift_template_id: string
  preference: ShiftRegistrationPreference
  note?: string
  submitted: boolean
}

export type AssignmentBoardSlot = ShiftDemand & {
  assigned_employee_ids: string[]
  preferred_employee_ids: string[]
  available_employee_ids: string[]
  unavailable_employee_ids: string[]
  filled_count: number
  missing_count: number
}

export type AssignmentBoardEmployee = {
  employee: AuthUser
  registrations: ShiftRegistration[]
  assigned_count: number
}

export type AssignmentBoardData = {
  week: ScheduleWeek
  demands: AssignmentBoardSlot[]
  employees: AssignmentBoardEmployee[]
  assignments: Schedule[]
}

export type AssignmentRecommendation = {
  employee_id: string
  employee_name: string
  position_id: string
  position_name: string
  assigned_count: number
  preference: ShiftRegistrationPreference | 'unknown'
  score: number
  label: string
  reason: string
  is_assigned: boolean
  has_same_day_assignment: boolean
  same_day_shift_name?: string
}

export type ScheduleChangeLog = {
  id: string
  store_id: string
  week_start: string
  assignment_id: string
  employee_id: string
  date: string
  action: 'create' | 'update' | 'cancel' | 'delete' | 'publish'
  before_state?: Schedule | null
  after_state?: Schedule | null
  changed_by: string
  changed_at: string
  reason: string
}

export type ScheduleChangeLogFeed = ScheduleChangeLog & {
  actor_name: string
  store_name: string
  employee_name: string
  before_shift_name?: string
  after_shift_name?: string
}

export type ScheduleValidationWarning = {
  type: string
  message: string
  code?: string
  employee_id?: string
  date?: string
  shift_id?: string
  level?: WarningLevel
}

type SchedulePublishSummary = {
  totalAssignments: number
  assignedEmployees: number
  unassignedEmployees: number
  blockingWarnings: ScheduleValidationWarning[]
  warnings: ScheduleValidationWarning[]
  changedAfterPublishCount: number
  canPublish: boolean
}

type CopyWeekResult = {
  copied: number
  skipped_invalid_employee: number
  skipped_existing_assignment: number
}

const WEEK_META_KEY = 'homies_schedule_weeks'
const CHANGE_LOG_KEY = 'homies_schedule_change_logs'
const SHIFT_DEMAND_POSITION_NOTE_PREFIX = '[hrm-demand-position]'

export class ScheduleService {
  private static readonly BLOCKING_WARNING_TYPES = new Set([
    'invalid_employee',
    'missing_reason',
  ])

  private static isBlockingWarning(warning: ScheduleValidationWarning) {
    return warning.level === 'block' || this.BLOCKING_WARNING_TYPES.has(warning.type)
  }

  private static toValidationWarningFromRuleWarning(warning: ReturnType<typeof checkScheduleWarnings>[number]): ScheduleValidationWarning {
    return {
      type: `rule_${warning.warning_type}`,
      code: warning.warning_level === 'block' ? 'RULE_BLOCK' : 'RULE_WARNING',
      message: warning.message,
      employee_id: warning.employee_id,
      date: warning.date,
      shift_id: warning.shift_id,
      level: warning.warning_level,
    }
  }

  private static init() {
    initSchedules()
  }

  private static encodeDemandNotes(positionId: string, notes?: string) {
    const cleanNotes = (notes || '').trim()
    return cleanNotes
      ? `${SHIFT_DEMAND_POSITION_NOTE_PREFIX}${positionId} ${cleanNotes}`
      : `${SHIFT_DEMAND_POSITION_NOTE_PREFIX}${positionId}`
  }

  private static decodeDemandNotes(rawNotes?: string): { positionId?: string; notes?: string } {
    const value = (rawNotes || '').trim()
    if (!value.startsWith(SHIFT_DEMAND_POSITION_NOTE_PREFIX)) {
      return { notes: value || undefined }
    }

    const payload = value.slice(SHIFT_DEMAND_POSITION_NOTE_PREFIX.length)
    const separatorIndex = payload.indexOf(' ')
    if (separatorIndex === -1) {
      return {
        positionId: payload || undefined,
      }
    }

    const positionId = payload.slice(0, separatorIndex).trim()
    const notes = payload.slice(separatorIndex + 1).trim()
    return {
      positionId: positionId || undefined,
      notes: notes || undefined,
    }
  }

  private static ensureWeekMetaStorage() {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(WEEK_META_KEY)) {
      localStorage.setItem(WEEK_META_KEY, JSON.stringify([]))
    }
  }

  private static ensureChangeLogStorage() {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(CHANGE_LOG_KEY)) {
      localStorage.setItem(CHANGE_LOG_KEY, JSON.stringify([]))
    }
  }

  private static getWeekMetaDb(): ScheduleWeekMeta[] {
    this.ensureWeekMetaStorage()
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(WEEK_META_KEY) || '[]') as ScheduleWeekMeta[]
    } catch (error) {
      console.warn(`[ScheduleService] Failed to parse ${WEEK_META_KEY}. Falling back to empty week meta.`, error)
      return []
    }
  }

  private static saveWeekMetaDb(data: ScheduleWeekMeta[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WEEK_META_KEY, JSON.stringify(data))
    }
  }

  private static getChangeLogDb(): ScheduleChangeLog[] {
    this.ensureChangeLogStorage()
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(CHANGE_LOG_KEY) || '[]') as ScheduleChangeLog[]
    } catch (error) {
      console.warn(`[ScheduleService] Failed to parse ${CHANGE_LOG_KEY}. Falling back to empty change log.`, error)
      return []
    }
  }

  private static saveChangeLogDb(data: ScheduleChangeLog[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHANGE_LOG_KEY, JSON.stringify(data))
    }
  }

  private static addChangeLog(entry: Omit<ScheduleChangeLog, 'id' | 'changed_at'>) {
    const db = this.getChangeLogDb()
    db.unshift({
      id: `sch-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      changed_at: new Date().toISOString(),
      ...entry,
    })
    this.saveChangeLogDb(db)
  }

  static getWeekStartDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const year = monday.getFullYear()
    const month = String(monday.getMonth() + 1).padStart(2, '0')
    const date = String(monday.getDate()).padStart(2, '0')
    return `${year}-${month}-${date}`
  }

  static getWeekDates(weekStartDate: string): string[] {
    const monday = new Date(`${weekStartDate}T00:00:00`)
    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(monday)
      current.setDate(monday.getDate() + index)
      const year = current.getFullYear()
      const month = String(current.getMonth() + 1).padStart(2, '0')
      const day = String(current.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })
  }

  static getWeekMeta(storeId: string, weekStartDate: string): ScheduleWeekMeta | null {
    const db = this.getWeekMetaDb()
    return db.find(item => item.store_id === storeId && item.week_start === weekStartDate) || null
  }

  private static toCycleStatus(weekMeta: ScheduleWeekMeta | null, registrationStatus?: string): ScheduleCycleStatus {
    if (weekMeta?.status === 'published' || registrationStatus === 'published') return 'published'
    if (registrationStatus === 'open') return 'registration_open'
    if (registrationStatus === 'reviewing') return 'drafting'
    return 'registration_closed'
  }

  static getScheduleWeek(storeId: string, weekStartDate: string): ScheduleWeek | null {
    const weekMeta = this.getWeekMeta(storeId, weekStartDate)
    const registrationWeek = getRegistrationWeekByWeek(storeId, weekStartDate)

    if (!weekMeta && !registrationWeek) return null

    const weekDates = this.getWeekDates(weekStartDate)
    return {
      store_id: storeId,
      week_start: weekStartDate,
      week_end: weekDates[6] || weekStartDate,
      status: weekMeta?.status || (registrationWeek?.status === 'published' ? 'published' : 'draft'),
      published_at: weekMeta?.published_at || registrationWeek?.published_at,
      published_by: weekMeta?.published_by,
      updated_at: weekMeta?.updated_at || registrationWeek?.updated_at || new Date().toISOString(),
      updated_by: weekMeta?.updated_by || registrationWeek?.created_by || '',
      registration_open_at: registrationWeek?.registration_open_date,
      registration_deadline: registrationWeek?.registration_deadline,
      target_publish_at: undefined,
      cycle_status: this.toCycleStatus(weekMeta, registrationWeek?.status),
      registration_week_id: registrationWeek?.id,
    }
  }

  static getOrCreateScheduleWeek(storeId: string, weekStartDate: string, currentUser?: AuthUser): ScheduleWeek {
    const existing = this.getScheduleWeek(storeId, weekStartDate)
    if (existing) return existing

    const weekDates = this.getWeekDates(weekStartDate)
    const monday = new Date(`${weekStartDate}T00:00:00`)
    const openDate = new Date(monday)
    openDate.setDate(monday.getDate() - 7)
    const deadline = new Date(monday)
    deadline.setDate(monday.getDate() - 2)

    const registrationWeek = createOrUpdateRegistrationWeek({
      org_id: 'org-001',
      store_id: storeId,
      week_start_date: weekStartDate,
      status: 'open',
      registration_open_date: openDate.toISOString().split('T')[0],
      registration_deadline: `${deadline.toISOString().split('T')[0]}T23:59`,
      created_by: currentUser?.id || 'system',
    })

    this.ensureWeekMetaStorage()
    const db = this.getWeekMetaDb()
    db.push({
      store_id: storeId,
      week_start: weekStartDate,
      week_end: weekDates[6] || weekStartDate,
      status: 'draft',
      updated_at: new Date().toISOString(),
      updated_by: currentUser?.id || 'system',
    })
    this.saveWeekMetaDb(db)

    return {
      store_id: storeId,
      week_start: weekStartDate,
      week_end: weekDates[6] || weekStartDate,
      status: 'draft',
      updated_at: new Date().toISOString(),
      updated_by: currentUser?.id || 'system',
      registration_open_at: registrationWeek.registration_open_date,
      registration_deadline: registrationWeek.registration_deadline,
      cycle_status: 'registration_open',
      registration_week_id: registrationWeek.id,
    }
  }

  static updateScheduleWeekWindow(input: {
    currentUser: AuthUser
    storeId: string
    weekStart: string
    registrationOpenAt: string
    registrationDeadline: string
    targetPublishAt?: string
    status?: 'closed' | 'open' | 'reviewing' | 'published'
  }): ScheduleWeek {
    const existing = this.getOrCreateScheduleWeek(input.storeId, input.weekStart, input.currentUser)
    const registrationWeek = createOrUpdateRegistrationWeek({
      id: existing.registration_week_id,
      org_id: 'org-001',
      store_id: input.storeId,
      week_start_date: input.weekStart,
      status: input.status || 'open',
      registration_open_date: input.registrationOpenAt,
      registration_deadline: input.registrationDeadline,
      created_by: input.currentUser.id,
      published_at: existing.published_at,
    })

    return {
      ...existing,
      registration_open_at: registrationWeek.registration_open_date,
      registration_deadline: registrationWeek.registration_deadline,
      target_publish_at: input.targetPublishAt,
      registration_week_id: registrationWeek.id,
      cycle_status: this.toCycleStatus(this.getWeekMeta(input.storeId, input.weekStart), registrationWeek.status),
    }
  }

  static getWeekStateMeta(week: ScheduleWeek): ScheduleWeekStateMeta {
    if (week.cycle_status === 'published') {
      return {
        key: 'published',
        label: 'Đã chốt',
        description: 'Lịch chính thức đã chốt và nhân viên đang nhìn thấy.',
        tone: 'bg-emerald-50 text-emerald-700',
      }
    }

    if (week.cycle_status === 'drafting') {
      return {
        key: 'drafting',
        label: 'Đang lên lịch',
        description: 'Đợt đăng ký đã qua và quản lý đang xếp bản nháp.',
        tone: 'bg-sky-50 text-sky-700',
      }
    }

    if (week.cycle_status === 'registration_open') {
      return {
        key: 'registration_open',
        label: 'Mở đăng ký',
        description: 'Nhân sự còn có thể gửi availability cho tuần này.',
        tone: 'bg-amber-50 text-amber-700',
      }
    }

    return {
      key: 'registration_closed',
      label: 'Đã khóa đăng ký',
      description: 'Đợt đăng ký đã đóng, chờ quản lý chốt bản nháp.',
      tone: 'bg-slate-100 text-slate-700',
    }
  }

  static getAssignmentStateMeta(schedule: Schedule): ScheduleAssignmentStateMeta {
    if (schedule.modified_after_publish) {
      return {
        key: 'changed_after_publish',
        label: 'Đã đổi sau khi chốt',
        description: schedule.change_reason?.trim() || 'Ca này đã bị chỉnh sau khi tuần được chốt.',
        tone: 'bg-primary-50 text-primary-700',
      }
    }

    if (schedule.status === 'published') {
      return {
        key: 'published',
        label: 'Chính thức',
        description: 'Ca này đang là lịch chính thức.',
        tone: 'bg-emerald-50 text-emerald-700',
      }
    }

    return {
      key: 'draft',
      label: 'Bản nháp',
      description: 'Ca này mới ở bản nháp nội bộ của quản lý.',
      tone: 'bg-amber-50 text-amber-700',
    }
  }

  static getSlotRecommendations(board: AssignmentBoardData, slot: AssignmentBoardSlot): AssignmentRecommendation[] {
    const sameDayByEmployee = new Map<string, Schedule[]>()
    board.assignments.forEach(schedule => {
      const key = `${schedule.employee_id}_${schedule.date}`
      const current = sameDayByEmployee.get(key) || []
      current.push(schedule)
      sameDayByEmployee.set(key, current)
    })

    return board.employees
      .filter(item => item.employee.position_id === slot.position_id || item.employee.secondary_position_ids?.includes(slot.position_id) || slot.assigned_employee_ids.includes(item.employee.id))
      .map(item => {
        const isSecondary = item.employee.position_id !== slot.position_id && item.employee.secondary_position_ids?.includes(slot.position_id)
        const registration = item.registrations.find(registration =>
          registration.date === slot.date &&
          registration.shift_template_id === slot.shift_template_id
        )
        const preference: AssignmentRecommendation['preference'] = registration?.preference || 'unknown'
        const sameDaySchedules = sameDayByEmployee.get(`${item.employee.id}_${slot.date}`) || []
        const sameDayOtherShift = sameDaySchedules.find(schedule => schedule.shift_id !== slot.shift_template_id) || null
        const isAssigned = slot.assigned_employee_ids.includes(item.employee.id)

        let score = 0
        if (isAssigned) score += 120
        if (preference === 'preferred') score += 60
        else if (preference === 'available') score += 30
        else if (preference === 'unknown') score += 10
        else score -= 50

        if (isSecondary) score -= 5 // Ưu tiên nhẹ cho người có vị trí chính
        score += Math.max(0, 24 - (item.assigned_count * 4))
        if (sameDayOtherShift) score -= 45
        if (item.employee.status === 'probation') score -= 3

        const preferenceLabel =
          preference === 'preferred' ? 'Ưu tiên đăng ký' :
            preference === 'available' ? 'Có thể nhận ca' :
              preference === 'unavailable' ? 'Đã báo không thể làm' :
                'Chưa có đăng ký'
        const reasonParts = [
          isSecondary ? 'Kiêm nhiệm vị trí này' : 'Vị trí chính',
          preferenceLabel,
          `Đã xếp ${item.assigned_count} ca trong tuần`,
        ]

        if (sameDayOtherShift) {
          reasonParts.push(`Đang có ca ${ShiftTemplateService.getById(sameDayOtherShift.shift_id)?.name || sameDayOtherShift.shift_id} cùng ngày`)
        }

        if (item.employee.status === 'probation') {
          reasonParts.push('Đang thử việc')
        }

        return {
          employee_id: item.employee.id,
          employee_name: item.employee.full_name,
          position_id: item.employee.position_id,
          position_name: getPositionById(item.employee.position_id)?.name || item.employee.position_id,
          assigned_count: item.assigned_count,
          preference,
          score,
          label: isAssigned
            ? 'Đang giữ'
            : sameDayOtherShift
              ? 'Cần kiểm tra'
              : preference === 'preferred'
                ? 'Ưu tiên'
                : preference === 'available'
                  ? 'Có thể gán'
                  : preference === 'unavailable'
                    ? 'Cân nhắc'
                    : 'Gợi ý',
          reason: reasonParts.join(' · '),
          is_assigned: isAssigned,
          has_same_day_assignment: Boolean(sameDayOtherShift),
          same_day_shift_name: sameDayOtherShift
            ? (ShiftTemplateService.getById(sameDayOtherShift.shift_id)?.name || sameDayOtherShift.shift_id)
            : undefined,
        }
      })
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score
        if (right.assigned_count !== left.assigned_count) return left.assigned_count - right.assigned_count
        return left.employee_name.localeCompare(right.employee_name)
      })
  }

  private static moveWeekToDrafting(storeId: string, weekStartDate: string) {
    const registrationWeek = getRegistrationWeekByWeek(storeId, weekStartDate)
    if (!registrationWeek || registrationWeek.status === 'published' || registrationWeek.status === 'reviewing') return
    updateRegistrationStatus(registrationWeek.id, 'reviewing')
  }

  private static touchPublishedWeek(currentUser: AuthUser, storeId: string, weekStartDate: string) {
    const weekDates = this.getWeekDates(weekStartDate)
    const weekEndDate = weekDates[6]
    if (!weekEndDate) return

    const db = this.getWeekMetaDb()
    const index = db.findIndex(item => item.store_id === storeId && item.week_start === weekStartDate)
    if (index === -1) return

    db[index] = {
      ...db[index],
      week_end: weekEndDate,
      status: 'published',
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
    }
    this.saveWeekMetaDb(db)

    const registrationWeek = getRegistrationWeekByWeek(storeId, weekStartDate)
    if (registrationWeek && registrationWeek.status !== 'published') {
      updateRegistrationStatus(registrationWeek.id, 'published')
    }
  }

  static getShiftDemand(storeId: string, weekStart: string): ShiftDemand[] {
    const week = this.getOrCreateScheduleWeek(storeId, weekStart)
    if (!week.registration_week_id) return []

    const quotas = getShiftQuotas(week.registration_week_id)
    const templates = ShiftTemplateService.getActiveForStore(storeId)
    const positions = Array.from(new Set(templates.flatMap(template => template.allowed_position_ids || [])))

    return quotas.flatMap(quota => {
      const template = templates.find(item => item.id === quota.shift_id)
      const decoded = this.decodeDemandNotes(quota.notes)
      if (decoded.positionId) {
        return [{
          id: `demand-${quota.id}-${decoded.positionId}`,
          registration_week_id: week.registration_week_id!,
          store_id: storeId,
          week_start: weekStart,
          date: quota.date,
          shift_template_id: quota.shift_id,
          position_id: decoded.positionId,
          required_count: quota.max_staff,
          min_count: quota.min_staff,
          notes: decoded.notes,
        }]
      }

      const positionIds = template?.allowed_position_ids?.length ? template.allowed_position_ids : positions

      return positionIds.map(positionId => ({
        id: `demand-${quota.id}-${positionId}`,
        registration_week_id: week.registration_week_id!,
        store_id: storeId,
        week_start: weekStart,
        date: quota.date,
        shift_template_id: quota.shift_id,
        position_id: positionId,
        required_count: quota.max_staff,
        min_count: quota.min_staff,
        notes: decoded.notes,
      }))
    })
  }

  static saveShiftDemand(currentUser: AuthUser, storeId: string, weekStart: string, demands: ShiftDemand[]): ShiftDemand[] {
    const week = this.getOrCreateScheduleWeek(storeId, weekStart, currentUser)
    if (!week.registration_week_id) return []

    const quotas = demands.map(demand => ({
      registration_week_id: week.registration_week_id!,
      shift_id: demand.shift_template_id,
      date: demand.date,
      min_staff: demand.min_count,
      max_staff: demand.required_count,
      notes: this.encodeDemandNotes(demand.position_id, demand.notes),
    }))

    saveShiftQuotas(week.registration_week_id, quotas)
    this.moveWeekToDrafting(storeId, weekStart)
    return this.getShiftDemand(storeId, weekStart)
  }

  static getRegistrationsForWeek(storeId: string, weekStart: string): ShiftRegistration[] {
    const employees = EmployeeService.getEmployees({
      id: 'system',
      full_name: 'system',
      email: 'system@local',
      role: 'hr_admin',
      store_id: storeId,
      position_id: 'pos-005',
      phone: '',
      employee_code: 'SYS',
      status: 'active',
      account_status: 'dang_hoat_dong',
      total_points: 0,
      gamification_level: 'system',
      hire_date: weekStart,
    }).filter(employee => employee.store_id === storeId)

    const employeeIds = new Set(employees.map(employee => employee.id))
    const prefs = getAllPreferencesForWeek(weekStart).filter(pref => employeeIds.has(pref.user_id))
    const templates = ShiftTemplateService.getActiveForStore(storeId)

    const registrations: ShiftRegistration[] = []
    prefs.forEach(pref => {
      if (pref.not_available) {
        templates.forEach(template => {
          registrations.push({
            id: `${pref.id}-${template.id}-na`,
            employee_id: pref.user_id,
            store_id: storeId,
            week_start: weekStart,
            date: pref.date,
            shift_template_id: template.id,
            preference: 'unavailable',
            note: pref.reason || pref.note,
            submitted: pref.status === 'submitted',
          })
        })
        return
      }

      templates.forEach(template => {
        const preferenceLevel = getShiftPreferenceLevel(pref, template.id)
        registrations.push({
          id: `${pref.id}-${template.id}`,
          employee_id: pref.user_id,
          store_id: storeId,
          week_start: weekStart,
          date: pref.date,
          shift_template_id: template.id,
          preference: preferenceLevel,
          note: pref.note,
          submitted: pref.status === 'submitted',
        })
      })
    })

    return registrations
  }

  static saveEmployeeRegistration(input: {
    currentUser: AuthUser
    employeeId: string
    weekStart: string
    entries: Array<{
      date: string
      shift_template_id: string
      preference: ShiftRegistrationPreference
      note?: string
    }>
    submit?: boolean
  }): ShiftRegistration[] {
    const employee = EmployeeService.getEmployeeById(input.employeeId, input.currentUser) || EmployeeService.getEmployeeById(input.employeeId)
    if (!employee || employee.id !== input.currentUser.id) return []
    if (!['active', 'probation'].includes(employee.status)) return []

    const week = this.getOrCreateScheduleWeek(employee.store_id, input.weekStart, input.currentUser)
    if (week.registration_deadline && new Date(week.registration_deadline) < new Date()) return []
    if (week.cycle_status !== 'registration_open') return []

    const templates = ShiftTemplateService.getActiveForStore(employee.store_id)

    const dayMap = new Map<string, {
      morning: boolean
      afternoon: boolean
      evening: boolean
      notAvailable: boolean
      shiftPreferences: Record<string, boolean>
      shiftPreferenceLevels: Record<string, ShiftRegistrationPreference>
      reason?: string
    }>()

    input.entries.forEach(entry => {
      const current = dayMap.get(entry.date) || {
        morning: false,
        afternoon: false,
        evening: false,
        notAvailable: false,
        shiftPreferences: {},
        shiftPreferenceLevels: {},
      }
      if (entry.preference === 'unavailable') {
        current.morning = false
        current.afternoon = false
        current.evening = false
        current.notAvailable = true
        templates.forEach(template => {
          current.shiftPreferences[template.id] = false
          current.shiftPreferenceLevels[template.id] = 'unavailable'
        })
      } else {
        current.notAvailable = false
        current.shiftPreferences[entry.shift_template_id] = true
        current.shiftPreferenceLevels[entry.shift_template_id] = entry.preference
        if (entry.shift_template_id === 'shift-001') current.morning = true
        if (entry.shift_template_id === 'shift-002') current.afternoon = true
        if (entry.shift_template_id === 'shift-003') current.evening = true
      }
      if (entry.note) current.reason = entry.note
      dayMap.set(entry.date, current)
    })

    savePreferences(
      input.employeeId,
      input.weekStart,
      Array.from(dayMap.entries()).map(([date, value]) => ({
        date,
        morning: value.morning,
        afternoon: value.afternoon,
        evening: value.evening,
        notAvailable: value.notAvailable,
        shiftPreferences: value.shiftPreferences,
        shiftPreferenceLevels: value.shiftPreferenceLevels,
        reason: value.reason,
      })),
      '',
      input.submit ? 'submitted' : 'draft',
    )

    return this.getRegistrationsForWeek(employee.store_id, input.weekStart).filter(registration => registration.employee_id === input.employeeId)
  }

  static getAssignmentBoardData(currentUser: AuthUser, storeId: string, weekStart: string): AssignmentBoardData {
    const week = this.getOrCreateScheduleWeek(storeId, weekStart, currentUser)
    const demands = this.getShiftDemand(storeId, weekStart)
    const registrations = this.getRegistrationsForWeek(storeId, weekStart)
    const assignments = this.getStoreSchedules(currentUser, storeId, this.getWeekDates(weekStart))
    const eligibleEmployees = this.getEligibleEmployees(currentUser, storeId)

    const slots: AssignmentBoardSlot[] = demands.map(demand => {
      const assigned = assignments.filter(assignment =>
        assignment.date === demand.date &&
        assignment.shift_id === demand.shift_template_id &&
        (assignment.assigned_position_id || eligibleEmployees.find(employee => employee.id === assignment.employee_id)?.position_id) === demand.position_id
      )
      const relatedRegs = registrations.filter(registration => {
        if (registration.date !== demand.date || registration.shift_template_id !== demand.shift_template_id) return false
        const emp = eligibleEmployees.find(employee => employee.id === registration.employee_id)
        if (!emp) return false
        return emp.position_id === demand.position_id || emp.secondary_position_ids?.includes(demand.position_id)
      })

      return {
        ...demand,
        assigned_employee_ids: assigned.map(item => item.employee_id),
        preferred_employee_ids: relatedRegs.filter(item => item.preference === 'preferred').map(item => item.employee_id),
        available_employee_ids: relatedRegs.filter(item => item.preference === 'available').map(item => item.employee_id),
        unavailable_employee_ids: relatedRegs.filter(item => item.preference === 'unavailable').map(item => item.employee_id),
        filled_count: assigned.length,
        missing_count: Math.max(demand.required_count - assigned.length, 0),
      }
    })

    return {
      week,
      demands: slots,
      employees: eligibleEmployees.map(employee => ({
        employee,
        registrations: registrations.filter(registration => registration.employee_id === employee.id),
        assigned_count: assignments.filter(assignment => assignment.employee_id === employee.id).length,
      })),
      assignments,
    }
  }

  static async assignEmployeeToSlot(input: {
    currentUser: AuthUser
    storeId: string
    weekStart: string
    employeeId: string
    date: string
    shiftTemplateId: string
    assignedPositionId?: string
    note?: string
    changeReason?: string
  }): Promise<ScheduleAssignResult> {
    const warnings = this.validateAssignmentAgainstShiftTemplate(
      input.currentUser,
      input.storeId,
      input.employeeId,
      input.shiftTemplateId,
      input.date,
      input.assignedPositionId,
    )
    const employeeRegs = this.getRegistrationsForWeek(input.storeId, input.weekStart).filter(registration =>
      registration.employee_id === input.employeeId &&
      registration.date === input.date &&
      registration.shift_template_id === input.shiftTemplateId
    )

    const hasUnavailable = employeeRegs.some(registration => registration.preference === 'unavailable')
    if (hasUnavailable) {
      warnings.push({
        type: 'registration_unavailable',
        message: 'Nhân viên đã đánh dấu không thể làm ca này.',
        employee_id: input.employeeId,
        date: input.date,
        shift_id: input.shiftTemplateId,
      })
    }

    const result = await this.assignSchedule(
      input.currentUser,
      input.storeId,
      input.employeeId,
      input.shiftTemplateId,
      input.date,
      input.note,
      input.changeReason,
      input.assignedPositionId,
    )
    return { ...result, warnings }
  }

  static removeAssignment(
    currentUser: AuthUser,
    storeId: string,
    employeeId: string,
    date: string,
    changeReason?: string
  ): boolean {
    return this.deleteSchedule(currentUser, storeId, employeeId, date, changeReason)
  }

  static validateWeekForPublish(currentUser: AuthUser, storeId: string, weekStart: string): {
    canPublish: boolean
    hardWarnings: ScheduleValidationWarning[]
    softWarnings: ScheduleValidationWarning[]
  } {
    const weekDates = this.getWeekDates(weekStart)
    const summary = this.getPublishSummary(currentUser, storeId, weekDates)
    const board = this.getAssignmentBoardData(currentUser, storeId, weekStart)
    const underfilledWarnings: ScheduleValidationWarning[] = board.demands
      .filter(demand => demand.missing_count > 0)
      .map(demand => ({
        type: 'underfilled_slot',
        date: demand.date,
        shift_id: demand.shift_template_id,
        message: `Ca ${demand.shift_template_id} ngày ${demand.date} còn thiếu ${demand.missing_count} người cho vị trí ${demand.position_id}.`,
      }))

    return {
      canPublish: summary.blockingWarnings.length === 0,
      hardWarnings: summary.blockingWarnings,
      softWarnings: [...summary.warnings.filter(w => !this.isBlockingWarning(w)), ...underfilledWarnings],
    }
  }

  static saveDraftWeek(currentUser: AuthUser, storeId: string, weekDates: string[]): boolean {
    this.init()
    this.ensureWeekMetaStorage()

    if (currentUser.role === 'employee') return false
    if (['store_manager', 'shift_leader'].includes(currentUser.role) && currentUser.store_id !== storeId) return false

    const weekStartDate = weekDates[0]
    const weekEndDate = weekDates[6]
    if (!weekStartDate || !weekEndDate) return false

    const db = this.getWeekMetaDb()
    const index = db.findIndex(item => item.store_id === storeId && item.week_start === weekStartDate)
    const base: ScheduleWeekMeta = {
      store_id: storeId,
      week_start: weekStartDate,
      week_end: weekEndDate,
      status: 'draft',
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
    }

    if (index === -1) {
      db.push(base)
    } else {
      db[index] = {
        ...db[index],
        ...base,
        status: db[index].status === 'published' ? 'published' : 'draft',
      }
    }

    this.saveWeekMetaDb(db)
    this.moveWeekToDrafting(storeId, weekStartDate)
    return true
  }

  static isWeekPublished(storeId: string, weekStartDate: string): boolean {
    const meta = this.getWeekMeta(storeId, weekStartDate)
    return meta?.status === 'published'
  }

  static publishWeek(
    currentUser: AuthUser,
    storeId: string,
    weekDates: string[],
    options?: { allowSoftWarnings?: boolean }
  ): boolean {
    this.init()
    this.ensureWeekMetaStorage()

    if (currentUser.role === 'employee') {
      return false
    }

    if (['store_manager', 'shift_leader'].includes(currentUser.role) && currentUser.store_id !== storeId) {
      return false
    }

    const weekStartDate = weekDates[0]
    const weekEndDate = weekDates[6]
    if (!weekStartDate || !weekEndDate) return false

    const publishValidation = this.validateWeekForPublish(currentUser, storeId, weekDates[0] || this.getWeekStartDate(new Date().toISOString().split('T')[0]))
    if (publishValidation.hardWarnings.length > 0) {
      return false
    }
    if (!options?.allowSoftWarnings && publishValidation.softWarnings.length > 0) return false

    const schedules = getSchedulesByStoreWeek(storeId, weekDates)
    const impactedEmployeeIds = Array.from(new Set(schedules.map(schedule => schedule.employee_id)))
    schedules.forEach(schedule => {
      schedule.status = 'published'
      schedule.updated_at = new Date().toISOString()
      schedule.updated_by = currentUser.id
    })
    saveSchedulesToStorage()

    // Sync trực tiếp trạng thái chốt lịch với DB Supabase 'lich_phan_ca'
    void scheduleAdapter.publishWeekSchedules(storeId, weekStartDate, weekEndDate)

    const db = this.getWeekMetaDb()
    const now = new Date().toISOString()
    const index = db.findIndex(item => item.store_id === storeId && item.week_start === weekStartDate)
    const nextMeta: ScheduleWeekMeta = {
      store_id: storeId,
      week_start: weekStartDate,
      week_end: weekEndDate,
      status: 'published',
      published_at: now,
      published_by: currentUser.id,
      updated_at: now,
      updated_by: currentUser.id,
    }

    if (index === -1) {
      db.push(nextMeta)
    } else {
      db[index] = { ...db[index], ...nextMeta }
    }
    this.saveWeekMetaDb(db)
    const registrationWeek = getRegistrationWeekByWeek(storeId, weekStartDate)
    if (registrationWeek) {
      updateRegistrationStatus(registrationWeek.id, 'published')
    }

    this.addChangeLog({
      store_id: storeId,
      week_start: weekStartDate,
      assignment_id: `publish-${storeId}-${weekStartDate}`,
      employee_id: '',
      date: weekStartDate,
      action: 'publish',
      before_state: null,
      after_state: null,
      changed_by: currentUser.id,
      reason: `Chốt lịch tuần (${schedules.length} ca chính thức)`,
    })

    const impactedEmployees = impactedEmployeeIds
      .map(employeeId => EmployeeService.getEmployeeById(employeeId))
      .filter(Boolean)

    const storeName = getStoreById(storeId)?.name || storeId
    notifySchedulePublished({
      userIds: impactedEmployeeIds,
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      storeId,
      storeName,
      publishedByName: currentUser.full_name,
    })

    impactedEmployees.forEach(employee => {
      if (!employee?.email) return
      ScheduleEmailService.sendEmail({
        type: 'schedule_published',
        to: employee.email,
        subject: `Lịch tuần ${weekStartDate} - ${weekEndDate} đã được xuất bản`,
        body_preview: `${currentUser.full_name} đã xuất bản lịch tuần tại ${storeName}. Vui lòng vào web để kiểm tra ca làm của bạn.`,
        related_week: weekStartDate,
      })
    })

    return true
  }

  static clearWeekSchedules(currentUser: AuthUser, storeId: string, weekDates: string[]): boolean {
    this.init()
    this.ensureWeekMetaStorage()

    if (currentUser.role === 'employee') return false
    if (['store_manager', 'shift_leader'].includes(currentUser.role) && currentUser.store_id !== storeId) return false

    const weekStartDate = weekDates[0]
    const weekEndDate = weekDates[6]
    if (!weekStartDate || !weekEndDate) return false

    const removedCount = mockSchedules.filter(s => isStoreMatch(s.store_id, storeId) && weekDates.includes(s.date)).length

    for (let i = mockSchedules.length - 1; i >= 0; i--) {
      const schedule = mockSchedules[i]
      if (isStoreMatch(schedule.store_id, storeId) && weekDates.includes(schedule.date)) {
        mockSchedules.splice(i, 1)
      }
    }

    saveSchedulesToStorage()

    // Sync xóa toàn bộ ca tuần trên CSDL Supabase
    void scheduleAdapter.clearStoreWeekShifts(storeId, weekStartDate, weekEndDate)

    this.addChangeLog({
      store_id: storeId,
      week_start: weekStartDate,
      assignment_id: `clear-${storeId}-${weekStartDate}`,
      employee_id: '',
      date: weekStartDate,
      action: 'delete',
      before_state: null,
      after_state: null,
      changed_by: currentUser.id,
      reason: `Làm sạch tuần (Đã xóa ${removedCount} ca)`,
    })

    return true
  }

  static async importShifts(
    currentUser: AuthUser,
    storeId: string,
    shifts: Array<{
      employee_id: string
      shift_id: string
      date: string
      notes?: string
      assigned_position_id?: string
      status?: 'draft' | 'published'
    }>,
    options?: {
      clearExisting?: boolean
      weekDates?: string[]
      status?: 'draft' | 'published'
    }
  ): Promise<ScheduleImportResult> {
    this.init()
    this.ensureWeekMetaStorage()

    const buildImportResult = (count: number, sync: ScheduleDbSyncResult): ScheduleImportResult => ({
      count,
      ...sync,
      valueOf: () => count,
    })

    if (currentUser.role === 'employee') {
      return buildImportResult(0, {
        trangThai: 'that_bai',
        soGhiThanhCong: 0,
        soBiLoai: shifts.length,
        lyDo: ['Tài khoản nhân viên không có quyền nhập lịch'],
      })
    }
    if (['store_manager', 'shift_leader'].includes(currentUser.role) && currentUser.store_id !== storeId) {
      return buildImportResult(0, {
        trangThai: 'that_bai',
        soGhiThanhCong: 0,
        soBiLoai: shifts.length,
        lyDo: ['Tài khoản không có quyền nhập lịch cho cửa hàng này'],
      })
    }

    if (options?.clearExisting) {
      const importWeekStarts = getImportWeekStarts(
        shifts.map(shift => shift.date),
        options.weekDates
      )
      importWeekStarts.forEach(weekStart => {
        this.clearWeekSchedules(currentUser, storeId, this.getWeekDates(weekStart))
      })
    }

    const defaultStatus = options?.status || 'published'
    const createdRecords: Schedule[] = []

    shifts.forEach(shift => {
      const record = apiAddSchedule(
        storeId,
        shift.employee_id,
        shift.shift_id,
        shift.date,
        shift.notes,
        shift.status || defaultStatus,
        shift.assigned_position_id
      )
      record.updated_by = currentUser.id
      record.updated_at = new Date().toISOString()
      createdRecords.push(record)
    })

    saveSchedulesToStorage()

    // Đồng bộ hàng loạt vào CSDL Supabase
    const adapterResult = await scheduleAdapter.bulkAssignShifts(
      shifts.map(s => ({
        employee_id: s.employee_id,
        store_id: storeId,
        shift_id: s.shift_id,
        date: s.date,
        notes: s.notes,
        status: (s.status || defaultStatus) === 'published' ? 'da_xac_nhan' : 'da_xep',
      }))
    )
    const syncResult = mapAdapterSyncResult(adapterResult)

    if (shifts.length > 0) {
      const weekStart = this.getWeekStartDate(shifts[0].date)
      this.addChangeLog({
        store_id: storeId,
        week_start: weekStart,
        assignment_id: `import-${storeId}-${weekStart}`,
        employee_id: '',
        date: weekStart,
        action: 'create',
        before_state: null,
        after_state: null,
        changed_by: currentUser.id,
        reason: `Import ${createdRecords.length} ca làm việc từ file Excel`,
      })
    }

    return buildImportResult(createdRecords.length, syncResult)
  }

  static getSchedulesForUser(currentUser: AuthUser, employeeId: string): Schedule[] {
    this.init()

    if (currentUser.role === 'employee') {
      if (currentUser.id !== employeeId) {
        return []
      }

      const rawSchedules = getAllSchedulesByEmployee(employeeId)
      return rawSchedules.filter(schedule => {
        if (schedule.status !== 'published') return false
        const weekStart = this.getWeekStartDate(schedule.date)
        return this.isWeekPublished(schedule.store_id, weekStart)
      })
    }

    if (['store_manager', 'shift_leader'].includes(currentUser.role)) {
      const targetEmp = EmployeeService.getEmployeeById(employeeId)
      if (!targetEmp || targetEmp.store_id !== currentUser.store_id) {
        return []
      }
      return getAllSchedulesByEmployee(employeeId)
    }

    return getAllSchedulesByEmployee(employeeId)
  }

  static getStoreSchedules(currentUser: AuthUser, storeId: string, weekDates: string[]): Schedule[] {
    this.init()

    if (currentUser.role === 'employee') {
      return []
    }

    if (['store_manager', 'shift_leader'].includes(currentUser.role) && currentUser.store_id !== storeId) {
      return []
    }

    return getSchedulesByStoreWeek(storeId, weekDates)
  }

  /**
   * Return only official assignments that attendance is allowed to consume.
   * A published assignment is not enough when its schedule week is still a draft.
   */
  static getPublishedSchedulesForStore(currentUser: AuthUser, storeId: string, dates: string[]): Schedule[] {
    return this.getStoreSchedules(currentUser, storeId, dates).filter(schedule =>
      schedule.status === 'published' &&
      this.isWeekPublished(storeId, this.getWeekStartDate(schedule.date))
    )
  }

  static getPeerSchedulesForSwap(currentUser: AuthUser, employeeId: string): Schedule[] {
    this.init()
    const employee = EmployeeService.getEmployeeById(employeeId)
    if (!employee) return []

    const canSee =
      currentUser.role === 'ceo' ||
      currentUser.role === 'hr_admin' ||
      (currentUser.role === 'store_manager' && currentUser.store_id === employee.store_id) ||
      (currentUser.role === 'employee' && currentUser.store_id === employee.store_id)

    if (!canSee) return []

    return getAllSchedulesByEmployee(employeeId).filter(schedule => {
      const weekStart = this.getWeekStartDate(schedule.date)
      return schedule.status === 'published' && this.isWeekPublished(schedule.store_id, weekStart)
    })
  }

  static getEligibleEmployees(currentUser: AuthUser, storeId: string) {
    this.init()
    initSchedules()
    const allEmps = EmployeeService.getEmployees(currentUser).filter(emp =>
      !emp.status || ['active', 'probation'].includes(emp.status)
    )
    const storeAssignments = mockSchedules.filter(s => 
      isStoreMatch(s.store_id, storeId)
    )
    const assignedEmpIds = new Set(storeAssignments.map(s => s.employee_id))

    const storeEmps = allEmps.filter(emp =>
      isStoreMatch(emp.store_id, storeId) ||
      emp.secondary_store_ids?.some(sId => isStoreMatch(sId, storeId)) ||
      assignedEmpIds.has(emp.id)
    )

    // Khử trùng lặp nhân sự trùng tên trong cùng cơ sở (giữ lại hồ sơ có đầy đủ thông tin nhất)
    const seenIds = new Set<string>()
    const uniqueEmps: AuthUser[] = []
    storeEmps.forEach(emp => {
      if (!seenIds.has(emp.id)) {
        seenIds.add(emp.id)
        uniqueEmps.push(emp)
      }
    })

    return uniqueEmps
  }

  static validateWeekSchedules(currentUser: AuthUser, storeId: string, weekDates: string[]): ScheduleValidationWarning[] {
    const schedules = this.getStoreSchedules(currentUser, storeId, weekDates)
    const warnings: ScheduleValidationWarning[] = []
    const eligibleIds = new Set(this.getEligibleEmployees(currentUser, storeId).map(emp => emp.id))
    const shiftTemplates = ShiftTemplateService.getAllForStore(storeId)

    const pairMap = new Set<string>()
    const shiftDayCount = new Map<string, number>()
    schedules.forEach(schedule => {
      if (!eligibleIds.has(schedule.employee_id)) {
        const empObj = EmployeeService.getEmployeeById(schedule.employee_id)
        if (empObj && (empObj.status === 'resigned' || empObj.status === 'inactive')) {
          warnings.push({
            type: 'invalid_employee',
            code: 'INVALID_EMPLOYEE',
            employee_id: schedule.employee_id,
            date: schedule.date,
            level: 'block',
            message: `Nhân viên ${empObj.full_name || schedule.employee_id} đã nghỉ việc hoặc chưa kích hoạt.`,
          })
        }
      }

      const key = `${schedule.employee_id}_${schedule.date}`
      if (pairMap.has(key)) {
        warnings.push({
          type: 'duplicate_shift',
          code: 'DUPLICATE_SHIFT',
          employee_id: schedule.employee_id,
          date: schedule.date,
          level: 'warning',
          message: 'Nhân viên có từ 2 ca trở lên trong ngày (Tăng ca / Ca gãy).',
        })
      } else {
        pairMap.add(key)
      }

      const validation = this.validateAssignmentAgainstShiftTemplate(
        currentUser,
        storeId,
        schedule.employee_id,
        schedule.shift_id,
        schedule.date,
        schedule.assigned_position_id
      )
      validation.forEach(item => warnings.push(item))

      const weekStart = this.getWeekStartDate(schedule.date)
      if (this.isWeekPublished(storeId, weekStart) && schedule.modified_after_publish && !schedule.change_reason) {
        warnings.push({
          type: 'missing_reason',
          code: 'MISSING_REASON',
          employee_id: schedule.employee_id,
          date: schedule.date,
          level: 'block',
          message: 'Có ca đã sửa sau khi chốt nhưng chưa có lý do thay đổi.',
        })
      }

      const shiftDayKey = `${schedule.shift_id}_${schedule.date}`
      shiftDayCount.set(shiftDayKey, (shiftDayCount.get(shiftDayKey) || 0) + 1)
    })

    shiftTemplates.forEach(template => {
      weekDates.forEach(date => {
        const count = shiftDayCount.get(`${template.id}_${date}`) || 0
        if (template.max_headcount && count > template.max_headcount) {
          warnings.push({
            type: 'over_max_headcount',
            code: 'OVER_MAX_HEADCOUNT',
            date,
            shift_id: template.id,
            level: 'warning',
            message: `Ca ${template.name} ngày ${date} đang tăng cường thêm người (${count}/${template.max_headcount}).`,
          })
        }
        if (template.min_headcount && count > 0 && count < template.min_headcount) {
          warnings.push({
            type: 'under_min_required_role',
            code: 'UNDER_MIN_REQUIRED_ROLE',
            date,
            shift_id: template.id,
            level: 'warning',
            message: `Ca ${template.name} ngày ${date} chưa đạt số người tối thiểu (${count}/${template.min_headcount}).`,
          })
        }
      })
    })

    this.getEligibleEmployees(currentUser, storeId).forEach(employee => {
      const hasSchedule = schedules.some(schedule => schedule.employee_id === employee.id)
      if (!hasSchedule) {
        warnings.push({
          type: 'unassigned_employee',
          employee_id: employee.id,
          level: 'warning',
          message: `Nhân viên ${employee.full_name} chưa được xếp ca nào trong tuần này.`,
        })
      }
    })

    if (schedules.length === 0) {
      warnings.push({
        type: 'empty_week',
        level: 'warning',
        message: 'Tuần này chưa có ca nào được xếp.',
      })
    }

    scanWeekWarnings(storeId, weekDates, schedules).forEach(ruleWarning => {
      warnings.push(this.toValidationWarningFromRuleWarning(ruleWarning))
    })

    return warnings
  }

  static getBlockingWeekWarnings(currentUser: AuthUser, storeId: string, weekDates: string[]) {
    return this.validateWeekSchedules(currentUser, storeId, weekDates).filter(warning =>
      this.isBlockingWarning(warning)
    )
  }

  static getPublishSummary(currentUser: AuthUser, storeId: string, weekDates: string[]): SchedulePublishSummary {
    const warnings = this.validateWeekSchedules(currentUser, storeId, weekDates)
    const schedules = this.getStoreSchedules(currentUser, storeId, weekDates)
    const blockingWarnings = warnings.filter(warning => this.isBlockingWarning(warning))
    const assignedEmployees = new Set(schedules.map(schedule => schedule.employee_id)).size
    const totalEligibleEmployees = this.getEligibleEmployees(currentUser, storeId).length

    return {
      totalAssignments: schedules.length,
      assignedEmployees,
      unassignedEmployees: Math.max(totalEligibleEmployees - assignedEmployees, 0),
      blockingWarnings,
      warnings,
      changedAfterPublishCount: schedules.filter(schedule => schedule.modified_after_publish).length,
      canPublish: blockingWarnings.length === 0,
    }
  }

  static validateAssignmentAgainstShiftTemplate(
    currentUser: AuthUser,
    storeId: string,
    employeeId: string,
    shiftId: string,
    date: string,
    assignedPositionId?: string
  ): ScheduleValidationWarning[] {
    const warnings: ScheduleValidationWarning[] = []
    const employee = EmployeeService.getEmployeeById(employeeId)
    const template = ShiftTemplateService.getById(shiftId)

    if (!employee || !template) return warnings

    if (template.allowed_position_ids?.length) {
      const allowed = template.allowed_position_ids
      const canDoPosition =
        allowed.includes(employee.position_id) ||
        (assignedPositionId && allowed.includes(assignedPositionId)) ||
        (employee.secondary_position_ids && employee.secondary_position_ids.some(posId => allowed.includes(posId))) ||
        ['store_manager', 'shift_leader', 'ceo', 'hr_admin'].includes(employee.role) ||
        employee.position_id === 'pos-004' || employee.position_id === 'pos-005' || employee.position_id === 'pos-006' || employee.position_id === 'pos-007'

      if (!canDoPosition) {
        warnings.push({
          type: 'invalid_position_for_shift',
          code: 'INVALID_POSITION_FOR_SHIFT',
          employee_id: employeeId,
          date,
          shift_id: shiftId,
          level: 'warning',
          message: `${employee.full_name} kiêm nhiệm ca ${template.name}.`,
        })
      }
    }

    const sameDaySchedules = this.getStoreSchedules(currentUser, storeId, [date]).filter(schedule =>
      schedule.employee_id === employeeId &&
      schedule.shift_id !== shiftId
    )
    if (sameDaySchedules.length > 0) {
      const firstShiftName = ShiftTemplateService.getById(sameDaySchedules[0].shift_id)?.name || sameDaySchedules[0].shift_id
      warnings.push({
        type: 'already_assigned_same_day',
        code: 'ALREADY_ASSIGNED_SAME_DAY',
        employee_id: employeeId,
        date,
        shift_id: shiftId,
        message: `${employee.full_name} đang có ca ${firstShiftName} cùng ngày. Gán ca này sẽ chuyển lịch.`,
      })
    }

    const schedulesSameShift = this.getStoreSchedules(currentUser, storeId, [date]).filter(schedule => schedule.shift_id === shiftId)
    const projectedCount = schedulesSameShift.some(schedule => schedule.employee_id === employeeId)
      ? schedulesSameShift.length
      : schedulesSameShift.length + 1

    if (template.max_headcount && projectedCount > template.max_headcount) {
      warnings.push({
        type: 'over_max_headcount',
        code: 'OVER_MAX_HEADCOUNT',
        date,
        shift_id: shiftId,
        message: `Ca ${template.name} ngày ${date} sẽ vượt số người tối đa nếu thêm nhân sự này.`,
      })
    }

    checkScheduleWarnings(
      employeeId,
      shiftId,
      date,
      storeId,
      this.getStoreSchedules(currentUser, storeId, this.getWeekDates(this.getWeekStartDate(date)))
    ).forEach(ruleWarning => warnings.push(this.toValidationWarningFromRuleWarning(ruleWarning)))

    return warnings
  }

  static async assignSchedule(
    currentUser: AuthUser,
    storeId: string,
    employeeId: string,
    shiftId: string,
    date: string,
    notes?: string,
    changeReason?: string,
    assignedPositionId?: string
  ): Promise<ScheduleDbSyncResult & { schedule: Schedule | null }> {
    this.init()

    if (currentUser.role === 'employee') {
      return { schedule: null, trangThai: 'that_bai', soGhiThanhCong: 0, soBiLoai: 1, lyDo: ['Tài khoản nhân viên không có quyền xếp ca'] }
    }
    if (['store_manager', 'shift_leader'].includes(currentUser.role) && currentUser.store_id !== storeId) {
      return { schedule: null, trangThai: 'that_bai', soGhiThanhCong: 0, soBiLoai: 1, lyDo: ['Tài khoản không có quyền xếp ca cho cửa hàng này'] }
    }

    const employee = EmployeeService.getEmployeeById(employeeId)
    if (!employee) return { schedule: null, trangThai: 'that_bai', soGhiThanhCong: 0, soBiLoai: 1, lyDo: [`Không tìm thấy nhân viên: ${employeeId}`] }
    if (!['active', 'probation'].includes(employee.status)) {
      return { schedule: null, trangThai: 'that_bai', soGhiThanhCong: 0, soBiLoai: 1, lyDo: [`Nhân viên không hoạt động: ${employeeId}`] }
    }
    const assignmentWarnings = this.validateAssignmentAgainstShiftTemplate(currentUser, storeId, employeeId, shiftId, date, assignedPositionId)
    if (assignmentWarnings.some(item => this.isBlockingWarning(item))) {
      return { schedule: null, trangThai: 'that_bai', soGhiThanhCong: 0, soBiLoai: 1, lyDo: assignmentWarnings.map(item => item.message).slice(0, 5) }
    }

    const weekStart = this.getWeekStartDate(date)
    const wasPublished = this.isWeekPublished(storeId, weekStart)
    if (wasPublished && !changeReason?.trim()) {
      return { schedule: null, trangThai: 'that_bai', soGhiThanhCong: 0, soBiLoai: 1, lyDo: ['Cần nhập lý do khi sửa lịch đã chốt'] }
    }

    const existing = getSchedulesByStoreWeek(storeId, [date]).find(schedule => schedule.employee_id === employeeId && schedule.date === date) || null
    const next = apiAddSchedule(storeId, employeeId, shiftId, date, notes, wasPublished ? 'published' : 'draft', assignedPositionId)
    next.updated_by = currentUser.id
    next.updated_at = new Date().toISOString()
    if (wasPublished) {
      next.modified_after_publish = true
      next.change_reason = changeReason?.trim()
    }
    saveSchedulesToStorage()

    // Sync trực tiếp với DB Supabase 'lich_phan_ca'
    const adapterResult = await scheduleAdapter.assignShift({
      employee_id: employeeId,
      store_id: storeId,
      shift_id: shiftId,
      date,
      notes,
      status: wasPublished ? 'da_xac_nhan' : 'da_xep',
    })
    const syncResult = mapAdapterSyncResult(adapterResult)

    if (wasPublished) {
      this.touchPublishedWeek(currentUser, storeId, weekStart)
    } else {
      this.saveDraftWeek(currentUser, storeId, this.getWeekDates(weekStart))
    }

    this.addChangeLog({
      store_id: storeId,
      week_start: weekStart,
      assignment_id: next.id,
      employee_id: employeeId,
      date,
      action: existing ? 'update' : 'create',
      before_state: existing ? { ...existing } : null,
      after_state: { ...next },
      changed_by: currentUser.id,
      reason: wasPublished ? (changeReason || 'Sửa lịch sau khi chốt') : 'Xếp ca nháp',
    })

    if (wasPublished && employee.email) {
      const shiftName = ShiftTemplateService.getById(next.shift_id)?.name || next.shift_id
      notifyScheduleChangedAfterPublish({
        userId: employee.id,
        scheduleId: next.id,
        date,
        shiftName,
        startTime: ShiftTemplateService.getById(next.shift_id)?.start_time || '',
        endTime: ShiftTemplateService.getById(next.shift_id)?.end_time || '',
        reason: changeReason?.trim() || 'Điều chỉnh lịch sau khi chốt',
        storeId,
      })
      ScheduleEmailService.sendEmail({
        type: 'schedule_changed_after_publish',
        to: employee.email,
        subject: `Lịch làm ngày ${date} vừa được cập nhật`,
        body_preview: `Ca ${shiftName} của bạn ngày ${date} vừa được cập nhật. Lý do: ${changeReason?.trim() || 'Điều chỉnh vận hành.'}`,
        related_schedule_id: next.id,
        related_week: weekStart,
      })
    }

    return { schedule: next, ...syncResult }
  }

  static deleteSchedule(
    currentUser: AuthUser,
    storeId: string,
    employeeId: string,
    date: string,
    changeReason?: string
  ): boolean {
    this.init()

    if (currentUser.role === 'employee') return false
    if (['store_manager', 'shift_leader'].includes(currentUser.role) && currentUser.store_id !== storeId) return false

    const existing = getSchedulesByStoreWeek(storeId, [date]).find(schedule => schedule.employee_id === employeeId && schedule.date === date)
    if (!existing) return false

    const weekStart = this.getWeekStartDate(date)
    const wasPublished = this.isWeekPublished(storeId, weekStart)
    if (wasPublished && !changeReason?.trim()) {
      return false
    }

    const success = apiRemoveSchedule(employeeId, date)
    if (!success) return false

    // Sync trực tiếp xóa khỏi DB Supabase 'lich_phan_ca'
    void scheduleAdapter.removeShift(employeeId, storeId, date, existing.shift_id)

    if (wasPublished) {
      this.touchPublishedWeek(currentUser, storeId, weekStart)
    } else {
      this.saveDraftWeek(currentUser, storeId, this.getWeekDates(weekStart))
    }

    this.addChangeLog({
      store_id: storeId,
      week_start: weekStart,
      assignment_id: existing.id,
      employee_id: employeeId,
      date,
      action: wasPublished ? 'cancel' : 'delete',
      before_state: { ...existing },
      after_state: null,
      changed_by: currentUser.id,
      reason: wasPublished ? (changeReason || 'Hủy ca sau khi chốt') : 'Gỡ ca nháp',
    })

    const employee = EmployeeService.getEmployeeById(employeeId)
    if (wasPublished && employee?.email) {
      notifyScheduleChangedAfterPublish({
        userId: employeeId,
        scheduleId: existing.id,
        date,
        shiftName: ShiftTemplateService.getById(existing.shift_id)?.name || existing.shift_id,
        startTime: ShiftTemplateService.getById(existing.shift_id)?.start_time || '',
        endTime: ShiftTemplateService.getById(existing.shift_id)?.end_time || '',
        reason: changeReason?.trim() || 'Hủy ca sau khi chốt',
        storeId,
      })
      ScheduleEmailService.sendEmail({
        type: 'schedule_changed_after_publish',
        to: employee.email,
        subject: `Ca làm ngày ${date} vừa được hủy/cập nhật`,
        body_preview: `Ca của bạn ngày ${date} đã được điều chỉnh. Lý do: ${changeReason?.trim() || 'Điều chỉnh vận hành.'}`,
        related_schedule_id: existing.id,
        related_week: weekStart,
      })
    }

    return true
  }

  static copyPreviousWeek(currentUser: AuthUser, storeId: string, fromWeek: string[], toWeek: string[]): number {
    return this.copyPreviousWeekDetailed(currentUser, storeId, fromWeek, toWeek).copied
  }

  static copyPreviousWeekDetailed(currentUser: AuthUser, storeId: string, fromWeek: string[], toWeek: string[]): CopyWeekResult {
    this.init()

    if (currentUser.role === 'employee') return { copied: 0, skipped_invalid_employee: 0, skipped_existing_assignment: 0 }
    if (['store_manager', 'shift_leader'].includes(currentUser.role) && currentUser.store_id !== storeId) return { copied: 0, skipped_invalid_employee: 0, skipped_existing_assignment: 0 }
    if (!fromWeek.length || fromWeek.length !== toWeek.length) return { copied: 0, skipped_invalid_employee: 0, skipped_existing_assignment: 0 }
    if (this.isWeekPublished(storeId, toWeek[0])) return { copied: 0, skipped_invalid_employee: 0, skipped_existing_assignment: 0 }

    const eligibleIds = new Set(this.getEligibleEmployees(currentUser, storeId).map(emp => emp.id))
    const sourceSchedules = getSchedulesByStoreWeek(storeId, fromWeek)
    let copied = 0
    let skippedInvalidEmployee = 0
    let skippedExistingAssignment = 0

    sourceSchedules.forEach(schedule => {
      if (!eligibleIds.has(schedule.employee_id)) {
        skippedInvalidEmployee += 1
        return
      }

      const sourceIndex = fromWeek.indexOf(schedule.date)
      if (sourceIndex === -1) return

      const targetDate = toWeek[sourceIndex]
      if (!targetDate) return
      if (getScheduleByEmployeeDate(schedule.employee_id, targetDate, storeId)) {
        skippedExistingAssignment += 1
        return
      }

      const next = apiAddSchedule(
        storeId,
        schedule.employee_id,
        schedule.shift_id,
        targetDate,
        schedule.notes,
        'draft'
      )
      next.modified_after_publish = false
      next.change_reason = undefined
      next.updated_by = currentUser.id
      next.updated_at = new Date().toISOString()
      copied += 1
    })

    if (copied > 0) {
      saveSchedulesToStorage()
      this.saveDraftWeek(currentUser, storeId, toWeek)
      this.moveWeekToDrafting(storeId, toWeek[0] || '')
    }

    return {
      copied,
      skipped_invalid_employee: skippedInvalidEmployee,
      skipped_existing_assignment: skippedExistingAssignment,
    }
  }

  static getChangeLogs(currentUser: AuthUser, options?: { storeId?: string; weekStart?: string }) {
    let logs = this.getChangeLogDb()

    if (currentUser.role === 'employee') {
      return logs.filter(log => log.employee_id === currentUser.id)
    }

    if (['store_manager', 'shift_leader'].includes(currentUser.role)) {
      logs = logs.filter(log => log.store_id === currentUser.store_id)
    }

    if (options?.storeId) {
      logs = logs.filter(log => log.store_id === options.storeId)
    }

    if (options?.weekStart) {
      logs = logs.filter(log => log.week_start === options.weekStart)
    }

    return logs
  }

  static getChangeLogFeed(currentUser: AuthUser, options?: { storeId?: string; weekStart?: string }): ScheduleChangeLogFeed[] {
    return this.getChangeLogs(currentUser, options)
      .map(log => {
        const actor = EmployeeService.getEmployeeById(log.changed_by)
        const employee = log.employee_id ? EmployeeService.getEmployeeById(log.employee_id) : null
        return {
          ...log,
          actor_name: actor?.full_name || log.changed_by,
          store_name: getStoreById(log.store_id)?.name || log.store_id,
          employee_name: employee?.full_name || log.employee_id || 'Hệ thống',
          before_shift_name: log.before_state?.shift_id ? getShiftById(log.before_state.shift_id)?.name || log.before_state.shift_id : undefined,
          after_shift_name: log.after_state?.shift_id ? getShiftById(log.after_state.shift_id)?.name || log.after_state.shift_id : undefined,
        }
      })
      .sort((left, right) => right.changed_at.localeCompare(left.changed_at))
  }

  static save(): void {
    saveSchedulesToStorage()
  }
}
