'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { useAuthStore, DEMO_ACCOUNTS, type UserRole } from '@/store/auth-store'
import { usePermissions } from '@/hooks/usePermissions'
import { RoleBadge, PermissionsPanel } from '@/components/auth/RoleGuard'
import {
  Shield,
  Users,
  Lock,
  CheckCircle,
  XCircle,
  User,
  Zap,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react'
import { type Permission } from '@/lib/rbac'

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE PERMISSIONS MAPPING
// ─────────────────────────────────────────────────────────────────────────────

const FEATURE_PERMISSIONS: Record<string, Permission[]> = {
  // Employee Features
  'Xem danh sách nhân viên': ['employees.view'],
  'Tạo nhân viên mới': ['employees.create'],
  'Chỉnh sửa nhân viên': ['employees.edit'],
  'Xóa nhân viên': ['employees.delete'],
  'Xuất danh sách nhân viên': ['employees.export'],
  'Xem lương nhân viên': ['employees.view_salary'],

  // Leave Features
  'Tạo đơn nghỉ phép': ['leave.request'],
  'Phê duyệt nghỉ phép': ['leave.approve'],
  'Xem tất cả đơn nghỉ phép': ['leave.view_all'],

  // Schedule Features
  'Xem lịch làm việc': ['schedule.view'],
  'Phân công ca làm': ['schedule.assign'],
  'Đổi ca': ['schedule.swap'],
  'Tạo lịch tự động': ['schedule.auto_generate'],

  // KPI Features
  'Xem KPI của mình': ['kpi.view_own'],
  'Xem KPI nhóm': ['kpi.view_team'],
  'Đánh giá KPI': ['kpi.evaluate'],
  'Cài đặt KPI': ['kpi.settings'],

  // Payroll Features
  'Xem lương của mình': ['payroll.view_own'],
  'Xem lương nhóm': ['payroll.view_team'],
  'Tính lương': ['payroll.calculate'],
  'Quản lý thưởng': ['payroll.bonus'],

  // Reports Features
  'Báo cáo chấm công': ['reports.attendance'],
  'Báo cáo ngân sách': ['reports.budget'],
  'Tổng quan nhân sự': ['reports.hr_overview'],

  // Settings Features
  'Cài đặt WiFi': ['settings.wifi'],
  'Cài đặt lương': ['settings.payroll'],
  'Cài đặt hệ thống': ['settings.system'],
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function FeatureCard({
  name,
  permissions,
}: {
  name: string
  permissions: Permission[]
}) {
  const { can } = usePermissions()
  const hasAccess = permissions.some((p) => can(p))

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        hasAccess
          ? 'bg-success-50 border-success-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <span className={`text-sm ${hasAccess ? 'text-success-800' : 'text-gray-500'}`}>
        {name}
      </span>
      {hasAccess ? (
        <CheckCircle size={18} className="text-success-500" />
      ) : (
        <XCircle size={18} className="text-gray-400" />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON TABLE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function ComparisonTable() {
  const roles: UserRole[] = ['employee', 'shift_leader', 'store_manager', 'hr_admin', 'ceo']

  const features: { name: string; perm: Permission }[] = [
    { name: 'Xem lịch làm việc', perm: 'schedule.view' },
    { name: 'Tạo đơn nghỉ phép', perm: 'leave.request' },
    { name: 'Phê duyệt nghỉ phép', perm: 'leave.approve' },
    { name: 'Xem lương của mình', perm: 'payroll.view_own' },
    { name: 'Xem lương nhân viên', perm: 'employees.view_salary' },
    { name: 'Phân công ca làm', perm: 'schedule.assign' },
    { name: 'Đánh giá KPI', perm: 'kpi.evaluate' },
    { name: 'Tính lương', perm: 'payroll.calculate' },
    { name: 'Cài đặt hệ thống', perm: 'settings.system' },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-semibold text-gray-900">Tính năng</th>
            {roles.map((r) => (
              <th key={r} className="text-center p-3 font-semibold text-gray-900">
                <RoleBadge role={r} size="sm" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((f) => (
            <tr key={f.perm} className="border-b border-gray-100">
              <td className="p-3 text-gray-700">{f.name}</td>
              {roles.map((r) => {
                const hasAccess = hasPermissionForRole(r, f.perm)
                return (
                  <td key={r} className="p-3 text-center">
                    {hasAccess ? (
                      <CheckCircle size={18} className="text-success-500 mx-auto" />
                    ) : (
                      <XCircle size={18} className="text-gray-300 mx-auto" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Helper function (simulated)
function hasPermissionForRole(role: UserRole, permission: Permission): boolean {
  const rolePermissions: Record<UserRole, Permission[]> = {
    employee: ['schedule.view', 'leave.request', 'payroll.view_own', 'kpi.view_own'],
    shift_leader: ['schedule.view', 'leave.request', 'leave.calendar', 'payroll.view_own', 'kpi.view_own', 'kpi.view_team'],
    store_manager: ['schedule.view', 'schedule.assign', 'leave.request', 'leave.approve', 'payroll.view_own', 'kpi.view_own', 'kpi.view_team', 'kpi.evaluate', 'employees.view', 'employees.edit'],
    hr_admin: ['schedule.view', 'schedule.assign', 'leave.request', 'leave.approve', 'payroll.view_own', 'payroll.view_team', 'payroll.calculate', 'payroll.bonus', 'kpi.view_own', 'kpi.view_team', 'kpi.evaluate', 'kpi.settings', 'employees.view', 'employees.edit', 'employees.export', 'employees.view_salary', 'reports.attendance', 'reports.salary_structure'],
    area_manager: ['schedule.view', 'schedule.assign', 'leave.request', 'leave.approve', 'payroll.view_own', 'payroll.view_team', 'kpi.view_own', 'kpi.view_team', 'kpi.evaluate', 'employees.view'],
    ceo: ['schedule.view', 'schedule.assign', 'leave.request', 'leave.approve', 'leave.cancel_any', 'payroll.view_own', 'payroll.view_team', 'payroll.calculate', 'payroll.bonus', 'kpi.view_own', 'kpi.view_team', 'kpi.evaluate', 'kpi.settings', 'employees.view', 'employees.edit', 'employees.delete', 'employees.export', 'employees.view_salary', 'reports.attendance', 'reports.salary_structure', 'reports.budget', 'reports.hr_overview', 'settings.system'],
  }
  return rolePermissions[role]?.includes(permission) || false
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function RBACDemoPage() {
  const { user, loginAsRole } = useAuthStore()
  const { role, can } = usePermissions()
  const [activeTab, setActiveTab] = useState<'features' | 'comparison' | 'permissions'>('features')
  const [showDebug, setShowDebug] = useState(false)

  // Group features
  const featureGroups = {
    '👥 Nhân viên': Object.entries(FEATURE_PERMISSIONS).filter(([name]) =>
      ['Xem danh sách nhân viên', 'Tạo nhân viên mới', 'Chỉnh sửa nhân viên', 'Xóa nhân viên', 'Xuất danh sách nhân viên', 'Xem lương nhân viên'].includes(name)
    ),
    '📅 Nghỉ phép': Object.entries(FEATURE_PERMISSIONS).filter(([name]) =>
      ['Tạo đơn nghỉ phép', 'Phê duyệt nghỉ phép', 'Xem tất cả đơn nghỉ phép'].includes(name)
    ),
    '📆 Lịch làm': Object.entries(FEATURE_PERMISSIONS).filter(([name]) =>
      ['Xem lịch làm việc', 'Phân công ca làm', 'Đổi ca', 'Tạo lịch tự động'].includes(name)
    ),
    '📊 KPI': Object.entries(FEATURE_PERMISSIONS).filter(([name]) =>
      ['Xem KPI của mình', 'Xem KPI nhóm', 'Đánh giá KPI', 'Cài đặt KPI'].includes(name)
    ),
    '💰 Lương': Object.entries(FEATURE_PERMISSIONS).filter(([name]) =>
      ['Xem lương của mình', 'Xem lương nhóm', 'Tính lương', 'Quản lý thưởng'].includes(name)
    ),
    '📈 Báo cáo': Object.entries(FEATURE_PERMISSIONS).filter(([name]) =>
      ['Báo cáo chấm công', 'Báo cáo ngân sách', 'Tổng quan nhân sự'].includes(name)
    ),
    '⚙️ Cài đặt': Object.entries(FEATURE_PERMISSIONS).filter(([name]) =>
      ['Cài đặt WiFi', 'Cài đặt lương', 'Cài đặt hệ thống'].includes(name)
    ),
  }

  return (
    <AppShell title="🔐 Phân Quyền Truy Cập" backHref="/">
      {/* Demo Account Switcher */}
      <Card className="p-4 mb-4 bg-gradient-to-r from-primary/10 to-orange-50">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-semibold text-gray-900">Chuyển đổi tài khoản Demo</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              onClick={() => loginAsRole(account.role)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                role === account.role
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-primary'
              }`}
            >
              {account.icon} {account.name.split(' ')[0]}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          👆 Nhấn để đổi tài khoản và xem quyền truy cập thay đổi
        </p>
      </Card>

      {/* Current User Info */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.full_name || 'Chưa đăng nhập'}</p>
            <div className="flex items-center gap-2 mt-1">
              <RoleBadge role={role} size="sm" />
              <span className="text-xs text-gray-500">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {([
          { id: 'features', label: 'Tính năng', icon: Shield },
          { id: 'comparison', label: 'So sánh vai trò', icon: Users },
          { id: 'permissions', label: 'Chi tiết quyền', icon: Lock },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          {Object.entries(featureGroups).map(([groupName, features]) => (
            <Card key={groupName} className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{groupName}</h3>
              <div className="grid gap-2">
                {features.map(([name, perms]) => (
                  <FeatureCard key={name} name={name} permissions={perms} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">📊 So sánh quyền giữa các vai trò</h3>
          <ComparisonTable />
        </Card>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <PermissionsPanel role={role} collapsed={false} showTitle={true} />
      )}

      {/* Debug Toggle */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-24 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg z-40"
        title="Debug Info"
      >
        {showDebug ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>

      {/* Debug Info */}
      {showDebug && (
        <Card className="fixed bottom-32 right-4 w-80 p-4 bg-gray-900 text-white shadow-xl z-40">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning-400" />
            Debug Info
          </h4>
          <pre className="text-xs overflow-auto max-h-60">
            {JSON.stringify(
              {
                user: user?.full_name,
                role: role,
                permissions: {
                  'schedule.view': can('schedule.view'),
                  'leave.approve': can('leave.approve'),
                  'employees.edit': can('employees.edit'),
                  'payroll.calculate': can('payroll.calculate'),
                  'settings.system': can('settings.system'),
                },
              },
              null,
              2
            )}
          </pre>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-4 mt-4 bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary-500 mt-0.5" />
          <div>
            <p className="font-medium text-primary-900">Hệ thống phân quyền RBAC</p>
            <p className="text-sm text-primary-700 mt-1">
              Mỗi vai trò có quyền truy cập khác nhau. Nhân viên chỉ xem được lương của mình, 
              quản lý có thể duyệt nghỉ phép, HR Admin quản lý toàn bộ, và CEO có quyền cao nhất.
            </p>
          </div>
        </div>
      </Card>
    </AppShell>
  )
}
