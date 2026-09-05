'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  Users,
  Store,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import type {
  KpiCareerPositionSnapshot,
} from '@/lib/kpi/career-map-types'
import { PROMOTION_PRESETS, type PromotionPresetKey } from '@/lib/kpi/program-service'

export type KPISingleStageExceptionPanelProps = {
  positions: KpiCareerPositionSnapshot[]
  stores: Array<{ id: string; name: string }>
  employees?: Array<{ id: string; name: string; position_id: string; store_id: string }>
  onCreateDraftException(params: {
    sourcePositionId: string
    targetPositionId: string
    presetKey: PromotionPresetKey
    customMinScore: number
    customRequiredMonths: number
    storeIds: string[] | 'all'
    effectiveFrom: string
  }): void | Promise<void>
}

export function KPISingleStageExceptionPanel({
  positions = [],
  stores = [],
  employees = [],
  onCreateDraftException,
}: KPISingleStageExceptionPanelProps) {
  const activePositions = useMemo(() => {
    return positions.filter((p) => p.active !== false)
  }, [positions])

  const [sourcePositionId, setSourcePositionId] = useState<string>(activePositions[0]?.id || '')
  useEffect(() => {
    if (!sourcePositionId && activePositions[0]) {
      setSourcePositionId(activePositions[0].id)
    }
  }, [activePositions, sourcePositionId])
  const sourcePosition = useMemo(() => {
    return activePositions.find((p) => p.id === sourcePositionId) || null
  }, [activePositions, sourcePositionId])

  // Potential targets are adjacent higher-level positions (level = source.level + 1)
  const validTargetPositions = useMemo(() => {
    if (!sourcePosition) return []
    const sourceLevel = sourcePosition.level || 1
    return activePositions.filter((p) => (p.level || 1) === sourceLevel + 1)
  }, [activePositions, sourcePosition])

  const [targetPositionId, setTargetPositionId] = useState<string>('')
  const targetPosition = useMemo(() => {
    return validTargetPositions.find((p) => p.id === targetPositionId) || validTargetPositions[0] || null
  }, [validTargetPositions, targetPositionId])

  // Preset selection
  const [selectedPresetKey, setSelectedPresetKey] = useState<PromotionPresetKey>('employee_to_core')
  const activePreset = PROMOTION_PRESETS[selectedPresetKey]

  const [customMinScore, setCustomMinScore] = useState<number>(activePreset.min_score * 20)
  const [customRequiredMonths, setCustomRequiredMonths] = useState<number>(activePreset.required_months)
  const [isCreating, setIsCreating] = useState(false)

  // Store scope
  const [storeScope, setStoreScope] = useState<'all' | 'specific'>('all')
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([])

  // Effective date (first of next month)
  const defaultEffectiveDate = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1, 1)
    return d.toISOString().slice(0, 10)
  }, [])
  const [effectiveFrom, setEffectiveFrom] = useState<string>(defaultEffectiveDate)

  // Live impact calculation
  const impactedEmployees = useMemo(() => {
    if (!sourcePosition) return []
    return employees.filter((emp) => {
      if (emp.position_id !== sourcePosition.id) return false
      if (storeScope === 'specific' && !selectedStoreIds.includes(emp.store_id)) return false
      return true
    })
  }, [employees, sourcePosition, storeScope, selectedStoreIds])

  const handleCreateDraft = async () => {
    if (!sourcePosition) {
      toast.error('Vui lòng chọn chức danh nguồn.')
      return
    }
    const finalTargetId = targetPosition?.id || validTargetPositions[0]?.id
    if (!finalTargetId) {
      toast.error('Chưa có chức danh đích liền kề phù hợp.')
      return
    }

    if (customMinScore < 50 || customMinScore > 100) {
      toast.error('Điểm KPI yêu cầu phải từ 50 đến 100.')
      return
    }

    if (customRequiredMonths < 1 || customRequiredMonths > 24) {
      toast.error('Số tháng đánh giá phải từ 1 đến 24 tháng.')
      return
    }

    if (storeScope === 'specific' && selectedStoreIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một cửa hàng áp dụng.')
      return
    }

    if (!effectiveFrom) {
      toast.error('Vui lòng chọn ngày bắt đầu áp dụng.')
      return
    }

    const payload = {
      sourcePositionId: sourcePosition.id,
      targetPositionId: finalTargetId,
      presetKey: selectedPresetKey,
      customMinScore,
      customRequiredMonths,
      storeIds: storeScope === 'all' ? ('all' as const) : selectedStoreIds,
      effectiveFrom,
    }

    setIsCreating(true)
    try {
      await onCreateDraftException(payload)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo bản nháp ngoại lệ.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
      {/* HEADER */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#001D3D]">Thiết Lập Ngoại Lệ Đơn Chặng</h3>
            <p className="text-xs text-gray-500">
              Điều chỉnh riêng quy tắc thăng tiến cho 1 cặp vị trí cụ thể mà không phá vỡ cấu trúc sơ đồ tổng thể.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#2F6FA8]">
          <Sparkles size={13} />
          <span>Tạo bản nháp riêng biệt</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CỘT TRÁI: CẤU HÌNH NGOẠI LỆ */}
        <div className="space-y-4">
          {/* 1. Chọn chặng chuyển đổi */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              1. Chọn Cặp Chức Danh Chuyển Đổi
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Chức danh xuất phát</label>
                <select
                  value={sourcePositionId}
                  onChange={(e) => {
                    setSourcePositionId(e.target.value)
                    setTargetPositionId('')
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#2F6FA8] focus:outline-hidden"
                >
                  {activePositions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name} (Cấp {pos.level || 1})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Chức danh mục tiêu (Cấp +1)</label>
                {validTargetPositions.length > 0 ? (
                  <select
                    value={targetPosition?.id || ''}
                    onChange={(e) => setTargetPositionId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#2F6FA8] focus:outline-hidden"
                  >
                    {validTargetPositions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name} (Cấp {pos.level || 1})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    Không có chức danh liền kề cấp {((sourcePosition?.level || 1) + 1)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Tiêu chuẩn thăng tiến ngoại lệ */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              2. Tiêu Chuẩn &amp; Quy Tắc Xét Thăng Tiến
            </span>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Mẫu quy tắc áp dụng</label>
              <select
                value={selectedPresetKey}
                onChange={(e) => {
                  const key = e.target.value as PromotionPresetKey
                  setSelectedPresetKey(key)
                  const preset = PROMOTION_PRESETS[key]
                  setCustomMinScore(preset.min_score * 20)
                  setCustomRequiredMonths(preset.required_months)
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#2F6FA8] focus:outline-hidden"
              >
                <option value="employee_to_core">Lên cấp nghề chuyên môn</option>
                <option value="employee_to_leader">Bổ nhiệm Trưởng ca</option>
                <option value="leader_to_supervisor">Lên giám sát vận hành</option>
                <option value="supervisor_to_manager">Bổ nhiệm Quản lý cửa hàng</option>
                <option value="manager_to_area">Lên Quản lý khu vực</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Điểm KPI tối thiểu (&ge;)</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={customMinScore}
                  onChange={(e) => setCustomMinScore(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-[#001D3D] focus:border-[#2F6FA8] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Số tháng đạt chuẩn liên tiếp</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={customRequiredMonths}
                  onChange={(e) => setCustomRequiredMonths(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-[#001D3D] focus:border-[#2F6FA8] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 3. Phạm vi áp dụng & Ngày hiệu lực */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              3. Phạm Vi Cửa Hàng &amp; Hiệu Lực
            </span>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="storeScope"
                  checked={storeScope === 'all'}
                  onChange={() => setStoreScope('all')}
                  className="text-[#2F6FA8]"
                />
                <span>Toàn bộ hệ thống quán</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="storeScope"
                  checked={storeScope === 'specific'}
                  onChange={() => setStoreScope('specific')}
                  className="text-[#2F6FA8]"
                />
                <span>Quán cụ thể</span>
              </label>
            </div>

            {storeScope === 'specific' && (
              <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2.5 space-y-1">
                {stores.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-50 p-1 rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStoreIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStoreIds([...selectedStoreIds, s.id])
                        } else {
                          setSelectedStoreIds(selectedStoreIds.filter((id) => id !== s.id))
                        }
                      }}
                      className="rounded text-[#2F6FA8]"
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Ngày bắt đầu áp dụng</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#2F6FA8] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC TÁC ĐỘNG & HÀNH ĐỘNG */}
        <div className="flex flex-col justify-between rounded-xl border border-blue-100 bg-blue-50/40 p-5 space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2F6FA8]">
              <Sparkles size={15} />
              <span>Xem Trước Tác Động Thực Tế (Live Preview)</span>
            </div>

            {/* Stage Summary Card */}
            <div className="rounded-xl border border-blue-200/70 bg-white p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span className="text-gray-600">{sourcePosition?.name || '---'}</span>
                <ArrowRight size={14} className="text-[#2F6FA8]" />
                <span className="text-[#2F6FA8]">{targetPosition?.name || '---'}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 border border-amber-200">
                  KPI &gt;= {customMinScore} điểm
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-800 border border-blue-200">
                  Liên tiếp {customRequiredMonths} tháng
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 border border-emerald-200">
                  Hiệu lực từ {effectiveFrom}
                </span>
              </div>
            </div>

            {/* Impact Metric Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-white p-3.5 space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users size={14} className="text-[#2F6FA8]" />
                  <span>Nhân sự đang giữ vị trí</span>
                </div>
                <div className="text-xl font-bold font-mono text-[#001D3D]">
                  {impactedEmployees.length} <span className="text-xs font-normal text-gray-500">nhân viên</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-3.5 space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Store size={14} className="text-amber-600" />
                  <span>Phạm vi cửa hàng</span>
                </div>
                <div className="text-xl font-bold font-mono text-[#001D3D]">
                  {storeScope === 'all' ? stores.length : selectedStoreIds.length}{' '}
                  <span className="text-xs font-normal text-gray-500">cửa hàng</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-xs text-amber-900 space-y-1 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-amber-700" />
                <span>Quy trình an toàn Homies:</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Thao tác này chỉ tạo hoặc cập nhật bản nháp lộ trình (Draft). Sơ đồ chỉ có hiệu lực vận hành chính thức sau khi HR Admin gửi duyệt và CEO ban hành.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={handleCreateDraft}
              disabled={!sourcePosition || !targetPosition || isCreating}
              className="w-full bg-[#2F6FA8] hover:bg-[#1D3E61] text-white font-semibold py-2.5 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{isCreating ? 'Đang tạo bản nháp...' : 'Tạo Bản Nháp Ngoại Lệ Lộ Trình'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
