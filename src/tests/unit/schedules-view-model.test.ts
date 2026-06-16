import { describe, expect, it } from 'vitest'

import type {
  AssignmentBoardData,
  AssignmentBoardSlot,
  AssignmentRecommendation,
  ScheduleWeek,
  ShiftRegistration,
} from '@/lib/services/schedule-service'
import { buildRecommendationSections, buildScheduleRows, buildWeekOverviewCards, filterRecommendationsBySearch } from '@/app/schedules/view-model'

function createWeek(): ScheduleWeek {
  return {
    store_id: 'store-001',
    week_start: '2026-06-22',
    week_end: '2026-06-28',
    status: 'draft',
    updated_at: '2026-06-15T10:00:00.000Z',
    updated_by: 'mgr-001',
    cycle_status: 'drafting',
  }
}

function createSlot(overrides: Partial<AssignmentBoardSlot>): AssignmentBoardSlot {
  return {
    id: 'slot-1',
    registration_week_id: 'reg-001',
    store_id: 'store-001',
    week_start: '2026-06-22',
    date: '2026-06-22',
    shift_template_id: 'shift-morning',
    position_id: 'cashier',
    required_count: 2,
    min_count: 1,
    assigned_employee_ids: [],
    preferred_employee_ids: [],
    available_employee_ids: [],
    unavailable_employee_ids: [],
    filled_count: 0,
    missing_count: 2,
    ...overrides,
  }
}

function createBoard(): AssignmentBoardData {
  const preferredMorning: ShiftRegistration = {
    id: 'reg-1',
    employee_id: 'emp-1',
    store_id: 'store-001',
    week_start: '2026-06-22',
    date: '2026-06-22',
    shift_template_id: 'shift-morning',
    preference: 'preferred',
    submitted: true,
  }

  const availableMorning: ShiftRegistration = {
    id: 'reg-2',
    employee_id: 'emp-2',
    store_id: 'store-001',
    week_start: '2026-06-22',
    date: '2026-06-22',
    shift_template_id: 'shift-morning',
    preference: 'available',
    submitted: true,
  }

  const tuesdayPreferred: ShiftRegistration = {
    id: 'reg-3',
    employee_id: 'emp-3',
    store_id: 'store-001',
    week_start: '2026-06-22',
    date: '2026-06-23',
    shift_template_id: 'shift-afternoon',
    preference: 'preferred',
    submitted: true,
  }

  return {
    week: createWeek(),
    demands: [
      createSlot({
        id: 'slot-mon-morning',
        preferred_employee_ids: ['emp-1'],
        available_employee_ids: ['emp-2'],
      }),
      createSlot({
        id: 'slot-mon-afternoon',
        shift_template_id: 'shift-afternoon',
        required_count: 1,
        min_count: 1,
        assigned_employee_ids: ['emp-2'],
        filled_count: 1,
        missing_count: 0,
      }),
      createSlot({
        id: 'slot-tue-afternoon',
        date: '2026-06-23',
        shift_template_id: 'shift-afternoon',
        required_count: 1,
        min_count: 1,
        preferred_employee_ids: ['emp-3'],
        missing_count: 1,
      }),
    ],
    employees: [
      {
        employee: {
          id: 'emp-1',
          full_name: 'Nguyen Thi Phuong Thao',
          email: 'phuong-thao@homies.test',
          role: 'employee',
          store_id: 'store-001',
          status: 'active',
          position_id: 'cashier',
        },
        registrations: [preferredMorning],
        assigned_count: 0,
      },
      {
        employee: {
          id: 'emp-2',
          full_name: 'Le Giau',
          email: 'le-giau@homies.test',
          role: 'employee',
          store_id: 'store-001',
          status: 'active',
          position_id: 'cashier',
        },
        registrations: [availableMorning],
        assigned_count: 1,
      },
      {
        employee: {
          id: 'emp-3',
          full_name: 'Nguyen Trinh',
          email: 'nguyen-trinh@homies.test',
          role: 'employee',
          store_id: 'store-001',
          status: 'active',
          position_id: 'barista',
        },
        registrations: [tuesdayPreferred],
        assigned_count: 0,
      },
    ],
    assignments: [
      {
        id: 'assign-1',
        employee_id: 'emp-2',
        shift_id: 'shift-afternoon',
        date: '2026-06-22',
        store_id: 'store-001',
        status: 'draft',
        modified_after_publish: false,
      },
    ],
  }
}

