'use client'

import type { CareerProgressSummary } from '@/lib/career-path/eligibility'
import { GRADE_BADGE, cardClass } from './career-ui'

interface Props {
  summary: CareerProgressSummary
  /** Câu nhắc thêm dưới tiêu đề (vd: dành cho nhân viên tự xem). */
  hint?: string
}

/** Hiển thị điều kiện lên bậc kế tiếp. Chỉ để tham khảo, không tự nâng bậc. */
export default function EligibilityPanel({ summary, hint }: Props) {
  const { eligibility, months, hours } = summary
  if (!eligibility.next) {
    return (
      <section className={cardClass}>
        <h3 className="text-sm font-bold text-[#001D3D]">Điều kiện lên bậc</h3>
        <p className="mt-1 text-sm text-gray-500">Đang ở bậc cao nhất của lộ trình ({eligibility.current}). Tổng {months} tháng, {hours} giờ.</p>
      </section>
    )
  }
  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#001D3D]">
          Điều kiện lên{' '}
          <span className={`rounded-md px-2 py-0.5 ${GRADE_BADGE[eligibility.next]}`}>{eligibility.next}</span>
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${eligibility.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
          {eligibility.ready ? 'Đủ điều kiện để đề xuất' : 'Chưa đủ điều kiện'}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-500">{hint || 'Chỉ để tham khảo. Nâng bậc vẫn phải qua đề xuất và duyệt.'}</p>
      <ul className="mt-3 space-y-1.5">
        {eligibility.checks.map((c) => (
          <li key={c.key} className="flex items-start justify-between gap-3 text-sm">
            <span className="flex items-start gap-2">
              <span className={c.ok ? 'text-emerald-600' : 'text-gray-400'}>{c.ok ? '✓' : '○'}</span>
              <span className="text-[#001D3D]">{c.label}</span>
            </span>
            <span className={`shrink-0 text-xs ${c.ok ? 'text-emerald-700' : 'text-gray-500'}`}>{c.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
