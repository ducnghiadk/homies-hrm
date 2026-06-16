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

  it('renders compact weekly board cells with headline and action label', () => {
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

    expect(markup).toContain('Nguyen Thi Phuong Thao +1')
    expect(markup).toContain('Mo xep nguoi')
  })

  it('renders centered assignment modal with grouped recommendation sections', () => {
    const sections: RecommendationSection[] = [
      {
        id: 'registered',
        title: 'Da dang ky phu hop',
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
            label: 'Uu tien',
            reason: 'Da dang ky ca nay',
            is_assigned: false,
            has_same_day_assignment: false,
          },
        ],
      },
    ]

    const markup = renderToStaticMarkup(
      <AssignmentModal
        open
        slotTitle="Ca sang Thu ngan"
        slotSubtitle="Thu 2 - 22/06/2026 · 08:30 - 12:00 · Da xep 1/3"
        shortageLabel="Con thieu 2"
        search=""
        onSearchChange={vi.fn()}
        sections={sections}
        requiresPublishedReason={false}
        onAssign={vi.fn()}
        onRemove={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(markup).toContain('Ca sang Thu ngan')
    expect(markup).toContain('Da dang ky phu hop')
    expect(markup).toContain('Nguyen Thi Phuong Thao')
  })
})
