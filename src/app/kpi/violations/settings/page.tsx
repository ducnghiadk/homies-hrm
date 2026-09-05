'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  Lock,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'

type IncidentPolicyVersionStatus = 'published' | 'draft'

type IncidentPolicyRule = {
  code: string
  label: string
  severity: 'normal' | 'serious' | 'critical'
  evidence_required: boolean
  manager_accountability_allowed: boolean
  criterion_mapping: string
  promotion_block_months: number
}

type IncidentPolicyVersion = {
  id: string
  name: string
  status: IncidentPolicyVersionStatus
  effective_from: string
  created_at: string
  published_at?: string
  rules: IncidentPolicyRule[]
}

const PUBLISHED_VERSION: IncidentPolicyVersion = {
  id: 'incident_policy_2026_08_v1',
  name: 'Incident policy thang 08/2026',
  status: 'published',
  effective_from: '2026-08-01',
  created_at: '2026-08-01T08:00:00.000Z',
  published_at: '2026-08-01T09:00:00.000Z',
  rules: [
    {
      code: 'attendance_late',
      label: 'Di tre / cham gio tre',
      severity: 'normal',
      evidence_required: true,
      manager_accountability_allowed: false,
      criterion_mapping: 'discipline_execution',
      promotion_block_months: 0,
    },
    {
      code: 'attendance_no_show',
      label: 'Bo ca / vang mat khong bao',
      severity: 'critical',
      evidence_required: true,
      manager_accountability_allowed: true,
      criterion_mapping: 'discipline_execution',
      promotion_block_months: 3,
    },
    {
      code: 'wrong_topping',
      label: 'Sai topping / sai thanh pham',
      severity: 'serious',
      evidence_required: true,
      manager_accountability_allowed: false,
      criterion_mapping: 'operations_accuracy',
      promotion_block_months: 1,
    },
    {
      code: 'cash_shortage',
      label: 'Thieu tien / sai ket ca',
      severity: 'serious',
      evidence_required: true,
      manager_accountability_allowed: true,
      criterion_mapping: 'discipline_execution',
      promotion_block_months: 2,
    },
  ],
}

