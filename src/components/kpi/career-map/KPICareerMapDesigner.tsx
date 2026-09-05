'use client'

import React, { useState, useMemo } from 'react'
import {
  Layers,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { KPICareerPositionTray } from './KPICareerPositionTray'
import { KPICareerMapCanvas } from './KPICareerMapCanvas'
import { KPICareerMapInspector } from './KPICareerMapInspector'
import { KPICareerCriteriaLibraryDrawer } from './KPICareerCriteriaLibraryDrawer'
import { KPICareerMapValidationPanel } from './KPICareerMapValidationPanel'
import type {
  KpiCareerMapVersion,
  KpiCareerPositionSnapshot,
  KpiPositionCriteriaProfile,
  CareerMapAggregateChange,
} from '@/lib/kpi/career-map-types'
import type { CareerGradeCode } from '@/lib/kpi/career-grade-types'
import {
  addCareerPosition,
  applyHomiesCareerTemplate,
  validateCareerMap,
} from '@/lib/kpi/career-map-service'

export interface KPICareerMapDesignerProps {
  map: KpiCareerMapVersion
  positions: KpiCareerPositionSnapshot[]
  profiles?: KpiPositionCriteriaProfile[]
  employeeCountByPosition?: Record<string, number>
  totalStoresCount?: number
  readOnly?: boolean
  userRole?: string
  selectedNodeId?: string | null
  selectedEdgeId?: string | null
  rightPanelSlot?: React.ReactNode
  onAggregateChange(change: CareerMapAggregateChange): void
  onSelectNode(nodeId: string | null): void
  onSelectEdge(edgeId: string | null): void
}

export function KPICareerMapDesigner({
  map,
  positions,
  profiles = [],
  employeeCountByPosition = {},
  totalStoresCount = 1,
  readOnly = false,
  userRole,
  selectedNodeId = null,
  selectedEdgeId = null,
  rightPanelSlot,
  onAggregateChange,
  onSelectNode,
  onSelectEdge,
}: KPICareerMapDesignerProps) {
  const [showTray, setShowTray] = useState(true)
  const [activeRightTab, setActiveRightTab] = useState<'inspector' | 'validation'>('inspector')
  const [isCriteriaDrawerOpen, setIsCriteriaDrawerOpen] = useState(false)

  const validation = validateCareerMap({ map, profiles })
  const activeNodes = map.nodes.filter((n) => n.active)
  const activeEdges = map.edges.filter((e) => e.active)

  const selectedNode = useMemo(() => {
    return map.nodes.find((n) => n.id === selectedNodeId) || null
  }, [map.nodes, selectedNodeId])

  const selectedEdge = useMemo(() => {
    return map.edges.find((e) => e.id === selectedEdgeId) || null
  }, [map.edges, selectedEdgeId])

  const selectedProfile = selectedNode
    ? profiles.find((p) => p.id === selectedNode.criteria_profile_id) ||
      profiles.find((p) => selectedNode.grade_code && p.grade_codes?.includes(selectedNode.grade_code)) ||
      null
    : null

  const handleApplyHomiesTemplate = () => {
    try {
      const result = applyHomiesCareerTemplate({
        positions,
        actor_id: userRole || 'hr_admin',
      })
      onAggregateChange(result)
      toast.success('Đã áp dụng đủ lộ trình, tiêu chí và điều kiện chuẩn Homies C1 → C5.')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Không thể áp dụng mẫu Homies')
    }
  }

  const handleAddPositionFromTray = (positionId: string, gradeCode?: CareerGradeCode) => {
    const posObj = positions.find((p) => p.id === positionId)
    if (!posObj) return

    const existingCount = activeNodes.length
    const col = existingCount % 4
    const row = Math.floor(existingCount / 4)
    const defaultCoords = { x: 50 + col * 220, y: 50 + row * 120 }

    const result = addCareerPosition(map, profiles, posObj, defaultCoords, gradeCode)
    onAggregateChange({ map: result.map, profiles: result.profiles })
    const addedNode = result.map.nodes.find(
      (node) => node.position_id === positionId && (node.grade_code || undefined) === gradeCode
    )
    if (addedNode) {
      onSelectNode(addedNode.id)
    }
  }

  const handleUpdateProfile = (updatedProfile: KpiPositionCriteriaProfile) => {
    const exists = profiles.some((p) => p.id === updatedProfile.id)
    const nextProfiles = exists
      ? profiles.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
      : [...profiles, updatedProfile]
    onAggregateChange({ map, profiles: nextProfiles })
  }

  return (
    <div className="flex h-[780px] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      {/* Mobile Notice Bar */}
      <div className="flex items-center justify-between bg-amber-50 px-4 py-2 text-xs text-amber-800 border-b border-amber-200 md:hidden">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Chỉnh sửa sơ đồ tốt nhất trên máy tính để kéo thả và nối nhánh chính xác hơn.</span>
        </div>
      </div>

      {/* Top Bar: Stats & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowTray((v) => !v)}
              className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              title={showTray ? 'Thu gọn danh mục chức vụ' : 'Mở danh mục chức vụ'}
            >
              {showTray ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
          )}

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F6FA8]/10 text-[#2F6FA8]">
            <GitFork className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#001D3D]">
                Sơ đồ Lộ trình Phát triển Homies
              </h2>
              <span className="rounded-md bg-[#2F6FA8]/10 px-2 py-0.5 text-xs font-bold text-[#2F6FA8]">
                v{map.version} {map.status === 'published' ? '• Đang áp dụng' : '• Bản nháp'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Thiết lập chuẩn toàn chuỗi • Tự động gắn tiêu chí & điều kiện tăng bậc
            </p>
          </div>
        </div>

        {/* Quick Stats & Tab Switches */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-gray-600 border border-gray-200/80">
            <Layers className="h-3.5 w-3.5 text-gray-400" />
            <span>
              <strong className="font-mono text-[#001D3D]">{activeNodes.length}</strong> vị trí
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-gray-600 border border-gray-200/80">
            <GitFork className="h-3.5 w-3.5 text-gray-400" />
            <span>
              <strong className="font-mono text-[#001D3D]">{activeEdges.length}</strong> đường nối
            </span>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={handleApplyHomiesTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2F6FA8]/10 px-2.5 py-1 text-xs font-bold text-[#2F6FA8] hover:bg-[#2F6FA8]/20 transition-colors"
              title="Áp dụng mẫu sơ đồ chuẩn Homies với 6 bậc C1-C5 và 100% trọng số tiêu chí"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Mẫu Homies Đa năng</span>
            </button>
          )}

          {/* Validation Status Switch Button */}
          <button
            type="button"
            onClick={() => setActiveRightTab('validation')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold border transition-all ${
              validation.valid
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            {validation.valid ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Sơ đồ hợp lệ</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span>
                  {validation.issues.filter((i) => i.severity === 'blocking').length} lỗi chặn
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Area (3 Columns / Panels) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left: Position Tray */}
        {!readOnly && (
          <div
            className={`transition-all duration-300 ${
              showTray ? 'w-[280px] shrink-0' : 'w-0 overflow-hidden'
            }`}
          >
            <KPICareerPositionTray
              map={map}
              positions={positions}
              employeeCountByPosition={employeeCountByPosition}
              readOnly={readOnly}
              onAddPosition={handleAddPositionFromTray}
            />
          </div>
        )}

        {/* Center: Interactive Canvas */}
        <div className="flex-1 relative h-full">
          <KPICareerMapCanvas
            map={map}
            positions={positions}
            profiles={profiles}
            employeeCountByPosition={employeeCountByPosition}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            readOnly={readOnly}
            userRole={userRole}
            onAggregateChange={onAggregateChange}
            onSelectNode={(nodeId) => {
              onSelectNode(nodeId)
              if (nodeId) setActiveRightTab('inspector')
            }}
            onSelectEdge={(edgeId) => {
              onSelectEdge(edgeId)
              if (edgeId) setActiveRightTab('inspector')
            }}
          />
        </div>

        {/* Right: Dynamic Inspector / Criteria / Validation Slot */}
        <div className="w-[340px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          {rightPanelSlot ? (
            rightPanelSlot
          ) : activeRightTab === 'validation' ? (
            <KPICareerMapValidationPanel
              validation={validation}
              onUseHomiesTemplate={handleApplyHomiesTemplate}
              onSelectIssue={(issue) => {
                if (issue.node_id) {
                  onSelectNode(issue.node_id)
                  setActiveRightTab('inspector')
                } else if (issue.edge_id) {
                  onSelectEdge(issue.edge_id)
                  setActiveRightTab('inspector')
                }
              }}
            />
          ) : (
            <KPICareerMapInspector
              map={map}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              profile={selectedProfile}
              employeeCount={selectedNode ? employeeCountByPosition[selectedNode.position_id] || 0 : 0}
              storeCount={totalStoresCount}
              readOnly={readOnly}
              onOpenCriteriaDrawer={() => setIsCriteriaDrawerOpen(true)}
              onUpdateProfile={handleUpdateProfile}
              onChange={(nextMap) => {
                onAggregateChange({ map: nextMap, profiles })
              }}
              onClose={() => {
                onSelectNode(null)
                onSelectEdge(null)
              }}
            />
          )}
        </div>
      </div>

      {/* Criteria Library Modal Drawer */}
      <KPICareerCriteriaLibraryDrawer
        isOpen={isCriteriaDrawerOpen}
        targetNode={selectedNode}
        allPositions={positions}
        existingProfiles={profiles}
        employeeCountByPosition={employeeCountByPosition}
        totalStoresCount={totalStoresCount}
        onClose={() => setIsCriteriaDrawerOpen(false)}
        onSaveProfiles={(nextProfiles) => {
          onAggregateChange({ map, profiles: nextProfiles })
        }}
      />
    </div>
  )
}
