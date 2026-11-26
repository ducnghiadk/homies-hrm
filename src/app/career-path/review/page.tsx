'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import type { CareerPlacement } from '@/lib/career-path/placement'
import type { CareerProgressSummary } from '@/lib/career-path/eligibility'
import PromotionProposalCard, { type ProposalRow } from '@/components/career-path-v7/PromotionProposalCard'
import ProposePromotionPanel from '@/components/career-path-v7/ProposePromotionPanel'
import { GRADE_BADGE, POSITION_LABEL, cardClass } from '@/components/career-path-v7/career-ui'

const MANAGERS = ['ceo', 'hr_admin', 'area_manager', 'store_manager']
type Tab = 'pending' | 'done' | 'propose'

interface Loaded {
  proposals: ProposalRow[]
  canPropose: boolean
  respondWithin: number
  configured: boolean
  reasonMin: number
  allowException: boolean
  exceptionMin: number
  placements: CareerPlacement[]
  summaries: Map<string, CareerProgressSummary>
  names: Map<string, string>
}

async function fetchAll(): Promise<Loaded> {
  const [prRes, plRes, asRes, empRes] = await Promise.all([
    fetch('/api/career-path/promotions', { cache: 'no-store' }).then((r) => r.json()),
    fetch('/api/career-path/placements', { cache: 'no-store' }).then((r) => r.json()),
    fetch('/api/career-path/assessments', { cache: 'no-store' }).then((r) => r.json()),
    fetch('/api/employees?status=active', { cache: 'no-store' }).then((r) => r.json()),
  ])
  if (!prRes.success || !plRes.success || !asRes.success) throw new Error(prRes.message || plRes.message || asRes.message || 'Không tải được dữ liệu.')
  const emps = ((empRes.success && empRes.data) || []) as { id: string; full_name: string }[]
  return {
    proposals: prRes.proposals || [],
    canPropose: Boolean(prRes.can_propose),
    respondWithin: prRes.respond_within_working_days || 0,
    configured: prRes.configured !== false,
    reasonMin: Number(prRes.reason_min_chars) || 0,
    allowException: prRes.allow_exception !== false,
    exceptionMin: Number(prRes.exception_reason_min_chars) || 0,
    placements: plRes.placements || [],
    summaries: new Map(((asRes.summaries || []) as CareerProgressSummary[]).map((s) => [s.employee_id, s])),
    names: new Map(emps.map((e) => [e.id, e.full_name])),
  }
}

const todayVn = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)

