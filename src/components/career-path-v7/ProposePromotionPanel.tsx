'use client'

import { useState } from 'react'
import type { CareerProgressSummary } from '@/lib/career-path/eligibility'
import EligibilityPanel from './EligibilityPanel'
import { cardClass, inputClass } from './career-ui'

interface Props {
  employeeName: string
  summary: CareerProgressSummary
  /** Số ký tự tối thiểu của lý do, theo Cài đặt lộ trình. */
  reasonMin: number
  exceptionMin: number
  allowException: boolean
  onSubmit: (reason: string) => Promise<string | null>
  onClose: () => void
}

/** Form đề xuất nâng bậc cho 1 nhân viên. Chưa đủ điều kiện thì là đề xuất ngoại lệ, cần lý do dài hơn. */
export default function ProposePromotionPanel({ employeeName, summary, reasonMin, exceptionMin, allowException, onSubmit, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const exception = !summary.eligibility.ready
  const minLen = exception ? exceptionMin : reasonMin
  const blocked = exception && !allowException

  const submit = async () => {
    setBusy(true)
    setError('')
    const err = await onSubmit(reason)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="space-y-3">
      <section className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-[#001D3D]">Đề xuất nâng bậc · {employeeName}</h3>
          <button type="button" onClick={onClose} className="text-xs text-gray-500 underline">Đóng</button>
        </div>
        {exception && (
          <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
            {blocked
              ? 'Nhân viên chưa đủ điều kiện theo Cài đặt, và Cài đặt đang không cho đề xuất ngoại lệ.'
              : `Nhân viên chưa đủ điều kiện theo Cài đặt. Bạn vẫn có thể đề xuất ngoại lệ${minLen > 0 ? `, nhưng cần ghi lý do ít nhất ${minLen} ký tự` : ''} để người duyệt cân nhắc.`}
          </p>
        )}
        <textarea
          className={`${inputClass} mt-3`}
          rows={3}
          placeholder={exception ? 'Vì sao nên nâng bậc dù chưa đủ điều kiện?' : 'Lý do đề xuất (vd: đã tự làm tốt toàn bộ kỹ năng chính)'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">{minLen > 0 ? `${reason.trim().length}/${minLen} ký tự tối thiểu` : 'Lý do không bắt buộc'}</span>
          <button type="button" disabled={busy || blocked || reason.trim().length < minLen} onClick={submit} className="rounded-lg bg-[#001D3D] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            Gửi đề xuất lên {summary.eligibility.next}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </section>
      <EligibilityPanel summary={summary} />
    </div>
  )
}
