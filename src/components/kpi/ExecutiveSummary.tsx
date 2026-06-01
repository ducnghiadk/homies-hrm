'use client'

import type { StoreKPISummary } from '@/lib/kpi-report-service'

interface ExecutiveSummaryProps {
  summary: StoreKPISummary
  periodLabel: string
}

export default function ExecutiveSummary({ summary, periodLabel }: ExecutiveSummaryProps) {
  const excCount = summary.grade_distribution.excellent || 0
  const goodCount = summary.grade_distribution.good || 0
  const weakest = summary.category_performance.find(c => c.weakest_area)
  const promoCount = summary.promotion_ready.length
  const changeDir = summary.score_change > 0 ? 'tăng' : summary.score_change < 0 ? 'giảm' : 'không đổi'

  const text = `${summary.store_name} có tháng hoạt động ${summary.average_score >= 80 ? 'tốt' : summary.average_score >= 70 ? 'ổn' : 'cần cải thiện'} ` +
    `với điểm TB ${summary.average_score} (${changeDir} ${Math.abs(summary.score_change)} so với tháng trước). ` +
    `${excCount + goodCount} nhân viên đạt Tốt/Xuất sắc${excCount > 0 ? ` (${excCount} Xuất sắc)` : ''}. ` +
    (weakest && weakest.average < 80 ? `Điểm yếu cần cải thiện: ${weakest.name} (${weakest.average} điểm). ` : '') +
    (promoCount > 0 ? `${promoCount} nhân viên đủ điều kiện thăng tiến.` : '')

  return (
    <div className="card-elevated p-4 space-y-2 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">📝</span>
        <h3 className="text-xs font-bold">Tóm tắt {periodLabel}</h3>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        &ldquo;{text}&rdquo;
      </p>
      <button
        className="text-[10px] font-bold py-1.5 px-3 rounded-lg"
        style={{ background: 'var(--primary)', color: 'white' }}
        onClick={() => {
          const el = document.createElement('textarea')
          el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy')
          document.body.removeChild(el)
        }}>
        📥 Sao chép báo cáo
      </button>
    </div>
  )
}
