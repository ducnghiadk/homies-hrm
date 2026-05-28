'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { usePermissions } from '@/hooks/usePermissions'
import { RoleBadge } from '@/components/auth/RoleGuard'
import { ROLE_LABELS, ROLE_PERMISSIONS, PERMISSION_LABELS, type Permission } from '@/lib/rbac'
import type { UserRole } from '@/store/auth-store'
import {
  ChevronRight,
  CheckCircle,
  Info,
  Lock,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface RoleGroup {
  role: UserRole
  label: string
  icon: string
  permissions: Permission[]
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function RoleCard({
  role,
  label,
  icon,
  permissions,
  isExpanded,
  onToggle,
}: {
  role: UserRole
  label: string
  icon: string
  permissions: Permission[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const { isRole } = usePermissions()
  const isCurrentRole = isRole(role)

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const [category] = perm.split('.')
    if (!acc[category]) acc[category] = []
    acc[category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const categoryLabels: Record<string, string> = {
    employees: '👥 Nhân viên',
    leave: '📅 Nghỉ phép',
    schedule: '📆 Lịch làm',
    attendance: '⏰ Chấm công',
    kpi: '📊 KPI',
    payroll: '💰 Lương',
    reports: '📈 Báo cáo',
    analytics: '🔍 Phân tích',
    settings: '⚙️ Cài đặt',
    staffing: '📐 Nhân sự',
    tasks: '📋 Công việc',
    recognition: '🏆 Khen thưởng',
    career: '🚀 Thăng tiến',
    learning: '📚 Học tập',
    gamification: '🎮 Gamification',
    news: '📰 Tin tức',
    chat: '💬 Chat',
    inventory: '📦 Tồn kho',
    wellness: '🧘 Sức khỏe',
  }

  return (
    <Card
      className={`p-4 transition-all cursor-pointer ${
        isCurrentRole ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">{label}</h3>
              {isCurrentRole && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  Vai trò của bạn
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{permissions.length} quyền</p>
          </div>
        </div>
        <ChevronRight
          size={20}
          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category} className="mb-4 last:mb-0">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {categoryLabels[category] || category}
              </h4>
              <div className="flex flex-wrap gap-2">
                {perms.map((perm) => (
                  <span
                    key={perm}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-success-50 text-success-700 text-xs rounded-full border border-success-200"
                    title={PERMISSION_LABELS[perm]}
                  >
                    <CheckCircle size={12} className="text-success-500" />
                    {perm.split('.')[1]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const { role: currentRole } = usePermissions()
  const [expandedRole, setExpandedRole] = useState<UserRole | null>(currentRole)
  const roles: RoleGroup[] = [
    {
      role: 'employee',
      label: ROLE_LABELS.employee,
      icon: '⭐',
      permissions: ROLE_PERMISSIONS.employee,
    },
    {
      role: 'shift_leader',
      label: ROLE_LABELS.shift_leader,
      icon: '🎯',
      permissions: ROLE_PERMISSIONS.shift_leader,
    },
    {
      role: 'store_manager',
      label: ROLE_LABELS.store_manager,
      icon: '👔',
      permissions: ROLE_PERMISSIONS.store_manager,
    },
    {
      role: 'area_manager',
      label: ROLE_LABELS.area_manager,
      icon: '🗺️',
      permissions: ROLE_PERMISSIONS.area_manager,
    },
    {
      role: 'hr_admin',
      label: ROLE_LABELS.hr_admin,
      icon: '🛡️',
      permissions: ROLE_PERMISSIONS.hr_admin,
    },
    {
      role: 'ceo',
      label: ROLE_LABELS.ceo,
      icon: '👑',
      permissions: ROLE_PERMISSIONS.ceo,
    },
  ]

  return (
    <AppShell title="🔐 Phân Quyền Truy Cập" backHref="/settings">
      {/* Info Card */}
      <Card className="p-4 mb-4 bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary-500 mt-0.5" />
          <div>
            <p className="font-medium text-primary-900">Hệ thống phân quyền RBAC</p>
            <p className="text-sm text-primary-700 mt-1">
              Mỗi vai trò có bộ quyền khác nhau. Nhân viên chỉ xem được dữ liệu cá nhân,
              quản lý có thể xem nhóm, HR Admin quản lý toàn bộ hệ thống.
            </p>
          </div>
        </div>
      </Card>

      {/* Current Role Highlight */}
      <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm text-gray-600">Vai trò của bạn</p>
            <div className="flex items-center gap-2 mt-1">
              <RoleBadge role={currentRole} size="md" />
              <span className="text-sm text-gray-600">
                ({roles.find(r => r.role === currentRole)?.permissions.length} quyền)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Role Cards */}
      <div className="space-y-3">
        {roles.map((roleGroup) => (
          <RoleCard
            key={roleGroup.role}
            role={roleGroup.role}
            label={roleGroup.label}
            icon={roleGroup.icon}
            permissions={roleGroup.permissions}
            isExpanded={expandedRole === roleGroup.role}
            onToggle={() =>
              setExpandedRole(
                expandedRole === roleGroup.role ? null : roleGroup.role
              )
            }
          />
        ))}
      </div>

      {/* Note */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Nhấn vào mỗi vai trò để xem chi tiết quyền hạn
      </p>
    </AppShell>
  )
}
