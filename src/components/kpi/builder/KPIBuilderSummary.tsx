'use client'

import { AlertTriangle, CheckCircle2, Copy, Globe2, ShieldAlert, Sparkles, Layers } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import type { KpiValidationIssue } from '@/lib/kpi/configuration-service'
import type { KpiSetVersion } from '@/lib/kpi/types'

interface KPIBuilderSummaryProps {
  selectedVersion?: KpiSetVersion
  validationIssues: KpiValidationIssue[]
  onCloneVersion(): void
  onPublish(): void
}

function formatScope(storeIds: KpiSetVersion['store_ids']): string {
  if (storeIds === 'all') return 'Toàn hệ thống'
  return `${storeIds.length} cửa hàng`
}

export function KPIBuilderSummary({
  selectedVersion,
  validationIssues,
  onCloneVersion,
  onPublish,
}: KPIBuilderSummaryProps) {
  const activeGroups = selectedVersion?.groups.filter((group) => group.criteria.some((criterion) => criterion.active)) ?? []
  const totalWeight = activeGroups.reduce((sum, group) => sum + group.weight, 0)
  const hasBlockingIssues = validationIssues.length > 0
  const isReadyToPublish = selectedVersion?.status === 'draft' && !hasBlockingIssues && totalWeight === 100

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Đối soát quy chuẩn</p>
        <h2 className="mt-0.5 text-base font-bold text-[#001D3D]">Trạng thái & Kiểm tra logic</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {/* Scope Card */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#001D3D]">
            <Globe2 size={15} className="text-[#2F6FA8]" />
            Phạm vi áp dụng
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-[#001D3D]">
            {selectedVersion ? formatScope(selectedVersion.store_ids) : '--'}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            {selectedVersion ? `${selectedVersion.level_codes.length} nhóm chức danh / cấp bậc` : 'Chưa chọn phiên bản.'}
          </p>
        </div>

        {/* Weight Card */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#001D3D]">
            <Sparkles size={15} className="text-[#2F6FA8]" />
            Tổng trọng số
          </div>
          <p className={`mt-2 text-xl font-bold font-mono tabular-nums ${totalWeight === 100 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {selectedVersion ? `${totalWeight}%` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            {selectedVersion ? `${activeGroups.length} trụ tiêu chí đang kích hoạt` : 'Chưa chọn phiên bản.'}
          </p>
        </div>
      </div>

      {/* Validation Status */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#001D3D]">
          {hasBlockingIssues ? (
            <AlertTriangle size={15} className="text-amber-600" />
          ) : (
            <CheckCircle2 size={15} className="text-emerald-600" />
          )}
          Trạng thái kiểm tra trước công bố
        </div>

        {hasBlockingIssues ? (
          <div className="mt-2.5 space-y-2">
            {validationIssues.map((issue) => (
              <div key={`${issue.code}-${issue.path}`} className="rounded-lg bg-amber-50 border border-amber-200/80 p-2.5 text-xs text-amber-900">
                <p className="font-bold text-[11px] uppercase tracking-wider">{issue.code}</p>
                <p className="mt-0.5">{issue.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 p-2.5 text-xs font-medium text-emerald-800">
            ✓ Phiên bản hợp lệ 100%, sẵn sàng công bố áp dụng cho chuỗi.
          </div>
        )}
      </div>

      {/* Checklist Reminder */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#2F6FA8]">
          <ShieldAlert size={14} />
          Quy tắc chuẩn hóa KPI
        </div>
        <ul className="mt-2 space-y-1.5 text-[11px] text-gray-600 list-disc list-inside">
          <li>Tổng trọng số các trụ bắt buộc tròn 100%.</li>
          <li>Tiêu chí tự động liên kết nguồn POS/Check-in rõ ràng.</li>
          <li>Bản đã công bố được đóng băng để bảo toàn số liệu.</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 h-9"
          icon={<Copy size={14} className="text-gray-500" />}
          onClick={onCloneVersion}
        >
          Nhân bản thành kỳ tiếp theo
        </Button>
        <Button
          type="button"
          disabled={!isReadyToPublish}
          className={`w-full justify-center text-xs font-semibold h-9 ${
            isReadyToPublish
              ? 'bg-[#2F6FA8] hover:bg-[#1D3E61] text-white shadow-xs'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          onClick={onPublish}
        >
          Công bố áp dụng phiên bản này
        </Button>
      </div>
    </section>
  )
}
