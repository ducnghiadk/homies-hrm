import type { ServerDatabaseSchema } from '@/lib/server/db'
import type { KpiDatabase } from '@/lib/kpi/repository'
import type { LocalPeerReviewDatabase } from '@/lib/kpi/local-peer-review-repository'
import {
  syncMonthlyPeerReviews,
  toSchedulerShift,
  type PeerSchedulerEmployee,
  type PeerSchedulerShift,
} from '@/lib/kpi/peer-review-scheduler'

// Nối bộ tự tạo đánh giá đồng nghiệp hằng tháng với dữ liệu máy chủ (nhân sự + chấm công thật).
// Chạy mỗi khi có người lưu KPI hoặc thao tác đánh giá đồng nghiệp, nên không cần lịch chạy riêng.
export function syncPeerReviewsFromServerDb(
  db: ServerDatabaseSchema,
  kpi: KpiDatabase,
  peer: LocalPeerReviewDatabase,
  now: string = new Date().toISOString()
): { peer: LocalPeerReviewDatabase; changed: boolean; created: number } {
  const positionName = new Map((db.positions || []).map((p) => [p.id, p.name]))
  const employees: PeerSchedulerEmployee[] = (db.employees || []).map((e) => ({
    id: e.id,
    name: e.full_name,
    role: e.role,
    store_id: e.store_id,
    secondary_store_ids: e.secondary_store_ids,
    status: e.status,
    position_id: e.position_id,
    position_name: positionName.get(e.position_id),
  }))
  const shifts: PeerSchedulerShift[] = (db.attendance || [])
    .map((a) => toSchedulerShift(a as Parameters<typeof toSchedulerShift>[0]))
    .filter((s): s is PeerSchedulerShift => s !== null)
  return syncMonthlyPeerReviews({ kpi, peer, employees, shifts, now })
}
