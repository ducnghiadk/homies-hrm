'use client'

import { useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { getMondayOfDate } from '@/lib/mock-data-registration-weeks'
import { getPublishedAssignmentsForEmployee } from '@/lib/mock-data-schedule-weeks'
import { getShiftById } from '@/lib/mock-data'

function getCurrentWeekStart() {
  return getMondayOfDate(new Date()).toISOString().split('T')[0]
}

export default function MySchedulePage() {
  const { user } = useAuthStore()

  const assignments = useMemo(() => {
    if (!user) return []
    return getPublishedAssignmentsForEmployee(user.id, getCurrentWeekStart())
  }, [user])

  return (
    <AppShell showNav>
      <div className="space-y-4 pb-24">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Lich cua toi</h1>
          <p className="text-xs text-gray-400">Chi hien thi ca da duoc publish chinh thuc.</p>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm font-semibold text-gray-500 shadow-[var(--shadow-card)]">
            Chua co lich da publish cho tuan hien tai.
          </div>
        ) : (
          assignments.map((assignment) => {
            const shift = getShiftById(assignment.shift_id)
            return (
              <div key={assignment.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{assignment.date}</p>
                    <p className="text-xs font-semibold text-gray-500">{shift?.name || assignment.shift_id}</p>
                    <p className="text-[11px] text-gray-400">{shift ? `${shift.start_time} - ${shift.end_time}` : 'Dang cap nhat'}</p>
                  </div>
                  {assignment.modified_after_publish ? (
                    <span className="rounded-full border border-warning-200 bg-warning-50 px-2 py-0.5 text-[10px] font-bold text-warning-700">
                      Moi cap nhat
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Da chot
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </AppShell>
  )
}
