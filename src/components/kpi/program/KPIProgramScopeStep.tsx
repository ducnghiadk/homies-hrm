'use client'

import React, { useMemo } from 'react'
import type { KpiTemplateId } from '@/lib/kpi/types'
import type {
  KpiCareerMapVersion,
  KpiPositionCriteriaProfile,
  CareerMapAggregateChange,
} from '@/lib/kpi/career-map-types'
import { validateCareerMap } from '@/lib/kpi/career-map-service'
import { KPICareerMapDesigner } from '../career-map/KPICareerMapDesigner'
import {
  Users,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react'

export type KPIProgramScopeStepProps = {
  positions: Array<{
    id: string
    name: string
    level?: number
    department_id?: string
    job_family?: string
    base_salary?: number
    pay_type?: 'hourly' | 'monthly'
    active?: boolean
  }>
  stores: Array<{ id: string; name: string }>
  positionIds?: string[]
  templateId?: KpiTemplateId
  storeIds: string[] | 'all'
  effectiveFrom: string
  careerMap?: KpiCareerMapVersion
  careerProfiles?: KpiPositionCriteriaProfile[]
  employeeCountByPosition?: Record<string, number>
  careerMapSlot?: React.ReactNode
  userRole?: string
  onAggregateChange(change: CareerMapAggregateChange): void
  onOpenCareerMap?(): void
  onChange(input: {
    position_ids: string[]
    template_id?: KpiTemplateId
    store_ids: string[] | 'all'
    from_position_id?: string
    to_position_id?: string
    effective_from: string
  }): void
  onBack(): void
  onContinue(): void
}

export function KPIProgramScopeStep({
  positions,
  stores,
  positionIds = [],
  templateId,
  storeIds,
  effectiveFrom,
  careerMap,
  careerProfiles = [],
  employeeCountByPosition = {},
  careerMapSlot,
  userRole,
  onAggregateChange,
  onChange,
  onBack,
  onContinue,
}: KPIProgramScopeStepProps) {
  // Validate Career Map
  const mapValidation = useMemo(() => {
    if (!careerMap) return { has_blocking: false, issues: [] }
    return validateCareerMap({ map: careerMap, profiles: careerProfiles })
  }, [careerMap, careerProfiles])

  // Handle store scope change
  const handleStoreScopeToggle = (scope: 'all' | 'specific') => {
    if (scope === 'all') {
      onChange({
        position_ids: positionIds,
        template_id: templateId,
        store_ids: 'all',
        effective_from: effectiveFrom,
      })
    } else {
      const defaultStoreIds = stores.length > 0 ? [stores[0].id] : []
      onChange({
        position_ids: positionIds,
        template_id: templateId,
        store_ids: defaultStoreIds,
        effective_from: effectiveFrom,
      })
    }
  }

  const handleToggleSpecificStore = (storeId: string) => {
    const currentList = Array.isArray(storeIds) ? storeIds : []
    const nextList = currentList.includes(storeId)
      ? currentList.filter((id) => id !== storeId)
      : [...currentList, storeId]

    onChange({
      position_ids: positionIds,
      template_id: templateId,
      store_ids: nextList.length === 0 && stores.length > 0 ? [stores[0].id] : nextList,
      effective_from: effectiveFrom,
    })
  }

  const isAllStores = storeIds === 'all'
  const isStoreValid = isAllStores || (Array.isArray(storeIds) && storeIds.length > 0)
  const isDateValid = Boolean(effectiveFrom)
  const canContinue = !mapValidation.has_blocking && isStoreValid && isDateValid

  return (
    <div className="space-y-6">
      {/* Header Hướng Dẫn */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-[#2F6FA8]/10 px-2.5 py-0.5 text-xs font-bold text-[#2F6FA8]">
          <Layers size={13} />
          <span>Bước 2 / 5</span>
        </div>
        <h2 className="text-base font-bold text-[#001D3D] sm:text-lg">
          Sơ Đồ Lộ Trình Phát Triển Sự Nghiệp &amp; Tiêu Chuẩn Toàn Chuỗi
        </h2>
        <p className="text-xs text-gray-500">
          Thiết lập cấu trúc chức danh, điều kiện chuyển đổi và bộ tiêu chí đánh giá trực quan trên toàn hệ thống Homies.
        </p>
      </div>

      {/* KHỐI 1: SƠ ĐỒ LỘ TRÌNH VÀ TIÊU CHÍ TOÀN CHUỖI */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#2F6FA8]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              1. Bản Đồ Nghề Nghiệp Homies (Career Map)
            </h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            Kéo thả chức danh từ thanh bên trái và nối các chặng thăng tiến
          </span>
        </div>

        <div className="space-y-4">
          {careerMapSlot ? (
            careerMapSlot
          ) : careerMap ? (
            <KPICareerMapDesigner
              map={careerMap}
              positions={positions.map((p) => ({
                id: p.id,
                name: p.name,
                level: p.level || 1,
                department_id: p.department_id,
                job_family: p.job_family,
                base_salary: p.base_salary,
                pay_type: p.pay_type,
                active: p.active,
              }))}
              profiles={careerProfiles}
              employeeCountByPosition={employeeCountByPosition}
              totalStoresCount={stores.length}
              userRole={userRole}
              readOnly={careerMap.status === 'published'}
              onAggregateChange={onAggregateChange}
              onSelectNode={() => {}}
              onSelectEdge={() => {}}
            />
          ) : (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-gray-700">
              Sơ đồ lộ trình toàn chuỗi tự động quản lý các chức danh và điều kiện thăng tiến của toàn bộ hệ thống.
            </div>
          )}

          {mapValidation.has_blocking && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <span>⚠️ Sơ đồ có lỗi chặn cần khắc phục trước khi tiếp tục:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                {mapValidation.issues
                  .filter((i) => i.severity === 'blocking')
                  .map((issue, idx) => (
                    <li key={idx}>{issue.message}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* KHỐI 2: PHẠM VI ÁP DỤNG CHI NHÁNH & NGÀY HIỆU LỰC */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PHẠM VI CHI NHÁNH */}
        <fieldset className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <Building2 size={16} className="text-[#2F6FA8]" />
            <span>2. Phạm Vi Chi Nhánh Áp Dụng</span>
          </legend>
          <p className="text-xs text-gray-500">
            Chọn toàn bộ chuỗi hoặc chỉ định các cơ sở thí điểm mô hình đánh giá mới.
          </p>

          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => handleStoreScopeToggle('all')}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                isAllStores ? 'bg-white text-[#2F6FA8] shadow-xs' : 'text-gray-500'
              }`}
            >
              Toàn hệ thống ({stores.length} quán)
            </button>
            <button
              type="button"
              onClick={() => handleStoreScopeToggle('specific')}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                !isAllStores ? 'bg-white text-[#2F6FA8] shadow-xs' : 'text-gray-500'
              }`}
            >
              Chỉ định chi nhánh cụ thể
            </button>
          </div>

          {!isAllStores && (
            <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
              {stores.map((s) => {
                const checked = Array.isArray(storeIds) && storeIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleSpecificStore(s.id)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                      checked
                        ? 'border-[#2F6FA8] bg-blue-50/50 text-[#001D3D] font-bold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {checked && <Check size={14} className="text-[#2F6FA8] shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>
          )}
        </fieldset>

        {/* NGÀY HIỆU LỰC */}
        <fieldset className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <Calendar size={16} className="text-[#2F6FA8]" />
            <span>3. Thời Điểm Áp Dụng</span>
          </legend>
          <p className="text-xs text-gray-500">
            Chương trình đánh giá và sơ đồ lộ trình sẽ chính thức có hiệu lực từ ngày này.
          </p>

          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-gray-700">
              Ngày hiệu lực: <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={effectiveFrom.slice(0, 10)}
              onChange={(e) =>
                onChange({
                  position_ids: positionIds,
                  template_id: templateId,
                  store_ids: storeIds,
                  effective_from: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 text-xs font-bold text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:bg-white shadow-2xs"
            />
            <p className="text-[11px] text-gray-400">Hệ thống sẽ bắt đầu tính điểm từ chu kỳ có ngày này.</p>
          </div>
        </fieldset>
      </div>

      {/* THANH ĐIỀU HƯỚNG BƯỚC */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[40px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-xs transition-all hover:bg-gray-50 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Quay Lại: Mục Tiêu</span>
        </button>

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => onContinue()}
          className="flex min-h-[40px] items-center gap-2 rounded-xl bg-[#2F6FA8] px-6 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1D3E61] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Tiếp Tục: Nguồn Dữ Liệu</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
