'use client'

import React, { useMemo, useState } from 'react'
import {
  Compass,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react'
import {
  DEFAULT_CAREER_TRANSITION_PRESETS,
  type KpiCareerMapVersion,
  type KpiPositionCriteriaProfile,
  type KpiCareerPositionSnapshot,
} from '@/lib/kpi/career-map-types'

export interface KPICareerMapReadOnlyProps {
  map: KpiCareerMapVersion | null
  profiles?: KpiPositionCriteriaProfile[]
  positions?: KpiCareerPositionSnapshot[]
  currentPositionId?: string
  employeeName?: string
  storeName?: string
  role?: string
}

export function KPICareerMapReadOnly({
  map,
  profiles = [],
  currentPositionId,
  employeeName,
  storeName,
}: KPICareerMapReadOnlyProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Determine current node
  const currentNode = useMemo(() => {
    if (!map || !currentPositionId) return null
    return map.nodes.find((n) => n.position_id === currentPositionId) || null
  }, [map, currentPositionId])

  // Active nodes & edges
  const activeNodes = useMemo(() => map?.nodes.filter((n) => n.active) || [], [map])
  const activeEdges = useMemo(() => map?.edges.filter((e) => e.active) || [], [map])

  // Group nodes by job family
  const branches = useMemo(() => {
    const mapByFamily = new Map<string, typeof activeNodes>()
    for (const node of activeNodes) {
      const family = node.job_family || 'general'
      if (!mapByFamily.has(family)) {
        mapByFamily.set(family, [])
      }
      mapByFamily.get(family)!.push(node)
    }

    // Sort nodes within family by level ascending
    for (const nodes of mapByFamily.values()) {
      nodes.sort((a, b) => a.position_level_snapshot - b.position_level_snapshot)
    }

    return Array.from(mapByFamily.entries()).map(([family, nodes]) => ({
      family,
      name:
        family === 'barista'
          ? 'Nhánh Pha Chế (Barista)'
          : family === 'cashier'
          ? 'Nhánh Thu Ngân'
          : family === 'service'
          ? 'Nhánh Phục Vụ'
          : family === 'kitchen'
          ? 'Nhánh Bếp'
          : family === 'management'
          ? 'Nhánh Quản Lý Cửa Hàng'
          : 'Lộ Trình Chung',
      nodes,
    }))
  }, [activeNodes])

  // Next possible positions for current node
  const nextTargetNodes = useMemo(() => {
    if (!currentNode || !map) return []
    const outgoingEdges = activeEdges.filter((e) => e.source_node_id === currentNode.id)
    const targetIds = new Set(outgoingEdges.map((e) => e.target_node_id))
    return activeNodes.filter((n) => targetIds.has(n.id))
  }, [currentNode, map, activeEdges, activeNodes])

  // Selected node details
  const activeSelectedNode = useMemo(() => {
    const targetId = selectedNodeId || currentNode?.id || activeNodes[0]?.id
    return activeNodes.find((n) => n.id === targetId) || null
  }, [selectedNodeId, currentNode, activeNodes])

  const activeSelectedProfile = useMemo(() => {
    if (!activeSelectedNode) return null
    return (
      profiles.find(
        (p) =>
          (activeSelectedNode.grade_code && p.grade_codes?.includes(activeSelectedNode.grade_code)) ||
          p.id === activeSelectedNode.criteria_profile_id ||
          p.position_ids.includes(activeSelectedNode.position_id)
      ) || null
    )
  }, [activeSelectedNode, profiles])

  const incomingEdgesForSelected = useMemo(() => {
    if (!activeSelectedNode) return []
    return activeEdges.filter((e) => e.target_node_id === activeSelectedNode.id)
  }, [activeSelectedNode, activeEdges])

  if (!map) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-xs">
        <Compass className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-3 text-base font-bold text-[#001D3D]">
          Chưa có Sơ đồ Lộ trình được phát hành
        </h3>
        <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          HR Admin hoặc Ban Giám Đốc đang xây dựng sơ đồ chuẩn cho toàn chuỗi Homies. Sơ đồ sẽ hiển thị ngay khi được phê duyệt.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Employee Context */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2F6FA8] text-white shadow-xs">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#001D3D]">
                  Bản Đồ Phát Triển Sự Nghiệp Chuẩn Homies
                </h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Bản v{map.version} Đang áp dụng
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-600">
                {employeeName ? `Nhân viên: ${employeeName}` : 'Lộ trình minh bạch toàn hệ thống'}
                {storeName && ` • Chi nhánh: ${storeName}`}
                {currentNode && ` • Vị trí hiện tại: `}
                {currentNode && (
                  <span className="font-bold text-[#2F6FA8]">
                    {currentNode.position_name_snapshot} (Cấp {currentNode.position_level_snapshot})
                  </span>
                )}
              </p>
            </div>
          </div>

          {nextTargetNodes.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-blue-200/80 px-3.5 py-2 text-xs">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Mục tiêu kế tiếp ({nextTargetNodes.length} hướng)
                </span>
                <span className="font-bold text-[#001D3D]">
                  {nextTargetNodes.map((n) => n.position_name_snapshot).join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Visual Map View + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Branch progression lanes */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#2F6FA8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Các Nhánh Lộ Trình ({branches.length} nhánh)
                </h3>
              </div>
              <span className="text-[11px] text-gray-400">
                Nhấp vào từng chức danh để xem chi tiết tiêu chí
              </span>
            </div>

            <div className="space-y-6">
              {branches.map((branch) => (
                <div
                  key={branch.family}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition hover:bg-gray-50/80"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-[#2F6FA8]" />
                      {branch.name}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 font-semibold">
                      {branch.nodes.length} Cấp bậc
                    </span>
                  </div>

                  {/* Horizontal progression chain */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {branch.nodes.map((node, index) => {
                      const isCurrent = currentNode?.id === node.id
                      const isSelected = activeSelectedNode?.id === node.id
                      const isNext = nextTargetNodes.some((n) => n.id === node.id)

                      return (
                        <React.Fragment key={node.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedNodeId(node.id)}
                            className={`group relative flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left transition shadow-2xs ${
                              isSelected
                                ? 'bg-[#2F6FA8] text-white ring-2 ring-[#2F6FA8]/30 shadow-sm'
                                : isCurrent
                                ? 'bg-emerald-50 text-emerald-950 border-2 border-emerald-500 font-bold'
                                : isNext
                                ? 'bg-amber-50 text-amber-950 border-2 border-amber-400 font-bold animate-pulse'
                                : 'bg-white text-gray-800 border border-gray-200/80 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {/* Level Badge */}
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-mono font-bold ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : isCurrent
                                  ? 'bg-emerald-500 text-white'
                                  : isNext
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {node.position_level_snapshot}
                            </span>

                            <div className="min-w-0 pr-1">
                              <p
                                className={`text-xs font-bold truncate ${
                                  isSelected ? 'text-white' : 'text-[#001D3D]'
                                }`}
                              >
                                {node.position_name_snapshot}
                              </p>
                              <p
                                className={`text-[10px] ${
                                  isSelected
                                    ? 'text-blue-100'
                                    : isCurrent
                                    ? 'text-emerald-700 font-semibold'
                                    : 'text-gray-400'
                                }`}
                              >
                                {isCurrent
                                  ? '● Vị trí của bạn'
                                  : isNext
                                  ? '★ Mục tiêu tiếp theo'
                                  : `Cấp bậc ${node.position_level_snapshot}`}
                              </p>
                            </div>
                          </button>

                          {/* Arrow between sequential levels */}
                          {index < branch.nodes.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Position Inspector */}
        <div className="lg:col-span-4">
          {activeSelectedNode ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-5 sticky top-20">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#2F6FA8]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Chi Tiết Chức Danh
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-[#001D3D]">
                  {activeSelectedNode.position_name_snapshot}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-semibold text-[#2F6FA8]">
                    Cấp bậc {activeSelectedNode.position_level_snapshot}
                  </span>
                  <span>•</span>
                  <span>Nhánh {activeSelectedNode.job_family || 'Chung'}</span>
                </div>
              </div>

              {/* Transition prerequisites */}
              {incomingEdgesForSelected.length > 0 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FA8] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Điều kiện thăng tiến vào vị trí
                  </span>
                  <div className="space-y-1.5 text-xs text-gray-700">
                    {incomingEdgesForSelected.map((edge) => {
                      const preset =
                        map.transition_presets?.[edge.preset_key] ||
                        DEFAULT_CAREER_TRANSITION_PRESETS[edge.preset_key] ||
                        DEFAULT_CAREER_TRANSITION_PRESETS.same_profession_level_up

                      return (
                        <div key={edge.id} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>{preset.name || preset.preset_name}</strong> (v{preset.version || edge.preset_version || 1}): Duy trì tối thiểu{' '}
                            <strong>{preset.required_months || preset.required_good_months || 3} tháng</strong> đạt điểm KPI &gt;={' '}
                            <strong>{preset.min_score || preset.min_kpi_score || 80} điểm</strong>.
                            {(preset.challenge_required || Boolean(preset.trial_shift_count)) && ' (Bắt buộc hoàn thành thử thách vận hành)'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Criteria List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Bộ Tiêu Chí Đánh Giá ({activeSelectedProfile?.criteria.length || 0})
                  </span>
                  <span className="text-[11px] font-bold text-[#2F6FA8]">100% Trọng số</span>
                </div>

                {activeSelectedProfile && activeSelectedProfile.criteria.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {activeSelectedProfile.criteria.map((crit) => (
                      <div
                        key={crit.id}
                        className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-[#001D3D]">{crit.name}</span>
                          <span className="rounded-md bg-blue-100/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#2F6FA8] shrink-0">
                            {crit.weight}%
                          </span>
                        </div>
                        {crit.description && (
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            {crit.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-400">
                          <span>Nguồn: {crit.evidence_source}</span>
                          <span>•</span>
                          <span>Định dạng: {crit.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500">
                    Vị trí này đang áp dụng bộ tiêu chí khung tiêu chuẩn Homies.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-xs text-gray-400">
              Chọn một vị trí trên sơ đồ để xem điều kiện và tiêu chí.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
