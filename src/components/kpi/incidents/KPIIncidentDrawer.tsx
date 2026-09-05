'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  Plus,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'
import {
  addSecondaryViolation,
  calculateIncidentImpact,
  createIncident,
  type CreateIncidentInput,
  type KpiIncidentImpact,
  type KpiIncidentPolicy,
  type SecondaryViolationInput,
} from '@/lib/kpi/incident-service'
import type { KpiActor, KpiIncident } from '@/lib/kpi/types'

export interface KPIIncidentOption {
  id: string
  label: string
  note?: string
}

export interface KPIIncidentViolationOption {
  code: string
  label: string
  note: string
}

interface KPIIncidentDrawerProps {
  open: boolean
  mode: 'create' | 'detail'
  actor: KpiActor
  incident: KpiIncident | null
  initialStoreId?: string
  stores: KPIIncidentOption[]
  employees: KPIIncidentOption[]
  violationOptions: KPIIncidentViolationOption[]
  policy: KpiIncidentPolicy
  onClose: () => void
  onSubmit: (payload: { incident: KpiIncident; impact: KpiIncidentImpact }) => Promise<void> | void
}

const DEFAULT_CREATE_INPUT: CreateIncidentInput = {
  store_id: '',
  employee_id: '',
  occurred_at: '',
  source: 'operation',
  primary_violation_code: '',
  description: '',
  evidence_refs: [],
}

const DEFAULT_SECONDARY: SecondaryViolationInput = {
  code: '',
  independent_behavior: false,
  reason: '',
  evidence_refs: [],
}

