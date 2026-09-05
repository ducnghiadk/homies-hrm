'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ShieldCheck,
  TimerReset,
  TrendingUp,
  Users,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  createChallenge,
  extendChallenge,
  recordChallengeCheckIn,
  stopChallengeForSeriousIncident,
  type ChallengeCheckpoint,
  type KpiChallenge,
} from '@/lib/kpi/challenge-service'

const INITIAL_CHALLENGES: KpiChallenge[] = [
  (() => {
    let challenge = createChallenge({
      development_case_id: 'dev_pt2_to_senior',
      employee_id: 'emp_pt2',
      current_level: 'pt2',
      target_level: 'senior',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })
    challenge = recordChallengeCheckIn(challenge, {
      checkpoint: 'week_2',
      actor_id: 'manager_01',
      note: 'Ban dau da on dinh SOP va toc do ra mon.',
      recorded_at: '2026-09-05T09:00:00.000Z',
    })
    return challenge
  })(),
  (() => {
    let challenge = createChallenge({
      development_case_id: 'dev_senior_to_leader',
      employee_id: 'emp_senior',
      current_level: 'senior',
      target_level: 'shift_leader',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })
    challenge = recordChallengeCheckIn(challenge, {
      checkpoint: 'week_2',
      actor_id: 'area_manager_01',
      note: 'Co tien bo nhung can them thoi gian kem cap.',
      recorded_at: '2026-09-05T09:00:00.000Z',
    })
    challenge = recordChallengeCheckIn(challenge, {
      checkpoint: 'week_4',
      actor_id: 'area_manager_01',
      note: 'Da biet dieu phoi ca nhung van chua deu chat luong.',
      recorded_at: '2026-09-19T09:00:00.000Z',
    })
    challenge = extendChallenge(challenge, {
      actor_id: 'ceo_01',
      reason: 'Gia han 1 lan de theo doi kha nang kem cap thuc te.',
      recorded_at: '2026-10-22T09:00:00.000Z',
    })
    return challenge
  })(),
  (() => {
    const challenge = createChallenge({
      development_case_id: 'dev_stop_incident',
      employee_id: 'emp_shift_candidate',
      current_level: 'senior',
      target_level: 'shift_leader',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })
    return stopChallengeForSeriousIncident(challenge, {
      actor_id: 'ceo_01',
      incident_id: 'incident_critical_01',
      note: 'Dung challenge do co su co nghiem trong trong ca.',
      recorded_at: '2026-09-02T09:00:00.000Z',
    })
  })(),
]

const EMPLOYEE_LABELS: Record<string, string> = {
  emp_pt2: 'Nguyen Minh Quan',
  emp_senior: 'Tran Hoang Mai',
  emp_shift_candidate: 'Le Gia Han',
}

const LEVEL_LABELS: Record<string, string> = {
  pt2: 'PT2',
  senior: 'Senior',
  shift_leader: 'Shift Leader',
}

