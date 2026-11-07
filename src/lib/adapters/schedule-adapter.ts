// ============================================
// HRM Trà Sữa 🧋 — Schedule Data Adapter
// Unified Shift & Schedule Data Repository (Supabase DB + Local Fallback)
// ============================================

import { isRealDbMode } from './repository-config.ts';
import { mockShiftGrid, type ShiftCell } from '../mock-data-scheduling.ts';
import { supabase } from '../supabase.ts';

export interface ScheduleShift {
  id: string;
  employee_id: string;
  employee_name?: string;
  store_id: string;
  shift_id: string;
  date: string;
  status: 'da_xep' | 'da_xac_nhan' | 'da_huy';
  notes?: string;
}

export interface ScheduleAdapterWriteResult {
  ok: boolean;
  soGhiThanhCong: number;
  soBiLoai: number;
  lyDo?: string[];
}

const isValidUuid = (val?: string): boolean =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const STORE_ID_MAP: Record<string, string> = {
  'store-001': 'c0000000-0000-0000-0000-000000000001',
  'store-002': 'c0000000-0000-0000-0000-000000000002',
  'store-003': 'c0000000-0000-0000-0000-000000000003',
};

const REVERSE_STORE_MAP: Record<string, string> = {
  'c0000000-0000-0000-0000-000000000001': 'store-001',
  'c0000000-0000-0000-0000-000000000002': 'store-002',
  'c0000000-0000-0000-0000-000000000003': 'store-003',
};

const SHIFT_ID_MAP: Record<string, string> = {
  'shift-001': 'd0000000-0000-0000-0000-000000000001',
  'shift-002': 'd0000000-0000-0000-0000-000000000002',
  'shift-003': 'd0000000-0000-0000-0000-000000000003',
  'shift-004': 'd0000000-0000-0000-0000-000000000004',
};

const REVERSE_SHIFT_MAP: Record<string, string> = {
  'd0000000-0000-0000-0000-000000000001': 'shift-001',
  'd0000000-0000-0000-0000-000000000002': 'shift-002',
  'd0000000-0000-0000-0000-000000000003': 'shift-003',
  'd0000000-0000-0000-0000-000000000004': 'shift-004',
};

const EMPLOYEE_ID_MAP: Record<string, string> = {
  'emp-001': 'e0000000-0000-0000-0000-000000000001',
  'emp-002': 'e0000000-0000-0000-0000-000000000002',
  'emp-003': 'e0000000-0000-0000-0000-000000000003',
  'emp-004': 'e0000000-0000-0000-0000-000000000004',
  'emp-005': 'e0000000-0000-0000-0000-000000000005',
  'emp-006': 'e0000000-0000-0000-0000-000000000006',
  'emp-007': 'e0000000-0000-0000-0000-000000000007',
  'emp-008': 'e0000000-0000-0000-0000-000000000008',
  'emp-009': 'e0000000-0000-0000-0000-000000000009',
  'emp-010': 'e0000000-0000-0000-0000-000000000010',
};

const REVERSE_EMPLOYEE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(EMPLOYEE_ID_MAP).map(([k, v]) => [v, k])
);

export const resolveStoreUuid = (id?: string): string => (id && STORE_ID_MAP[id]) || id || '';
export const resolveShiftUuid = (id?: string): string => (id && SHIFT_ID_MAP[id]) || id || '';

export const resolveEmployeeUuid = (id?: string): string => {
  if (!id) return '';
  if (EMPLOYEE_ID_MAP[id]) return EMPLOYEE_ID_MAP[id];
  if (isValidUuid(id)) return id;
  const match = id.match(/^emp-(?:nv-?|bh-?)?0*(\d+)$/i);
  if (match) {
    const num = Number(match[1]);
    return `e0000000-0000-0000-0000-${String(num).padStart(12, '0')}`;
  }
  return id;
};

export const resolveEmployeeClientId = (uuidOrId?: string): string => {
  if (!uuidOrId) return '';
  if (REVERSE_EMPLOYEE_MAP[uuidOrId]) return REVERSE_EMPLOYEE_MAP[uuidOrId];
  return uuidOrId;
};

