'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Compass,
  Crown,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import type { KpiEmployeeRef, KpiLevelCode, KpiDatabase } from '@/lib/kpi/types.ts'
import { KPICareerMapReadOnly } from '@/components/kpi/career-map/KPICareerMapReadOnly'
import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import { MasterDataAdapter } from '@/lib/adapters/master-data-adapter'
import { employeeAdapter } from '@/lib/adapters/employee-adapter'
import { buildHomiesCareerMapSeed } from '@/lib/kpi/seed'
import { inferJobFamily } from '@/lib/kpi/career-map-service'
import { buildPromotionDossiers, scopePromotionDossiers } from '@/lib/kpi/career-map-deployment-service'
import type { KpiCareerPositionSnapshot } from '@/lib/kpi/career-map-types'
import type { EligibilityCheck, PromotionEligibilityInput } from '@/lib/kpi/development-service'
import type { TestSession } from '@/lib/kpi/test-service'
import type { KpiChallenge } from '@/lib/kpi/challenge-service'
import type { SalarySuggestion } from '@/lib/kpi/salary-service'

type PipelineStepStatus = 'done' | 'current' | 'blocked' | 'upcoming'

interface PipelineStep {
  id: string
  label: string
  note: string
  status: PipelineStepStatus
}

interface PromotionDossier {
  id: string
  employeeName: string
  storeName: string
  employee: KpiEmployeeRef
  targetLevel: KpiLevelCode
  currentHourlyRate: number | null
  leaderProposalNote: string
  finalReviewNote: string
  appointmentNote: string
  appealDeadline: string
  eligibilityInput: PromotionEligibilityInput | null
  eligibilityChecks: EligibilityCheck[]
  eligibilityStatus: 'not_eligible' | 'eligible_for_test'
  testSession: TestSession | null
  challenge: KpiChallenge | null
  salarySuggestion: SalarySuggestion | null
  salaryBandLabel: string | null
  overallStatus: 'ready_for_appointment' | 'in_testing' | 'blocked'
  stageLabel: string
}

const LEVEL_LABELS: Record<string, string> = {
  c1_pc: 'C1 - Pha chế',
  c1_tn: 'C1 - Thu ngân',
  c2: 'C2 - Nhân viên đa năng',
  c3: 'C3 - Senior',
  c4: 'C4 - Trưởng ca',
  c5: 'C5 - Quản lý cửa hàng',
  pt1_tn: 'PT1 Thu ngân',
  pt1_pc: 'PT1 Pha chế',
  pt2: 'PT2',
  senior: 'Senior',
  shift_leader: 'Shift Leader',
}

const PIPELINE_LABELS = [
  { id: 'system_detect', label: '1. System detect' },
  { id: 'leader_propose', label: '2. Leader propose' },
  { id: 'test', label: '3. Test' },
  { id: 'ceo_approve', label: '4. CEO approve challenge' },
  { id: 'challenge', label: '5. Challenge' },
  { id: 'final_review', label: '6. Final review' },
  { id: 'appointment', label: '7. Appointment / salary' },
] as const

