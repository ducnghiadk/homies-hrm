import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { ScheduleToolbar } from '@/app/schedules/_components/ScheduleToolbar'
import { WeeklyRhythmRail } from '@/app/schedules/_components/WeeklyRhythmRail'
import { WeeklyBoardGrid } from '@/app/schedules/_components/WeeklyBoardGrid'
import { AssignmentModal } from '@/app/schedules/_components/AssignmentModal'
import type { RecommendationSection, ScheduleRowViewModel, WeekOverviewCard } from '@/app/schedules/view-model'

describe('schedules extracted components', () => {
  it('renders toolbar actions and active week label', () => {
    const markup = renderToStaticMarkup(
      <ScheduleToolbar
        stores={[{ id: 'store-001', name: 'Homies Quan 1' }]}
        activeStoreId="store-001"
        activeWeekLabel="Tuan 22/06 - 28/06"
        onStoreChange={vi.fn()}
        onPreviousWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onOpenDemandEditor={vi.fn()}
        onCopyPreviousWeek={vi.fn()}
      />,
    )

    expect(markup).toContain('Tuan 22/06 - 28/06')
    expect(markup).toContain('Sao chep tuan')
    expect(markup).toContain('Tong quan ca tuan')
  })

  it('renders weekly rhythm rail summary and statuses', () => {
    const days: WeekOverviewCard[] = [
      {
        date: '2026-06-22',
        dayLabel: 'T2',
        registeredCount: 2,
        requiredCount: 3,
        shortageCount: 1,
        tone: 'warning',
        statusLabel: 'Thieu 1 ca',
        summaryLabel: '2/3 da dang ky',
      },
    ]

    const markup = renderToStaticMarkup(
      <WeeklyRhythmRail days={days} selectedDate="2026-06-22" onSelectDate={vi.fn()} />,
    )

    expect(markup).toContain('2/3 da dang ky')
    expect(markup).toContain('Thieu 1 ca')
  })

  it('renders compact weekly board cells with position for each visible person', () => {
    const rows: ScheduleRowViewModel[] = [
      {
        templateId: 'shift-morning',
        templateName: 'Ca sang',
        timeRange: '08:30 - 12:00',
        cells: [
          {
            date: '2026-06-22',
            shiftTemplateId: 'shift-morning',
            slotIds: ['slot-1'],
            filledCount: 1,
            requiredCount: 3,
            shortageCount: 2,
            tone: 'critical',
            primaryLabel: 'Nguyen Thi Phuong Thao',
            headline: 'Nguyen Thi Phuong Thao +1',
            previewNames: ['Nguyen Thi Phuong Thao', 'Le Giau'],
            previewAssignments: [
              { employeeId: 'emp-1', employeeName: 'Nguyen Thi Phuong Thao', positionLabel: 'Thu ngan', source: 'assigned' },
              { employeeId: 'emp-2', employeeName: 'Le Giau', positionLabel: 'Pha che', source: 'registered' },
            ],
            source: 'registered',
            secondaryCount: 1,
            statusLabel: 'Con thieu 2',
            actionLabel: 'Mo xep nguoi',
            isSetup: true,
          },
        ],
      },
    ]

    const markup = renderToStaticMarkup(
      <WeeklyBoardGrid
        dates={['2026-06-22']}
        rows={rows}
        selectedSlotKey="2026-06-22__shift-morning"
        onSelectCell={vi.fn()}
      />,
    )

    expect(markup).toContain('Nguyen Thi Phuong Thao')
    expect(markup).toContain('Thu ngan')
    expect(markup).toContain('Le Giau')
    expect(markup).toContain('Pha che')
  })

  it('renders task-first assignment modal with compact groups and no right rail copy', () => {
    const sections: RecommendationSection[] = [
      {
        id: 'registered',
        title: 'Da dang ky va phu hop',
        description: 'Uu tien nguoi da dang ky truoc.',
        items: [
          {
            employee_id: 'emp-1',
            employee_name: 'Nguyen Thi Phuong Thao',
            position_id: 'cashier',
            position_name: 'Thu ngan',
            assigned_count: 1,
            preference: 'preferred',
            score: 98,
            label: 'Dang giu ca',
            reason: 'Dang giu ca nay',
            is_assigned: true,
            has_same_day_assignment: false,
          },
        ],
      },
      {
        id: 'backup',
        title: 'Co the bo sung',
        description: 'Nguon tang cuong neu nhom uu tien chua du.',
        items: [
          {
            employee_id: 'emp-2',
            employee_name: 'Le Phuong Nam',
            position_id: 'barista',
            position_name: 'Pha che',
            assigned_count: 1,
            preference: 'available',
            score: -18,
            label: 'Can can nhac',
            reason: 'Can kiem tra ca chieu cung ngay',
            is_assigned: false,
            has_same_day_assignment: true,
            same_day_shift_name: 'Ca chieu',
          },
        ],
      },
    ]

    const markup = renderToStaticMarkup(
      <AssignmentModal
        open
        slotTitle="Ca sang - T2 22/06"
        slotSubtitle="08:30 - 12:00 - Pha che - Thieu 1 nguoi"
        shortageLabel="Thieu 1 nguoi"
        search=""
        onSearchChange={vi.fn()}
        sections={sections}
        requiresPublishedReason
        onAssign={vi.fn()}
        onRemove={vi.fn()}
        onClose={vi.fn()}
        filledCountLabel="1/2 nguoi"
      />,
    )

    expect(markup).toContain('Ca sang - T2 22/06')
    expect(markup).toContain('08:30 - 12:00 - Pha che - Thieu 1 nguoi')
    expect(markup).toContain('1/2 nguoi')
    expect(markup).toContain('Sua sau khi chot se can ly do thay doi')
    expect(markup).toContain('Da dang ky va phu hop')
    expect(markup).toContain('Co the bo sung')
    expect(markup).toContain('Dang giu ca nay')
    expect(markup).toContain('Can kiem tra ca chieu cung ngay')
    expect(markup).toContain('Gan vao ca')
    expect(markup).toContain('Go khoi ca')
    expect(markup).not.toContain('Vi tri trong ca nay')
    expect(markup).not.toContain('Tinh trang o dang xem')
    expect(markup).not.toContain('Meo thao tac')
    expect(markup).not.toContain('Thu ngan - 1 ca trong tuan')
    expect(markup).not.toContain('\\uFFFD')
  })
})
