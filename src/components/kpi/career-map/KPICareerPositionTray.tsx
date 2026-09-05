'use client'

import React, { useMemo, useState } from 'react'
import { AlertTriangle, Briefcase, Check, Plus, Search, ShieldCheck, Users } from 'lucide-react'

import { HOMIES_CAREER_GRADES } from '@/lib/kpi/career-grade-catalog'
import type { CareerGradeCode, CareerGradeDefinition } from '@/lib/kpi/career-grade-types'
import type { KpiCareerMapVersion, KpiCareerPositionSnapshot } from '@/lib/kpi/career-map-types'

export interface KPICareerPositionTrayProps {
  map: KpiCareerMapVersion
  positions: KpiCareerPositionSnapshot[]
  employeeCountByPosition?: Record<string, number>
  readOnly?: boolean
  onAddPosition(positionId: string, gradeCode?: CareerGradeCode): void
}

interface TrayItem {
  key: string
  position: KpiCareerPositionSnapshot
  grade: CareerGradeDefinition | null
}

export function KPICareerPositionTray({
  map,
  positions,
  employeeCountByPosition = {},
  readOnly = false,
  onAddPosition,
}: KPICareerPositionTrayProps) {
  const [search, setSearch] = useState('')

  const items = useMemo<TrayItem[]>(() => positions.flatMap((position): TrayItem[] => {
    const positionKey = resolvePositionKey(position)
    const grades = positionKey
      ? HOMIES_CAREER_GRADES.filter((grade) => grade.position_key === positionKey)
      : []

    if (grades.length === 0) {
      return [{ key: `${position.id}:none`, position, grade: null }]
    }
    return grades.map((grade) => ({
      key: `${position.id}:${grade.code}`,
      position,
      grade,
    }))
  }), [positions])

  const placedKeys = useMemo(() => new Set(
    map.nodes
      .filter((node) => node.active)
      .map((node) => `${node.position_id}:${node.grade_code || 'none'}`)
  ), [map.nodes])

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    if (!keyword) return items
    return items.filter((item) =>
      item.position.name.toLocaleLowerCase('vi').includes(keyword) ||
      item.grade?.label.toLocaleLowerCase('vi').includes(keyword) ||
      item.position.id.toLowerCase().includes(keyword)
    )
  }, [items, search])

  const unplacedCount = items.filter((item) => !placedKeys.has(item.key)).length

  return (
    <div className="flex h-full w-full flex-col border-r border-gray-200/80 bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#001D3D]">Chức danh & cấp bậc</h3>
          {unplacedCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              {unplacedCount} chưa xếp
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <Check className="h-3 w-3" /> Đã xếp đủ
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Một chức danh có thể có nhiều cấp bậc. Kéo đúng thẻ cấp bậc vào sơ đồ.
        </p>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm chức danh hoặc cấp bậc..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-8 pr-3 text-xs text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:bg-white"
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">Không tìm thấy cấp bậc phù hợp</div>
        ) : filteredItems.map((item) => {
          const isPlaced = placedKeys.has(item.key)
          const Icon = item.grade?.management ? ShieldCheck : item.grade ? Users : Briefcase
          const gradeCode = item.grade?.code

          return (
            <div
              key={item.key}
              draggable={!readOnly && !isPlaced}
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow-position', item.position.id)
                if (gradeCode) event.dataTransfer.setData('application/reactflow-grade', gradeCode)
                event.dataTransfer.effectAllowed = 'move'
              }}
              className={`rounded-xl border p-3 transition-all ${
                isPlaced
                  ? 'border-gray-200/60 bg-gray-50/70 opacity-75'
                  : 'cursor-grab border-gray-200 bg-white hover:border-[#2F6FA8]/50 hover:shadow-xs active:cursor-grabbing'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="rounded-lg bg-[#2F6FA8]/10 p-1.5 text-[#2F6FA8]"><Icon className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-gray-500">{item.position.name}</p>
                    <h4 className="truncate text-xs font-bold text-[#001D3D]">{item.grade?.label || item.position.name}</h4>
                    <p className="mt-0.5 text-[10px] text-gray-500">{employeeCountByPosition[item.position.id] || 0} nhân viên</p>
                  </div>
                </div>
                {!readOnly && (isPlaced ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-200/80 px-2 py-1 text-[10px] font-semibold text-gray-600">
                    <Check className="h-2.5 w-2.5" /> Đã thêm
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAddPosition(item.position.id, gradeCode)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#2F6FA8]/10 px-2 py-1 text-[11px] font-bold text-[#2F6FA8] hover:bg-[#2F6FA8] hover:text-white"
                  >
                    <Plus className="h-3 w-3" /> Thêm
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function resolvePositionKey(
  position: KpiCareerPositionSnapshot
): CareerGradeDefinition['position_key'] | null {
  const normalized = `${position.id} ${position.name}`.toLocaleLowerCase('vi')
  if (normalized.includes('store_employee') || normalized.includes('nhân viên cửa hàng')) return 'store_employee'
  if (normalized.includes('shift_leader') || normalized.includes('trưởng ca')) return 'shift_leader'
  if (normalized.includes('store_manager') || normalized.includes('quản lý cửa hàng')) return 'store_manager'
  return null
}
