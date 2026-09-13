'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Building2,
  FileSpreadsheet,
  LoaderCircle,
  ShieldAlert,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'

import AppShell from '@/components/layout/AppShell'
import { getKpiReportSnapshot, type KpiReportSnapshot } from '@/lib/kpi/report-service'
import type { KpiActor } from '@/lib/kpi/types'
import { useAuthStore } from '@/store/auth-store'

type ReportTab = 'trend' | 'risk' | 'pipeline' | 'leaderboard'

const TAB_OPTIONS: Array<{
  key: ReportTab
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
}> = [
  { key: 'trend', label: 'Xu huong', icon: TrendingUp },
  { key: 'risk', label: 'Rui ro', icon: ShieldAlert },
  { key: 'pipeline', label: 'Thang tien', icon: Briefcase },
  { key: 'leaderboard', label: 'Xep hang', icon: Trophy },
]

export default function ReportsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<ReportTab>('trend')
  const [report, setReport] = useState<KpiReportSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/reports')
    }
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    if (!hasHydrated || !user) return

    let cancelled = false

    getKpiReportSnapshot({
      actor: mapUserToActor(user),
      now: new Date().toISOString(),
    })
      .then((snapshot) => {
        if (!cancelled) {
          setReport(snapshot)
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Khong tai duoc bao cao KPI')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [hasHydrated, user])

  const exportRows = useMemo(() => {
    if (!report) return ''

    const rows: string[][] = [
      ['KPI Report', report.month],
      [],
      ['Macro cards'],
      ['id', 'label', 'value', 'helper'],
      ...report.macro_cards.map((item) => [item.id, item.label, item.value, item.helper]),
      [],
      ['Monthly trend'],
      ['month', 'average_score', 'evaluation_count', 'risk_count'],
      ...report.trend.months.map((item) => [
        item.month,
        item.average_score.toString(),
        item.evaluation_count.toString(),
        item.risk_count.toString(),
      ]),
      [],
      ['Risk list'],
      ['employee_id', 'store_id', 'level_code', 'total_score', 'incident_count', 'open_appeals', 'reason_tags'],
      ...report.risk_list.map((item) => [
        item.employee_id,
        item.store_id,
        item.level_code,
        item.total_score.toString(),
        item.incident_count.toString(),
        item.open_appeals.toString(),
        item.reason_tags.join(' | '),
      ]),
      [],
      ['Promotion pipeline'],
      ['id', 'employee_id', 'store_id', 'current_level', 'target_level', 'status', 'latest_score'],
      ...report.promotion_pipeline.cases.map((item) => [
        item.id,
        item.employee_id,
        item.store_id,
        item.current_level,
        item.target_level,
        item.status,
        item.latest_score?.toString() ?? '',
      ]),
      [],
      ['Leaderboard'],
      ['rank', 'employee_id', 'store_id', 'level_code', 'total_score', 'grade_code', 'delta_from_previous'],
      ...report.leaderboard.map((item) => [
        item.rank.toString(),
        item.employee_id,
        item.store_id,
        item.level_code,
        item.total_score.toString(),
        item.grade_code ?? '',
        item.delta_from_previous.toString(),
      ]),
    ]

    return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
  }, [report])

  if (!hasHydrated || !user) return null

  const monthLabel = report ? formatMonthLabel(report.month) : 'Dang tai'

  return (
    <AppShell showNav className="min-h-screen bg-[#F4F6F8]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>HRM Homies</span>
            <span>/</span>
            <Link href="/kpi" className="transition hover:text-[#2F6FA8]">
              KPI
            </Link>
            <span>/</span>
            <span className="text-[#2F6FA8]">Bao cao</span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-900">Bao cao KPI da scope theo quyen</h1>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {monthLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <Building2 size={16} className="text-[#2F6FA8]" />
                  {report ? `${report.scope.store_ids.length} cua hang` : 'Dang tinh scope'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users size={16} className="text-emerald-600" />
                  {report ? `${report.scope.employee_ids.length} nhan su` : 'Dang tai nhan su'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportReportCsv(exportRows, report?.month)}
                disabled={!report}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileSpreadsheet size={16} className="text-[#2F6FA8]" />
                <span>Xuat bao cao</span>
              </button>

              <Link
                href="/kpi"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                <span>Ve hub KPI</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <section className="flex min-h-[320px] items-center justify-center border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <LoaderCircle size={18} className="animate-spin text-[#2F6FA8]" />
              <span>Dang tong hop bao cao KPI...</span>
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {error}
          </section>
        )}

        {!loading && report && (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {report.macro_cards.map((item) => (
                <article key={item.id} className="border border-slate-200 bg-white px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    {item.label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</div>
                  <div className={`mt-2 text-sm ${
                    item.tone === 'warning'
                      ? 'text-amber-700'
                      : item.tone === 'good'
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                  }`}>
                    {item.helper}
                  </div>
                </article>
              ))}
            </section>

            <section className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {TAB_OPTIONS.map((item) => {
                const Icon = item.icon
                const active = tab === item.key

                return (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                      active
                        ? 'border-[#2F6FA8] bg-[#EAF3FB] text-[#2F6FA8]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {tab === 'trend' && <TrendTab report={report} />}
                {tab === 'risk' && <RiskTab report={report} />}
                {tab === 'pipeline' && <PipelineTab report={report} />}
                {tab === 'leaderboard' && <LeaderboardTab report={report} />}
              </div>

              <aside className="space-y-6">
                <section className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">Insight nhanh</h2>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    {report.insights.map((item) => (
                      <article key={item.id} className="border border-slate-200 px-3 py-3">
                        <div className={`text-xs font-semibold uppercase tracking-[0.08em] ${
                          item.tone === 'warning'
                            ? 'text-amber-700'
                            : item.tone === 'good'
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                        }`}>
                          {item.title}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{item.body}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">SLA khiu nai</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-slate-200">
                    {[
                      ['Dang mo', report.appeal_sla.open_count],
                      ['Sap den han', report.appeal_sla.near_deadline_count],
                      ['Qua han', report.appeal_sla.overdue_count],
                      ['Da ket luan', report.appeal_sla.resolved_count],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-white px-4 py-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
                        <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">Lap lai su co</h2>
                  </div>
                  <div className="px-4 py-4">
                    {report.incident_recurrence.length === 0 ? (
                      <p className="text-sm text-slate-500">Khong co nhan su lap lai su co trong ky nay.</p>
                    ) : (
                      <div className="space-y-3">
                        {report.incident_recurrence.map((item) => (
                          <article key={item.employee_id} className="border border-slate-200 px-3 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{item.employee_id}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {item.store_id} • {item.primary_code}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-amber-700">{item.repeat_count} lan</div>
                                <div className="text-xs text-slate-500">{formatDateTime(item.latest_occurred_at)}</div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </aside>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

function TrendTab({ report }: { report: KpiReportSnapshot }) {
  return (
    <div className="space-y-6">
      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Xu huong theo thang</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Ky</th>
                <th className="px-4 py-3">Diem TB</th>
                <th className="px-4 py-3">So nhan su</th>
                <th className="px-4 py-3">Can theo sat</th>
              </tr>
            </thead>
            <tbody>
              {report.trend.months.map((item) => (
                <tr key={item.month} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-900">{formatMonthLabel(item.month)}</td>
                  <td className="px-4 py-3 text-slate-700">{item.average_score.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700">{item.evaluation_count}</td>
                  <td className="px-4 py-3 text-slate-700">{item.risk_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <BreakdownPanel
          title="Theo cua hang"
          rows={report.trend.stores.map((item) => ({
            label: item.store_id,
            value: `${item.average_score.toFixed(2)} / 5`,
            helper: `${item.evaluation_count} nhan su • ${item.risk_count} can theo sat`,
          }))}
        />
        <BreakdownPanel
          title="Theo cap bac"
          rows={report.trend.levels.map((item) => ({
            label: item.level_code,
            value: `${item.average_score.toFixed(2)} / 5`,
            helper: `${item.evaluation_count} nhan su`,
          }))}
        />
      </section>

      <BreakdownPanel
        title="Theo nhom tieu chi"
        rows={report.trend.groups.map((item) => ({
          label: item.group_name,
          value: `${item.average_score.toFixed(2)} / 5`,
          helper: `${item.evaluation_count} diem thanh phan • ${item.tag}`,
        }))}
      />
    </div>
  )
}

function RiskTab({ report }: { report: KpiReportSnapshot }) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Danh sach nhan su can theo sat</h2>
      </div>
      <div className="space-y-3 px-4 py-4">
        {report.risk_list.length === 0 ? (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            Khong co nhan su nao dang roi vao nhom canh bao trong ky nay.
          </div>
        ) : (
          report.risk_list.map((item) => (
            <article key={item.employee_id} className="border border-slate-200 px-4 py-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{item.employee_id}</span>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      {item.level_code}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {item.store_id}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.reason_tags.map((reason) => (
                      <span key={reason} className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid min-w-[240px] grid-cols-3 gap-3">
                  <StatPill label="Diem" value={item.total_score.toFixed(2)} tone="warning" />
                  <StatPill label="Su co" value={`${item.incident_count}`} tone="neutral" />
                  <StatPill label="Khieu nai" value={`${item.open_appeals}`} tone="neutral" />
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

function PipelineTab({ report }: { report: KpiReportSnapshot }) {
  return (
    <div className="space-y-6">
      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Phan bo trang thai thang tien</h2>
        </div>
        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
          {report.promotion_pipeline.status_counts.map((item) => (
            <article key={item.status} className="border border-slate-200 px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{item.status}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{item.count}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Danh sach ho so dang mo</h2>
        </div>
        <div className="space-y-3 px-4 py-4">
          {report.promotion_pipeline.cases.map((item) => (
            <article key={item.id} className="border border-slate-200 px-4 py-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{item.employee_id}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {item.store_id}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {item.current_level} <ArrowUpRight className="mx-1 inline-block" size={14} /> {item.target_level}
                  </div>
                </div>

                <div className="grid min-w-[260px] grid-cols-2 gap-3">
                  <StatPill label="Trang thai" value={item.status} tone="neutral" />
                  <StatPill label="Diem gan nhat" value={item.latest_score?.toFixed(2) ?? '-'} tone="good" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function LeaderboardTab({ report }: { report: KpiReportSnapshot }) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Top nhan su theo KPI hien tai</h2>
      </div>
      <div className="space-y-3 px-4 py-4">
        {report.leaderboard.map((item) => (
          <article key={item.employee_id} className="border border-slate-200 px-4 py-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-700">
                  #{item.rank}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{item.employee_id}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {item.store_id}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-[#2F6FA8]">
                      {item.level_code}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {item.grade_code ?? 'chua xep loai'} • chenhlech ky truoc {formatSigned(item.delta_from_previous)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-semibold text-slate-900">{item.total_score.toFixed(2)}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">/ 5</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function BreakdownPanel({
  title,
  rows,
}: {
  title: string
  rows: Array<{ label: string; value: string; helper: string }>
}) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3 px-4 py-4">
        {rows.map((row) => (
          <article key={`${title}_${row.label}`} className="flex items-start justify-between gap-4 border border-slate-200 px-3 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">{row.label}</div>
              <div className="mt-1 text-sm text-slate-500">{row.helper}</div>
            </div>
            <div className="text-right text-sm font-semibold text-slate-900">{row.value}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'neutral' | 'good' | 'warning'
}) {
  return (
    <div className={`border px-3 py-3 ${
      tone === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'good'
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-slate-50'
    }`}>
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function mapUserToActor(user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>): KpiActor {
  return {
    id: user.id,
    role: user.role,
    store_id: user.store_id,
  }
}

function formatMonthLabel(month: string): string {
  const [year, monthValue] = month.split('-')
  return `Thang ${monthValue}/${year}`
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatSigned(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}`
}

function exportReportCsv(content: string, month?: string) {
  if (!content || typeof window === 'undefined') return

  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `homies-kpi-report-${month ?? 'latest'}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value: string) {
  const normalized = value.replaceAll('"', '""')
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized
}