export default function KPIIncidentDrawer({
  open,
  mode,
  actor,
  incident,
  initialStoreId,
  stores,
  employees,
  violationOptions,
  policy,
  onClose,
  onSubmit,
}: KPIIncidentDrawerProps) {
  const [createInput, setCreateInput] = useState<CreateIncidentInput>(DEFAULT_CREATE_INPUT)
  const [secondaryDraft, setSecondaryDraft] = useState<SecondaryViolationInput>(DEFAULT_SECONDARY)
  const [secondaryList, setSecondaryList] = useState<SecondaryViolationInput[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open || mode !== 'create') return

    setCreateInput({
      ...DEFAULT_CREATE_INPUT,
      store_id: initialStoreId ?? stores[0]?.id ?? '',
      occurred_at: new Date().toISOString().slice(0, 16),
    })
    setSecondaryDraft(DEFAULT_SECONDARY)
    setSecondaryList([])
    setErrorMessage(null)
  }, [initialStoreId, mode, open, stores])

  const preview = useMemo(() => {
    if (mode !== 'create') return null
    if (!createInput.store_id || !createInput.employee_id || !createInput.primary_violation_code || !createInput.description.trim()) {
      return null
    }

    const evidenceRefs = createInput.evidence_refs
    if (evidenceRefs.length === 0) {
      return null
    }

    try {
      let nextIncident = createIncident(createInput, actor)

      for (const secondary of secondaryList) {
        nextIncident = addSecondaryViolation(nextIncident, secondary)
      }

      return {
        incident: nextIncident,
        impact: calculateIncidentImpact(nextIncident, policy),
      }
    } catch {
      return null
    }
  }, [actor, createInput, mode, policy, secondaryList])

  if (!open) return null

  async function handleAddSecondary() {
    setErrorMessage(null)

    try {
      let baseIncident = createIncident({
        ...createInput,
        evidence_refs: createInput.evidence_refs,
      }, actor)

      for (const item of secondaryList) {
        baseIncident = addSecondaryViolation(baseIncident, item)
      }

      addSecondaryViolation(baseIncident, secondaryDraft)

      setSecondaryList((current) => [...current, normalizeSecondaryInput(secondaryDraft)])
      setSecondaryDraft(DEFAULT_SECONDARY)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the them loi phu')
    }
  }

  async function handleSubmit() {
    setErrorMessage(null)

    try {
      let nextIncident = createIncident(createInput, actor)

      for (const secondary of secondaryList) {
        nextIncident = addSecondaryViolation(nextIncident, secondary)
      }

      const impact = calculateIncidentImpact(nextIncident, policy)

      setIsSaving(true)
      await onSubmit({ incident: nextIncident, impact })
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the tao ho so su co')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#001D3D]/25 backdrop-blur-[1px]">
      <div className="h-full w-full max-w-3xl overflow-y-auto border-l border-gray-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <ShieldAlert size={14} className="text-rose-600" />
                <span>{mode === 'create' ? 'Tao ho so su co' : 'Chi tiet ho so su co'}</span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-[#001D3D]">
                {mode === 'create' ? 'Ho so su co van hanh / ky luat' : 'Ho so su co da ghi nhan'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {mode === 'detail' && incident ? (
          <div className="space-y-5 p-5">
            <DetailBlock title="Thong tin chung" icon={<ClipboardList size={15} className="text-[#2F6FA8]" />}>
              <DetailRow label="Ma ho so" value={incident.id} />
              <DetailRow label="Thoi gian" value={formatDateTime(incident.occurred_at)} />
              <DetailRow label="Nguon" value={incident.source} />
              <DetailRow label="Trang thai" value={incident.status} />
              <DetailRow label="Mo ta" value={incident.description} />
            </DetailBlock>

            <DetailBlock title="Loi goc va loi phu" icon={<AlertTriangle size={15} className="text-amber-700" />}>
              {incident.violations.map((violation) => (
                <div key={`${violation.code}-${violation.reason}`} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-gray-900">{violation.code}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${violation.primary ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-[#2F6FA8]'}`}>
                      {violation.primary ? 'Loi goc' : 'Loi phu doc lap'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">{violation.reason}</div>
                  <div className="mt-2 text-[11px] text-gray-500">Bang chung: {violation.evidence_refs.join(', ') || 'Chua co du lieu'}</div>
                </div>
              ))}
            </DetailBlock>
          </div>
        ) : (
          <div className="space-y-5 p-5">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Thoi gian su co" icon={<Calendar size={14} className="text-gray-400" />}>
                <input
                  type="datetime-local"
                  value={createInput.occurred_at}
                  onChange={(event) => setCreateInput((current) => ({ ...current, occurred_at: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                />
              </Field>

              <Field label="Cua hang / ca">
                <select
                  value={createInput.store_id}
                  onChange={(event) => setCreateInput((current) => ({ ...current, store_id: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                >
                  <option value="">Chon cua hang</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Nhan vien lien quan">
                <select
                  value={createInput.employee_id}
                  onChange={(event) => setCreateInput((current) => ({ ...current, employee_id: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                >
                  <option value="">Chon nhan vien</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Nguon ghi nhan">
                <select
                  value={createInput.source}
                  onChange={(event) => setCreateInput((current) => ({ ...current, source: event.target.value as CreateIncidentInput['source'] }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                >
                  <option value="operation">Van hanh cua hang</option>
                  <option value="attendance">Cham cong</option>
                  <option value="customer">Khach hang</option>
                  <option value="food_app">App giao hang</option>
                  <option value="other">Khac</option>
                </select>
              </Field>
            </section>

            <Field label="Loi goc / nguyen nhan chinh">
              <select
                value={createInput.primary_violation_code}
                onChange={(event) => setCreateInput((current) => ({ ...current, primary_violation_code: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
              >
                <option value="">Chon loi goc</option>
                {violationOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Mo ta su co">
              <textarea
                value={createInput.description}
                onChange={(event) => setCreateInput((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                placeholder="Mo ta ngan gon hanh vi, boi canh, khach/ca/ban giao lien quan..."
              />
            </Field>

            <Field label="Bang chung (tach bang dau phay)">
              <input
                type="text"
                value={createInput.evidence_refs.join(', ')}
                onChange={(event) => setCreateInput((current) => ({
                  ...current,
                  evidence_refs: splitEvidenceInput(event.target.value),
                }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                placeholder="camera_ca_1, photo_bill_1, note_leader"
              />
            </Field>

            <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2">
                <Plus size={15} className="text-amber-700" />
                <h3 className="text-sm font-bold text-amber-900">Them loi phu neu thuc su la hanh vi doc lap</h3>
              </div>
              <p className="mt-1 text-xs text-amber-800">
                Neu phan nan chi la hau qua cua loi goc thi khong duoc them de tranh phat trung.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <select
                  value={secondaryDraft.code}
                  onChange={(event) => setSecondaryDraft((current) => ({ ...current, code: event.target.value }))}
                  className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-500"
                >
                  <option value="">Chon loi phu</option>
                  {violationOptions.map((option) => (
                    <option key={option.code} value={option.code}>{option.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={secondaryDraft.evidence_refs.join(', ')}
                  onChange={(event) => setSecondaryDraft((current) => ({
                    ...current,
                    evidence_refs: splitEvidenceInput(event.target.value),
                  }))}
                  className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-500"
                  placeholder="Bang chung rieng cua loi phu"
                />
              </div>

              <textarea
                value={secondaryDraft.reason}
                onChange={(event) => setSecondaryDraft((current) => ({ ...current, reason: event.target.value }))}
                rows={3}
                className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-500"
                placeholder="Vi sao day la hanh vi doc lap, khong chi la hau qua cua loi goc?"
              />

              <label className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-900">
                <input
                  type="checkbox"
                  checked={secondaryDraft.independent_behavior}
                  onChange={(event) => setSecondaryDraft((current) => ({ ...current, independent_behavior: event.target.checked }))}
                  className="h-4 w-4 rounded border-amber-300"
                />
                Xac nhan loi phu nay la hanh vi doc lap, co bang chung rieng
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleAddSecondary()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
                >
                  <Plus size={14} />
                  <span>Them loi phu</span>
                </button>
                {!secondaryDraft.independent_behavior && secondaryDraft.code ? (
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                    <AlertTriangle size={14} />
                    <span>Chua du dieu kien tach loi phu</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 space-y-2">
                {secondaryList.map((item) => (
                  <div key={`${item.code}-${item.reason}`} className="rounded-2xl border border-amber-200 bg-white px-3 py-3 text-xs text-gray-700">
                    <div className="font-bold text-gray-900">{item.code}</div>
                    <div className="mt-1">{item.reason}</div>
                    <div className="mt-1 text-gray-500">Bang chung: {item.evidence_refs.join(', ')}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[#2F6FA8]" />
                <h3 className="text-sm font-bold text-[#001D3D]">Preview tac dong KPI va lien doi leader</h3>
              </div>

              {!preview ? (
                <div className="mt-3 rounded-2xl border border-dashed border-blue-200 bg-white px-3 py-4 text-xs text-gray-500">
                  Dien du thong tin loi goc, mo ta va bang chung de xem preview tac dong.
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <PreviewCard
                    label="Tieu chi bi anh huong"
                    value={preview.impact.criterion_id ?? 'Chua map'}
                    note="Map theo policy su co"
                  />
                  <PreviewCard
                    label="Diem goi y"
                    value={preview.impact.suggested_score === undefined ? 'Chua co' : `${preview.impact.suggested_score} / 5`}
                    note="Chi la goi y cho leader/CEO"
                  />
                  <PreviewCard
                    label="Chan thang bac"
                    value={preview.impact.promotion_block_months === 0 ? 'Khong' : `${preview.impact.promotion_block_months} thang`}
                    note={preview.impact.manager_accountability_proposed ? 'Co de xuat xem lien doi leader' : 'Chua de xuat lien doi leader'}
                  />
                </div>
              )}
            </section>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-medium text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Dong
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSaving}
                className="rounded-xl bg-[#2F6FA8] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#245781] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Dang luu...' : 'Luu ho so su co'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </label>
  )
}

function PreviewCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-white px-3 py-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-2 text-sm font-bold text-[#001D3D]">{value}</div>
      <div className="mt-1 text-[11px] text-gray-500">{note}</div>
    </div>
  )
}

function DetailBlock({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-xs">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-[#001D3D]">{title}</h3>
        </div>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-800">{value}</div>
    </div>
  )
}

function splitEvidenceInput(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeSecondaryInput(input: SecondaryViolationInput): SecondaryViolationInput {
  return {
    code: input.code,
    independent_behavior: input.independent_behavior,
    reason: input.reason.trim(),
    evidence_refs: splitEvidenceInput(input.evidence_refs.join(', ')),
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN')
}
