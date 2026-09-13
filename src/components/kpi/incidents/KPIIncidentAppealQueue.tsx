'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Scale,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import type { KpiAppeal, KpiIncident } from '@/lib/kpi/types'
import type { IncidentAppealDecisionInput } from '@/lib/kpi/appeal-service'

export interface KPIIncidentAppealQueueItem {
  appeal: KpiAppeal
  incident: KpiIncident
  employeeLabel: string
  storeLabel: string
  primaryViolationLabel: string
  currentImpactLabel: string
  deadlineLabel: string
  overdue: boolean
  auditTrail: string[]
}

interface KPIIncidentAppealQueueProps {
  items: KPIIncidentAppealQueueItem[]
  canDecide: boolean
  onDecide: (item: KPIIncidentAppealQueueItem, decision: IncidentAppealDecisionInput) => Promise<void> | void
}

export default function KPIIncidentAppealQueue({ items, canDecide, onDecide }: KPIIncidentAppealQueueProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [decision, setDecision] = useState<IncidentAppealDecisionInput>({
    result: 'keep',
    note: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.appeal.id === selectedId) ?? null,
    [items, selectedId]
  )

  async function handleSubmit() {
    if (!selectedItem) return

    setErrorMessage(null)

    try {
      setIsSaving(true)
      await onDecide(selectedItem, decision)
      setSelectedId(null)
      setDecision({ result: 'keep', note: '' })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the luu quyet dinh')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={18} />
          </div>
          <div className="mt-4 text-sm font-bold text-[#001D3D]">Khong co ho so khiếu nai su co dang mo</div>
          <div className="mt-1 text-xs text-gray-500">Queue nay se hien khi nhan su gui khiếu nai incident trong 48 gio.</div>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.appeal.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-bold text-[#001D3D]">{item.employeeLabel}</div>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                    {item.storeLabel}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    item.overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.deadlineLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard icon={<ShieldAlert size={14} className="text-rose-700" />} label="Su co goc" value={item.primaryViolationLabel} note={item.incident.description} />
                  <InfoCard icon={<Scale size={14} className="text-[#2F6FA8]" />} label="Tac dong hien tai" value={item.currentImpactLabel} note={`Trang thai incident: ${item.incident.status}`} />
                  <InfoCard icon={<MessageSquare size={14} className="text-purple-700" />} label="Ly do nhan su khiếu nai" value={item.appeal.reason} note={`Bang chung nhan su: ${item.appeal.evidence_refs.join(', ') || 'Chua co'}`} />
                  <InfoCard icon={<Sparkles size={14} className="text-amber-700" />} label="Bang chung he thong" value={item.incident.evidence_refs.join(', ') || 'Chua co'} note={`Loi phu doc lap: ${Math.max(item.incident.violations.length - 1, 0)}`} />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <Clock3 size={13} />
                    <span>Audit va lich su</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    {item.auditTrail.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="xl:w-[240px]">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.appeal.id)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold text-white transition ${
                    canDecide ? 'bg-[#2F6FA8] hover:bg-[#245781]' : 'bg-gray-400'
                  }`}
                >
                  {canDecide ? 'CEO xem va quyet dinh' : 'Chi CEO duoc quyet dinh'}
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {selectedItem && canDecide ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001D3D]/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-700" />
              <h3 className="text-base font-bold text-[#001D3D]">Quyet dinh ho so khiếu nai incident</h3>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="space-y-2 text-xs font-bold text-gray-700">
                <span>Ket qua</span>
                <select
                  value={decision.result}
                  onChange={(event) => setDecision((current) => ({ ...current, result: event.target.value as IncidentAppealDecisionInput['result'] }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                >
                  <option value="keep">Giu nguyen incident</option>
                  <option value="reclassify">Doi phan loai loi goc</option>
                  <option value="adjust_impact">Doi tac dong KPI / thang bac</option>
                  <option value="cancel">Huy incident</option>
                </select>
              </label>

              {decision.result === 'reclassify' ? (
                <label className="space-y-2 text-xs font-bold text-gray-700">
                  <span>Ma loi goc moi</span>
                  <input
                    type="text"
                    value={decision.reclassified_primary_code ?? ''}
                    onChange={(event) => setDecision((current) => ({ ...current, reclassified_primary_code: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                    placeholder="vd: attendance_late"
                  />
                </label>
              ) : null}

              {decision.result === 'adjust_impact' ? (
                <>
                  <label className="space-y-2 text-xs font-bold text-gray-700">
                    <span>Diem KPI moi</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={decision.suggested_score ?? ''}
                      onChange={(event) => setDecision((current) => ({
                        ...current,
                        suggested_score: event.target.value ? Number(event.target.value) : undefined,
                      }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                    />
                  </label>

                  <label className="space-y-2 text-xs font-bold text-gray-700">
                    <span>Chan thang bac (thang)</span>
                    <input
                      type="number"
                      min={0}
                      value={decision.promotion_block_months ?? 0}
                      onChange={(event) => setDecision((current) => ({
                        ...current,
                        promotion_block_months: Number(event.target.value),
                      }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
                    />
                  </label>

                  <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <input
                        type="checkbox"
                        checked={decision.manager_accountability?.proposed ?? false}
                        onChange={(event) => setDecision((current) => ({
                          ...current,
                          manager_accountability: {
                            proposed: event.target.checked,
                            same_shift: current.manager_accountability?.same_shift ?? false,
                            reason: current.manager_accountability?.reason,
                            evidence_refs: current.manager_accountability?.evidence_refs ?? [],
                          },
                        }))}
                        className="h-4 w-4 rounded border-amber-300"
                      />
                      <span>De xuat lien doi leader</span>
                    </label>

                    {decision.manager_accountability?.proposed ? (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-amber-900">
                          <input
                            type="checkbox"
                            checked={decision.manager_accountability.same_shift}
                            onChange={(event) => setDecision((current) => ({
                              ...current,
                              manager_accountability: {
                                proposed: true,
                                same_shift: event.target.checked,
                                reason: current.manager_accountability?.reason,
                                evidence_refs: current.manager_accountability?.evidence_refs ?? [],
                              },
                            }))}
                            className="h-4 w-4 rounded border-amber-300"
                          />
                          <span>Leader dung ca phu trach</span>
                        </label>

                        <input
                          type="text"
                          value={(decision.manager_accountability?.evidence_refs ?? []).join(', ')}
                          onChange={(event) => setDecision((current) => ({
                            ...current,
                            manager_accountability: {
                              proposed: true,
                              same_shift: current.manager_accountability?.same_shift ?? false,
                              reason: current.manager_accountability?.reason,
                              evidence_refs: splitRefs(event.target.value),
                            },
                          }))}
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-500"
                          placeholder="Bang chung rieng cho lien doi leader"
                        />

                        <textarea
                          value={decision.manager_accountability.reason ?? ''}
                          onChange={(event) => setDecision((current) => ({
                            ...current,
                            manager_accountability: {
                              proposed: true,
                              same_shift: current.manager_accountability?.same_shift ?? false,
                              reason: event.target.value,
                              evidence_refs: current.manager_accountability?.evidence_refs ?? [],
                            },
                          }))}
                          rows={3}
                          className="md:col-span-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-500"
                          placeholder="Ly do lien doi leader"
                        />
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>

            <label className="mt-4 block space-y-2 text-xs font-bold text-gray-700">
              <span>Ghi chu ket luan cua CEO</span>
              <textarea
                value={decision.note}
                onChange={(event) => setDecision((current) => ({ ...current, note: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#2F6FA8]"
              />
            </label>

            {errorMessage ? (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-medium text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
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
                {isSaving ? 'Dang luu...' : 'Luu quyet dinh'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-bold text-[#001D3D]">{value}</div>
      <div className="mt-1 text-xs text-gray-600">{note}</div>
    </div>
  )
}

function splitRefs(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}
