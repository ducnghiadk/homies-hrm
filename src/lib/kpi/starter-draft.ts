import { DEFAULT_KPI_POLICY } from './default-policy.ts'
import type { KpiSetVersion } from './types.ts'

/**
 * Bản nháp KPI đầu tiên khi máy chủ chưa có chương trình nào.
 * Chỉ có khung nhóm tiêu chí và thang điểm mặc định; mục tiêu, vị trí, nguồn đánh giá,
 * điều kiện lên bậc để trống cho CEO/HR tự chọn trong trình thiết lập. Không tự phát hành.
 */
export function buildStarterKpiDraft(actorId: string, now: Date = new Date()): KpiSetVersion {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return {
    id: `kpi_set_${month.replace('-', '_')}_v1_${now.getTime()}`,
    set_id: 'kpi_set_main',
    version: 1,
    name: `Chương trình đánh giá tháng ${month.slice(5)}/${month.slice(0, 4)}`,
    status: 'draft',
    program_setup_step: 'purpose',
    position_ids: [],
    level_codes: [...DEFAULT_KPI_POLICY.levels],
    store_ids: 'all',
    effective_from: `${month}-01`,
    score_scale: [...DEFAULT_KPI_POLICY.score_scale],
    groups: structuredClone(DEFAULT_KPI_POLICY.groups),
    created_by: actorId,
    created_at: now.toISOString(),
  }
}
