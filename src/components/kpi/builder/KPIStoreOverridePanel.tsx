'use client'

import React, { useMemo, useState } from 'react'
import type { KpiSetVersion, KpiStoreTargetOverride } from '@/lib/kpi/types'
import { isValidStoreTargetOverride, resolveCriterionTarget } from '@/lib/kpi/target-policy-service'
import {
  Store,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react'

export type KPIStoreOverridePanelProps = {
  version: KpiSetVersion
  stores: Array<{ id: string; name: string }>
  onChange(items: KpiStoreTargetOverride[]): void
}

export function KPIStoreOverridePanel({
  version,
  stores,
  onChange,
}: KPIStoreOverridePanelProps) {
  const [draftOverrides, setDraftOverrides] = useState(version.target_overrides || [])

  // Thu thập tất cả tiêu chí có thể điều chỉnh target (chỉ tiêu chí định lượng)
  const availableCriteria = useMemo(() => {
    const list: Array<{ id: string; name: string; groupName: string; unit?: string }> = []
    version.groups.forEach((g) => {
      g.criteria.forEach((c) => {
        if (c.active && c.scoring_mode !== 'leader') {
          list.push({
            id: c.id,
            name: c.name,
            groupName: g.name,
            unit: c.unit,
          })
        }
      })
    })
    return list
  }, [version.groups])

  const persistWhenValid = (items: KpiStoreTargetOverride[]) => {
    setDraftOverrides(items)
    const storeIds = stores.map((store) => store.id)
    const criterionIds = availableCriteria.map((criterion) => criterion.id)
    if (items.every((item) => isValidStoreTargetOverride(item, storeIds, criterionIds))) {
      onChange(items)
    }
  }

  // Thêm ngoại lệ mới
  const handleAddOverride = () => {
    if (stores.length === 0 || availableCriteria.length === 0) return

    const todayStr = new Date().toISOString().slice(0, 10)
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10)

    const newOverride: KpiStoreTargetOverride = {
      id: `override_${Date.now()}`,
      store_id: stores[0].id,
      criterion_id: availableCriteria[0].id,
      target: 0,
      reason: 'Đang sửa chữa mặt bằng / Sự cố kỹ thuật',
      owner_id: version.created_by || 'hr_admin_01',
      effective_from: todayStr,
      effective_to: endOfMonth,
    }

    persistWhenValid([...draftOverrides, newOverride])
  }

  // Cập nhật từng trường của ngoại lệ
  const handleUpdateOverride = (
    id: string,
    field: keyof KpiStoreTargetOverride,
    value: string | number
  ) => {
    const nextOverrides = draftOverrides.map((item) => {
      if (item.id !== id) return item
      return { ...item, [field]: value }
    })
    persistWhenValid(nextOverrides)
  }

  // Xóa ngoại lệ
  const handleRemoveOverride = (id: string) => {
    persistWhenValid(draftOverrides.filter((item) => item.id !== id))
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-4">
      {/* Header hướng dẫn */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2F6FA8] uppercase tracking-wider">
            <Store size={15} />
            <span>Ngoại Lệ Mục Tiêu Theo Cửa Hàng (Store Overrides)</span>
          </div>
          <h3 className="text-sm font-bold text-[#001D3D] sm:text-base">
            Điều chỉnh chỉ tiêu đặc thù cho quán đang sửa chữa, vướng công trình hoặc mới khai trương
          </h3>
          <p className="text-xs text-gray-500">
            Ngoại lệ chỉ ghi đè mục tiêu (target) trong một khoảng thời gian nhất định, không thay đổi bộ tiêu chí hay trọng số chung.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddOverride}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1D3E61] cursor-pointer"
        >
          <Plus size={14} />
          <span>Thêm Ngoại Lệ Mới</span>
        </button>
      </div>

      {/* Danh sách ngoại lệ */}
      {draftOverrides.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center space-y-2">
          <Info size={24} className="mx-auto text-gray-400" />
          <h4 className="text-sm font-bold text-gray-700">Chưa có ngoại lệ nào được thiết lập</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Tất cả các cửa hàng sẽ áp dụng mục tiêu chung của toàn chuỗi hoặc theo nhóm cửa hàng A/B/C.
          </p>
          <button
            type="button"
            onClick={handleAddOverride}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-white cursor-pointer"
          >
            <Plus size={13} />
            <span>Thêm ngoại lệ đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {draftOverrides.map((item, index) => {
            const isExpired = item.effective_to < todayStr
            const isDateInvalid = item.effective_from > item.effective_to
            const currentResolved = resolveCriterionTarget(
              version,
              item.criterion_id,
              item.store_id,
              item.effective_from
            )
            const criterionInfo = availableCriteria.find((c) => c.id === item.criterion_id)

            return (
              <div
                key={item.id || index}
                className={`rounded-2xl border p-5 shadow-xs space-y-4 bg-white transition-all ${
                  isDateInvalid
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isExpired
                    ? 'border-gray-200 bg-gray-50/50 opacity-80'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                {/* Header item ngoại lệ */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#2F6FA8]">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-[#001D3D]">
                      Ngoại lệ #{index + 1}
                    </span>

                    {isExpired ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 border border-gray-200">
                        Đã hết hạn
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        <span>Đang có hiệu lực</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveOverride(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Xóa ngoại lệ này"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Cửa hàng */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Cửa hàng áp dụng:</label>
                    <select
                      value={item.store_id}
                      onChange={(e) => handleUpdateOverride(item.id, 'store_id', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2 text-xs font-bold text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:bg-white"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tiêu chí */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Tiêu chí cần điều chỉnh:</label>
                    <select
                      value={item.criterion_id}
                      onChange={(e) => handleUpdateOverride(item.id, 'criterion_id', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2 text-xs font-bold text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:bg-white"
                    >
                      {availableCriteria.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.groupName} - {c.name} {c.unit ? `(${c.unit})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target ngoại lệ */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>Mục tiêu điều chỉnh:</span>
                      {currentResolved && (
                        <span className="text-[11px] text-gray-400 font-normal">
                          Chuẩn: {currentResolved.target} {criterionInfo?.unit || ''}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step={0.1}
                      value={item.target}
                      onChange={(e) => handleUpdateOverride(item.id, 'target', Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2 text-xs font-mono font-bold text-[#2F6FA8] outline-none focus:border-[#2F6FA8] focus:bg-white"
                    />
                  </div>

                  {/* Thời gian hiệu lực */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Thời gian hiệu lực:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={item.effective_from}
                        onChange={(e) => handleUpdateOverride(item.id, 'effective_from', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-1.5 text-[11px] font-mono outline-none focus:border-[#2F6FA8] focus:bg-white"
                      />
                      <span className="text-gray-400 text-xs">-</span>
                      <input
                        type="date"
                        value={item.effective_to}
                        onChange={(e) => handleUpdateOverride(item.id, 'effective_to', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-1.5 text-[11px] font-mono outline-none focus:border-[#2F6FA8] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Lý do ngoại lệ & Báo lỗi ngày */}
                <div className="space-y-1 pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <label>Lý do điều chỉnh ngoại lệ (bắt buộc):</label>
                    {isDateInvalid && (
                      <span className="text-rose-600 text-[11px] flex items-center gap-1">
                        <AlertTriangle size={11} />
                        Ngày bắt đầu không được lớn hơn ngày kết thúc
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.reason}
                    placeholder="VD: Cửa hàng đang làm lại vỉa hè phía trước trong 2 tuần..."
                    onChange={(e) => handleUpdateOverride(item.id, 'reason', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2 text-xs text-gray-800 outline-none focus:border-[#2F6FA8] focus:bg-white"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
