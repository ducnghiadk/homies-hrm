'use client'

import React from 'react'
import {
  Plus,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react'
import type {
  KpiCareerMapEdge,
  KpiCareerMapNode,
  KpiCareerMapVersion,
  KpiPositionCriteriaProfile,
} from '@/lib/kpi/career-map-types'
import { DEFAULT_CAREER_TRANSITION_PRESETS } from '@/lib/kpi/career-map-types'
import { removeCareerMapEdge, removeCareerMapNode, updateSharedPreset } from '@/lib/kpi/career-map-service'
import { rebalanceCriteriaWeights } from '@/lib/kpi/career-map-criteria-service'
import { toast } from 'sonner'

export interface KPICareerMapInspectorProps {
  map: KpiCareerMapVersion
  selectedNode: KpiCareerMapNode | null
  selectedEdge: KpiCareerMapEdge | null
  profile: KpiPositionCriteriaProfile | null
  employeeCount?: number
  storeCount?: number
  readOnly?: boolean
  onOpenCriteriaDrawer(): void
  onUpdateProfile(profile: KpiPositionCriteriaProfile): void
  onChange(next: KpiCareerMapVersion): void
  onClose(): void
}

export function KPICareerMapInspector({
  map,
  selectedNode,
  selectedEdge,
  profile,
  employeeCount = 0,
  storeCount = 1,
  readOnly = false,
  onOpenCriteriaDrawer,
  onUpdateProfile,
  onChange,
  onClose,
}: KPICareerMapInspectorProps) {
  const [editingPreset, setEditingPreset] = React.useState(false)
  const [editMonths, setEditMonths] = React.useState(3)
  const [editHours, setEditHours] = React.useState(350)
  const [editMinScore, setEditMinScore] = React.useState(80)

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-gray-400">
        <Layers className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-xs font-semibold text-gray-600">Chưa chọn đối tượng nào</p>
        <p className="mt-1 text-[11px] text-gray-400">
          Bấm vào một vị trí hoặc đường nối trên sơ đồ để xem và chỉnh sửa chi tiết.
        </p>
      </div>
    )
  }

  // Edge Inspector View
  if (selectedEdge) {
    const sourceNode = map.nodes.find((n) => n.id === selectedEdge.source_node_id)
    const targetNode = map.nodes.find((n) => n.id === selectedEdge.target_node_id)
    const preset =
      map.transition_presets?.[selectedEdge.preset_key] ||
      DEFAULT_CAREER_TRANSITION_PRESETS[selectedEdge.preset_key] ||
      DEFAULT_CAREER_TRANSITION_PRESETS.same_profession_level_up

    const handleDeleteEdge = () => {
      if (readOnly) return
      const nextMap = removeCareerMapEdge(map, selectedEdge.id)
      onChange(nextMap)
      onClose()
    }

    const handleSavePreset = () => {
      if (readOnly) return
      const currentPresets = map.transition_presets || { ...DEFAULT_CAREER_TRANSITION_PRESETS }
      const res = updateSharedPreset(currentPresets, map, selectedEdge.preset_key, {
        required_good_months: Number(editMonths),
        required_months: Number(editMonths),
        min_kpi_score: Number(editMinScore),
        min_score: Number(editMinScore),
        min_hours: Number(editHours),
      })
      onChange(res.map)
      setEditingPreset(false)
      toast.success(`Đã cập nhật quy tắc "${preset.preset_name || preset.name}" (v${res.presets[selectedEdge.preset_key].version}) cho ${res.affectedEdgeCount} đường nối cùng loại.`)
    }

    const sourceLabel = sourceNode?.grade_name_snapshot || sourceNode?.position_name_snapshot || 'Nguồn'
    const targetLabel = targetNode?.grade_name_snapshot || targetNode?.position_name_snapshot || 'Đích'

    // Determine authority by target rank/grade
    const isToManager = targetNode?.grade_code === 'c5' || targetNode?.position_level_snapshot === 5
    const isToLeader = targetNode?.grade_code === 'c4' || targetNode?.position_level_snapshot === 4
    const authorityLabel = isToManager ? 'CEO phê duyệt' : isToLeader ? 'HR Admin phê duyệt' : 'Cửa hàng trưởng phê duyệt'

    return (
      <div className="flex h-full flex-col bg-white">
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-[#2F6FA8]/10 px-2 py-0.5 text-xs font-bold text-[#2F6FA8]">
                Đường nối chuyển cấp
              </span>
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-gray-600">
                v{preset.version || selectedEdge.preset_version || 1}
              </span>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={handleDeleteEdge}
                className="text-gray-400 hover:text-rose-600 transition-colors"
                title="Xoá đường nối"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <h3 className="mt-2 text-sm font-bold text-[#001D3D]">{preset.name || preset.preset_name}</h3>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-600">
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-bold text-gray-800 line-clamp-1">
              {sourceLabel}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-bold text-gray-800 line-clamp-1">
              {targetLabel}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#001D3D] flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#2F6FA8]" />
                Điều kiện xét tăng bậc (Preset dùng chung)
              </h4>
              {!readOnly && !editingPreset && (
                <button
                  type="button"
                  onClick={() => {
                    setEditMonths(preset.required_months || preset.required_good_months || 3)
                    setEditHours(preset.min_hours || 350)
                    setEditMinScore(preset.min_score || preset.min_kpi_score || 80)
                    setEditingPreset(true)
                  }}
                  className="text-[11px] font-bold text-[#2F6FA8] hover:underline"
                >
                  Sửa quy tắc
                </button>
              )}
            </div>

            {editingPreset ? (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Thâm niên / Số tháng KPI liên tiếp:</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={editMonths}
                    onChange={(e) => setEditMonths(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 rounded-lg border border-gray-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Số giờ làm tích lũy tối thiểu (Part-time):</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={editHours}
                    onChange={(e) => setEditHours(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 rounded-lg border border-gray-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Điểm KPI tối thiểu (%):</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={editMinScore}
                    onChange={(e) => setEditMinScore(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 rounded-lg border border-gray-300 text-xs font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSavePreset}
                    className="flex-1 bg-[#2F6FA8] text-white p-1.5 rounded-lg font-bold hover:bg-[#1D3E61]"
                  >
                    Lưu cấu hình Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPreset(false)}
                    className="bg-gray-200 text-gray-700 p-1.5 rounded-lg font-bold"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-gray-600">
                <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-1.5">
                  <span className="text-gray-500">Thâm niên / Số tháng KPI:</span>
                  <span className="font-semibold text-gray-800">
                    {preset.required_months || preset.required_good_months || 3} tháng liên tiếp
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-1.5">
                  <span className="text-gray-500">Giờ tích lũy tối thiểu:</span>
                  <span className="font-semibold text-gray-800">
                    ≥ {preset.min_hours || 350} giờ
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-1.5">
                  <span className="text-gray-500">Điểm KPI sàn:</span>
                  <span className="font-semibold text-gray-800">
                    ≥ {preset.min_score || preset.min_kpi_score || 80} điểm
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-1.5">
                  <span className="text-gray-500">Kỹ năng bắt buộc:</span>
                  <span className="font-semibold text-emerald-700">
                    Pha chế + Thu ngân (Đa năng)
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-1.5">
                  <span className="text-gray-500">Thẩm quyền phê duyệt:</span>
                  <span className="font-bold text-[#001D3D]">
                    {authorityLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-[11px] text-blue-900 leading-relaxed">
            Quy tắc chuyển cấp được quản lý tập trung và áp dụng thống nhất cho toàn chuỗi Homies. Đạt đủ điều kiện chỉ đưa vào danh sách &quot;Sẵn sàng xét duyệt&quot;, không tự ý đổi bậc hay tăng lương tự động.
          </div>
        </div>
      </div>
    )
  }

  if (!selectedNode) {
    return null
  }

  // Node Inspector View
  const criteriaList = profile?.criteria || []
  const totalWeight = criteriaList.reduce((sum, c) => sum + c.weight, 0)
  const isWeightValid = totalWeight === 100

  const handleToggleLock = (critId: string) => {
    if (readOnly || !profile) return
    const updatedCriteria = profile.criteria.map((c) =>
      c.id === critId ? { ...c, locked: !c.locked } : c
    )
    onUpdateProfile({ ...profile, criteria: updatedCriteria })
  }

  const handleDeleteCriterion = (critId: string) => {
    if (readOnly || !profile) return
    const filtered = profile.criteria.filter((c) => c.id !== critId)
    const rebalanced = rebalanceCriteriaWeights(filtered)
    onUpdateProfile({ ...profile, criteria: rebalanced })
  }

  const handleDeleteNode = () => {
    if (readOnly) return
    const nextMap = removeCareerMapNode(map, selectedNode.id)
    onChange(nextMap)
    onClose()
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Node Header */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 font-mono">
            Cấp {selectedNode.position_level_snapshot || 1}
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={handleDeleteNode}
              className="text-gray-400 hover:text-rose-600 transition-colors"
              title="Xoá vị trí khỏi sơ đồ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <h3 className="mt-2 text-sm font-bold text-[#001D3D]">
          {selectedNode.position_name_snapshot}
        </h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span>
            <strong className="font-mono font-semibold text-gray-700">{employeeCount}</strong> nhân sự
          </span>
          <span>•</span>
          <span>
            <strong className="font-mono font-semibold text-gray-700">{storeCount}</strong> chi nhánh
          </span>
        </div>
      </div>

      {/* Criteria Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-[#001D3D]">Bộ tiêu chí đánh giá</h4>
            <p className="text-[11px] text-gray-500">Áp dụng theo công việc đang làm</p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={onOpenCriteriaDrawer}
              className="inline-flex items-center gap-1 rounded-lg bg-[#2F6FA8] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#1D3E61] transition-colors"
            >
              <Plus className="h-3 w-3" />
              Thêm tiêu chí
            </button>
          )}
        </div>

        {/* Total Weight Status */}
        <div
          className={`flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold border ${
            isWeightValid
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isWeightValid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
            <span>Tổng trọng số:</span>
          </div>
          <span className="font-mono font-bold text-sm">{totalWeight}%</span>
        </div>

        {/* Criteria Items List */}
        <div className="space-y-2">
          {criteriaList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
              Chưa có tiêu chí nào cho vị trí này. Bấm &quot;Thêm tiêu chí&quot; để chọn từ thư viện F&amp;B.
            </div>
          ) : (
            criteriaList.map((crit) => (
              <div
                key={crit.id}
                className="group relative rounded-xl border border-gray-200 bg-white p-3 shadow-2xs hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-[#001D3D]">{crit.name}</h5>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600 font-medium">
                        {crit.evidence_source}
                      </span>
                      <span>Mục tiêu: {crit.pass_target || 'Đạt'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#2F6FA8]">
                      {crit.weight}%
                    </span>
                    {!readOnly && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleLock(crit.id)}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            crit.locked ? 'text-amber-600' : 'text-gray-300'
                          }`}
                          title={crit.locked ? 'Đang khóa trọng số' : 'Khóa trọng số'}
                        >
                          {crit.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCriterion(crit.id)}
                          className="p-1 rounded hover:bg-rose-50 text-gray-300 hover:text-rose-600"
                          title="Xóa tiêu chí"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
