'use client'

import React, { useState, useMemo } from 'react'
import {
  X,
  Sparkles,
  Check,
  Users,
  Building2,
  Layers,
} from 'lucide-react'
import type {
  KpiCareerMapNode,
  KpiCareerPositionSnapshot,
  KpiCriteriaApplyScope,
  KpiPositionCriteriaProfile,
} from '@/lib/kpi/career-map-types'
import {
  applyCriterionToScope,
  createCustomCriterion,
  suggestCriteriaForPosition,
} from '@/lib/kpi/career-map-criteria-service'
import { inferJobFamily } from '@/lib/kpi/career-map-service'

export interface KPICareerCriteriaLibraryDrawerProps {
  isOpen: boolean
  targetNode: KpiCareerMapNode | null
  allPositions: KpiCareerPositionSnapshot[]
  existingProfiles: KpiPositionCriteriaProfile[]
  employeeCountByPosition?: Record<string, number>
  totalStoresCount?: number
  onClose(): void
  onSaveProfiles(profiles: KpiPositionCriteriaProfile[]): void
}

type TabKey = 'homies' | 'fnb' | 'custom'

export function KPICareerCriteriaLibraryDrawer({
  isOpen,
  targetNode,
  allPositions,
  existingProfiles,
  employeeCountByPosition = {},
  totalStoresCount = 1,
  onClose,
  onSaveProfiles,
}: KPICareerCriteriaLibraryDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('homies')
  const [scopeMode, setScopeMode] = useState<'current_position' | 'job_family' | 'selected_positions'>(
    'current_position'
  )
  const [selectedPosIds, setSelectedPosIds] = useState<string[]>([])
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<string[]>([])

  // Custom Form State (4 Questions)
  const [outcome, setOutcome] = useState('')
  const [evidenceSource, setEvidenceSource] = useState('checklist')
  const [passTarget, setPassTarget] = useState('')
  const [importance, setImportance] = useState<'low' | 'medium' | 'high'>('medium')
  const [customName, setCustomName] = useState('')

  // Suggested criteria from F&B catalog
  const suggestions = useMemo(() => {
    if (!targetNode) return []
    return suggestCriteriaForPosition({
      id: targetNode.position_id,
      name: targetNode.position_name_snapshot,
      level: targetNode.position_level_snapshot,
      job_family: targetNode.job_family,
    })
  }, [targetNode])

  const homiesRecommended = useMemo(
    () => suggestions.filter((c) => c.source === 'homies_recommended'),
    [suggestions]
  )
  const fnbCommon = useMemo(
    () => suggestions.filter((c) => c.source === 'fnb_common'),
    [suggestions]
  )

  const affectedPositions = useMemo(() => {
    if (!targetNode) return []
    if (scopeMode === 'current_position') {
      return allPositions.filter((p) => p.id === targetNode.position_id)
    }
    if (scopeMode === 'job_family') {
      const family = targetNode.job_family.toLowerCase()
      return allPositions.filter(
        (p) => (p.job_family || inferJobFamily(p.name, p.id)).toLowerCase() === family
      )
    }
    return allPositions.filter((p) => selectedPosIds.includes(p.id))
  }, [targetNode, scopeMode, allPositions, selectedPosIds])

  const affectedEmployeeCount = useMemo(() => {
    return affectedPositions.reduce((sum, p) => sum + (employeeCountByPosition[p.id] || 0), 0)
  }, [affectedPositions, employeeCountByPosition])

  if (!isOpen || !targetNode) return null

  const handleApplyPredefined = () => {
    const selectedItems = suggestions.filter((s) => selectedCriteriaIds.includes(s.id))
    if (selectedItems.length === 0) return

    let currentProfiles = [...existingProfiles]
    const scope: KpiCriteriaApplyScope =
      scopeMode === 'current_position'
        ? { mode: 'current_position', position_id: targetNode.position_id }
        : scopeMode === 'job_family'
        ? { mode: 'job_family', job_family: targetNode.job_family }
        : { mode: 'selected_positions', position_ids: selectedPosIds }

    for (const item of selectedItems) {
      const res = applyCriterionToScope(scope, item, allPositions, currentProfiles)
      currentProfiles = res.updated_profiles
    }

    onSaveProfiles(currentProfiles)
    onClose()
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!outcome.trim()) return

    const customCriterion = createCustomCriterion({
      outcome: outcome.trim(),
      evidence_source: evidenceSource,
      pass_target: passTarget.trim() || '100% hoàn thành',
      importance,
      custom_name: customName.trim() || outcome.trim(),
    })

    const scope: KpiCriteriaApplyScope =
      scopeMode === 'current_position'
        ? { mode: 'current_position', position_id: targetNode.position_id }
        : scopeMode === 'job_family'
        ? { mode: 'job_family', job_family: targetNode.job_family }
        : { mode: 'selected_positions', position_ids: selectedPosIds }

    const res = applyCriterionToScope(scope, customCriterion, allPositions, existingProfiles)
    onSaveProfiles(res.updated_profiles)
    onClose()
  }

  const toggleSelectCriterion = (id: string) => {
    setSelectedCriteriaIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectPosition = (posId: string) => {
    setSelectedPosIds((prev) =>
      prev.includes(posId) ? prev.filter((id) => id !== posId) : [...prev, posId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6FA8]/10 text-[#2F6FA8]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D]">Thư viện tiêu chí F&B</h3>
              <p className="text-xs text-gray-500">
                Thêm tiêu chí cho vị trí <strong className="text-gray-800">{targetNode.position_name_snapshot}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('homies')}
            className={`pb-3 text-xs font-bold transition-colors relative ${
              activeTab === 'homies' ? 'text-[#2F6FA8]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Homies đề xuất ({homiesRecommended.length})
            {activeTab === 'homies' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F6FA8] rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fnb')}
            className={`pb-3 text-xs font-bold transition-colors relative ${
              activeTab === 'fnb' ? 'text-[#2F6FA8]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            F&B phổ biến ({fnbCommon.length})
            {activeTab === 'fnb' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F6FA8] rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-3 text-xs font-bold transition-colors relative ${
              activeTab === 'custom' ? 'text-[#2F6FA8]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            + Tạo tiêu chí riêng
            {activeTab === 'custom' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F6FA8] rounded-full" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Scope Selector */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
            <h4 className="text-xs font-bold text-[#001D3D] mb-2.5">Phạm vi áp dụng</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScopeMode('current_position')}
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  scopeMode === 'current_position'
                    ? 'border-[#2F6FA8] bg-white ring-2 ring-[#2F6FA8]/15 font-bold text-[#2F6FA8]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Chỉ vị trí này
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('job_family')}
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  scopeMode === 'job_family'
                    ? 'border-[#2F6FA8] bg-white ring-2 ring-[#2F6FA8]/15 font-bold text-[#2F6FA8]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Cùng nghề ({targetNode.job_family})
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('selected_positions')}
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  scopeMode === 'selected_positions'
                    ? 'border-[#2F6FA8] bg-white ring-2 ring-[#2F6FA8]/15 font-bold text-[#2F6FA8]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Chọn nhiều vị trí
              </button>
            </div>

            {/* Selected positions multi-select list */}
            {scopeMode === 'selected_positions' && (
              <div className="mt-3 space-y-1.5 pt-2 border-t border-gray-200/60 max-h-32 overflow-y-auto">
                {allPositions.map((pos) => {
                  const isChecked = selectedPosIds.includes(pos.id)
                  return (
                    <label
                      key={pos.id}
                      className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectPosition(pos.id)}
                        className="rounded border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8]"
                      />
                      <span>{pos.name} (Cấp {pos.level})</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* Impact Summary */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200/60">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-gray-400" />
                <strong className="font-mono text-gray-700">{affectedPositions.length}</strong> vị trí
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                <strong className="font-mono text-gray-700">{affectedEmployeeCount}</strong> nhân sự
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <strong className="font-mono text-gray-700">{totalStoresCount}</strong> chi nhánh
              </span>
            </div>
          </div>

          {/* Tab 1: Homies Recommended */}
          {activeTab === 'homies' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Tick chọn các tiêu chí Homies chuẩn hoá riêng cho vai trò này:
              </p>
              {homiesRecommended.map((item) => {
                const isSelected = selectedCriteriaIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelectCriterion(item.id)}
                    className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2F6FA8] bg-blue-50/40 ring-2 ring-[#2F6FA8]/15'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-[#2F6FA8] bg-[#2F6FA8] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#001D3D]">{item.name}</h4>
                        <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{item.description}</p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">
                            Nguồn: {item.evidence_source}
                          </span>
                          <span>•</span>
                          <span>Đạt: {item.pass_target}</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#2F6FA8] shrink-0">
                      ~{item.suggested_weight}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tab 2: F&B Common */}
          {activeTab === 'fnb' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Các tiêu chí vận hành F&B phổ biến phù hợp áp dụng bổ sung:
              </p>
              {fnbCommon.map((item) => {
                const isSelected = selectedCriteriaIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelectCriterion(item.id)}
                    className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2F6FA8] bg-blue-50/40 ring-2 ring-[#2F6FA8]/15'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-[#2F6FA8] bg-[#2F6FA8] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#001D3D]">{item.name}</h4>
                        <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{item.description}</p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">
                            Nguồn: {item.evidence_source}
                          </span>
                          <span>•</span>
                          <span>Đạt: {item.pass_target}</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#2F6FA8] shrink-0">
                      ~{item.suggested_weight}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tab 3: Custom Form (4 Plain-Language Questions) */}
          {activeTab === 'custom' && (
            <form onSubmit={handleApplyCustom} className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-900 leading-relaxed flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-[#2F6FA8] shrink-0 mt-0.5" />
                <span>Trả lời 4 câu hỏi đơn giản, hệ thống sẽ tự động cấu hình cách đo lường và trọng số phù hợp.</span>
              </div>

              {/* Question 1 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#001D3D]">
                  1. Bạn muốn nhân viên làm tốt việc gì?
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giảm món làm sai công thức, Mở ca đúng giờ..."
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#001D3D] placeholder-gray-400 focus:border-[#2F6FA8] focus:outline-none"
                />
              </div>

              {/* Custom Name (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Tên hiển thị tiêu chí (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Để trống sẽ tự đặt theo mục tiêu"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#001D3D] placeholder-gray-400 focus:border-[#2F6FA8] focus:outline-none"
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#001D3D]">
                  2. Kết quả kiểm tra lấy từ đâu?
                </label>
                <select
                  value={evidenceSource}
                  onChange={(e) => setEvidenceSource(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#001D3D] focus:border-[#2F6FA8] focus:outline-none"
                >
                  <option value="checklist">Checklist mở/đóng ca (Nhập hằng ngày)</option>
                  <option value="pos">Dữ liệu máy bán hàng POS (Tự động)</option>
                  <option value="shift_log">Nhật ký ca / Sự cố</option>
                  <option value="manager_rating">Quản lý trực tiếp chấm điểm</option>
                  <option value="peer_review">Đánh giá đồng nghiệp ẩn danh</option>
                </select>
              </div>

              {/* Question 3 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#001D3D]">
                  3. Bao nhiêu được xem là đạt?
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Không quá 2 món sai/tháng, Đạt 100% checklist..."
                  value={passTarget}
                  onChange={(e) => setPassTarget(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#001D3D] placeholder-gray-400 focus:border-[#2F6FA8] focus:outline-none"
                />
              </div>

              {/* Question 4 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#001D3D]">
                  4. Tiêu chí này quan trọng ở mức nào?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportance('low')}
                    className={`rounded-xl border p-2 text-center text-xs transition-all ${
                      importance === 'low'
                        ? 'border-[#2F6FA8] bg-blue-50/50 font-bold text-[#2F6FA8]'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    Thấp (10%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportance('medium')}
                    className={`rounded-xl border p-2 text-center text-xs transition-all ${
                      importance === 'medium'
                        ? 'border-[#2F6FA8] bg-blue-50/50 font-bold text-[#2F6FA8]'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    Vừa (20%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportance('high')}
                    className={`rounded-xl border p-2 text-center text-xs transition-all ${
                      importance === 'high'
                        ? 'border-[#2F6FA8] bg-blue-50/50 font-bold text-[#2F6FA8]'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    Cao (30%)
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#2F6FA8] py-2.5 text-xs font-bold text-white hover:bg-[#1D3E61] transition-colors"
                >
                  Tạo và áp dụng tiêu chí
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions for Predefined Tabs */}
        {activeTab !== 'custom' && (
          <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Đã chọn <strong className="font-mono text-[#001D3D]">{selectedCriteriaIds.length}</strong> tiêu chí
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={selectedCriteriaIds.length === 0}
                onClick={handleApplyPredefined}
                className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Áp dụng tiêu chí đã chọn
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
