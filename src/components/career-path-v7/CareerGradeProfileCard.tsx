'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { CareerPlacement } from '@/lib/career-path/placement'
import { GRADE_BADGE, POSITION_LABEL } from './career-ui'

interface Props {
  employeeId: string
  viewerRole: string
}

type State = { status: 'loading' } | { status: 'hidden' } | { status: 'ready'; placement: CareerPlacement | null; changes: number }

const formatDay = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '')

/** Thẻ "Bậc lộ trình" trong hồ sơ nhân sự: bậc hiện tại theo Playbook V7 và lối vào các màn lộ trình. */
export default function CareerGradeProfileCard({ employeeId, viewerRole }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    fetch(`/api/career-path/placements?employee_id=${encodeURIComponent(employeeId)}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!alive) return
        if (!json?.success) return setState({ status: 'hidden' })
        setState({ status: 'ready', placement: json.placement || null, changes: Array.isArray(json.history) ? json.history.length : 0 })
      })
      .catch(() => alive && setState({ status: 'hidden' }))
    return () => {
      alive = false
    }
  }, [employeeId])

  if (state.status !== 'ready') return null
  const isAdmin = viewerRole === 'ceo' || viewerRole === 'hr_admin'
  const isManager = isAdmin || viewerRole === 'store_manager' || viewerRole === 'area_manager'
  const p = state.placement

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Bậc lộ trình thăng tiến</p>
          {p ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${GRADE_BADGE[p.grade_code]}`}>{p.grade_code}</span>
              <span className="text-sm font-semibold text-[#001D3D]">{POSITION_LABEL[p.primary_position]}</span>
              <span className="text-xs text-gray-500">từ {formatDay(p.effective_date)} · {state.changes} lần ghi nhận</span>
              {p.entry_assessment === 'pending' && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Chờ đánh giá đầu vào</span>
              )}
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-600">Chưa được xếp bậc.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link href="/career-path/placement" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#001D3D]">
              {p ? 'Điều chỉnh bậc' : 'Xếp bậc'}
            </Link>
          )}
          {isManager && p && (
            <Link href="/career-path/assessment" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#001D3D]">
              Đánh giá kỹ năng
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
