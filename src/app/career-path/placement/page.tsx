'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { normalizeCareerPathSettings, type CareerPathSettings } from '@/lib/career-path/settings'
import type { CareerPlacement } from '@/lib/career-path/placement'
import PlacementEditor, { type PlacementEmployee } from '@/components/career-path-v7/PlacementEditor'
import { GRADE_BADGE, POSITION_LABEL, cardClass, inputClass } from '@/components/career-path-v7/career-ui'

const ADMIN = ['ceo', 'hr_admin']
type Filter = 'all' | 'unplaced' | 'pending'

interface Loaded {
  employees: PlacementEmployee[]
  placements: CareerPlacement[]
  settings: CareerPathSettings
}

async function fetchAll(): Promise<Loaded> {
  const [empRes, plRes, setRes] = await Promise.all([
    fetch('/api/employees?status=active', { cache: 'no-store' }).then((r) => r.json()),
    fetch('/api/career-path/placements', { cache: 'no-store' }).then((r) => r.json()),
    fetch('/api/career-path/settings', { cache: 'no-store' }).then((r) => r.json()),
  ])
  if (!empRes.success || !plRes.success || !setRes.success) throw new Error(plRes.message || setRes.message || 'Không tải được dữ liệu.')
  const list = (empRes.data || []) as (PlacementEmployee & { role?: string })[]
  return {
    employees: list.filter((e) => e.role !== 'ceo').sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi')),
    placements: plRes.placements || [],
    settings: normalizeCareerPathSettings(setRes.settings),
  }
}

export default function CareerPlacementPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [employees, setEmployees] = useState<PlacementEmployee[]>([])
  const [placements, setPlacements] = useState<CareerPlacement[]>([])
  const [settings, setSettings] = useState<CareerPathSettings | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) router.replace('/login?redirect=/career-path/placement')
    else if (user && !ADMIN.includes(user.role)) router.replace('/career-path')
  }, [hasHydrated, isAuthenticated, user, router])

  const applyLoaded = (d: Loaded) => {
    setEmployees(d.employees)
    setPlacements(d.placements)
    setSettings(d.settings)
    setError('')
    setLoading(false)
  }
  const applyError = (e: unknown) => {
    setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.')
    setLoading(false)
  }
  const load = () => {
    fetchAll().then(applyLoaded).catch(applyError)
  }

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return
    let alive = true
    fetchAll()
      .then((d) => { if (alive) applyLoaded(d) })
      .catch((e) => { if (alive) applyError(e) })
    return () => { alive = false }
  }, [hasHydrated, isAuthenticated])

  const byEmployee = useMemo(() => new Map(placements.map((p) => [p.employee_id, p])), [placements])
  const unplacedCount = employees.filter((e) => !byEmployee.has(e.id)).length
  const pendingCount = placements.filter((p) => p.entry_assessment === 'pending').length

  const rows = employees.filter((e) => {
    const p = byEmployee.get(e.id)
    if (filter === 'unplaced' && p) return false
    if (filter === 'pending' && p?.entry_assessment !== 'pending') return false
    const q = search.trim().toLowerCase()
    return !q || e.full_name.toLowerCase().includes(q) || (e.employee_code || '').toLowerCase().includes(q)
  })
  const selected = employees.find((e) => e.id === selectedId) || null

  return (
    <AppShell title="Xếp bậc nhân viên">
      <div className="min-h-screen bg-[#FFF8E8] px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#001D3D]">Xếp bậc ban đầu</h1>
              <p className="text-sm text-gray-500">
                HR xếp bậc theo tay nghề thực tế của từng người, sau đó xác nhận lại bằng bài đánh giá đầu vào.
                Bước này chưa thay đổi lương.
              </p>
            </div>
            <Link href="/settings/career-path" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#001D3D]">
              Cài đặt lộ trình
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Nhân viên đang làm', employees.length],
              ['Chưa xếp bậc', unplacedCount],
              ['Chờ đánh giá xác nhận', pendingCount],
            ].map(([label, value]) => (
              <div key={label as string} className={cardClass}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
                <div className="mt-1 text-2xl font-bold text-[#001D3D]">{loading ? '…' : value}</div>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error} <button type="button" onClick={() => { setError(''); setLoading(true); void load() }} className="font-semibold underline">Thử lại</button>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
            <section className={cardClass}>
              <div className="flex flex-wrap gap-2">
                <input className={`${inputClass} max-w-xs`} placeholder="Tìm tên hoặc mã nhân viên" value={search} onChange={(e) => setSearch(e.target.value)} />
                {([['all', 'Tất cả'], ['unplaced', 'Chưa xếp'], ['pending', 'Chờ xác nhận']] as [Filter, string][]).map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setFilter(v)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === v ? 'bg-[#001D3D] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <ul className="mt-3 divide-y divide-gray-100">
                {rows.map((e) => {
                  const p = byEmployee.get(e.id)
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        className={`flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left ${selectedId === e.id ? 'bg-[#2F6FA8]/5' : ''}`}
                      >
                        <span>
                          <span className="block text-sm font-semibold text-[#001D3D]">{e.full_name}</span>
                          <span className="block text-xs text-gray-500">{e.employee_code || e.id}</span>
                        </span>
                        {p ? (
                          <span className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">{POSITION_LABEL[p.primary_position]}</span>
                            <span className={`rounded-md px-2 py-0.5 font-bold ${GRADE_BADGE[p.grade_code]}`}>{p.grade_code}</span>
                            {p.entry_assessment === 'pending' && <span className="text-amber-700">Chờ xác nhận</span>}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400">Chưa xếp</span>
                        )}
                      </button>
                    </li>
                  )
                })}
                {!loading && rows.length === 0 && <li className="py-6 text-center text-sm text-gray-500">Không có nhân viên phù hợp.</li>}
              </ul>
            </section>

            <div>
              {selected && settings ? (
                <PlacementEditor
                  key={`${selected.id}-${byEmployee.get(selected.id)?.updated_at || ''}`}
                  employee={selected}
                  placement={byEmployee.get(selected.id) || null}
                  settings={settings}
                  onClose={() => setSelectedId(null)}
                  onSaved={() => void load()}
                />
              ) : (
                <section className={`${cardClass} text-sm text-gray-500`}>Chọn một nhân viên ở danh sách để xếp bậc.</section>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