async function post(body: Record<string, unknown>): Promise<string | null> {
  const res = await fetch('/api/career-path/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  return res.ok && json.success ? null : json.message || 'Không lưu được.'
}

export default function CareerReviewPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('pending')
  const [showNotReady, setShowNotReady] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Mở từ thông báo: /career-path/review?proposal=<id> → chuyển đúng tab và tô viền đề xuất đó.
  const [focusId, setFocusId] = useState<string | null>(null)
  const today = todayVn()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const id = new URLSearchParams(window.location.search).get('proposal')
      if (id) setFocusId(id)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) router.replace('/login?redirect=/career-path/review')
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

  const pending = useMemo(() => (data?.proposals || []).filter((p) => p.status === 'pending'), [data])
  const done = useMemo(() => (data?.proposals || []).filter((p) => p.status !== 'pending'), [data])
  const candidates = useMemo(() => {
    if (!data) return []
    const hasPending = new Set(pending.map((p) => p.employee_id))
    return data.placements
      .map((p) => ({ p, s: data.summaries.get(p.employee_id), name: data.names.get(p.employee_id) || p.employee_id }))
      .filter(({ p, s }) => s?.eligibility.next && !hasPending.has(p.employee_id) && p.employee_id !== user?.id && (showNotReady || s.eligibility.ready))
      .sort((a, b) => Number(Boolean(b.s?.eligibility.ready)) - Number(Boolean(a.s?.eligibility.ready)) || a.name.localeCompare(b.name, 'vi'))
  }, [data, pending, showNotReady, user?.id])

  useEffect(() => {
    if (!focusId || !data) return
    const row = data.proposals.find((p) => p.id === focusId)
    if (!row) return
    const timer = window.setTimeout(() => {
      setTab(row.status === 'pending' ? 'pending' : 'done')
      window.setTimeout(() => document.getElementById(`proposal-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [focusId, data])

  const act = (row: ProposalRow) => async (action: 'approve' | 'reject' | 'cancel', note: string, effectiveDate: string) => {
    const err = await post({ action, proposal_id: row.id, note, effective_date: effectiveDate })
    if (!err) reload()
    return err
  }
  const propose = (employeeId: string) => async (reason: string) => {
    const err = await post({ action: 'propose', employee_id: employeeId, reason })
    if (!err) { setSelectedId(null); setTab('pending'); reload() }
    return err
  }

  const overdue = pending.filter((p) => p.overdue).length
  const selected = candidates.find((c) => c.p.employee_id === selectedId)
  const tabs: [Tab, string, number][] = [['pending', 'Chờ duyệt', pending.length], ['propose', 'Đề xuất mới', candidates.length], ['done', 'Đã xử lý', done.length]]

  return (
    <AppShell title="Đề xuất nâng bậc">
      <div className="min-h-screen bg-[#FFF8E8] px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#001D3D]">Đề xuất & duyệt nâng bậc</h1>
              <p className="text-sm text-gray-500">Mỗi đề xuất chỉ lên 1 bậc kế tiếp. Ai được đề xuất, ai được duyệt và hạn phản hồi theo Cài đặt lộ trình.</p>
            </div>
            <Link href="/career-path/assessment" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#001D3D]">Đánh giá kỹ năng</Link>
          </div>

          {data && !data.configured && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              Chưa cài đặt lộ trình. CEO/HR cần nhập và lưu Cài đặt lộ trình thì mới đề xuất nâng bậc được.
            </div>
          )}
          {overdue > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Có {overdue} đề xuất đã quá {data?.respondWithin} ngày làm việc chưa được phản hồi.
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error} <button type="button" onClick={reload} className="font-semibold underline">Thử lại</button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {tabs.filter(([t]) => t !== 'propose' || data?.canPropose).map(([t, label, n]) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === t ? 'bg-[#001D3D] text-white' : 'bg-white text-gray-600'}`}>
                {label} ({data ? n : '…'})
              </button>
            ))}
          </div>

          {tab !== 'propose' && (
            <ul className="space-y-3">
              {(tab === 'pending' ? pending : done).map((row) => (
                <PromotionProposalCard key={row.id} row={row} today={today} respondWithin={data?.respondWithin || 0} onAction={act(row)} highlight={row.id === focusId} />
              ))}
              {data && (tab === 'pending' ? pending : done).length === 0 && (
                <li className={`${cardClass} text-center text-sm text-gray-500`}>{tab === 'pending' ? 'Không có đề xuất nào đang chờ.' : 'Chưa có đề xuất nào được xử lý.'}</li>
              )}
            </ul>
          )}

          {tab === 'propose' && data?.canPropose && (
            <div className="grid gap-4 lg:grid-cols-[1fr_480px]">
              <section className={cardClass}>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={showNotReady} onChange={(e) => setShowNotReady(e.target.checked)} />
                  Hiện cả nhân viên chưa đủ điều kiện (đề xuất ngoại lệ)
                </label>
                <ul className="mt-3 divide-y divide-gray-100">
                  {candidates.map(({ p, s, name }) => (
                    <li key={p.employee_id}>
                      <button type="button" onClick={() => setSelectedId(p.employee_id)} className={`flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left ${selectedId === p.employee_id ? 'bg-[#2F6FA8]/5' : ''}`}>
                        <span>
                          <span className="block text-sm font-semibold text-[#001D3D]">{name}</span>
                          <span className="block text-xs text-gray-500">{POSITION_LABEL[p.primary_position]} · {s?.months} tháng · {s?.hours} giờ</span>
                        </span>
                        <span className="flex items-center gap-2 text-xs">
                          <span className={`rounded-md px-2 py-0.5 font-bold ${GRADE_BADGE[p.grade_code]}`}>{p.grade_code}</span>
                          <span className={s?.eligibility.ready ? 'font-semibold text-emerald-700' : 'text-orange-700'}>
                            {s?.eligibility.ready ? `Đủ lên ${s.eligibility.next}` : 'Chưa đủ'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                  {candidates.length === 0 && <li className="py-6 text-center text-sm text-gray-500">Chưa có nhân viên nào đủ điều kiện mà chưa được đề xuất.</li>}
                </ul>
              </section>
              <div>
                {selected?.s ? (
                  <ProposePromotionPanel key={selected.p.employee_id} employeeName={selected.name} summary={selected.s} reasonMin={data?.reasonMin || 0} exceptionMin={data?.exceptionMin || 0} allowException={data?.allowException !== false} onSubmit={propose(selected.p.employee_id)} onClose={() => setSelectedId(null)} />
                ) : (
                  <section className={`${cardClass} text-sm text-gray-500`}>Chọn một nhân viên để đề xuất nâng bậc.</section>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
