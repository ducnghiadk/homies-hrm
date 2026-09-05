'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import { getStoreById, mockEmployees } from '@/lib/mock-data'
import type { KpiDatabase } from '@/lib/kpi/types'
import {
  createTestSession,
  finalizeTest,
  scheduleRetest,
  scoreTestSection,
  type TestSession,
} from '@/lib/kpi/test-service'

type SessionMap = Record<string, TestSession>

const LEVEL_LABELS: Record<string, string> = {
  pt1_tn: 'PT1 Thu ngan',
  pt1_pc: 'PT1 Pha che',
  pt2: 'PT2',
  senior: 'Senior',
  shift_leader: 'Shift Leader',
}

export default function PromotionTestsPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()

  const [database, setDatabase] = useState<KpiDatabase | null>(null)
  const [sessionMap, setSessionMap] = useState<SessionMap>({})
  const [selectedCaseId, setSelectedCaseId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/development/tests')
    }
  }, [hasHydrated, isAuthenticated, router])

  const canAccess = ['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'].includes(user?.role ?? '')

  const refreshData = useCallback(async () => {
    const db = await kpiAdapter.getDatabase()
    setDatabase(db)
  }, [])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user || !canAccess) return
    const timer = window.setTimeout(() => {
      void refreshData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [canAccess, hasHydrated, isAuthenticated, refreshData, user])

  const candidates = useMemo(() => {
    if (!database) return []

    return database.development_cases
      .filter((item) => ['leader_proposed', 'testing'].includes(item.status))
      .map((item) => {
        const employee = mockEmployees.find((entry) => entry.id === item.employee_id)
        const store = getStoreById(employee?.store_id)
        return {
          case: item,
          employeeName: employee?.full_name ?? item.employee_id,
          storeName: store?.name ?? employee?.store_id ?? 'Chua ro cua hang',
        }
      })
  }, [database])

  const effectiveSelectedCaseId = selectedCaseId || candidates[0]?.case.id || ''
  const selectedCandidate = candidates.find((item) => item.case.id === effectiveSelectedCaseId) ?? null

  const selectedSession = useMemo(() => {
    if (!selectedCandidate || !user) return null

    const existing = sessionMap[selectedCandidate.case.id]
    if (existing) return existing

    return createTestSession({
      development_case_id: selectedCandidate.case.id,
      employee_id: selectedCandidate.case.employee_id,
      current_level: selectedCandidate.case.current_level,
      target_level: selectedCandidate.case.target_level,
      created_by: user.id,
      created_at: '2026-08-22T09:00:00.000Z',
    })
  }, [selectedCandidate, sessionMap, user])

  const finalizedCount = Object.values(sessionMap).filter((session) => Boolean(session.outcome)).length
  const passedCount = Object.values(sessionMap).filter((session) => session.outcome === 'passed').length
  const pendingCount = Math.max(candidates.length - finalizedCount, 0)
  const retestCount = Object.values(sessionMap).filter((session) => Boolean(session.retest_scheduled_for)).length

  if (!hasHydrated || !user || !canAccess) return null

  function updateSection(sectionId: string, value: number) {
    if (!selectedCandidate || !selectedSession || !user) return

    setSessionMap((current) => ({
      ...current,
      [selectedCandidate.case.id]: scoreTestSection(selectedSession, {
        section_id: sectionId,
        score: value,
        actor_id: user.id,
        evidence_refs: [`rubric_${selectedCandidate.case.id}_${sectionId}`],
      }),
    }))
  }

  function handleFinalize() {
    if (!selectedCandidate || !selectedSession || !user) return

    setErrorMessage(null)

    try {
      const finalized = finalizeTest(selectedSession, {
        actor_id: user.id,
        finalized_at: '2026-08-22T10:00:00.000Z',
      })

      setSessionMap((current) => ({
        ...current,
        [selectedCandidate.case.id]: finalized,
      }))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the chot bai test')
    }
  }

  function handleScheduleRetest() {
    if (!selectedCandidate || !selectedSession || !user) return

    setErrorMessage(null)

    try {
      const next = scheduleRetest(selectedSession, {
        actor_id: user.id,
        scheduled_at: '2026-08-22T11:00:00.000Z',
      })

      setSessionMap((current) => ({
        ...current,
        [selectedCandidate.case.id]: next,
      }))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the len lich test lai')
    }
  }

  return (
    <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
      <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3.5 shadow-2xs sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/kpi/promotion" className="transition hover:text-[#2F6FA8]">Ho so thang bac</Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Bai test nang bac</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                Trung tam test nang bac va test lai
              </h1>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Rule total + san tung phan
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Ngay hom nay la 22/08/2026. Tong diem tu tinh theo rubric, khong cho nhap tong truc tiep.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/kpi/promotion"
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft size={14} />
              <span>Ve ho so thang bac</span>
            </Link>
            <button
              type="button"
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
            >
              <FileSpreadsheet size={14} className="text-[#2F6FA8]" />
              <span>Xuat rubric</span>
            </button>
            <button
              type="button"
              onClick={handleFinalize}
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <ShieldCheck size={14} />
              <span>Chot bai test</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-4">
          <MacroCard
            title="Ung vien dang xu ly"
            value={`${candidates.length}`}
            note="Queue testing tu leader de xuat"
            tone="blue"
            icon={<GraduationCap size={16} />}
          />
          <MacroCard
            title="Da dat"
            value={`${passedCount}`}
            note="San sang qua challenge"
            tone="emerald"
            icon={<CheckCircle2 size={16} />}
          />
          <MacroCard
            title="Cho chot"
            value={`${pendingCount}`}
            note="Chua co ket qua cuoi"
            tone="amber"
            icon={<Clock3 size={16} />}
          />
          <MacroCard
            title="Test lai"
            value={`${retestCount}`}
            note="Da len lich test lai"
            tone="rose"
            icon={<RotateCcw size={16} />}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                <ClipboardList size={14} className="text-[#2F6FA8]" />
                <span>Queue va rubric cham tung phan</span>
              </h2>
              <span className="text-xs font-medium text-gray-500">Tong diem lay trung binh 3 phan</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80 font-bold text-gray-600">
                      <th className="px-4 py-3 text-[#001D3D]">Nhan su</th>
                      <th className="px-3 py-3 text-center">Tuyen</th>
                      <th className="px-3 py-3 text-center">Trang thai</th>
                      <th className="px-4 py-3 text-right">Tong hien tai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {candidates.map((item) => {
                      const session = sessionMap[item.case.id]
                      const isSelected = item.case.id === effectiveSelectedCaseId
                      return (
                        <tr
                          key={item.case.id}
                          onClick={() => setSelectedCaseId(item.case.id)}
                          className={isSelected ? 'cursor-pointer bg-blue-50/50' : 'cursor-pointer transition hover:bg-blue-50/30'}
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-gray-900">{item.employeeName}</div>
                            <div className="text-[11px] font-medium text-gray-500">{item.storeName}</div>
                          </td>
                          <td className="px-3 py-3.5 text-center font-bold text-gray-700">
                            {LEVEL_LABELS[item.case.current_level]} {'->'} {LEVEL_LABELS[item.case.target_level]}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <QueueBadge status={session?.outcome ? session.outcome : 'draft'} />
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-[#001D3D]">
                            {typeof session?.total_score === 'number' ? session.total_score.toFixed(2) : '--'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedCandidate && selectedSession ? (
              <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#001D3D]">{selectedCandidate.employeeName}</div>
                    <div className="text-xs font-medium text-gray-500">
                      {LEVEL_LABELS[selectedCandidate.case.current_level]} {'->'} {LEVEL_LABELS[selectedCandidate.case.target_level]}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Tong can {selectedSession.passing_total}
                    </span>
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      San moi phan {selectedSession.section_floor}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedSession.sections.map((section) => (
                    <div key={section.section_id} className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{formatSectionLabel(section.section_id)}</div>
                        <div className="mt-1 text-[11px] font-medium text-gray-500">
                          Diem san: {selectedSession.section_floor}. Nguoi cham can dinh kem evidence theo rubric.
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={section.score ?? ''}
                          onChange={(event) => updateSection(section.section_id, Number(event.target.value))}
                          className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-mono font-bold tabular-nums text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:ring-2 focus:ring-[#2F6FA8]/20"
                        />
                        <span className="text-xs font-bold text-gray-500">/100</span>
                      </div>
                    </div>
                  ))}
                </div>

                {errorMessage ? (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                    <CircleAlert size={14} className="mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-xs">
                <div className="text-sm font-bold text-[#001D3D]">Chua co ung vien trong queue testing</div>
                <div className="mt-1 text-xs font-medium text-gray-500">
                  Khi leader de xuat xong ho so, danh sach se hien o day de cham theo rubric.
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">Tong hop ket qua hien tai</div>
              {selectedSession ? (
                <div className="mt-4 space-y-3">
                  <InfoRow label="Tong hien tai" value={typeof selectedSession.total_score === 'number' ? selectedSession.total_score.toFixed(2) : '--'} />
                  <InfoRow label="Ket qua" value={mapOutcome(selectedSession.outcome)} />
                  <InfoRow label="Test lai" value={selectedSession.retest_scheduled_for ? formatDateTime(selectedSession.retest_scheduled_for) : 'Chua len lich'} />
                  <InfoRow label="So lan test lai" value={`${selectedSession.retest_attempts}`} />
                </div>
              ) : (
                <div className="mt-4 text-xs font-medium text-gray-500">Chon 1 ung vien de xem tong hop.</div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">Rule pass theo tuyen</div>
              <div className="mt-4 space-y-3 text-xs text-gray-600">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="font-bold text-gray-800">PT1 / PT2 va PT2 / Senior</div>
                  <div className="mt-1">Tong {'>='} 80 va khong phan nao duoi san 70.</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="font-bold text-gray-800">Senior / Shift Leader</div>
                  <div className="mt-1">Tong {'>='} 85 va khong phan nao duoi san 75.</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="font-bold text-gray-800">Rule test lai</div>
                  <div className="mt-1">Lech nhe thi 2 tuan. Lech xa thi 4 tuan. Toi da 1 lan test lai.</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">Hanh dong nhanh</div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleFinalize}
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-[#2F6FA8] px-4 text-xs font-bold text-white transition hover:bg-[#1D3E61]"
                >
                  <CheckCircle2 size={14} />
                  <span>Chot ket qua test</span>
                </button>
                <button
                  type="button"
                  onClick={handleScheduleRetest}
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                >
                  <RotateCcw size={14} />
                  <span>Len lich test lai</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

function MacroCard({
  title,
  value,
  note,
  tone,
  icon,
}: {
  title: string
  value: string
  note: string
  tone: 'blue' | 'emerald' | 'amber' | 'rose'
  icon: ReactNode
}) {
  const toneMap = {
    blue: 'bg-blue-50 text-[#2F6FA8] border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{title}</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#001D3D]">{value}</div>
          <div className="mt-1 text-[11px] font-medium text-gray-500">{note}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${toneMap[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function QueueBadge({ status }: { status: TestSession['outcome'] | 'draft' }) {
  if (status === 'passed') {
    return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Dat</span>
  }

  if (status === 'failed_section_floor') {
    return <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">Rot san</span>
  }

  if (status === 'failed_total') {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">Rot tong</span>
  }

  return <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">Dang cham</span>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="font-medium text-gray-500">{label}</span>
      <span className="font-mono font-bold tabular-nums text-[#001D3D]">{value}</span>
    </div>
  )
}

function formatSectionLabel(sectionId: string): string {
  const labelMap: Record<string, string> = {
    product_knowledge: 'Kien thuc san pham va quy trinh',
    operations_execution: 'Thuc thi SOP va xu ly trong ca',
    service_attitude: 'Thai do phuc vu va phan hoi khach',
    leadership_judgement: 'Tu duy dieu phoi va phan quyet',
    operations_control: 'Kiem soat van hanh va loi ca',
    coaching_readiness: 'Kem cap, huong dan va chuyen giao',
  }

  return labelMap[sectionId] ?? sectionId
}

function mapOutcome(outcome?: TestSession['outcome']): string {
  if (!outcome) return 'Chua chot'
  if (outcome === 'passed') return 'Dat'
  if (outcome === 'failed_section_floor') return 'Rot san tung phan'
  return 'Rot tong'
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}
