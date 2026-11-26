'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { normalizeCareerPathSettings, type CareerPathSettings } from '@/lib/career-path/settings'
import type { CareerGradeHistoryEntry, CareerPlacement } from '@/lib/career-path/placement'
import type { CareerProgressSummary } from '@/lib/career-path/eligibility'
import { applicableSkills } from '@/lib/career-path/assessment'
import { cumulativeHourlyBonus } from '@/lib/career-path/pay'
import EligibilityPanel from '@/components/career-path-v7/EligibilityPanel'
import SkillGroupList, { SkillLevelLegend } from '@/components/career-path-v7/SkillGroupList'
import { GRADE_BADGE, POSITION_LABEL, cardClass, formatDateTime, formatVnd } from '@/components/career-path-v7/career-ui'

/**
 * Nhân viên tự xem lộ trình của mình (Playbook V7): bậc, vị trí chính, mức kỹ năng,
 * điều kiện lên bậc kế tiếp và lịch sử đổi bậc. Chỉ xem, không tự sửa.
 */

const formatDay = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '')

const KIND_LABEL: Record<CareerGradeHistoryEntry['kind'], string> = {
  initial: 'Xếp bậc ban đầu',
  correction: 'Điều chỉnh',
  promotion: 'Nâng bậc',
}

interface Loaded {
  settings: CareerPathSettings
  placement: CareerPlacement | null
  history: CareerGradeHistoryEntry[]
  summary: CareerProgressSummary | null
}

async function fetchMine(employeeId: string): Promise<Loaded> {
  const q = encodeURIComponent(employeeId)
  const [setRes, plRes, asRes] = await Promise.all([
    fetch('/api/career-path/settings', { cache: 'no-store' }).then((r) => r.json()),
    fetch(`/api/career-path/placements?employee_id=${q}`, { cache: 'no-store' }).then((r) => r.json()),
    fetch(`/api/career-path/assessments?employee_id=${q}`, { cache: 'no-store' }).then((r) => r.json()),
  ])
  if (!setRes.success || !plRes.success) throw new Error(plRes.message || setRes.message || 'Không tải được lộ trình.')
  return {
    settings: normalizeCareerPathSettings(setRes.settings),
    placement: plRes.placement || null,
    history: plRes.history || [],
    summary: asRes.success ? asRes.summary || null : null,
  }
}

export default function MyCareerPathPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.replace('/login?redirect=/career-path/me')
  }, [hasHydrated, isAuthenticated, router])

  const userId = user?.id
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !userId) return
    let alive = true
    fetchMine(userId)
      .then((d) => { if (alive) { setData(d); setError('') } })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : 'Không tải được lộ trình.') })
    return () => { alive = false }
  }, [hasHydrated, isAuthenticated, userId])

  const placement = data?.placement
  const gradeCfg = placement && data ? data.settings.grades.find((g) => g.code === placement.grade_code) : undefined
  const skills = placement && data ? applicableSkills(data.settings, placement.primary_position) : []
  const levels = data?.summary?.levels || {}
  const hourlyBonus = placement && data ? cumulativeHourlyBonus(data.settings, placement.grade_code) : 0
  const ftBonus = gradeCfg?.ft_monthly_vs_g1_vnd || 0

  return (
    <AppShell className="w-full max-w-none space-y-4 px-4 py-4 sm:px-6">
      <header className="mx-auto max-w-3xl">
        <h1 className="text-xl font-bold text-[#001D3D]">Lộ trình của tôi</h1>
        <p className="text-sm text-gray-500">Bậc hiện tại và những gì cần thêm để lên bậc kế tiếp.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className={cardClass}><p className="text-sm text-gray-500">Đang tải lộ trình…</p></div>}

      {data && !placement && (
        <div className={cardClass}>
          <p className="text-sm text-[#001D3D]">Bạn chưa được xếp bậc trên lộ trình mới.</p>
          <p className="mt-1 text-xs text-gray-500">HR sẽ xếp bậc ban đầu theo năng lực thực tế. Khi có bậc, trang này sẽ hiện mức kỹ năng và điều kiện lên bậc.</p>
        </div>
      )}

      {data && placement && (
        <div className="mx-auto max-w-3xl space-y-4">
          <section className={cardClass}>
            <div className="flex items-center gap-3">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${GRADE_BADGE[placement.grade_code]}`}>{placement.grade_code}</span>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#001D3D]">{gradeCfg?.label || placement.grade_code}</p>
                <p className="text-sm text-gray-500">{POSITION_LABEL[placement.primary_position]} · từ {formatDay(placement.effective_date)}</p>
              </div>
            </div>
            {gradeCfg?.description && <p className="mt-3 text-sm text-gray-600">{gradeCfg.description}</p>}
            {(hourlyBonus > 0 || ftBonus > 0) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {hourlyBonus > 0 && <span className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-600">Part-time +{formatVnd(hourlyBonus)}/giờ</span>}
                {ftBonus > 0 && <span className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-600">Full-time +{formatVnd(ftBonus)}/tháng</span>}
              </div>
            )}
            {data.summary && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <EligibilityPanel bare summary={data.summary} hint="Khi đủ điều kiện, quản lý sẽ đề xuất nâng bậc cho bạn. Bạn không cần tự gửi yêu cầu." />
              </div>
            )}
          </section>

          <section className={cardClass}>
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <h2 className="text-sm font-bold text-[#001D3D]">Mức kỹ năng của tôi</h2>
              <p className="text-xs text-gray-500">
                {data.summary?.assessments_count ? `Đánh giá gần nhất ${formatDateTime(data.summary.last_assessed_at)}` : 'Chưa có lần đánh giá nào'}
              </p>
            </div>
            <div className="mt-2"><SkillLevelLegend /></div>
            <div className="mt-3"><SkillGroupList skills={skills} levels={levels} /></div>
          </section>

          <details className={`${cardClass} group`}>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-[#001D3D]">
              Lịch sử đổi bậc ({data.history.length})
              <span className="text-gray-400 transition group-open:rotate-90">›</span>
            </summary>
            {data.history.length === 0 && <p className="mt-2 text-sm text-gray-500">Chưa có lịch sử.</p>}
            <ol className="mt-3 space-y-3">
              {[...data.history].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((h) => (
                <li key={h.id} className="border-l-2 border-gray-200 pl-3 text-sm">
                  <p className="font-semibold text-[#001D3D]">{KIND_LABEL[h.kind]}: {h.from_grade ? `${h.from_grade} → ` : ''}{h.to_grade}</p>
                  <p className="text-xs text-gray-500">Hiệu lực {formatDay(h.effective_date)}{h.decided_by_name ? ` · ${h.decided_by_name}` : ''}</p>
                  {h.reason && <p className="mt-0.5 text-xs text-gray-600">{h.reason}</p>}
                </li>
              ))}
            </ol>
          </details>
        </div>
      )}
    </AppShell>
  )
}