export default function PromotionChallengesPage() {
  const [selectedId, setSelectedId] = useState(INITIAL_CHALLENGES[0]?.id ?? '')
  const challenges = INITIAL_CHALLENGES
  const selectedChallenge = challenges.find((item) => item.id === selectedId) ?? challenges[0] ?? null

  const summary = useMemo(() => ({
    active: challenges.filter((item) => item.status === 'active').length,
    extended: challenges.filter((item) => item.status === 'extended_once').length,
    stopped: challenges.filter((item) => item.status === 'stopped_for_serious_incident').length,
    checkpoints: challenges.reduce((sum, item) => sum + item.check_ins.length, 0),
  }), [challenges])

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
              <span className="font-bold text-[#2F6FA8]">Challenge timeline</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                Theo doi thu thach va bo nhiem
              </h1>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Mốc tuần 2 / 4 / cuối kỳ
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Challenge chỉ được gia hạn 1 lần. Nếu có incident nghiêm trọng thì dừng ngay và trả hồ sơ về hàng CEO.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/kpi/development/tests"
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft size={14} />
              <span>Ve bai test</span>
            </Link>
            <button
              type="button"
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <ShieldCheck size={14} />
              <span>Gui CEO quyet dinh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-4">
          <MacroCard title="Dang challenge" value={`${summary.active}`} note="Can theo doi tiep" icon={<TrendingUp size={16} />} tone="blue" />
          <MacroCard title="Da gia han" value={`${summary.extended}`} note="Moi ho so toi da 1 lan" icon={<TimerReset size={16} />} tone="amber" />
          <MacroCard title="Dung vi incident" value={`${summary.stopped}`} note="CEO can quyet dinh tiep" icon={<AlertTriangle size={16} />} tone="rose" />
          <MacroCard title="Check-in da ghi" value={`${summary.checkpoints}`} note="Tong moc da cap nhat" icon={<Users size={16} />} tone="emerald" />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                <Clock3 size={14} className="text-[#2F6FA8]" />
                <span>Timeline ho so challenge</span>
              </h2>
              <span className="text-xs font-medium text-gray-500">Bam tung dong de xem chi tiet</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80 font-bold text-gray-600">
                      <th className="px-4 py-3 text-[#001D3D]">Nhan su</th>
                      <th className="px-3 py-3 text-center">Tuyen</th>
                      <th className="px-3 py-3 text-center">Thoi luong</th>
                      <th className="px-3 py-3 text-center">Trang thai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {challenges.map((challenge) => {
                      const isSelected = challenge.id === selectedChallenge?.id
                      return (
                        <tr
                          key={challenge.id}
                          onClick={() => setSelectedId(challenge.id)}
                          className={isSelected ? 'cursor-pointer bg-blue-50/50' : 'cursor-pointer transition hover:bg-blue-50/30'}
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-gray-900">{EMPLOYEE_LABELS[challenge.employee_id] ?? challenge.employee_id}</div>
                            <div className="text-[11px] font-medium text-gray-500">{challenge.development_case_id}</div>
                          </td>
                          <td className="px-3 py-3.5 text-center font-bold text-gray-700">
                            {LEVEL_LABELS[challenge.current_level]} {'->'} {LEVEL_LABELS[challenge.target_level]}
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono font-bold tabular-nums text-[#001D3D]">
                            {challenge.duration_label} thang
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <ChallengeBadge status={challenge.status} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedChallenge ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#001D3D]">{EMPLOYEE_LABELS[selectedChallenge.employee_id] ?? selectedChallenge.employee_id}</div>
                    <div className="text-xs font-medium text-gray-500">
                      {LEVEL_LABELS[selectedChallenge.current_level]} {'->'} {LEVEL_LABELS[selectedChallenge.target_level]}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Challenge {selectedChallenge.duration_label} thang
                    </span>
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Gia han: {selectedChallenge.extension_count}/1
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  {selectedChallenge.required_checkpoints.map((checkpoint) => {
                    const checkIn = selectedChallenge.check_ins.find((item) => item.checkpoint === checkpoint)
                    return (
                      <div key={checkpoint} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-gray-800">{formatCheckpointLabel(checkpoint)}</div>
                          {checkIn ? (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          ) : (
                            <Clock3 size={16} className="text-amber-600" />
                          )}
                        </div>
                        <div className="mt-2 text-[11px] font-medium text-gray-500">
                          {checkIn ? `${formatDateTime(checkIn.recorded_at)} • ${checkIn.actor_id}` : 'Chua co ghi nhan'}
                        </div>
                        <div className="mt-3 text-xs text-gray-600">
                          {checkIn?.note ?? 'Cho nguoi theo doi cap nhat ket qua moc nay.'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">Quyet dinh hien tai</div>
              {selectedChallenge ? (
                <div className="mt-4 space-y-3">
                  <InfoRow label="Trang thai" value={formatChallengeStatus(selectedChallenge.status)} />
                  <InfoRow label="Nguoi duyet" value={selectedChallenge.approved_by} />
                  <InfoRow label="Dung vi incident" value={selectedChallenge.stop_incident_id ?? 'Khong co'} />
                  <InfoRow label="Return level" value={selectedChallenge.return_to_level ? LEVEL_LABELS[selectedChallenge.return_to_level] : '--'} />
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">Rule challenge</div>
              <div className="mt-4 space-y-3 text-xs text-gray-600">
                <RuleCard title="Check-in bat buoc">
                  Tuan 2, tuan 4, va cuoi ky. Route 1 thang bo qua moc tuan 4.
                </RuleCard>
                <RuleCard title="Gia han 1 lan">
                  Neu can theo doi them, CEO duoc gia han duy nhat 1 lan va phai ghi ro ly do.
                </RuleCard>
                <RuleCard title="Dung ngay neu co incident">
                  Ho so bi dung ngay khi co incident nghiem trong. Khong cho tiep tuc challenge.
                </RuleCard>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">Timeline ghi chu</div>
              <div className="mt-4 space-y-3">
                {selectedChallenge?.check_ins.map((item) => (
                  <div key={`${selectedChallenge.id}_${item.checkpoint}`} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                    <div className="text-xs font-bold text-gray-800">{formatCheckpointLabel(item.checkpoint)}</div>
                    <div className="mt-1 text-[11px] font-medium text-gray-500">
                      {formatDateTime(item.recorded_at)} • {item.actor_id}
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{item.note}</div>
                  </div>
                ))}

                {selectedChallenge?.status === 'extended_once' ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    {selectedChallenge.extension_reason}
                  </div>
                ) : null}

                {selectedChallenge?.status === 'stopped_for_serious_incident' ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    {selectedChallenge.final_decision_note}
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

function MacroCard({ title, value, note, icon, tone }: {
  title: string
  value: string
  note: string
  icon: ReactNode
  tone: 'blue' | 'amber' | 'rose' | 'emerald'
}) {
  const toneMap = {
    blue: 'bg-blue-50 text-[#2F6FA8] border-blue-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
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

function ChallengeBadge({ status }: { status: KpiChallenge['status'] }) {
  if (status === 'active') {
    return <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2F6FA8]">Dang theo doi</span>
  }
  if (status === 'extended_once') {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">Da gia han</span>
  }
  if (status === 'stopped_for_serious_incident') {
    return <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">Dung ngay</span>
  }
  if (status === 'passed') {
    return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Dat</span>
  }
  return <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">That bai</span>
}

function RuleCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <div className="font-bold text-gray-800">{title}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="font-medium text-gray-500">{label}</span>
      <span className="font-mono font-bold tabular-nums text-[#001D3D]">{value}</span>
    </div>
  )
}

function formatCheckpointLabel(checkpoint: ChallengeCheckpoint): string {
  if (checkpoint === 'week_2') return 'Check-in tuan 2'
  if (checkpoint === 'week_4') return 'Check-in tuan 4'
  return 'Tong ket cuoi ky'
}

function formatChallengeStatus(status: KpiChallenge['status']): string {
  if (status === 'active') return 'Dang challenge'
  if (status === 'extended_once') return 'Da gia han 1 lan'
  if (status === 'stopped_for_serious_incident') return 'Dung vi incident nghiem trong'
  if (status === 'passed') return 'Dat va cho bo nhiem'
  if (status === 'approved') return 'Da duyet'
  return 'Khong dat, quay ve cap cu'
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}/${month}/${year}`
}