function collectInvalidIdReasons(input: { employee_id: string; store_id: string; shift_id: string }): string[] {
  const storeUuid = resolveStoreUuid(input.store_id);
  const shiftUuid = resolveShiftUuid(input.shift_id);
  const empUuid = resolveEmployeeUuid(input.employee_id);
  const reasons: string[] = [];

  if (!isValidUuid(empUuid)) reasons.push(`nhan_vien_id không hợp lệ: ${input.employee_id}`);
  if (!isValidUuid(storeUuid)) reasons.push(`cua_hang_id không hợp lệ: ${input.store_id}`);
  if (!isValidUuid(shiftUuid)) reasons.push(`ca_lam_id không hợp lệ: ${input.shift_id}`);

  return reasons;
}

function buildLocalWriteResult(count: number): ScheduleAdapterWriteResult {
  return { ok: true, soGhiThanhCong: count, soBiLoai: 0 };
}

export const scheduleAdapter = {
  /**
   * Lấy lịch phân ca theo Cửa hàng và Khoảng ngày
   */
  async getShiftsByStoreAndWeek(storeId: string, startDate: string, endDate: string): Promise<ScheduleShift[]> {
    const storeUuid = resolveStoreUuid(storeId);
    if (isRealDbMode() && isValidUuid(storeUuid)) {
      try {
        const { data, error } = await supabase
          .from('lich_phan_ca')
          .select('*, nhan_vien!lich_phan_ca_nhan_vien_id_fkey(id, ma_nhan_vien, ho_ten)')
          .eq('cua_hang_id', storeUuid)
          .gte('ngay', startDate)
          .lte('ngay', endDate);

        if (error) {
          console.warn('[ScheduleAdapter] Supabase query notice:', error.message || error.details || 'Local fallback');
        } else if (data && data.length > 0) {
          return data.map((row: Record<string, unknown>) => {
            const rawEmpId = String(row.nhan_vien_id || '');
            const rawStoreId = String(row.cua_hang_id || '');
            const rawShiftId = String(row.ca_lam_id || '');
            const nv = row.nhan_vien as { id?: string; ma_nhan_vien?: string; ho_ten?: string } | undefined;
            let empId = REVERSE_EMPLOYEE_MAP[rawEmpId];
            if (!empId && nv?.ma_nhan_vien) {
              const code = nv.ma_nhan_vien.trim().toLowerCase();
              empId = code.startsWith('emp-') ? code : `emp-${code}`;
            }
            if (!empId) empId = rawEmpId;

            return {
              id: String(row.id || ''),
              employee_id: empId,
              employee_name: nv?.ho_ten || '',
              store_id: REVERSE_STORE_MAP[rawStoreId] || rawStoreId,
              shift_id: REVERSE_SHIFT_MAP[rawShiftId] || rawShiftId,
              date: String(row.ngay || ''),
              status: (row.trang_thai as ScheduleShift['status']) || 'da_xep',
              notes: String(row.ghi_chu || ''),
            };
          });
        }
      } catch (err) {
        console.warn('[ScheduleAdapter] Exception getting shifts:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams({ store_id: storeId })
        if (startDate) params.set('from_date', startDate)
        if (endDate) params.set('to_date', endDate)
        const res = await fetch(`/api/shifts?${params.toString()}`)
        if (res.ok) {
          const json = await res.json()
          if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
            const filtered = json.data.filter((s: { date: string }) =>
              (!startDate || s.date >= startDate) && (!endDate || s.date <= endDate)
            )
            if (filtered.length > 0) {
              return filtered.map((s: { id: string; employee_id: string; employee_name?: string; employee?: { full_name?: string }; store_id?: string; shift_id: string; date: string; status?: string; notes?: string; shift_name?: string }) => ({
                id: s.id,
                employee_id: s.employee_id,
                employee_name: s.employee_name || s.employee?.full_name || '',
                store_id: s.store_id || storeId,
                shift_id: s.shift_id,
                date: s.date,
                status: s.status === 'APPROVED' ? ('da_xac_nhan' as const) : ('da_xep' as const),
                notes: s.notes || s.shift_name,
              }))
            }
          }
        }
      } catch (e) {
        console.warn('[ScheduleAdapter] fetch /api/shifts fallback notice:', e)
      }
    }

    return mockShiftGrid.flatMap((cell: ShiftCell) =>
      cell.employees.map((emp: { id: string; name: string }) => ({
        id: `shift-${cell.date}-${cell.shift_id}-${emp.id}`,
        employee_id: emp.id,
        store_id: storeId,
        shift_id: cell.shift_id,
        date: cell.date,
        status: 'da_xep' as const,
      }))
    );
  },

  /**
   * Đồng bộ Gán Ca làm việc mới vào DB Supabase `lich_phan_ca`
   */
  async assignShift(input: {
    employee_id: string;
    store_id: string;
    shift_id: string;
    date: string;
    notes?: string;
    status?: 'da_xep' | 'da_xac_nhan';
  }): Promise<ScheduleAdapterWriteResult> {
    const storeUuid = resolveStoreUuid(input.store_id);
    const shiftUuid = resolveShiftUuid(input.shift_id);
    const empUuid = resolveEmployeeUuid(input.employee_id);
    if (!isRealDbMode()) return buildLocalWriteResult(1);

    const invalidReasons = collectInvalidIdReasons(input);
    if (invalidReasons.length > 0) {
      return {
        ok: false,
        soGhiThanhCong: 0,
        soBiLoai: 1,
        lyDo: invalidReasons.slice(0, 5),
      };
    }

    if (isValidUuid(empUuid) && isValidUuid(storeUuid) && isValidUuid(shiftUuid)) {
      try {
        const payload = {
          nhan_vien_id: empUuid,
          cua_hang_id: storeUuid,
          ca_lam_id: shiftUuid,
          ngay: input.date,
          trang_thai: input.status || 'da_xep',
          ghi_chu: input.notes || '',
        };

        const { data, error } = await supabase
          .from('lich_phan_ca')
          .upsert([payload], { onConflict: 'nhan_vien_id,ngay,ca_lam_id' })
          .select()
          .single();

        if (!error && data) {
          return { ok: true, soGhiThanhCong: 1, soBiLoai: 0 };
        }
        if (error) {
          console.warn('[ScheduleAdapter] Supabase assignment notice:', error.message || error.details || 'Assignment failed');
          return { ok: false, soGhiThanhCong: 0, soBiLoai: 0, lyDo: [error.message || 'Ghi lịch phân ca thất bại'] };
        }
        return { ok: false, soGhiThanhCong: 0, soBiLoai: 0, lyDo: ['Supabase không trả về dòng lịch phân ca sau khi ghi'] };
      } catch (err) {
        console.warn('[ScheduleAdapter] Exception upserting shift:', err);
        return { ok: false, soGhiThanhCong: 0, soBiLoai: 0, lyDo: [err instanceof Error ? err.message : 'Lỗi không xác định khi ghi lịch phân ca'] };
      }
    }

    return { ok: false, soGhiThanhCong: 0, soBiLoai: 1, lyDo: ['ID lịch phân ca không hợp lệ'] };
  },

  /**
   * Đồng bộ hàng loạt ca vào DB Supabase `lich_phan_ca`
   */
  async bulkAssignShifts(
    shifts: Array<{
      employee_id: string;
      store_id: string;
      shift_id: string;
      date: string;
      notes?: string;
      status?: 'da_xep' | 'da_xac_nhan';
    }>
  ): Promise<ScheduleAdapterWriteResult> {
    if (shifts.length === 0) return buildLocalWriteResult(0);
    if (isRealDbMode()) {
      try {
        const lyDo: string[] = [];
        const validShifts = shifts.filter(s => {
          const invalidReasons = collectInvalidIdReasons(s);
          if (invalidReasons.length > 0) {
            invalidReasons.forEach(reason => {
              if (lyDo.length < 5) lyDo.push(reason);
            });
            return false;
          }
          return true;
        });
        const payloads = validShifts.map(s => ({
          nhan_vien_id: resolveEmployeeUuid(s.employee_id),
          cua_hang_id: resolveStoreUuid(s.store_id),
          ca_lam_id: resolveShiftUuid(s.shift_id),
          ngay: s.date,
          trang_thai: s.status || 'da_xep',
          ghi_chu: s.notes || '',
        }));

        if (payloads.length === 0) {
          return {
            ok: false,
            soGhiThanhCong: 0,
            soBiLoai: shifts.length,
            lyDo: lyDo.length > 0 ? lyDo : ['Không có bản ghi lịch phân ca hợp lệ để ghi Supabase'],
          };
        }

        if (payloads.length > 0) {
          const { error } = await supabase
            .from('lich_phan_ca')
            .upsert(payloads, { onConflict: 'nhan_vien_id,ngay,ca_lam_id' });

          if (error) {
            console.warn('[ScheduleAdapter] Bulk upsert notice:', error.message || error.details || 'Local sync active');
            return { ok: false, soGhiThanhCong: 0, soBiLoai: shifts.length - payloads.length, lyDo: [error.message || 'Ghi hàng loạt lịch phân ca thất bại', ...lyDo].slice(0, 5) };
          }
          return { ok: true, soGhiThanhCong: payloads.length, soBiLoai: shifts.length - payloads.length, lyDo: lyDo.length > 0 ? lyDo : undefined };
        }
      } catch (err) {
        console.warn('[ScheduleAdapter] Exception bulk assigning shifts:', err);
        return { ok: false, soGhiThanhCong: 0, soBiLoai: shifts.length, lyDo: [err instanceof Error ? err.message : 'Lỗi không xác định khi ghi hàng loạt lịch phân ca'] };
      }
    }
    return buildLocalWriteResult(shifts.length);
  },

  /**
   * Xóa toàn bộ ca của một tuần tại cửa hàng
   */
  async clearStoreWeekShifts(storeId: string, startDate: string, endDate: string): Promise<boolean> {
    if (isRealDbMode()) {
      const storeUuid = resolveStoreUuid(storeId);
      if (isValidUuid(storeUuid)) {
        try {
          const { error } = await supabase
            .from('lich_phan_ca')
            .delete()
            .eq('cua_hang_id', storeUuid)
            .gte('ngay', startDate)
            .lte('ngay', endDate);

          if (error) {
            console.warn('[ScheduleAdapter] Notice clearing week in Supabase:', error.message || error.details || 'Local sync active');
            return false;
          }
          return true;
        } catch (err) {
          console.warn('[ScheduleAdapter] Exception clearing week:', err);
          return false;
        }
      }
      return false;
    }
    return true;
  },

  /**
   * Xóa Gán Ca từ DB Supabase `lich_phan_ca`
   */
  async removeShift(employeeId: string, storeId: string, date: string, shiftId?: string): Promise<boolean> {
    if (isRealDbMode()) {
      const empUuid = resolveEmployeeUuid(employeeId);
      const storeUuid = resolveStoreUuid(storeId);
      const shiftUuid = resolveShiftUuid(shiftId);
      if (!isValidUuid(empUuid) || !isValidUuid(storeUuid) || (shiftId !== undefined && !isValidUuid(shiftUuid))) return false;
      try {
        let query = supabase
          .from('lich_phan_ca')
          .delete()
          .eq('nhan_vien_id', empUuid)
          .eq('ngay', date)
          .eq('cua_hang_id', storeUuid);

        if (shiftId !== undefined) query = query.eq('ca_lam_id', shiftUuid);

        const { error } = await query;
        if (error) {
          console.warn('[ScheduleAdapter] Notice removing shift from Supabase:', error.message || error.details || 'Local sync active');
          return false;
        }
        return true;
      } catch (err) {
        console.warn('[ScheduleAdapter] Exception deleting shift:', err);
        return false;
      }
    }
    return true;
  },

  /**
   * Chốt Lịch Tuần: Cập nhật trạng thái `da_xac_nhan` cho tất cả ca trong tuần
   */
  async publishWeekSchedules(storeId: string, startDate: string, endDate: string): Promise<boolean> {
    const storeUuid = resolveStoreUuid(storeId);
    if (isRealDbMode()) {
      if (!isValidUuid(storeUuid)) return false;
      try {
        const { error } = await supabase
          .from('lich_phan_ca')
          .update({ trang_thai: 'xac_nhan' })
          .eq('cua_hang_id', storeUuid)
          .gte('ngay', startDate)
          .lte('ngay', endDate);

        if (error) {
          console.warn('[ScheduleAdapter] Notice publishing week in Supabase:', error.message || error.details || 'Local sync active');
          return false;
        }
        return true;
      } catch (err) {
        console.warn('[ScheduleAdapter] Exception publishing week:', err);
        return false;
      }
    }
    return true;
  },
};
