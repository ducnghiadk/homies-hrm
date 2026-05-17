'use client'

import { useDeviceType } from '@/lib/design-system/breakpoints'
import MobileScheduleView from './mobile/MobileScheduleView'
import type { ScheduleResult, ScheduleShift } from '@/lib/mock-data-smart-schedule'

interface ScheduleViewProps {
  schedule: ScheduleResult
  onEditShift?: (shift: ScheduleShift) => void
  onDeleteShift?: (shiftId: string) => void
  onAddShift?: () => void
  onPublish?: () => void
  onBack?: () => void
}

/**
 * Responsive schedule view switcher.
 *
 * Mobile  → MobileScheduleView (list cards, swipe, bottom sheet)
 * Tablet  → MobileScheduleView (same for now, fits well on tablet)
 * Desktop → Reuses existing ScheduleResultView / DragDropScheduleEditor
 *
 * Desktop falls through to null so the parent page can still render
 * the existing desktop-first components.
 */
export default function ScheduleView({
  schedule,
  onEditShift,
  onDeleteShift,
  onAddShift,
  onPublish,
}: ScheduleViewProps) {
  const device = useDeviceType()

  // Mobile + Tablet → new mobile-optimised view
  if (device === 'mobile' || device === 'tablet') {
    return (
      <MobileScheduleView
        schedule={schedule}
        onEditShift={onEditShift}
        onDeleteShift={onDeleteShift}
        onAddShift={onAddShift}
        onPublish={onPublish}
      />
    )
  }

  // Desktop → return null so the page can render existing desktop components
  // (ScheduleResultView, DragDropScheduleEditor etc.)
  return null
}
