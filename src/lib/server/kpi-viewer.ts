import type { AuthenticatedUser } from '@/lib/server/auth-helper'
import { getUserStoreIds } from '@/lib/server/auth-helper'
import type { ServerDatabaseSchema } from '@/lib/server/db'
import type { KpiViewer } from '@/lib/kpi/kpi-access-policy'
import type { KpiActor } from '@/lib/kpi/types'

/** Người đang xem KPI, lấy từ phiên đăng nhập trên máy chủ (không tin vai trò trình duyệt gửi). */
export function buildKpiViewer(user: AuthenticatedUser, db: ServerDatabaseSchema): KpiViewer {
  const storeByEmployee = new Map<string, string>()
  for (const employee of db.employees || []) {
    if (employee?.id && employee.store_id) storeByEmployee.set(employee.id, employee.store_id)
  }
  return {
    userId: user.userId,
    role: user.role,
    storeIds: getUserStoreIds(user),
    employeeStoreOf: (employeeId) => storeByEmployee.get(employeeId),
  }
}

const KPI_ACTOR_ROLES: KpiActor['role'][] = ['employee', 'shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo']

export function buildKpiActor(user: AuthenticatedUser): KpiActor {
  const role = (user.role || '').toLowerCase() as KpiActor['role']
  return {
    id: user.userId,
    role: KPI_ACTOR_ROLES.includes(role) ? role : 'employee',
    store_id: user.employee?.store_id,
  }
}
