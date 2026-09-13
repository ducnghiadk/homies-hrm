'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react'
import type { Node, Edge, Connection } from '@xyflow/react'
import { toast } from 'sonner'
import { KPICareerMapNode } from './KPICareerMapNode'
import type {
  KpiCareerMapVersion,
  KpiPositionCriteriaProfile,
  KpiCareerPositionSnapshot,
  CareerMapAggregateChange,
} from '@/lib/kpi/career-map-types'
import {
  addCareerMapEdge,
  addCareerPosition,
  canEditCareerMapStructure,
  moveCareerMapNode,
  validateCareerMap,
} from '@/lib/kpi/career-map-service'

export { canEditCareerMapStructure }

const nodeTypes = {
  careerMapNode: KPICareerMapNode,
}

const PRESET_LABELS: Record<string, string> = {
  same_profession_level_up: 'Lên cấp nghề',
  to_multiskill: 'Lên Đa năng (C2)',
  to_senior: 'Lên Senior (C3)',
  to_senior_employee: 'Lên nhân viên chính',
  to_shift_leader: 'Lên Trưởng ca (C4)',
  to_store_manager: 'Lên Quản lý CH (C5)',
}

interface InnerCanvasProps {
  map: KpiCareerMapVersion
  positions?: KpiCareerPositionSnapshot[]
  profiles?: KpiPositionCriteriaProfile[]
  employeeCountByPosition?: Record<string, number>
  selectedNodeId?: string | null
  selectedEdgeId?: string | null
  readOnly?: boolean
  userRole?: string
  onAggregateChange(change: CareerMapAggregateChange): void
  onSelectNode(nodeId: string | null): void
  onSelectEdge(edgeId: string | null): void
}