export default function ViolationSettingsPage() {
  const { user } = useAuthStore()
  const [versions, setVersions] = useState<IncidentPolicyVersion[]>([
    PUBLISHED_VERSION,
    {
      id: 'incident_policy_2026_09_v2',
      name: 'Incident policy thang 09/2026',
      status: 'draft',
      effective_from: '2026-09-01',
      created_at: '2026-08-22T10:30:00.000Z',
      rules: structuredClone(PUBLISHED_VERSION.rules),
    },
  ])
  const [selectedVersionId, setSelectedVersionId] = useState('incident_policy_2026_09_v2')
  const [savedToast, setSavedToast] = useState('')
  const [draftCounter, setDraftCounter] = useState(1)

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) ?? versions[0],
    [selectedVersionId, versions]
  )

  const isReadOnly = selectedVersion.status === 'published'
  const canAccess = ['ceo', 'hr_admin', 'area_manager'].includes(user?.role ?? '')

  if (!user || !canAccess) {
    return null
  }

  function updateRule(code: string, patch: Partial<IncidentPolicyRule>) {
    setVersions((current) => current.map((version) => (
      version.id === selectedVersion.id
        ? {
            ...version,
            rules: version.rules.map((rule) => (
              rule.code === code ? { ...rule, ...patch } : rule
            )),
          }
        : version
    )))
  }

  function addDraftFromPublished() {
    const published = versions.find((version) => version.status === 'published')
    if (!published) return

    const nextId = `incident_policy_2026_08_draft_${draftCounter}`
    const nextDraft: IncidentPolicyVersion = {
      id: nextId,
      name: `${published.name} - draft moi`,
      status: 'draft',
      effective_from: '2026-10-01',
      created_at: new Date().toISOString(),
      rules: structuredClone(published.rules),
    }

    setVersions((current) => [published, nextDraft, ...current.filter((version) => version.id !== published.id)])
    setSelectedVersionId(nextId)
    setDraftCounter((current) => current + 1)
    pulseToast('Da tao draft moi tu ban published')
  }

  function publishDraft() {
    setVersions((current) => current.map((version) => {
      if (version.id === selectedVersion.id) {
        return {
          ...version,
          status: 'published',
          published_at: '2026-08-22T11:00:00.000Z',
        }
      }

      if (version.status === 'published') {
        return {
          ...version,
          status: 'draft',
          published_at: undefined,
        }
      }

      return version
    }))
    pulseToast('Da publish policy moi. Ban cu khong con sua truc tiep.')
  }

  function pulseToast(message: string) {
    setSavedToast(message)
    window.setTimeout(() => setSavedToast(''), 2800)
  }

  return (
    <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
      <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3.5 shadow-2xs sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/kpi/violations" className="transition hover:text-[#2F6FA8]">Ho so su co</Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="font-bold text-[#2F6FA8]">Incident policy</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                Cai dat policy su co versioned
              </h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#2F6FA8]">
                Published khong sua truc tiep
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Hom nay la Thu Bay, 22/08/2026. Moi thay doi incident policy can di qua draft moi roi moi publish.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/kpi/violations"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50"
            >
              <ArrowLeft size={14} />
              <span>Ve ho so su co</span>
            </Link>

            <button
              type="button"
              onClick={addDraftFromPublished}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50"
            >
              <Plus size={14} className="text-[#2F6FA8]" />
              <span>Tao draft moi</span>
            </button>

            {!isReadOnly ? (
              <button
                type="button"
                onClick={publishDraft}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#245781]"
              >
                <Sparkles size={14} />
                <span>Publish policy</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="w-full space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        {savedToast ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
            {savedToast}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <MetricCard label="Tong version" value={String(versions.length)} note="Published + draft" />
          <MetricCard label="Version dang xem" value={selectedVersion.status} note={selectedVersion.name} />
          <MetricCard label="Rule co evidence bat buoc" value={String(selectedVersion.rules.filter((rule) => rule.evidence_required).length)} note="Ap dung truoc khi xac nhan incident" />
          <MetricCard label="Rule cho lien doi leader" value={String(selectedVersion.rules.filter((rule) => rule.manager_accountability_allowed).length)} note="Khong bat mac dinh" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <FileCheck size={15} className="text-[#2F6FA8]" />
              <h2 className="text-sm font-bold text-[#001D3D]">Danh sach version</h2>
            </div>

            <div className="mt-4 space-y-2">
              {versions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    selectedVersionId === version.id
                      ? 'border-[#2F6FA8] bg-blue-50/50'
                      : 'border-gray-100 bg-gray-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-gray-900">{version.name}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      version.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {version.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Hieu luc tu {version.effective_from} • Tao luc {formatDateTime(version.created_at)}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white shadow-xs">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#001D3D]">{selectedVersion.name}</h2>
                  <div className="mt-1 text-xs text-gray-500">
                    {isReadOnly
                      ? 'Ban published dang khoa chinh sua. Muon doi policy, hay tao draft moi.'
                      : 'Day la draft. Admin co the doi rule roi publish thanh version moi.'}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700">
                  {isReadOnly ? <Lock size={13} className="text-amber-700" /> : <Save size={13} className="text-[#2F6FA8]" />}
                  <span>{isReadOnly ? 'Read only' : 'Draft editable'}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Ma loi</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Muc do</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Evidence</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Criterion map</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Lien doi leader</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Chan thang bac</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedVersion.rules.map((rule) => (
                    <tr key={rule.code}>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-bold text-gray-900">{rule.label}</div>
                        <div className="mt-1 text-[11px] text-gray-500">{rule.code}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <select
                          disabled={isReadOnly}
                          value={rule.severity}
                          onChange={(event) => updateRule(rule.code, { severity: event.target.value as IncidentPolicyRule['severity'] })}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none disabled:bg-gray-50"
                        >
                          <option value="normal">normal</option>
                          <option value="serious">serious</option>
                          <option value="critical">critical</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={rule.evidence_required}
                            onChange={(event) => updateRule(rule.code, { evidence_required: event.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span>Bat buoc</span>
                        </label>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <select
                          disabled={isReadOnly}
                          value={rule.criterion_mapping}
                          onChange={(event) => updateRule(rule.code, { criterion_mapping: event.target.value })}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none disabled:bg-gray-50"
                        >
                          <option value="discipline_execution">discipline_execution</option>
                          <option value="operations_accuracy">operations_accuracy</option>
                          <option value="customer_feedback">customer_feedback</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={rule.manager_accountability_allowed}
                            onChange={(event) => updateRule(rule.code, { manager_accountability_allowed: event.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span>Cho phep</span>
                        </label>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <input
                          type="number"
                          min={0}
                          disabled={isReadOnly}
                          value={rule.promotion_block_months}
                          onChange={(event) => updateRule(rule.code, { promotion_block_months: Number(event.target.value) })}
                          className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none disabled:bg-gray-50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-gray-50 px-4 py-4 md:grid-cols-3">
              <PolicyHint
                icon={<ShieldAlert size={14} className="text-rose-700" />}
                title="Evidence la bat buoc"
                note="Neu bat evidence_required, incident chua co bang chung se khong nen chot."
              />
              <PolicyHint
                icon={<Sparkles size={14} className="text-amber-700" />}
                title="Khong lien doi leader mac dinh"
                note="Phai bat tung ma loi, va khi appeal quyet dinh van can ly do + bang chung rieng."
              />
              <PolicyHint
                icon={<CheckCircle2 size={14} className="text-emerald-700" />}
                title="Versioned policy"
                note="Ban published khoa lai. Moi sua doi tao draft moi de tranh lam lech ky dang chay."
              />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-2xs">
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <div className="mt-2 text-2xl font-bold text-[#001D3D]">{value}</div>
      <div className="mt-2 text-[11px] text-gray-500">{note}</div>
    </div>
  )
}

function PolicyHint({
  icon,
  title,
  note,
}: {
  icon: ReactNode
  title: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-3 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-2 text-xs text-gray-600">{note}</div>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN')
}