export default function PromotionPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [selectedId, setSelectedId] = useState('')
  const [activeTab, setActiveTab] = useState<'pipeline' | 'career_map'>('pipeline')
  const [database, setDatabase] = useState<KpiDatabase | null>(null)
  const [positions, setPositions] = useState<Array<{ id: string; name: string; level?: number }>>([])
  const [employees, setEmployees] = useState<
    Array<{ id: string; name: string; position_id: string; store_id: string }>
  >([])

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/promotion')
    }
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const [dbData, posList, empList] = await Promise.all([
          kpiAdapter.getDatabase(),
          MasterDataAdapter.getPositions(),
          employeeAdapter.getAllEmployees(user || undefined),
        ])
        if (cancelled) return
        setDatabase(dbData)
        setPositions(posList)
        setEmployees(
          empList.map((e: { id: string; fullName?: string; name?: string; position_id?: string; store_id?: string }) => ({
            id: e.id,
            name: e.fullName || e.name || e.id,
            position_id: e.position_id || '',
            store_id: e.store_id || '',
          }))
        )
      } catch {
        // Fallback to defaults
      }
    }
    void loadData()
    return () => {
      cancelled = true
    }
  }, [user])

  const canAccess = ['employee', 'shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'].includes(user?.role ?? '')

  const seedCareer = useMemo(() => buildHomiesCareerMapSeed(), [])

  const activeMap = useMemo(() => {
    if (database?.career_maps && database.career_maps.length > 0) {
      return database.career_maps.find((m) => m.status === 'published') || database.career_maps[0]
    }
    return seedCareer.map
  }, [database, seedCareer.map])

  const activeProfiles = useMemo(() => {
    if (database?.position_criteria_profiles && database.position_criteria_profiles.length > 0) {
      return database.position_criteria_profiles
    }
    return seedCareer.profiles
  }, [database, seedCareer.profiles])

  const careerPositions: KpiCareerPositionSnapshot[] = useMemo(() => {
    return positions.map((p) => ({
      id: p.id,
      name: p.name,
      level: p.level || 1,
      job_family: inferJobFamily(p.name, p.id),
    }))
  }, [positions])

  const rawDossiers = useMemo(() => {
    const placements = database?.career_employee_placements || []
    if (placements.length > 0 && activeMap) {
      return buildPromotionDossiers({
        placements,
        employees,
        careerMap: activeMap,
        evaluations: database?.evaluations || [],
        developmentCases: database?.development_cases || [],
      })
    }
    return []
  }, [database?.career_employee_placements, database?.evaluations, database?.development_cases, activeMap, employees])

  const scopedDossiers = useMemo(() => {
    return scopePromotionDossiers(rawDossiers, user)
  }, [rawDossiers, user])

  const selectedDossier = useMemo(
    () => scopedDossiers.find((item) => item.id === selectedId) ?? scopedDossiers[0] ?? null,
    [selectedId, scopedDossiers]
  )

  const summary = useMemo(() => ({
    total: scopedDossiers.length,
    ready: scopedDossiers.filter((item) => item.overallStatus === 'ready_for_appointment').length,
    testing: scopedDossiers.filter((item) => item.overallStatus === 'in_testing').length,
    blocked: scopedDossiers.filter((item) => item.overallStatus === 'blocked').length,
  }), [scopedDossiers])

  if (!hasHydrated || !user || !canAccess) return null

  return (
    <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
      <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3.5 shadow-2xs sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/kpi" className="transition hover:text-[#2F6FA8]">KPI</Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">People development</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                Hub thang tien va bo nhiem 7 buoc
              </h1>
              {/* Tab Switcher */}
              <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('pipeline')}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    activeTab === 'pipeline'
                      ? 'bg-white text-[#2F6FA8] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pipeline 7 Bước
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('career_map')}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'career_map'
                      ? 'bg-white text-[#2F6FA8] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Compass size={13} className="text-[#2F6FA8]" />
                  Sơ Đồ Lộ Trình Homies
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Moi ho so deu hien ly do dat, ly do vuong, bai test, challenge, luong de xuat va han khieu nai 3 ngay lam viec.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/kpi/development/tests"
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <FileCheck2 size={14} />
              <span>Mo bai test</span>
            </Link>
            <Link
              href="/kpi/development/challenges"
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <ShieldCheck size={14} />
              <span>Mo challenge</span>
            </Link>
            <Link
              href="/kpi/settings"
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#255987]"
            >
              <BadgeDollarSign size={14} />
              <span>Khung luong va policy</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
        {activeTab === 'career_map' ? (
          <KPICareerMapReadOnly
            map={activeMap}
            profiles={activeProfiles}
            positions={careerPositions}
            currentPositionId={selectedDossier?.employee?.position_id}
            employeeName={selectedDossier?.employeeName}
            storeName={selectedDossier?.storeName}
            role={user?.role}
          />
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-4">
              <MacroCard title="Tong ho so" value={`${summary.total}`} note="Dang nam trong pipeline" tone="blue" icon={<ClipboardList size={16} />} />
              <MacroCard title="San sang bo nhiem" value={`${summary.ready}`} note="Da qua test va challenge" tone="emerald" icon={<CheckCircle2 size={16} />} />
              <MacroCard title="Dang xu ly" value={`${summary.testing}`} note="Dang o bai test hoac challenge" tone="amber" icon={<Clock3 size={16} />} />
              <MacroCard title="Dang bi chan" value={`${summary.blocked}`} note="Can go canh bao hoac KPI" tone="rose" icon={<CircleAlert size={16} />} />
            </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
              <div className="border-b border-gray-100 px-4 py-3.5 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#001D3D]">Queue ho so thang tien</h2>
                    <div className="mt-0.5 text-xs text-gray-500">Bam tung dong de xem day du checklist va buoc ke tiep</div>
                  </div>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    22/08/2026
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80 font-bold text-gray-600">
                      <th className="px-4 py-3 text-[#001D3D]">Nhan su</th>
                      <th className="px-3 py-3 text-center">Tuyen</th>
                      <th className="px-3 py-3 text-center">Trang thai</th>
                      <th className="px-3 py-3 text-center">Buoc hien tai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {scopedDossiers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500">
                          {user.role === 'employee'
                            ? 'Bạn chưa có hồ sơ trong danh sách xét duyệt thăng tiến chu kỳ này.'
                            : user.role === 'store_manager'
                            ? 'Không có hồ sơ thăng tiến nào thuộc chi nhánh được phân công của bạn.'
                            : 'Hiện chưa có hồ sơ nhân viên nào trong danh sách xét duyệt thăng tiến.'}
                        </td>
                      </tr>
                    ) : (
                      scopedDossiers.map((dossier) => {
                        const isSelected = dossier.id === selectedDossier?.id
                        return (
                          <tr
                            key={dossier.id}
                            onClick={() => setSelectedId(dossier.id)}
                            className={isSelected ? 'cursor-pointer bg-blue-50/50' : 'cursor-pointer transition hover:bg-blue-50/30'}
                          >
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-gray-900">{dossier.employeeName}</div>
                              <div className="text-[11px] font-medium text-gray-500">{dossier.storeName}</div>
                            </td>
                            <td className="px-3 py-3.5 text-center font-bold text-gray-700">
                              {LEVEL_LABELS[dossier.employee.level_code] || dossier.employee.level_code} {'->'} {LEVEL_LABELS[dossier.targetLevel] || dossier.targetLevel}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <StatusBadge status={dossier.overallStatus} />
                            </td>
                            <td className="px-3 py-3.5 text-center font-medium text-gray-600">
                              {dossier.stageLabel}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedDossier ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                  <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-lg font-bold text-[#001D3D]">{selectedDossier.employeeName}</div>
                      <div className="mt-1 text-xs font-medium text-gray-500">
                        {selectedDossier.storeName} • {LEVEL_LABELS[selectedDossier.employee.level_code] || selectedDossier.employee.level_code} {'->'} {LEVEL_LABELS[selectedDossier.targetLevel] || selectedDossier.targetLevel}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={selectedDossier.overallStatus} />
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                        Han khieu nai: {selectedDossier.appealDeadline}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DetailStat
                      title="KPI trung binh"
                      value={selectedDossier.eligibilityInput
                        ? formatAverageScore(selectedDossier.eligibilityInput.monthly_scores.map((item: { total: number }) => item.total))
                        : 'Chua co du lieu'}
                      note="Lay trung binh cac thang xet"
                    />
                    <DetailStat
                      title="Gio cong hop le thap nhat"
                      value={selectedDossier.eligibilityInput
                        ? `${formatLowestHours(selectedDossier.eligibilityInput.monthly_scores)} gio`
                        : 'Chua co du lieu'}
                      note="Dung de chan KPI khong du ca"
                    />
                    <DetailStat title="Ket qua test" value={formatTestOutcome(selectedDossier.testSession)} note={formatTestNote(selectedDossier.testSession)} />
                    <DetailStat title="De xuat luong" value={selectedDossier.salarySuggestion ? formatCurrency(selectedDossier.salarySuggestion.recommended) : '-'} note={selectedDossier.salaryBandLabel ?? 'Chua mo buoc bo nhiem'} />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-[#001D3D]">Pipeline 7 buoc</h2>
                    <div className="text-xs font-medium text-gray-500">Thay badge xanh chung chung bang trang thai co giai thich</div>
                  </div>

                  <div className="mt-4 grid gap-3 xl:grid-cols-7">
                    {buildPipelineSteps(selectedDossier).map((step) => (
                      <div key={step.id} className={`rounded-xl border p-3 ${stepTone(step.status)}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-bold text-[#001D3D]">{step.label}</div>
                          <PipelineDot status={step.status} />
                        </div>
                        <div className="mt-2 text-xs font-medium text-gray-700">{step.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-[#001D3D]">Checklist dieu kien du thi</h2>
                    <span className="text-xs font-medium text-gray-500">Actual / required / block hien ro tung dong</span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80 font-bold text-gray-600">
                          <th className="px-3 py-3 text-[#001D3D]">Tieu chi</th>
                          <th className="px-3 py-3">Actual</th>
                          <th className="px-3 py-3">Required</th>
                          <th className="px-3 py-3 text-center">Ket qua</th>
                          <th className="px-3 py-3 text-center">Block</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedDossier.eligibilityChecks.map((check: EligibilityCheck) => (
                          <tr key={check.code}>
                            <td className="px-3 py-3.5">
                              <div className="font-semibold text-gray-900">{check.label}</div>
                            </td>
                            <td className="px-3 py-3.5 text-gray-700">{check.actual}</td>
                            <td className="px-3 py-3.5 text-gray-700">{check.required}</td>
                            <td className="px-3 py-3.5 text-center">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                check.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {check.passed ? 'Dat' : 'Chua dat'}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                check.blocking ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {check.blocking ? 'Co' : 'Khong'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold text-[#001D3D]">Ghi nhan tu leader va hoi dong</h2>
                    <div className="mt-4 space-y-3">
                      <InfoBlock icon={<UserRoundCheck size={15} className="text-[#2F6FA8]" />} title="Leader de xuat" body={selectedDossier.leaderProposalNote} />
                      <InfoBlock icon={<Crown size={15} className="text-amber-600" />} title="Final review" body={selectedDossier.finalReviewNote} />
                      <InfoBlock icon={<BriefcaseBusiness size={15} className="text-emerald-600" />} title="Bo nhiem / salary" body={selectedDossier.appointmentNote} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold text-[#001D3D]">Tom tat test, challenge va luong</h2>
                    <div className="mt-4 space-y-4">
                      <MiniPanel
                        title="Bai test"
                        body={buildTestSummary(selectedDossier.testSession)}
                        tone={selectedDossier.testSession?.outcome === 'passed' ? 'emerald' : selectedDossier.testSession ? 'amber' : 'gray'}
                      />
                      <MiniPanel
                        title="Challenge"
                        body={buildChallengeSummary(selectedDossier.challenge)}
                        tone={selectedDossier.challenge?.status === 'passed' ? 'emerald' : selectedDossier.challenge ? 'blue' : 'gray'}
                      />
                      <MiniPanel
                        title="Khung luong"
                        body={buildSalarySummary(selectedDossier.salarySuggestion, selectedDossier.salaryBandLabel)}
                        tone={selectedDossier.salarySuggestion ? 'blue' : 'gray'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <SidebarPanel
              title="Rule can nho"
              icon={<ShieldCheck size={16} className="text-[#2F6FA8]" />}
              items={[
                'System chi goi y nguon, leader van la nguoi chot diem cuoi.',
                'Incident nghiem trong hoac canh bao con hieu luc se chan thang tien.',
                'Moi ho so chi duoc challenge gia han toi da 1 lan.',
                'Quyet dinh nhan su co han khieu nai 3 ngay lam viec.',
              ]}
            />
            <SidebarPanel
              title="Ben quyet dinh"
              icon={<Sparkles size={16} className="text-amber-600" />}
              items={[
                'Neu chua qua checklist thi khong duoc nhay sang bai test.',
                'Neu test truot nhe thi len lich test lai 2 tuan; truot xa hon thi 4 tuan.',
                'Chi khi challenge qua va CEO dong y moi sang bo nhiem / salary.',
              ]}
            />
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <h2 className="text-sm font-bold text-[#001D3D]">Huong dan doc nhanh</h2>
              </div>
              <div className="mt-4 space-y-3 text-xs text-gray-600">
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <div className="font-semibold text-gray-900">1. Xem trang thai tong</div>
                  <div className="mt-1">Biet ngay ho so nao da san sang bo nhiem, ho so nao dang xu ly, ho so nao dang bi chan.</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <div className="font-semibold text-gray-900">2. Xem checklist</div>
                  <div className="mt-1">Tung dong co actual, muc can dat va co chan buoc tiep theo hay khong.</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <div className="font-semibold text-gray-900">3. Xem buoc ke tiep</div>
                  <div className="mt-1">Pipeline 7 buoc cho thay ai dang cho test, ai dang challenge, ai da den buoc salary.</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </>
    )}
  </div>
</AppShell>
  )
}

function buildPipelineSteps(dossier: PromotionDossier): PipelineStep[] {
  const testPassed = dossier.testSession?.outcome === 'passed'
  const testFailed = dossier.testSession?.outcome && dossier.testSession.outcome !== 'passed'
  const challengePassed = dossier.challenge?.status === 'passed'
  const challengeStarted = Boolean(dossier.challenge)

  return PIPELINE_LABELS.map((step) => {
    switch (step.id) {
      case 'system_detect':
        return {
          id: step.id,
          label: step.label,
          note: dossier.eligibilityStatus === 'eligible_for_test' ? 'Da gom du KPI, gio cong, incident va warning.' : 'He thong phat hien dieu kien chua sach.',
          status: 'done',
        }
      case 'leader_propose':
        return {
          id: step.id,
          label: step.label,
          note: 'Leader da co nhan xet va de xuat huong xu ly.',
          status: 'done',
        }
      case 'test':
        if (dossier.eligibilityStatus !== 'eligible_for_test') {
          return { id: step.id, label: step.label, note: 'Chua duoc vao bai test vi checklist dau vao dang fail.', status: 'blocked' }
        }
        if (testPassed) {
          return { id: step.id, label: step.label, note: 'Da qua bai test theo rule tong diem va san tung phan.', status: 'done' }
        }
        if (testFailed) {
          return { id: step.id, label: step.label, note: 'Lan 1 chua qua, da len lich test lai.', status: 'current' }
        }
        return { id: step.id, label: step.label, note: 'Cho mo bai test nang bac.', status: 'current' }
      case 'ceo_approve':
        if (dossier.eligibilityStatus !== 'eligible_for_test') {
          return { id: step.id, label: step.label, note: 'CEO chua xem challenge khi bai test chua mo.', status: 'upcoming' }
        }
        if (challengeStarted) {
          return { id: step.id, label: step.label, note: 'CEO da phe duyet challenge.', status: 'done' }
        }
        if (testPassed) {
          return { id: step.id, label: step.label, note: 'Cho CEO mo challenge sau khi bai test da dat.', status: 'current' }
        }
        return { id: step.id, label: step.label, note: 'Cho ket qua test roi moi sang buoc nay.', status: 'upcoming' }
      case 'challenge':
        if (!challengeStarted) {
          return {
            id: step.id,
            label: step.label,
            note: testPassed ? 'Cho tao challenge.' : 'Challenge chua mo.',
            status: testPassed ? 'current' : 'upcoming',
          }
        }
        if (challengePassed) {
          return { id: step.id, label: step.label, note: 'Da qua challenge va du moc check-in.', status: 'done' }
        }
        return { id: step.id, label: step.label, note: 'Dang theo doi challenge.', status: 'current' }
      case 'final_review':
        if (challengePassed) {
          return { id: step.id, label: step.label, note: dossier.finalReviewNote, status: 'done' }
        }
        if (challengeStarted) {
          return { id: step.id, label: step.label, note: 'Cho tong ket challenge truoc khi hoi dong chot.', status: 'upcoming' }
        }
        return { id: step.id, label: step.label, note: 'Chua vao final review.', status: 'upcoming' }
      case 'appointment':
        if (dossier.overallStatus === 'ready_for_appointment') {
          return { id: step.id, label: step.label, note: dossier.appointmentNote, status: 'current' }
        }
        if (dossier.overallStatus === 'blocked') {
          return { id: step.id, label: step.label, note: 'Khong mo salary khi ho so dau vao dang bi chan.', status: 'blocked' }
        }
        return { id: step.id, label: step.label, note: 'Chua mo salary decision.', status: 'upcoming' }
      default: {
        const unreachableStep: never = step
        return unreachableStep
      }
    }
  })
}

function buildTestSummary(session: TestSession | null): string {
  if (!session) return 'Chua mo bai test vi checklist dau vao chua dat.'
  if (!session.outcome) return 'Da tao session nhung chua chot diem.'
  if (session.outcome === 'passed') {
    return `Tong ${session.total_score} / nguong ${session.passing_total}. Tat ca phan deu tren san ${session.section_floor}.`
  }
  return `Tong ${session.total_score} / nguong ${session.passing_total}. Co phan duoi san ${session.section_floor}. Test lai: ${formatDate(session.retest_scheduled_for)}.`
}

function buildChallengeSummary(challenge: KpiChallenge | null): string {
  if (!challenge) return 'Chua mo challenge.'
  if (challenge.status === 'passed') {
    return `Da qua challenge ${challenge.duration_label} thang, du ${challenge.required_checkpoints.length} moc check-in.`
  }
  return `Dang o trang thai ${challenge.status}. Da ghi ${challenge.check_ins.length}/${challenge.required_checkpoints.length} moc.`
}

function buildSalarySummary(salary: SalarySuggestion | null, bandLabel: string | null): string {
  if (!salary || !bandLabel) return 'Chua mo de xuat luong.'
  return `${bandLabel}. Goi y ${formatCurrency(salary.recommended)} (${formatCurrency(salary.min)} - ${formatCurrency(salary.max)}).`
}

function formatAverageScore(values: number[]): string {
  if (!values.length) return '-'
  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  return average.toFixed(2)
}

function formatLowestHours(monthlyScores: PromotionEligibilityInput['monthly_scores']): number {
  if (!monthlyScores.length) return 0
  return Math.min(...monthlyScores.map((item) => item.valid_hours))
}

function formatTestOutcome(session: TestSession | null): string {
  if (!session?.outcome) return '-'
  if (session.outcome === 'passed') return 'Dat'
  if (session.outcome === 'failed_section_floor') return 'Truot san'
  return 'Truot tong'
}

function formatTestNote(session: TestSession | null): string {
  if (!session?.outcome) return 'Chua mo bai test'
  if (session.outcome === 'passed') return `Tong ${session.total_score}`
  return session.retest_scheduled_for ? `Hen lai ${formatDate(session.retest_scheduled_for)}` : 'Cho len lich test lai'
}

function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate))
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function stepTone(status: PipelineStepStatus): string {
  switch (status) {
    case 'done':
      return 'border-emerald-100 bg-emerald-50/70'
    case 'current':
      return 'border-blue-100 bg-blue-50/70'
    case 'blocked':
      return 'border-rose-100 bg-rose-50/70'
    default:
      return 'border-gray-100 bg-gray-50/80'
  }
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
  const toneClass = {
    blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    rose: 'border-rose-100 bg-rose-50/70 text-rose-700',
  }[tone]

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</div>
          <div className="mt-2 text-2xl font-bold text-[#001D3D]">{value}</div>
          <div className="mt-1 text-xs text-gray-500">{note}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${toneClass}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function DetailStat({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{title}</div>
      <div className="mt-2 text-lg font-bold text-[#001D3D]">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{note}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: PromotionDossier['overallStatus'] }) {
  const config = {
    ready_for_appointment: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    in_testing: 'border-amber-200 bg-amber-50 text-amber-700',
    blocked: 'border-rose-200 bg-rose-50 text-rose-700',
  }[status]

  const label = {
    ready_for_appointment: 'San sang bo nhiem',
    in_testing: 'Dang xu ly',
    blocked: 'Dang bi chan',
  }[status]

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${config}`}>
      {label}
    </span>
  )
}

function PipelineDot({ status }: { status: PipelineStepStatus }) {
  const config = {
    done: 'bg-emerald-600',
    current: 'bg-blue-600',
    blocked: 'bg-rose-600',
    upcoming: 'bg-gray-300',
  }[status]

  return <span className={`mt-0.5 block h-2.5 w-2.5 rounded-full ${config}`} />
}

function InfoBlock({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-sm font-semibold text-gray-900">{title}</div>
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-600">{body}</div>
    </div>
  )
}

function MiniPanel({ title, body, tone }: { title: string; body: string; tone: 'emerald' | 'amber' | 'blue' | 'gray' }) {
  const toneClass = {
    emerald: 'border-emerald-100 bg-emerald-50/70',
    amber: 'border-amber-100 bg-amber-50/70',
    blue: 'border-blue-100 bg-blue-50/70',
    gray: 'border-gray-100 bg-gray-50/70',
  }[tone]

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <ArrowRight size={14} className="text-[#2F6FA8]" />
        <div className="text-sm font-semibold text-gray-900">{title}</div>
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-600">{body}</div>
    </div>
  )
}

function SidebarPanel({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold text-[#001D3D]">{title}</h2>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs leading-5 text-gray-600">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
