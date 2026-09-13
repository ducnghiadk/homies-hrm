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

const SHIFT_ID_MAP: Record<string, string> = {
  'shift-001': 'd0000000-0000-0000-0000-000000000001',
  'shift-002': 'd0000000-0000-0000-0000-000000000002',
  'shift-003': 'd0000000-0000-0000-0000-000000000003',
  'shift-004': 'd0000000-0000-0000-0000-000000000004',
};

const resolveStoreUuid = (id?: string): string => (id && STORE_ID_MAP[id]) || id || '';
const resolveShiftUuid = (id?: string): string => (id && SHIFT_ID_MAP[id]) || id || '';

function collectInvalidIdReasons(input: { employee_id: string; store_id: string; shift_id: string }): string[] {
  const storeUuid = resolveStoreUuid(input.store_id);
  const shiftUuid = resolveShiftUuid(input.shift_id);
  const reasons: string[] = [];

  if (!isValidUuid(input.employee_id)) reasons.push(`nhan_vien_id không hợp lệ: ${input.employee_id}`);
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
          .select('*')
          .eq('cua_hang_id', storeUuid)
          .gte('ngay', startDate)
          .lte('ngay', endDate);

        if (error) {
          console.warn('[ScheduleAdapter] Supabase query notice:', error.message || error.details || 'Local fallback');
          return [];
        } else if (data && data.length > 0) {
          return data.map((row: Record<string, unknown>) => ({
            id: String(row.id || ''),
            employee_id: String(row.nhan_vien_id || ''),
            store_id: String(row.cua_hang_id || ''),
            shift_id: String(row.ca_lam_id || ''),
            date: String(row.ngay || ''),
            status: (row.trang_thai as ScheduleShift['status']) || 'da_xep',
            notes: String(row.ghi_chu || ''),
          }));
        }
        return [];
      } catch (err) {
        console.warn('[ScheduleAdapter] Exception getting shifts:', err);
        return [];
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

    if (isValidUuid(input.employee_id) && isValidUuid(storeUuid) && isValidUuid(shiftUuid)) {
      try {
        const payload = {
          nhan_vien_id: input.employee_id,
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
          nhan_vien_id: s.employee_id,
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
      if (!isValidUuid(employeeId)) return false;
      const storeUuid = resolveStoreUuid(storeId);
      const shiftUuid = resolveShiftUuid(shiftId);
      if (!isValidUuid(storeUuid) || (shiftId !== undefined && !isValidUuid(shiftUuid))) return false;
      try {
        let query = supabase
          .from('lich_phan_ca')
          .delete()
          .eq('nhan_vien_id', employeeId)
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
