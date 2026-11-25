'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { normalizeCareerPathSettings, type CareerPathSettings } from '@/lib/career-path/settings'
import type { CareerPlacement } from '@/lib/career-path/placement'
import type { CareerProgressSummary } from '@/lib/career-path/eligibility'
import AssessmentEditor from '@/components/career-path-v7/AssessmentEditor'
import { GRADE_BADGE, POSITION_LABEL, cardClass, inputClass } from '@/components/career-path-v7/career-ui'

const MANAGERS = ['ceo', 'hr_admin', 'area_manager', 'store_manager']
type Filter = 'all' | 'ready' | 'never'

interface Emp { id: string; full_name: string; employee_code?: string }
interface Loaded {
  employees: Map<string, Emp>
  placements: CareerPlacement[]
  summaries: Map<string, CareerProgressSummary>
  canAssess: boolean
  settings: CareerPathSettings
}

async function fetchAll(): Promise<Loaded> {
  const [empRes, plRes, asRes, setRes] = await Promise.all([
    fetch('/api/employees?status=active', { cache: 'no-store' }).then((r) => r.json()),
    fetch('/api/career-path/placements', { cache: 'no-store' }).then((r) => r.json()),
    fetch('/api/career-path/assessments', { cache: 'no-store' }).then((r) => r.json()),
    fetch('/api/career-path/settings', { cache: 'no-store' }).then((r) => r.json()),
  ])
  if (!plRes.success || !asRes.success || !setRes.success) throw new Error(asRes.message || plRes.message || 'Không tải được dữ liệu.')
  const emps = ((empRes.success && empRes.data) || []) as Emp[]
  return {
    employees: new Map(emps.map((e) => [e.id, e])),
    placements: plRes.placements || [],
    summaries: new Map(((asRes.summaries || []) as CareerProgressSummary[]).map((s) => [s.employee_id, s])),
    canAssess: Boolean(asRes.can_assess),
    settings: normalizeCareerPathSettings(setRes.settings),
  }
}

export default function CareerAssessmentPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) router.replace('/login?redirect=/career-path/assessment')
    else if (user && !MANAGERS.includes(user.role)) router.replace('/career-path/me')
  }, [hasHydrated, isAuthenticated, user, router])

  const apply = (d: Loaded) => { setData(d); setError('') }
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.')
  const reload = () => { fetchAll().then(apply).catch(fail) }

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return
    let alive = true
    fetchAll().then((d) => { if (alive) apply(d) }).catch((e) => { if (alive) fail(e) })
    return () => { alive = false }
  }, [hasHydrated, isAuthenticated])

  const rows = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.placements
      .map((p) => ({ p, emp: data.employees.get(p.employee_id), s: data.summaries.get(p.employee_id) }))
      .filter(({ p, emp, s }) => {
        if (filter === 'ready' && !s?.eligibility.ready) return false
        if (filter === 'never' && (s?.assessments_count || 0) > 0) return false
        const name = (emp?.full_name || p.employee_id).toLowerCase()
        return !q || name.includes(q) || (emp?.employee_code || '').toLowerCase().includes(q)
      })
      .sort((a, b) => (a.emp?.full_name || '').localeCompare(b.emp?.full_name || '', 'vi'))
  }, [data, search, filter])

  const readyCount = data ? [...data.summaries.values()].filter((s) => s.eligibility.ready).length : 0
  const neverCount = data ? data.placements.filter((p) => !data.summaries.get(p.employee_id)?.assessments_count).length : 0
  const selected = data?.placements.find((p) => p.employee_id === selectedId) || null

  return (
    <AppShell title="Đánh giá kỹ năng">
      <div className="min-h-screen bg-[#FFF8E8] px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#001D3D]">Đánh giá kỹ năng</h1>
              <p className="text-sm text-gray-500">Chấm mức 0–3 cho từng kỹ năng theo danh mục trong Cài đặt. Mỗi lần lưu là một phiếu mới, phiếu cũ được giữ nguyên.</p>
            </div>
            <Link href="/career-path/review" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#001D3D]">
              Đề xuất nâng bậc
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Nhân viên đã xếp bậc', data?.placements.length],
              ['Chưa được đánh giá', neverCount],
              ['Đủ điều kiện đề xuất', readyCount],
            ].map(([label, value]) => (
              <div key={label as string} className={cardClass}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
                <div className="mt-1 text-2xl font-bold text-[#001D3D]">{data ? value : '…'}</div>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error} <button type="button" onClick={reload} className="font-semibold underline">Thử lại</button>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1fr_480px]">
            <section className={cardClass}>
              <div className="flex flex-wrap gap-2">
                <input className={`${inputClass} max-w-xs`} placeholder="Tìm tên hoặc mã nhân viên" value={search} onChange={(e) => setSearch(e.target.value)} />
                {([['all', 'Tất cả'], ['never', 'Chưa đánh giá'], ['ready', 'Đủ điều kiện']] as [Filter, string][]).map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setFilter(v)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === v ? 'bg-[#001D3D] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <ul className="mt-3 divide-y divide-gray-100">
                {rows.map(({ p, emp, s }) => (
                  <li key={p.employee_id}>
                    <button type="button" onClick={() => setSelectedId(p.employee_id)} className={`flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left ${selectedId === p.employee_id ? 'bg-[#2F6FA8]/5' : ''}`}>
                      <span>
                        <span className="block text-sm font-semibold text-[#001D3D]">{emp?.full_name || p.employee_id}</span>
                        <span className="block text-xs text-gray-500">{POSITION_LABEL[p.primary_position]} · {s?.assessments_count || 0} phiếu</span>
                      </span>
                      <span className="flex items-center gap-2 text-xs">
                        <span className={`rounded-md px-2 py-0.5 font-bold ${GRADE_BADGE[p.grade_code]}`}>{p.grade_code}</span>
                        {s?.eligibility.ready && s.eligibility.next && <span className="font-semibold text-emerald-700">Đủ lên {s.eligibility.next}</span>}
                      </span>
                    </button>
                  </li>
                ))}
                {data && rows.length === 0 && (
                  <li className="py-6 text-center text-sm text-gray-500">
                    {data.placements.length === 0 ? 'Chưa có nhân viên nào được xếp bậc. HR cần xếp bậc trước.' : 'Không có nhân viên phù hợp.'}
                  </li>
                )}
              </ul>
            </section>

            <div>
              {selected && data ? (
                <AssessmentEditor
                  key={selected.employee_id}
                  employeeName={data.employees.get(selected.employee_id)?.full_name || selected.employee_id}
                  placement={selected}
                  settings={data.settings}
                  summary={data.summaries.get(selected.employee_id) || null}
                  canAssess={data.canAssess}
                  isSelf={selected.employee_id === user?.id}
                  onSaved={reload}
                  onClose={() => setSelectedId(null)}
                />
              ) : (
                <section className={`${cardClass} text-sm text-gray-500`}>Chọn một nhân viên ở danh sách để đánh giá.</section>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
