'use client'

import React, { useState } from 'react'
import { CheckCircle2, Send, FileSpreadsheet, ShieldAlert, Sparkles, ShieldCheck } from 'lucide-react'
import type { BSCTeamBonusSummary } from '@/lib/bsc-types'

export type BSCBonusPeriodStatus = 'draft' | 'pending_ceo' | 'published'

interface BSCApprovalBarProps {
  status: BSCBonusPeriodStatus
  isCEO: boolean
  isManager: boolean
  period: string
  storeName: string
  summary: BSCTeamBonusSummary
  onStatusChange: (nextStatus: BSCBonusPeriodStatus) => void
}

export default function BSCApprovalBar({
  status,
  isCEO,
  isManager,
  period,
  storeName,
  summary,
  onStatusChange,
}: BSCApprovalBarProps) {
  const [isExporting, setIsExporting] = useState(false)

  // Export summary report as CSV
  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const headers = ['Mã NV', 'Họ và tên', 'Chức vụ', 'Cấp bậc', 'Giờ làm (h)', 'Đủ giờ', 'Lỗi cá nhân (điểm)', 'Hệ số lỗi', 'Điểm chia', 'Tỷ lệ %', 'Thưởng BSC (VND)', 'Ghi chú']
      const rows = summary.individual_results.map(r => [
        `"${r.employee_id}"`,
        `"${r.employee_name}"`,
        `"${r.role}"`,
        `"${r.level_label}"`,
        r.work_hours,
        r.is_eligible_hours ? 'Đạt' : 'Không',
        r.personal_error_count,
        r.personal_coefficient,
        r.personal_share_points,
        `${r.share_percentage}%`,
        r.bonus_amount,
        `"${r.lock_reason || ''}"`,
      ])

      const csvContent = '\uFEFF' + [
        `BÁO CÁO THƯỞNG BSC - ${storeName.toUpperCase()}`,
        `Kỳ xét: ${period}`,
        `Tổng quỹ thưởng: ${summary.store_result.store_bonus_pool} VND`,
        `Thực chi nhân viên: ${summary.total_distributed_bonus_amount} VND`,
        `Phần tiền giữ lại: ${summary.retained_bonus_amount} VND`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `Bao_Cao_Thuong_BSC_${storeName.replace(/\s+/g, '_')}_${period}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const steps: { id: BSCBonusPeriodStatus; label: string; desc: string }[] = [
    { id: 'draft', label: '1. Bản Nháp', desc: 'Quản lý cơ sở đối soát' },
    { id: 'pending_ceo', label: '2. Chờ CEO Duyệt', desc: 'Đã gửi duyệt ngân sách' },
    { id: 'published', label: '3. Đã Công Bố', desc: 'Đã phát hành đến nhân sự' },
  ]

  const getCurrentStepIndex = () => {
    switch (status) {
      case 'draft': return 0
      case 'pending_ceo': return 1
      case 'published': return 2
      default: return 0
    }
  }

  const currentIdx = getCurrentStepIndex()

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#001D3D] tracking-tight">
                Quy Trình Duyệt Thưởng BSC — Kỳ {period}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                status === 'published'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'pending_ceo'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {status === 'published' ? 'Đã Phát Hành' : status === 'pending_ceo' ? 'Chờ Phê Duyệt' : 'Bản Nháp'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Cơ sở: <strong className="text-gray-800">{storeName}</strong>
            </p>
          </div>
        </div>

        {/* Export CSV button */}
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="px-3.5 py-2 min-h-[40px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
        >
          <FileSpreadsheet size={14} className="text-[#2F6FA8]" />
          <span>{isExporting ? 'Đang xuất...' : 'Xuất Báo Cáo'}</span>
        </button>
      </div>

      {/* 3 Step Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {steps.map((s, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx

          return (
            <div
              key={s.id}
              className={`p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-primary-50/70 border-primary-200/80'
                  : isDone
                  ? 'bg-emerald-50/50 border-emerald-200/60'
                  : 'bg-gray-50/50 border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-[#2F6FA8] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {isDone ? <CheckCircle2 size={12} /> : idx + 1}
                </div>
                <span className={`text-xs font-bold ${
                  isCurrent ? 'text-[#001D3D]' : isDone ? 'text-emerald-900' : 'text-gray-500'
                }`}>
                  {s.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 pl-7 font-medium leading-tight">
                {s.desc}
              </p>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {status === 'draft' && isManager && (
          <button
            type="button"
            onClick={() => onStatusChange('pending_ceo')}
            className="px-4 py-2 min-h-[40px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Send size={14} />
            <span>Gửi CEO Phê Duyệt</span>
          </button>
        )}

        {status === 'pending_ceo' && isCEO && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStatusChange('draft')}
              className="px-4 py-2 min-h-[40px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ShieldAlert size={14} />
              <span>Yêu Cầu Rà Soát Lại</span>
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('published')}
              className="px-4 py-2 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Chốt & Công Bố Bảng Thưởng</span>
            </button>
          </div>
        )}

        {status === 'published' && (
          <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 py-1">
            <CheckCircle2 size={16} />
            <span>Bảng thưởng đã được công bố chính thức đến toàn thể nhân viên.</span>
          </div>
        )}
      </div>
    </div>
  )
}
