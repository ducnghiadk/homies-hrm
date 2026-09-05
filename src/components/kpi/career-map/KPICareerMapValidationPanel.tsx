'use client'

import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type {
  KpiCareerMapValidationIssue,
  KpiCareerMapValidationResult,
} from '@/lib/kpi/career-map-types'

export interface KPICareerMapValidationPanelProps {
  validation: KpiCareerMapValidationResult
  onSelectIssue?(issue: KpiCareerMapValidationIssue): void
  onUseHomiesTemplate?(): void
}

export function KPICareerMapValidationPanel({
  validation,
  onSelectIssue,
  onUseHomiesTemplate,
}: KPICareerMapValidationPanelProps) {
  const blockingIssues = validation.issues.filter((i) => i.severity === 'blocking')
  const warningIssues = validation.issues.filter((i) => i.severity === 'warning')

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#2F6FA8]" />
          <h3 className="text-sm font-bold text-[#001D3D]">Kiểm tra hợp lệ lộ trình</h3>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Đảm bảo tính logic, không nhảy cóc cấp bậc và không tạo vòng lặp
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Overall Status Banner */}
        {validation.valid ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
            <h4 className="text-xs font-bold text-emerald-900">Sơ đồ hoàn toàn hợp lệ</h4>
            <p className="mt-1 text-[11px] text-emerald-700 leading-relaxed">
              Tất cả vị trí và đường nối đều tuân thủ đúng quy tắc thăng tiến của Homies. Bạn có thể gửi duyệt hoặc triển khai.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  Có {blockingIssues.length} vấn đề cần xử lý
                </h4>
                <p className="mt-1 text-[11px] text-rose-700 leading-relaxed">
                  Cần khắc phục các lỗi chặn bên dưới trước khi có thể gửi phê duyệt sơ đồ.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Blocking Issues List */}
        {blockingIssues.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-[#001D3D] uppercase tracking-wider text-[10px]">
              Lỗi chặn ({blockingIssues.length})
            </h5>
            {blockingIssues.map((issue, idx) => (
              <div
                key={`${issue.code}_${idx}`}
                onClick={() => onSelectIssue?.(issue)}
                className="group rounded-xl border border-rose-200 bg-white p-3 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                    <div>
                      <h6 className="text-xs font-bold text-[#001D3D]">{issue.message}</h6>
                      <p className="mt-0.5 text-[11px] text-gray-500">Mã lỗi: {issue.code}</p>
                      {issue.code === 'missing_criteria' && onUseHomiesTemplate && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onUseHomiesTemplate()
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#2F6FA8] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#245A89]"
                        >
                          <Sparkles className="h-3 w-3" />
                          Dùng bộ Homies
                        </button>
                      )}
                    </div>
                  </div>
                  {onSelectIssue && (
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-rose-600 transition-colors shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Warnings List */}
        {warningIssues.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider text-[10px]">
              Lưu ý vận hành ({warningIssues.length})
            </h5>
            {warningIssues.map((issue, idx) => (
              <div
                key={`${issue.code}_${idx}`}
                onClick={() => onSelectIssue?.(issue)}
                className="group rounded-xl border border-amber-200/80 bg-amber-50/30 p-3 hover:border-amber-300 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-xs font-semibold text-gray-800">{issue.message}</h6>
                    </div>
                  </div>
                  {onSelectIssue && (
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-amber-600 transition-colors shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
