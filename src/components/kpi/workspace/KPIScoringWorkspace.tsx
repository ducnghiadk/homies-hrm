'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeftRight, BadgeCheck, ChevronLeft, ChevronRight, FileText, HelpCircle, Save, Send, ShieldAlert } from 'lucide-react'
import type { KpiEvaluation } from '@/lib/kpi/types'
import type { KpiSubmissionIssue, LeaderScoreInput } from '@/lib/kpi/evaluation-service'

interface KPIScoringWorkspaceProps {
  evaluation: KpiEvaluation
  employeeLabel: string
  issues: KpiSubmissionIssue[]
  saveState: 'idle' | 'saving' | 'saved' | 'conflict'
  statusMessage: string
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onAutosave: (input: LeaderScoreInput) => void
  onSubmit: () => void
}

export default function KPIScoringWorkspace({
  evaluation,
  employeeLabel,
  issues,
  saveState,
  statusMessage,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onAutosave,
  onSubmit,
}: KPIScoringWorkspaceProps) {
  const [draftInputs, setDraftInputs] = useState<Record<string, { score: string; adjustment_reason: string; evidence_refs: string }>>({})

  useEffect(() => {
    const nextInputs: Record<string, { score: string; adjustment_reason: string; evidence_refs: string }> = {}

    evaluation.scores.forEach((score) => {
      nextInputs[score.criterion_id] = {
        score: score.final_score?.toString() ?? score.suggested_score?.toString() ?? '',
        adjustment_reason: score.adjustment_reason ?? '',
        evidence_refs: score.evidence_refs.join(', '),
      }
    })

    const timer = window.setTimeout(() => {
      setDraftInputs(nextInputs)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [evaluation])

  const criteria = useMemo(
    () => evaluation.snapshot.groups.flatMap((group) => group.criteria).filter((criterion) => criterion.active),
    [evaluation.snapshot.groups]
  )

  const issueMap = useMemo(() => {
    const map = new Map<string, KpiSubmissionIssue[]>()

    issues.forEach((issue) => {
      map.set(issue.criterion_id, [...(map.get(issue.criterion_id) ?? []), issue])
    })

    return map
  }, [issues])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500">Ho so dang cham</div>
            <h2 className="mt-1 text-lg font-bold text-[#001D3D]">{employeeLabel}</h2>
            <div className="mt-1 text-xs text-gray-500">
              Ky {evaluation.period_id.replace('period_', '').replaceAll('_', ' • ')} • Revision {evaluation.revision}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SaveStateBadge state={saveState} message={statusMessage} />

            <button
              type="button"
              onClick={onPrev}
              disabled={!canGoPrev}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={14} />
              <span>Truoc</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Sau</span>
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <Send size={14} />
              <span>Gui CEO so bo</span>
            </button>
          </div>
        </div>
      </div>

      {/* ĐIỂM ĐỒNG NGHIỆP ẨN DANH GỘP */}
      {evaluation.peer_summary && (
        <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <BadgeCheck size={16} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#001D3D]">
                  Góp Ý Đồng Nghiệp Ẩn Danh ({evaluation.peer_summary.applied_weight_percent}% Trọng Số)
                </h4>
                <p className="text-[11px] text-gray-500">
                  {evaluation.peer_summary.enough_anonymous_sample ? 'Đủ mẫu 2 phiếu ẩn danh' : 'Chưa đủ mẫu ẩn danh — Tự động chuyển trọng số cho Quản lý'}
                </p>
              </div>
            </div>

            {evaluation.peer_summary.total_score && (
              <span className="font-mono text-base font-bold text-purple-800 bg-purple-100/70 px-3 py-1 rounded-xl">
                {evaluation.peer_summary.total_score.toFixed(1)} / 5.0 Điểm
              </span>
            )}
          </div>

          {(evaluation.peer_summary.strength_summary || evaluation.peer_summary.improvement_summary) && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1 text-xs">
              {evaluation.peer_summary.strength_summary && (
                <div className="rounded-xl border border-purple-100 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Điểm Mạnh Nổi Bật Gộp</span>
                  <p className="text-gray-700 text-[11px] leading-relaxed">{evaluation.peer_summary.strength_summary}</p>
                </div>
              )}
              {evaluation.peer_summary.improvement_summary && (
                <div className="rounded-xl border border-amber-100 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Góp Ý Cải Thiện Gộp</span>
                  <p className="text-gray-700 text-[11px] leading-relaxed">{evaluation.peer_summary.improvement_summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {issues.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 text-amber-700" />
            <div>
              <div className="text-xs font-bold text-amber-800">Con {issues.length} muc can bo sung truoc khi gui</div>
              <div className="mt-1 text-[11px] text-amber-800">
                He thong se danh dau ngay tai tung dong co ly do, bang chung hoac nguon du lieu con thieu.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#2F6FA8]" />
            <h3 className="text-sm font-bold text-[#001D3D]">Bang cham chi tiet cua Shift Leader</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/90 text-gray-600">
                <th className="px-4 py-3 font-bold text-[#001D3D]">Tieu chi</th>
                <th className="px-3 py-3 text-center font-bold">Trong so</th>
                <th className="px-3 py-3 text-center font-bold">Goi y</th>
                <th className="px-3 py-3 text-center font-bold">Chot</th>
                <th className="px-4 py-3 font-bold">Ly do dieu chinh</th>
                <th className="px-4 py-3 font-bold">Bang chung</th>
                <th className="px-4 py-3 text-center font-bold">Trang thai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {criteria.map((criterion) => {
                const currentScore = evaluation.scores.find((score) => score.criterion_id === criterion.id)
                const currentDraft = draftInputs[criterion.id] ?? {
                  score: '',
                  adjustment_reason: '',
                  evidence_refs: '',
                }
                const rowIssues = issueMap.get(criterion.id) ?? []

                return (
                  <tr key={criterion.id} className="align-top transition hover:bg-blue-50/20">
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900">{criterion.name}</div>
                        <div className="text-[11px] text-gray-500">{criterion.description}</div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            {criterion.scoring_mode}
                          </span>
                          {criterion.source_key ? (
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                              {criterion.source_key}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <span className="font-mono font-bold tabular-nums text-[#001D3D]">{criterion.weight}%</span>
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <span className="font-mono font-bold tabular-nums text-gray-700">
                        {currentScore?.suggested_score ?? '--'}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <input
                        value={currentDraft.score}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setDraftInputs((current) => ({
                            ...current,
                            [criterion.id]: {
                              ...currentDraft,
                              score: nextValue,
                            },
                          }))
                        }}
                        onBlur={() => {
                          if (!currentDraft.score) return

                          onAutosave({
                            criterion_id: criterion.id,
                            score: Number(currentDraft.score),
                            adjustment_reason: currentDraft.adjustment_reason,
                            evidence_refs: currentDraft.evidence_refs
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }}
                        className="mx-auto w-16 rounded-xl border border-gray-200 bg-white px-2 py-2 text-center font-mono text-xs font-bold text-[#001D3D] outline-none focus:border-[#2F6FA8]"
                        inputMode="numeric"
                        placeholder="1-5"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <textarea
                        value={currentDraft.adjustment_reason}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setDraftInputs((current) => ({
                            ...current,
                            [criterion.id]: {
                              ...currentDraft,
                              adjustment_reason: nextValue,
                            },
                          }))
                        }}
                        onBlur={() => {
                          if (!currentDraft.score) return

                          onAutosave({
                            criterion_id: criterion.id,
                            score: Number(currentDraft.score),
                            adjustment_reason: currentDraft.adjustment_reason,
                            evidence_refs: currentDraft.evidence_refs
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }}
                        rows={2}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#2F6FA8]"
                        placeholder="Chi can nhap khi sua diem goi y"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <textarea
                        value={currentDraft.evidence_refs}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setDraftInputs((current) => ({
                            ...current,
                            [criterion.id]: {
                              ...currentDraft,
                              evidence_refs: nextValue,
                            },
                          }))
                        }}
                        onBlur={() => {
                          if (!currentDraft.score) return

                          onAutosave({
                            criterion_id: criterion.id,
                            score: Number(currentDraft.score),
                            adjustment_reason: currentDraft.adjustment_reason,
                            evidence_refs: currentDraft.evidence_refs
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }}
                        rows={2}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#2F6FA8]"
                        placeholder="VD: anh_chup_ca, ghi_chu_pos"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <RowStatusCell issues={rowIssues} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SaveStateBadge({
  state,
  message,
}: {
  state: 'idle' | 'saving' | 'saved' | 'conflict'
  message: string
}) {
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#2F6FA8]">
        <Save size={12} />
        {message}
      </span>
    )
  }

  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        <BadgeCheck size={12} />
        {message}
      </span>
    )
  }

  if (state === 'conflict') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
        <ShieldAlert size={12} />
        {message}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
      <ArrowLeftRight size={12} />
      {message}
    </span>
  )
}

function RowStatusCell({ issues }: { issues: KpiSubmissionIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
        San sang gui
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {issues.map((issue) => (
        <div
          key={`${issue.code}-${issue.criterion_id}`}
          className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800"
        >
          <div className="flex items-start gap-1.5">
            <HelpCircle size={12} className="mt-0.5 shrink-0" />
            <span>{issue.message}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