describe('schedules view model', () => {
  it('builds weekly overview cards with warm status tones and registration counts', () => {
    const board = createBoard()

    const cards = buildWeekOverviewCards(board, ['2026-06-22', '2026-06-23'])

    expect(cards).toHaveLength(2)
    expect(cards[0]).toMatchObject({
      date: '2026-06-22',
      registeredCount: 2,
      requiredCount: 3,
      shortageCount: 2,
      tone: 'critical',
      statusLabel: 'Thieu 2 ca',
      summaryLabel: '2/3 da dang ky',
    })
    expect(cards[1]).toMatchObject({
      date: '2026-06-23',
      registeredCount: 1,
      requiredCount: 1,
      shortageCount: 1,
      tone: 'critical',
      statusLabel: 'Thieu 1 ca',
      summaryLabel: '1/1 da dang ky',
    })
  })

  it('builds board rows that prefer assigned staff names and fall back to registered staff', () => {
    const board = createBoard()

    const rows = buildScheduleRows({
      board,
      weekDates: ['2026-06-22', '2026-06-23'],
      templates: [
        { id: 'shift-morning', name: 'Ca sang', start_time: '08:30', end_time: '12:00' },
        { id: 'shift-afternoon', name: 'Ca chieu', start_time: '12:00', end_time: '17:00' },
      ],
    })

    expect(rows).toHaveLength(2)
    expect(rows[0].cells[0]).toMatchObject({
      primaryLabel: 'Nguyen Thi Phuong Thao',
      headline: 'Nguyen Thi Phuong Thao +1',
      source: 'registered',
      statusLabel: 'Con thieu 2',
      actionLabel: 'Mo xep nguoi',
      tone: 'critical',
    })
    expect(rows[1].cells[0]).toMatchObject({
      primaryLabel: 'Le Giau',
      headline: 'Le Giau',
      source: 'assigned',
      statusLabel: 'Da du',
      actionLabel: 'Mo xep nguoi',
      tone: 'full',
    })
  })

  it('groups recommendations for popup by registered candidates first and backups later', () => {
    const recommendations: AssignmentRecommendation[] = [
      {
        employee_id: 'emp-1',
        employee_name: 'Nguyen Thi Phuong Thao',
        position_id: 'cashier',
        position_name: 'Thu ngan',
        assigned_count: 0,
        preference: 'preferred',
        score: 98,
        label: 'Da dang ky',
        reason: 'Phu hop nhat',
        is_assigned: false,
        has_same_day_assignment: false,
      },
      {
        employee_id: 'emp-2',
        employee_name: 'Tran Cong Huy',
        position_id: 'cashier',
        position_name: 'Thu ngan',
        assigned_count: 3,
        preference: 'unknown',
        score: 72,
        label: 'Co the bo sung',
        reason: 'Dieu chuyen duoc',
        is_assigned: false,
        has_same_day_assignment: false,
      },
      {
        employee_id: 'emp-3',
        employee_name: 'Nguyen Trinh',
        position_id: 'cashier',
        position_name: 'Thu ngan',
        assigned_count: 1,
        preference: 'available',
        score: 87,
        label: 'Phu hop cao',
        reason: 'Da dang ky nhung can xem lai',
        is_assigned: false,
        has_same_day_assignment: true,
        same_day_shift_name: 'Ca chieu',
      },
    ]

    const sections = buildRecommendationSections(recommendations)

    expect(sections.map(section => section.id)).toEqual(['registered', 'review', 'backup'])
    expect(sections[0].items.map(item => item.employee_name)).toEqual(['Nguyen Thi Phuong Thao'])
    expect(sections[1].items.map(item => item.employee_name)).toEqual(['Nguyen Trinh'])
    expect(sections[2].items.map(item => item.employee_name)).toEqual(['Tran Cong Huy'])
  })

  it('filters recommendations by Vietnamese name and position keyword for popup search', () => {
    const recommendations: AssignmentRecommendation[] = [
      {
        employee_id: 'emp-1',
        employee_name: 'Nguyen Thi Phuong Thao',
        position_id: 'cashier',
        position_name: 'Thu ngan',
        assigned_count: 0,
        preference: 'preferred',
        score: 98,
        label: 'Da dang ky',
        reason: 'Phu hop nhat',
        is_assigned: false,
        has_same_day_assignment: false,
      },
      {
        employee_id: 'emp-2',
        employee_name: 'Tran Cong Huy',
        position_id: 'barista',
        position_name: 'Pha che',
        assigned_count: 1,
        preference: 'available',
        score: 80,
        label: 'Co the lam',
        reason: 'Co kinh nghiem quay',
        is_assigned: false,
        has_same_day_assignment: false,
      },
    ]

    expect(filterRecommendationsBySearch(recommendations, 'thao').map(item => item.employee_id)).toEqual(['emp-1'])
    expect(filterRecommendationsBySearch(recommendations, 'pha che').map(item => item.employee_id)).toEqual(['emp-2'])
    expect(filterRecommendationsBySearch(recommendations, 'khong ton tai')).toEqual([])
  })
})
