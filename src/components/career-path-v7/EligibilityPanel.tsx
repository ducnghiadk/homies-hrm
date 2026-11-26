'use client'

import { isKpiCheck, type CareerProgressSummary } from '@/lib/career-path/eligibility'
import { GRADE_BADGE, cardClass } from './career-ui'

interface Props {
  summary: CareerProgressSummary
  /** Câu nhắc thêm dưới tiêu đề (vd: dành cho nhân viên tự xem). */
  hint?: string
  /** Bỏ khung thẻ khi đặt bên trong một thẻ khác. */
  bare?: boolean
}

/** Hiển thị điều kiện lên bậc kế tiếp. Chỉ để tham khảo, không tự nâng bậc. */
export default function EligibilityPanel({ summary, hint, bare }: Props) {
  const { eligibility, months, hours } = summary
  const wrap = bare ? '' : cardClass
  if (!eligibility.next) {
    return (
      <section className={wrap}>
        <h3 className="text-sm font-bold text-[#001D3D]">Điều kiện lên bậc</h3>
        <p className="mt-1 text-sm text-gray-500">Đang ở bậc cao nhất của lộ trình ({eligibility.current}). Tổng {months} tháng, {hours} giờ.</p>
      </section>
    )
  }
  const done = eligibility.checks.filter((c) => c.ok).length
  const total = eligibility.checks.length || 1
  return (
    <section className={wrap}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#001D3D]">
          Điều kiện lên <span className={`rounded-md px-2 py-0.5 ${GRADE_BADGE[eligibility.next]}`}>{eligibility.next}</span>
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${eligibility.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
          {eligibility.ready ? 'Đủ điều kiện để đề xuất' : `Đạt ${done}/${eligibility.checks.length} điều kiện`}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${eligibility.ready ? 'bg-emerald-500' : 'bg-[#2F6FA8]'}`} style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <ul className="mt-3 space-y-2">
        {eligibility.checks.map((c, i) => (
          <li key={c.key} className={`flex items-start gap-2 text-sm ${isKpiCheck(c) && !isKpiCheck(eligibility.checks[i - 1] ?? { key: 'setup' }) ? 'border-t border-gray-100 pt-2' : ''}`}>
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${c.ok ? 'bg-emerald-500 text-white' : 'border border-gray-300 text-transparent'}`}>✓</span>
            <span className="min-w-0">
              <span className={c.ok ? 'text-[#001D3D]' : 'font-medium text-[#001D3D]'}>{c.label}</span>
              <span className={`block text-xs ${c.ok ? 'text-gray-500' : 'text-amber-700'}`}>{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      {summary.store_bsc && <StoreBscNote b={summary.store_bsc} />}
      {summary.hours_breakdown && summary.hours_breakdown.source !== 'all_attendance' && (
        <HoursBreakdownNote b={summary.hours_breakdown} />
      )}
      <p className="mt-3 text-xs text-gray-500">{hint || 'Chỉ để tham khảo. Nâng bậc vẫn phải qua đề xuất và duyệt.'}</p>
    </section>
  )
}

function HoursBreakdownNote({ b }: { b: NonNullable<CareerProgressSummary['hours_breakdown']> }) {
  const parts: string[] = [`${b.official} giờ trong lịch đã chốt`]
  if (b.approved_off_schedule > 0) parts.push(`${b.approved_off_schedule} giờ ngoài lịch đã được duyệt`)
  if (b.legacy_counted > 0) parts.push(`${b.legacy_counted} giờ chấm công cũ`)
  if (b.carried > 0) parts.push(`${b.carried} giờ HR nhập lúc xếp bậc`)
  const removed: string[] = []
  if (b.off_schedule_excluded > 0) removed.push(`${b.off_schedule_excluded} giờ ngoài lịch chưa được duyệt`)
  if (b.legacy_excluded > 0) removed.push(`${b.legacy_excluded} giờ chấm công cũ`)
  return (
    <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
      <span className="font-semibold text-[#001D3D]">Giờ được tính:</span> {parts.join(' + ')}.
      {removed.length > 0 && <span className="block text-amber-700">Không tính: {removed.join(', ')}.</span>}
    </div>
  )
}

function StoreBscNote({ b }: { b: NonNullable<CareerProgressSummary['store_bsc']> }) {
  const [y, m] = b.period.split('-')
  return (
    <div className="mt-3 rounded-lg border border-gray-100 px-3 py-2 text-xs text-gray-600">
      <span className="font-semibold text-[#001D3D]">BSC cửa hàng tháng {m}/{y}{b.store_name ? ` (${b.store_name})` : ''}:</span>{' '}
      {b.unlocked ? `đã mở quỹ thưởng${b.coefficient !== null ? `, hệ số ${b.coefficient}` : ''}` : 'chưa mở quỹ thưởng'}.
      <span className="block text-gray-500">Chỉ để tham khảo, không dùng để xét bậc.</span>
    </div>
  )
}