function InnerCareerMapCanvas({
  map,
  positions = [],
  profiles = [],
  employeeCountByPosition = {},
  selectedNodeId,
  selectedEdgeId,
  readOnly = false,
  userRole,
  onAggregateChange,
  onSelectNode,
  onSelectEdge,
}: InnerCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const canEditStructure = canEditCareerMapStructure(userRole, map.status, isMobile)
  const effectiveReadOnly = readOnly || !canEditStructure

  const profilePosMap = useMemo(() => {
    const mapPos = new Map<string, boolean>()
    for (const prof of profiles) {
      for (const posId of prof.position_ids) {
        if (prof.criteria && prof.criteria.length > 0) {
          mapPos.set(posId, true)
        }
      }
    }
    return mapPos
  }, [profiles])

  // Convert Domain Map Nodes to ReactFlow Nodes
  const flowNodes: Node[] = useMemo(() => {
    return map.nodes
      .filter((n) => n.active)
      .map((node) => ({
        id: node.id,
        type: 'careerMapNode',
        position: { x: node.x, y: node.y },
        selected: node.id === selectedNodeId,
        draggable: !effectiveReadOnly,
        data: {
          node,
          employeeCount: employeeCountByPosition[node.position_id] || 0,
          hasCriteria: profilePosMap.has(node.position_id) || Boolean(node.criteria_profile_id),
          isReadOnly: effectiveReadOnly,
        },
      }))
  }, [map.nodes, selectedNodeId, employeeCountByPosition, profilePosMap, effectiveReadOnly])

  // Convert Domain Map Edges to ReactFlow Edges
  const flowEdges: Edge[] = useMemo(() => {
    return map.edges
      .filter((e) => e.active)
      .map((edge) => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        animated: true,
        selected: edge.id === selectedEdgeId,
        style: {
          stroke: edge.id === selectedEdgeId ? '#2F6FA8' : '#94A3B8',
          strokeWidth: edge.id === selectedEdgeId ? 3 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.id === selectedEdgeId ? '#2F6FA8' : '#94A3B8',
        },
        label: PRESET_LABELS[edge.preset_key] || 'Tăng bậc',
        labelStyle: { fill: '#475569', fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: '#FFFFFF', fillOpacity: 0.95 },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 6,
      }))
  }, [map.edges, selectedEdgeId])

  // Handle Drag Over Canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Handle Drop Position Node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      if (effectiveReadOnly) return

      const positionId = event.dataTransfer.getData('application/reactflow-position')
      const gradeCode = event.dataTransfer.getData('application/reactflow-grade') as import('@/lib/kpi/career-grade-types').CareerGradeCode
      if (!positionId) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const posObj = positions.find((p) => p.id === positionId)
      if (!posObj) {
        toast.error('Không tìm thấy thông tin chức danh trong danh mục Master Data.')
        return
      }
      const result = addCareerPosition(map, profiles, posObj, position, gradeCode || undefined)
      onAggregateChange({ map: result.map, profiles: result.profiles })
      const newNode = result.map.nodes.find(
        (node) => node.position_id === positionId && (node.grade_code || undefined) === (gradeCode || undefined)
      )
      if (newNode) {
        onSelectNode(newNode.id)
        toast.success(`Đã thêm "${newNode.position_name_snapshot}" vào sơ đồ.`)
      }
    },
    [map, positions, profiles, effectiveReadOnly, screenToFlowPosition, onAggregateChange, onSelectNode]
  )

  // Handle Node Position Drag Stop
  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      if (effectiveReadOnly) return
      const updatedMap = moveCareerMapNode(map, node.id, Math.round(node.position.x), Math.round(node.position.y))
      onAggregateChange({ map: updatedMap, profiles })
    },
    [map, profiles, effectiveReadOnly, onAggregateChange]
  )

  // Handle Connecting Edges
  const onConnect = useCallback(
    (connection: Connection) => {
      if (effectiveReadOnly) return
      if (!connection.source || !connection.target) return

      const testMap = addCareerMapEdge(map, connection.source, connection.target)
      const validation = validateCareerMap({ map: testMap, profiles })

      if (validation.has_blocking) {
        const blockingIssue = validation.issues.find((i) => i.severity === 'blocking')
        toast.error(blockingIssue?.message || 'Đường nối không hợp lệ theo quy tắc lộ trình.')
        return
      }

      onAggregateChange({ map: testMap, profiles })
      onSelectEdge(`edge_${connection.source}_${connection.target}`)
      toast.success('Đã thiết lập đường nối lộ trình thành công.')
    },
    [map, profiles, effectiveReadOnly, onAggregateChange, onSelectEdge]
  )

  // Handle Selection
  const onSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
      if (nodes.length > 0) {
        onSelectNode(nodes[0].id)
        onSelectEdge(null)
      } else if (edges.length > 0) {
        onSelectEdge(edges[0].id)
        onSelectNode(null)
      } else {
        onSelectNode(null)
        onSelectEdge(null)
      }
    },
    [onSelectNode, onSelectEdge]
  )

  return (
    <div className="relative h-full w-full bg-[#F8FAFC]" ref={reactFlowWrapper}>
      {/* Mobile Helper Notice */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-[#001D3D]/80 px-2.5 py-1 text-[11px] font-medium text-white shadow-xs backdrop-blur-xs md:hidden pointer-events-none">
        <span>💡 Chế độ xem: Dùng 2 ngón tay để di chuyển / phóng to (Khóa sửa trên di động)</span>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        nodesConnectable={!effectiveReadOnly}
        elementsSelectable={true}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        deleteKeyCode={effectiveReadOnly ? null : 'Delete'}
      >
        <Background color="#CBD5E1" gap={20} size={1} />
        <Controls showInteractive={!effectiveReadOnly} className="!bg-white !border-gray-200 !rounded-xl !shadow-sm" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white !border !border-gray-200 !rounded-xl !shadow-sm overflow-hidden"
        />
      </ReactFlow>
    </div>
  )
}

export type KPICareerMapCanvasProps = InnerCanvasProps

export function KPICareerMapCanvas(props: KPICareerMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerCareerMapCanvas {...props} />
    </ReactFlowProvider>
  )
}
