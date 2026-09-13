'use client'

import { useState } from 'react'
import { useAuthStore, type UserRole } from '@/store/auth-store'
import { usePermissions } from '@/hooks/usePermissions'
import { Card } from '@/components/ui/Card'
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Eye,
  EyeOff,
  Key,
  User,
} from 'lucide-react'
import { ROLE_LABELS, PERMISSION_LABELS, getPermissionsByRole, type Permission } from '@/lib/rbac'

// ─────────────────────────────────────────────────────────────────────────────
// ROLE BADGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  ceo: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200' },
  hr_admin: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200' },
  area_manager: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  store_manager: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-200' },
  shift_leader: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200' },
  employee: { bg: 'bg-vanilla-50', text: 'text-gray-700', border: 'border-gray-200' },
}

const ROLE_ICONS: Record<UserRole, string> = {
  ceo: '👑',
  hr_admin: '🛡️',
  area_manager: '🗺️',
  store_manager: '👔',
  shift_leader: '🎯',
  employee: '⭐',
}

type RoleBadgeProps = {
  role: UserRole
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export function RoleBadge({ role, size = 'md', showIcon = true, className = '' }: RoleBadgeProps) {
  const colors = ROLE_COLORS[role]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <span>{ROLE_ICONS[role]}</span>}
      <span>{ROLE_LABELS[role]}</span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS PANEL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type PermissionsPanelProps = {
  role: UserRole
  showTitle?: boolean
  collapsed?: boolean
  className?: string
}

export function PermissionsPanel({
  role,
  showTitle = true,
  collapsed: initialCollapsed = false,
  className = '',
}: PermissionsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const [showAll, setShowAll] = useState(false)

  const permissions = getPermissionsByRole(role)

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const [category] = perm.split('.')
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(perm)
    return acc
  }, {} as Record<string, typeof permissions>)

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
    checkin: '✔️ Check-in',
  }

  const displayPermissions = showAll ? permissions : permissions.slice(0, 10)

  return (
    <Card className={`p-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">Quyền hạn của {ROLE_LABELS[role]}</h3>
            <span className="text-sm text-gray-500">({permissions.length} quyền)</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-primary-50 rounded"
          >
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      )}

      {!isCollapsed && (
        <>
          {showAll ? (
            // Show grouped view
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-gray-700 text-xs rounded-full"
                        title={PERMISSION_LABELS[perm]}
                      >
                        <Check size={12} className="text-success-500" />
                        {perm.split('.')[1]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show simple list
            <div className="flex flex-wrap gap-2">
              {displayPermissions.map((perm) => (
                <span
                  key={perm}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-gray-700 text-xs rounded-full"
                  title={PERMISSION_LABELS[perm]}
                >
                  <Check size={12} className="text-success-500" />
                  {perm.split('.')[1]}
                </span>
              ))}
              {permissions.length > 10 && (
                <span className="text-xs text-gray-500 self-center">
                  +{permissions.length - 10} more...
                </span>
              )}
            </div>
          )}

          {permissions.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 text-sm text-primary hover:underline"
            >
              {showAll ? 'Thu gọn' : `Xem tất cả (${permissions.length})`}
            </button>
          )}
        </>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENT USER PERMISSIONS CARD
// ─────────────────────────────────────────────────────────────────────────────

export function CurrentUserPermissionsCard() {
  const { user } = useAuthStore()
  usePermissions()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!user) return null

  return (
    <Card className="p-4 border-2 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.full_name}</p>
            <RoleBadge role={user.role} size="sm" />
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-primary-50 rounded-lg"
          title={isExpanded ? 'Thu gọn' : 'Xem quyền'}
        >
          {isExpanded ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          <PermissionsPanel role={user.role} collapsed={false} showTitle={true} />
        </div>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION CHECKER (Debug Tool)
// ─────────────────────────────────────────────────────────────────────────────

type PermissionCheckerProps = {
  permissions: Permission[]
  label: string
}

function PermissionCheckItem({ permission, hasPermission }: { permission: Permission; hasPermission: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {hasPermission ? (
        <Check size={16} className="text-success-500" />
      ) : (
        <X size={16} className="text-error-500" />
      )}
      <span className={hasPermission ? 'text-gray-900' : 'text-gray-400'}>
        {PERMISSION_LABELS[permission] || permission}
      </span>
    </div>
  )
}

export function PermissionChecker({ permissions, label }: PermissionCheckerProps) {
  const { can } = usePermissions()

  return (
    <Card className="p-4">
      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
        <Key size={16} />
        {label}
      </h4>
      <div className="space-y-1">
        {permissions.map((perm) => (
          <PermissionCheckItem
            key={perm}
            permission={perm}
            hasPermission={can(perm)}
          />
        ))}
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export {
  ROLE_COLORS,
  ROLE_ICONS,
  ROLE_LABELS,
  PERMISSION_LABELS,
}
