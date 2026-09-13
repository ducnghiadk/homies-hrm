'use client'

import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import {
  Coffee,
  Receipt,
  Users,
  UtensilsCrossed,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { KpiCareerMapNode as KpiCareerMapNodeType } from '@/lib/kpi/career-map-types'

export interface CareerMapNodeData {
  node: KpiCareerMapNodeType
  employeeCount?: number
  hasCriteria?: boolean
  isSelected?: boolean
}

const FAMILY_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }
> = {
  barista: {
    label: 'Pha chế',
    icon: Coffee,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  cashier: {
    label: 'Thu ngân',
    icon: Receipt,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  service: {
    label: 'Phục vụ',
    icon: Users,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  kitchen: {
    label: 'Bếp',
    icon: UtensilsCrossed,
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  management: {
    label: 'Quản lý',
    icon: ShieldCheck,
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  other: {
    label: 'Khác',
    icon: Briefcase,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
}

const GRADE_CONFIG: Record<
  string,
  { label: string; badgeBg: string; badgeText: string; skills: string[] }
> = {
  c1_pc: { label: 'C1 - Pha chế', badgeBg: 'bg-amber-500/10', badgeText: 'text-amber-700', skills: ['Pha chế'] },
  c1_tn: { label: 'C1 - Thu ngân', badgeBg: 'bg-blue-500/10', badgeText: 'text-blue-700', skills: ['Thu ngân'] },
  c2: { label: 'C2 - Đa năng', badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-700', skills: ['Pha chế', 'Thu ngân'] },
  c3: { label: 'C3 - Senior', badgeBg: 'bg-teal-500/10', badgeText: 'text-teal-700', skills: ['Pha chế', 'Thu ngân'] },
  c4: { label: 'C4 - Trưởng ca', badgeBg: 'bg-indigo-500/10', badgeText: 'text-indigo-700', skills: ['Pha chế', 'Thu ngân', 'Quản ca'] },
  c5: { label: 'C5 - Quản lý CH', badgeBg: 'bg-purple-500/10', badgeText: 'text-purple-700', skills: ['Toàn diện'] },
}

export const KPICareerMapNode = memo(function KPICareerMapNode({
  data,
  selected,
}: NodeProps & { data: CareerMapNodeData }) {
  const { node, employeeCount = 0, hasCriteria = false } = data
  const familyConfig = FAMILY_CONFIG[node.job_family] || FAMILY_CONFIG.other
  const gradeConfig = node.grade_code ? GRADE_CONFIG[node.grade_code] : undefined
  const Icon = familyConfig.icon

  const displayTitle = node.grade_name_snapshot || gradeConfig?.label || node.position_name_snapshot

  return (
    <div
      className={`relative min-w-[230px] max-w-[270px] rounded-2xl bg-white p-4 shadow-sm transition-all duration-200 border ${
        selected
          ? 'border-[#2F6FA8] ring-4 ring-[#2F6FA8]/15 shadow-md scale-[1.02]'
          : 'border-gray-200/80 hover:border-gray-300 hover:shadow'
      }`}
    >
      {/* Target handle (Left - Đầu vào từ cấp thấp hơn) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#2F6FA8] hover:!scale-125 !transition-transform"
      />

      {/* Header: Grade Code Badge & Level */}
      <div className="flex items-center justify-between gap-2">
        {node.grade_code ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              gradeConfig?.badgeBg || 'bg-gray-100'
            } ${gradeConfig?.badgeText || 'text-gray-700'} border border-current/20 uppercase tracking-wider`}
          >
            <Icon className="h-3 w-3" />
            {node.grade_code.replace('_', '-')}
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${familyConfig.bg} ${familyConfig.text} border ${familyConfig.border}`}
          >
            <Icon className="h-3 w-3" />
            {familyConfig.label}
          </span>
        )}
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 font-mono">
          Bậc {node.position_level_snapshot || 1}
        </span>
      </div>

      {/* Position Name & Grade Title */}
      <div className="mt-2.5">
        <h4 className="text-sm font-bold text-[#001D3D] leading-tight line-clamp-1">
          {displayTitle}
        </h4>
        {node.grade_code && node.position_name_snapshot !== displayTitle && (
          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
            {node.position_name_snapshot}
          </p>
        )}
      </div>

      {/* Skills Badges */}
      {gradeConfig && gradeConfig.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {gradeConfig.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200/60"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Footer Info: Employees & Criteria indicator */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs text-gray-500">
        <div className="flex items-center gap-1 font-medium">
          <span className="font-mono font-bold text-gray-700">{employeeCount}</span> nhân sự
        </div>
        {hasCriteria ? (
          <span className="flex items-center gap-1 text-emerald-600 font-medium" title="Đã gắn tiêu chí">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-[11px]">Đủ tiêu chí</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600 font-medium" title="Chưa gắn bộ tiêu chí">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[11px]">Chưa tiêu chí</span>
          </span>
        )}
      </div>

      {/* Source handle (Right - Đầu ra nối lên cấp cao hơn) */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#2F6FA8] hover:!scale-125 !transition-transform"
      />
    </div>
  )
})
