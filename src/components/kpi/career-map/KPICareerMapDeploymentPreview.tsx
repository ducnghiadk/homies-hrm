'use client'

import React, { useState } from 'react'
import {
  GitFork,
  Layers,
  Users,
  Building2,
  Calendar,
  AlertTriangle,
  Send,
  RotateCcw,
  PlusCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import type {
  KpiCareerMapVersion,
  KpiCareerPositionSnapshot,
  KpiPositionCriteriaProfile,
  KpiCareerMapDeploymentPreview as KpiCareerMapDeploymentPreviewType,
} from '@/lib/kpi/career-map-types'
import type { KpiActor } from '@/lib/kpi/types'
import {
  createCareerMapDeploymentPreview,
  submitCareerMapForApproval,
  returnCareerMapDraft,
  publishCareerMap,
  clonePublishedCareerMapAsDraft,
} from '@/lib/kpi/career-map-deployment-service'
import { toast } from 'sonner'

export interface KPICareerMapDeploymentPreviewProps {
  map: KpiCareerMapVersion
  positions?: KpiCareerPositionSnapshot[]
  profiles: KpiPositionCriteriaProfile[]
  employees?: Array<{ id: string; store_id: string; position_id: string; full_name?: string; name?: string }>
  stores?: Array<{ id: string; name: string }>
  currentActor: KpiActor
  onUpdateMap(nextMap: KpiCareerMapVersion): void
  onDeployKpiSets?(): void
}

export function KPICareerMapDeploymentPreview({
  map,
  positions = [],
  profiles,
  employees = [],
  stores = [],
  currentActor,
  onUpdateMap,
  onDeployKpiSets,
}: KPICareerMapDeploymentPreviewProps) {
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    map.effective_from || new Date().toISOString().split('T')[0]
  )
  const [returnReason, setReturnReason] = useState('')
  const [showReturnModal, setShowReturnModal] = useState(false)

  const normalizedEmployees = employees.map((e) => ({
    id: e.id,
    name: e.full_name || e.name || e.id,
    position_id: e.position_id,
    store_id: e.store_id,
  }))

  const preview: KpiCareerMapDeploymentPreviewType = createCareerMapDeploymentPreview({
    map,
    profiles,
    employees: normalizedEmployees,
    stores,
  })

  const isHr = currentActor.role === 'hr_admin'
  const isCeo = currentActor.role === 'ceo'

  const handleSubmitForApproval = () => {
    try {
      const res = submitCareerMapForApproval(map, currentActor, profiles, {
        presets: map.transition_presets || {},
        masterPositions: positions,
      })
      onUpdateMap(res)
      toast.success('Đã gửi sơ đồ lộ trình đến CEO phê duyệt thành công!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi gửi duyệt.')
    }
  }

  const handlePublish = () => {
    try {
      const res = publishCareerMap(map, currentActor, effectiveFrom, profiles, {
        presets: map.transition_presets || {},
        masterPositions: positions,
      })
      onUpdateMap(res)
      onDeployKpiSets?.()
      toast.success('CEO đã duyệt và triển khai sơ đồ lộ trình toàn chuỗi thành công!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi phê duyệt.')
    }
  }

  const handleReturn = () => {
    if (!returnReason.trim()) {
      toast.error('Vui lòng nhập lý do trả lại để HR Admin chỉnh sửa.')
      return
    }
    try {
      const res = returnCareerMapDraft(map, currentActor, returnReason.trim())
      onUpdateMap(res)
      setShowReturnModal(false)
      toast.info('Đã trả lại sơ đồ cho HR Admin cập nhật.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi trả lại.')
    }
  }

  const handleCloneDraft = () => {
    try {
      const cloned = clonePublishedCareerMapAsDraft(map, currentActor.id)
      onUpdateMap(cloned)
      toast.success(`Đã tạo bản nháp v${cloned.version} để nâng cấp sơ đồ!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi nhân bản.')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F6FA8]/10 text-[#2F6FA8]">
            <GitFork className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#001D3D]">
                Tổng quan Triển khai Lộ trình Phát triển
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  map.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : map.status === 'pending_approval'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : map.status === 'returned'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {map.status === 'published'
                  ? 'Đang áp dụng toàn chuỗi'
                  : map.status === 'pending_approval'
                  ? 'Đang chờ CEO duyệt'
                  : map.status === 'returned'
                  ? 'CEO đã trả lại'
                  : 'Bản nháp HR'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Triển khai một chạm • Tự động kích hoạt bộ KPI & điều kiện thăng tiến cho từng vị trí
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-gray-700">Ngày hiệu lực:</span>
          <input
            type="date"
            disabled={map.status === 'published'}
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-[#001D3D] focus:border-[#2F6FA8] focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
      </div>

      {/* Return Notice (if returned) */}
      {map.status === 'returned' && map.returned_reason && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">CEO yêu cầu chỉnh sửa:</h4>
              <p className="mt-1 leading-relaxed">{map.returned_reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Nhánh nghề</span>
            <GitFork className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-[#001D3D]">
            {preview.branch_count} <span className="text-xs font-normal text-gray-500">nhánh</span>
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            {preview.position_count} vị trí trong lộ trình
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Đường nối tăng bậc</span>
            <Layers className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-[#2F6FA8]">
            {preview.transition_count} <span className="text-xs font-normal text-gray-500">chặng</span>
          </p>
          <p className="mt-1 text-[11px] text-gray-500">Tự động gắn điều kiện sàn</p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Nhân sự thụ hưởng</span>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-[#001D3D]">
            {preview.placed_employee_count} <span className="text-xs font-normal text-gray-500">người</span>
          </p>
          <p className="mt-1 text-[11px] text-gray-500">Toàn bộ nhân sự tại các cửa hàng</p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Chi nhánh áp dụng</span>
            <Building2 className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-[#001D3D]">
            {preview.store_count} <span className="text-xs font-normal text-gray-500">cửa hàng</span>
          </p>
          <p className="mt-1 text-[11px] text-gray-500">Chuẩn hóa 100% toàn hệ thống</p>
        </div>
      </div>

      {/* Unresolved Employee Warnings */}
      {preview.unresolved_employee_count > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">
                Có {preview.unresolved_employee_count} nhân viên chưa có vị trí trên sơ đồ
              </h4>
              <p className="mt-1 text-[11px] text-amber-700">
                Những nhân viên này có chức vụ chưa được kéo vào sơ đồ lộ trình hiện tại.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>Cập nhật lần cuối: {new Date(map.updated_at).toLocaleDateString('vi-VN')}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* HR: Submit for Approval */}
          {(map.status === 'draft' || map.status === 'returned') && isHr && (
            <button
              type="button"
              onClick={handleSubmitForApproval}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1D3E61] transition-colors shadow-xs"
            >
              <Send className="h-4 w-4" />
              Gửi CEO phê duyệt sơ đồ
            </button>
          )}

          {/* CEO: Return or Publish */}
          {map.status === 'pending_approval' && isCeo && (
            <>
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Trả lại chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <ShieldCheck className="h-4 w-4" />
                Duyệt & Triển khai toàn chuỗi
              </button>
            </>
          )}

          {/* Published: Clone Draft */}
          {map.status === 'published' && isHr && (
            <button
              type="button"
              onClick={handleCloneDraft}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#2F6FA8] bg-white px-4 py-2.5 text-xs font-bold text-[#2F6FA8] hover:bg-blue-50 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Tạo bản nháp chỉnh sửa mới (v{map.version + 1})
            </button>
          )}
        </div>
      </div>

      {/* Return Reason Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-[#001D3D]">Lý do trả lại sơ đồ cho HR</h4>
            <p className="text-xs text-gray-500">
              Nhập rõ nội dung cần bổ sung hoặc điều chỉnh để HR hoàn thiện lại bản nháp:
            </p>
            <textarea
              rows={3}
              required
              placeholder="Ví dụ: Cần bổ sung thêm nhánh Bếp C2 lên Trưởng ca..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 text-xs text-[#001D3D] focus:border-[#2F6FA8] focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReturn}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Xác nhận trả lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
