'use client'

import { useState } from 'react'
import type { PromotionProposal } from '@/lib/career-path/promotion'
import { GRADE_BADGE, POSITION_LABEL, formatDateTime, inputClass } from './career-ui'

export type ProposalRow = PromotionProposal & {
  employee_name: string
  waiting_working_days: number
  overdue: boolean
  can_decide: boolean
  can_cancel: boolean
}

const STATUS_LABEL: Record<PromotionProposal['status'], [string, string]> = {
  pending: ['Chờ duyệt', 'bg-amber-50 text-amber-800'],
  approved: ['Đã duyệt', 'bg-emerald-50 text-emerald-700'],
  rejected: ['Từ chối', 'bg-red-50 text-red-700'],
  cancelled: ['Đã hủy', 'bg-gray-100 text-gray-600'],
}

interface Props {
  row: ProposalRow
  today: string
  respondWithin: number
  onAction: (action: 'approve' | 'reject' | 'cancel', note: string, effectiveDate: string) => Promise<string | null>
}

/** Một đề xuất nâng bậc: thông tin, lý do, ảnh chụp điều kiện lúc đề xuất và nút duyệt/từ chối/hủy. */
export default function PromotionProposalCard({ row, today, respondWithin, onAction }: Props) {
  const [note, setNote] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(today)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [label, badge] = STATUS_LABEL[row.status]

  const run = async (action: 'approve' | 'reject' | 'cancel') => {
    setBusy(true)
    setError('')
    const err = await onAction(action, note, effectiveDate)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-[#001D3D]">{row.employee_name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
            <span>{POSITION_LABEL[row.position]}</span>
            <span className={`rounded-md px-1.5 py-0.5 font-bold ${GRADE_BADGE[row.from_grade]}`}>{row.from_grade}</span>
            <span>→</span>
            <span className={`rounded-md px-1.5 py-0.5 font-bold ${GRADE_BADGE[row.to_grade]}`}>{row.to_grade}</span>
            {row.exception && <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold text-orange-700">Ngoại lệ (chưa đủ điều kiện)</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <span className={`rounded-full px-2.5 py-0.5 font-semibold ${badge}`}>{label}</span>
          {row.status === 'pending' && (
            <span className={row.overdue ? 'font-semibold text-red-600' : 'text-gray-500'}>
              Chờ {row.waiting_working_days} ngày làm việc{row.overdue ? ` · quá hạn ${respondWithin} ngày` : ''}
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-[#001D3D]">
        <span className="font-semibold">Lý do:</span> {row.reason}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Đề xuất bởi {row.proposed_by_name} lúc {formatDateTime(row.proposed_at)} · {row.eligibility_snapshot.months} tháng, {row.eligibility_snapshot.hours} giờ
      </p>
      {row.eligibility_snapshot.checks.some((c) => !c.ok) && (
        <p className="mt-1 text-xs text-orange-700">
          Chưa đạt lúc đề xuất: {row.eligibility_snapshot.checks.filter((c) => !c.ok).map((c) => `${c.label} (${c.detail})`).join('; ')}
        </p>
      )}

      {row.status !== 'pending' && (
        <p className="mt-2 text-xs text-gray-600">
          {row.decided_by_name} xử lý lúc {formatDateTime(row.decided_at)}
          {row.effective_date ? ` · hiệu lực ${row.effective_date}` : ''}
          {row.decision_note ? ` · Ghi chú: ${row.decision_note}` : ''}
        </p>
      )}

      {row.status === 'pending' && (row.can_decide || row.can_cancel) && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <textarea className={inputClass} rows={1} placeholder="Ghi chú (bắt buộc khi từ chối)" value={note} onChange={(e) => setNote(e.target.value)} />
          {row.can_decide && (
            <label className="flex items-center justify-between gap-2 text-sm text-gray-600">
              Hiệu lực từ ngày
              <input type="date" className={`${inputClass} w-auto`} value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
            </label>
          )}
          <div className="flex items-center justify-between gap-2">
            {row.can_cancel ? (
              <button type="button" disabled={busy} onClick={() => run('cancel')} className="text-xs font-semibold text-gray-500 underline disabled:opacity-50">
                Hủy đề xuất
              </button>
            ) : <span />}
            {row.can_decide && (
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => run('reject')} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">
                  Từ chối
                </button>
                <button type="button" disabled={busy} onClick={() => run('approve')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  Duyệt nâng bậc
                </button>
              </div>
            )}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </li>
  )
}
