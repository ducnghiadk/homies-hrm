// ============================================
// HRM Trà Sữa 🧋 — Attendance Data Adapter
// Unified Attendance & Check-in Repository
// ============================================

import { isRealDbMode } from './repository-config';
import { mockAttByDate } from '../mock-data-attendance';
import { supabase } from '../supabase';
import { getActivePayrollPolicy } from '../services/payroll/payroll-policy-service';

const STORE_ID_MAP: Record<string, string> = {
  'store-001': 'c0000000-0000-0000-0000-000000000001',
  'store-002': 'c0000000-0000-0000-0000-000000000002',
  'store-003': 'c0000000-0000-0000-0000-000000000003',
}

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
  'emp-011': 'e0000000-0000-0000-0000-000000000011',
  'emp-012': 'e0000000-0000-0000-0000-000000000012',
  'emp-013': 'e0000000-0000-0000-0000-000000000013',
  'emp-014': 'e0000000-0000-0000-0000-000000000014',
  'emp-015': 'e0000000-0000-0000-0000-000000000015',
  'emp-016': 'e0000000-0000-0000-0000-000000000016',
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LOCAL_STORE_ID_MAP = Object.fromEntries(Object.entries(STORE_ID_MAP).map(([localId, uuid]) => [uuid, localId]))
const LOCAL_EMPLOYEE_ID_MAP = Object.fromEntries(Object.entries(EMPLOYEE_ID_MAP).map(([localId, uuid]) => [uuid, localId]))

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  store_id: string;
  shift_id?: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_lat?: number;
  check_in_lng?: number;
  check_out_lat?: number;
  check_out_lng?: number;
  status: string;
  late_minutes: number;
  total_hours?: number;
  overtime_hours?: number;
  note?: string;
}

export type CheckinMethod = 'gps' | 'wifi' | 'thu_cong' | 'qr'
export type AttendanceDbStatus = 'dung_gio' | 'di_muon' | 've_som' | 'vang_mat' | 'cho_duyet'

export type TodayShiftInfo = {
  lichPhanCaId: string
  gioBatDau: string
  gioKetThuc: string
}

export type CheckInPayload = {
  nhanVienId?: string
  cuaHangId: string
  ngay: string
  thoiGianCheckIn: string
  viDoCheckIn?: number
  kinhDoCheckIn?: number
  phuongThucCheckIn?: CheckinMethod
  trangThai?: AttendanceDbStatus
  phutDiMuon?: number
  ghiChu?: string
}

export type CheckOutPayload = {
  nhanVienId: string
  ngay: string
  thoiGianCheckOut: string
  viDoCheckOut?: number
  kinhDoCheckOut?: number
  soGioTangCa?: number
  trangThai?: AttendanceDbStatus
  phutVeSom?: number
  ghiChu?: string
}

type AttendanceWriteResult = { ok: true; id?: string } | { ok: false; loi: string }
type AttendancePeriodReadResult = { records: AttendanceRecord[]; coLoi: boolean; loi?: string }

function resolveEmployeeUuid(id?: string | null): string | null {
  if (!id) return null
  if (UUID_PATTERN.test(id)) return id
  return EMPLOYEE_ID_MAP[id] || null
}

function resolveStoreUuid(id?: string | null): string | null {
  if (!id) return null
  if (UUID_PATTERN.test(id)) return id
  return STORE_ID_MAP[id] || null
}

function mapAttendanceRow(row: Record<string, unknown>): AttendanceRecord {
  const employeeId = String(row.nhan_vien_id || '')
  const storeId = String(row.cua_hang_id || '')
  return {
    id: String(row.id || ''),
    employee_id: LOCAL_EMPLOYEE_ID_MAP[employeeId] || employeeId,
    store_id: LOCAL_STORE_ID_MAP[storeId] || storeId,
    shift_id: row.lich_phan_ca_id ? String(row.lich_phan_ca_id) : undefined,
    date: String(row.ngay || ''),
    check_in_time: row.thoi_gian_check_in ? String(row.thoi_gian_check_in) : undefined,
    check_out_time: row.thoi_gian_check_out ? String(row.thoi_gian_check_out) : undefined,
    check_in_lat: row.vi_do_check_in == null ? undefined : Number(row.vi_do_check_in),
    check_in_lng: row.kinh_do_check_in == null ? undefined : Number(row.kinh_do_check_in),
    check_out_lat: row.vi_do_check_out == null ? undefined : Number(row.vi_do_check_out),
    check_out_lng: row.kinh_do_check_out == null ? undefined : Number(row.kinh_do_check_out),
    status: String(row.trang_thai || ''),
    late_minutes: Number(row.phut_di_muon || 0),
    total_hours: Number(row.so_gio_thuc_te || 0),
    overtime_hours: Number(row.so_gio_tang_ca || 0),
    note: row.ghi_chu ? String(row.ghi_chu) : undefined,
  }
}

function mapAttendancePeriodRow(row: Record<string, unknown>): AttendanceRecord {
  const employeeId = String(row.nhan_vien_id || '')
  const storeId = String(row.cua_hang_id || '')
  return {
    id: String(row.id || ''),
    employee_id: employeeId,
    store_id: LOCAL_STORE_ID_MAP[storeId] || storeId,
    shift_id: row.lich_phan_ca_id ? String(row.lich_phan_ca_id) : undefined,
    date: String(row.ngay || ''),
    check_in_time: row.thoi_gian_check_in ? String(row.thoi_gian_check_in) : undefined,
    check_out_time: row.thoi_gian_check_out ? String(row.thoi_gian_check_out) : undefined,
    check_in_lat: row.vi_do_check_in == null ? undefined : Number(row.vi_do_check_in),
    check_in_lng: row.kinh_do_check_in == null ? undefined : Number(row.kinh_do_check_in),
    check_out_lat: row.vi_do_check_out == null ? undefined : Number(row.vi_do_check_out),
    check_out_lng: row.kinh_do_check_out == null ? undefined : Number(row.kinh_do_check_out),
    status: String(row.trang_thai || ''),
    late_minutes: Number(row.phut_di_muon || 0),
    total_hours: Number(row.so_gio_thuc_te || 0),
    overtime_hours: Number(row.so_gio_tang_ca || 0),
    note: row.ghi_chu ? String(row.ghi_chu) : undefined,
  }
}

function minutesFromTime(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return hours * 60 + minutes
}

export const attendanceAdapter = {
  async layNhanVienIdHienTai(): Promise<string | null> {
    if (!isRealDbMode()) return null

    const { data: authData, error: authError } = await supabase.auth.getUser()
    const authId = authData?.user?.id
    if (authError || !authId) return null

    const { data, error } = await supabase
      .from('nhan_vien')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle()

    if (error || !data) return null
    return String((data as Record<string, unknown>).id || '') || null
  },

  async timCaHomNay(nhanVienId: string, ngay: string): Promise<TodayShiftInfo | null> {
    if (!isRealDbMode()) return null

    const resolvedNhanVienId = resolveEmployeeUuid(nhanVienId) || nhanVienId
    const { data, error } = await supabase
      .from('lich_phan_ca')
      .select('id, ca_lam:ca_lam_id ( gio_bat_dau, gio_ket_thuc )')
      .eq('nhan_vien_id', resolvedNhanVienId)
      .eq('ngay', ngay)

    if (error || !data || data.length === 0) return null

    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const rows = (data as unknown as Record<string, unknown>[]).map(row => {
      const caLamRaw = row.ca_lam
      const caLam = Array.isArray(caLamRaw) ? caLamRaw[0] : caLamRaw
      const shift = (caLam || {}) as Record<string, unknown>
      const gioBatDau = String(shift.gio_bat_dau || '00:00')
      return {
        lichPhanCaId: String(row.id || ''),
        gioBatDau,
        gioKetThuc: String(shift.gio_ket_thuc || '00:00'),
        distance: Math.abs(minutesFromTime(gioBatDau) - nowMinutes),
      }
    })

    const nearest = rows.sort((left, right) => left.distance - right.distance)[0]
    if (!nearest?.lichPhanCaId) return null
    return {
      lichPhanCaId: nearest.lichPhanCaId,
      gioBatDau: nearest.gioBatDau,
      gioKetThuc: nearest.gioKetThuc,
    }
  },

  async checkIn(payload: CheckInPayload): Promise<AttendanceWriteResult> {
    if (!isRealDbMode()) return { ok: true, id: `local-${Date.now()}` }

    const fallbackNhanVienId = await this.layNhanVienIdHienTai()
    const nhanVienId = resolveEmployeeUuid(payload.nhanVienId) || fallbackNhanVienId
    const cuaHangId = resolveStoreUuid(payload.cuaHangId)

    if (!nhanVienId || !cuaHangId) return { ok: false, loi: 'THIEU_DINH_DANH' }

    const caHomNay = await this.timCaHomNay(nhanVienId, payload.ngay)
    const insertPayload: Record<string, unknown> = {
      nhan_vien_id: nhanVienId,
      cua_hang_id: cuaHangId,
      lich_phan_ca_id: caHomNay?.lichPhanCaId || null,
      ngay: payload.ngay,
      thoi_gian_check_in: payload.thoiGianCheckIn,
      vi_do_check_in: payload.viDoCheckIn ?? null,
      kinh_do_check_in: payload.kinhDoCheckIn ?? null,
      anh_check_in_url: null,
      phuong_thuc_check_in: payload.phuongThucCheckIn || 'gps',
      phut_di_muon: payload.phutDiMuon ?? 0,
      ghi_chu: payload.ghiChu ?? null,
    }

    if (payload.trangThai) insertPayload.trang_thai = payload.trangThai

    const { data, error } = await supabase
      .from('cham_cong')
      .insert(insertPayload)
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') return { ok: false, loi: 'DA_CHECK_IN' }
      return { ok: false, loi: error.message || 'LOI_CHECK_IN' }
    }

    return { ok: true, id: String((data as Record<string, unknown> | null)?.id || '') }
  },

  async checkOut(payload: CheckOutPayload): Promise<AttendanceWriteResult> {
    if (!isRealDbMode()) return { ok: true }

    const nhanVienId = resolveEmployeeUuid(payload.nhanVienId)
    if (!nhanVienId) return { ok: false, loi: 'THIEU_DINH_DANH' }

    const { data: openRecord, error: findError } = await supabase
      .from('cham_cong')
      .select('id, thoi_gian_check_in, ghi_chu')
      .eq('nhan_vien_id', nhanVienId)
      .eq('ngay', payload.ngay)
      .is('thoi_gian_check_out', null)
      .not('thoi_gian_check_in', 'is', null)
      .maybeSingle()

    if (findError) return { ok: false, loi: findError.message || 'LOI_CHECK_OUT' }
    if (!openRecord) return { ok: false, loi: 'CHUA_CHECK_IN' }

    const openRow = openRecord as Record<string, unknown>
    const checkInTime = openRow.thoi_gian_check_in ? new Date(String(openRow.thoi_gian_check_in)) : null
    const checkOutTime = new Date(payload.thoiGianCheckOut)
    const totalHours = checkInTime && !Number.isNaN(checkInTime.getTime())
      ? Math.max(0, Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / 3600000) * 100) / 100)
      : 0

    const policy = getActivePayrollPolicy()
    const standardHours = (typeof policy.standardHoursPerDay === 'number' && policy.standardHoursPerDay > 0)
      ? policy.standardHoursPerDay
      : 8

    const updatePayload: Record<string, unknown> = {
      thoi_gian_check_out: payload.thoiGianCheckOut,
      vi_do_check_out: payload.viDoCheckOut ?? null,
      kinh_do_check_out: payload.kinhDoCheckOut ?? null,
      anh_check_out_url: null,
      so_gio_thuc_te: totalHours,
      so_gio_tang_ca: payload.soGioTangCa ?? Math.max(0, Math.round((totalHours - standardHours) * 100) / 100),
      phut_ve_som: payload.phutVeSom ?? 0,
    }

    if (payload.ghiChu) {
      const existingNote = typeof openRow.ghi_chu === 'string' ? openRow.ghi_chu.trim() : ''
      updatePayload.ghi_chu = existingNote ? `${existingNote} | Ra: ${payload.ghiChu}` : payload.ghiChu
    }

    const { error } = await supabase
      .from('cham_cong')
      .update(updatePayload)
      .eq('id', String(openRow.id || ''))

    if (error) return { ok: false, loi: error.message || 'LOI_CHECK_OUT' }
    return { ok: true }
  },

  async getCheckinHomNay(nhanVienId: string, ngay: string): Promise<AttendanceRecord | null> {
    if (!isRealDbMode()) return null

    const resolvedNhanVienId = resolveEmployeeUuid(nhanVienId) || nhanVienId
    const { data, error } = await supabase
      .from('cham_cong')
      .select('*')
      .eq('nhan_vien_id', resolvedNhanVienId)
      .eq('ngay', ngay)
      .order('ngay_tao', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return mapAttendanceRow(data as Record<string, unknown>)
  },

  async getAttendanceByDate(storeId: string, date: string): Promise<AttendanceRecord[]> {
    if (isRealDbMode()) {
      const { data, error } = await supabase
        .from('cham_cong')
        .select('*')
        .eq('cua_hang_id', storeId)
        .eq('ngay', date);

      if (error) {
        console.error('[AttendanceAdapter] Error fetching attendance:', error);
        return mockAttByDate.map(a => ({
          id: a.id,
          employee_id: a.employee_id,
          store_id: storeId,
          date,
          check_in_time: a.actual_in,
          check_out_time: a.actual_out,
          status: a.status,
          late_minutes: a.late_minutes,
        }));
      }

      return (data || []).map((row: Record<string, unknown>) => mapAttendanceRow(row));
    }

    return mockAttByDate.map(a => ({
      id: a.id,
      employee_id: a.employee_id,
      store_id: storeId,
      date,
      check_in_time: a.actual_in,
      check_out_time: a.actual_out,
      status: a.status,
      late_minutes: a.late_minutes,
    }));
  },

  async getAttendanceByPeriod(tuNgay: string, denNgay: string, nhanVienId?: string): Promise<AttendancePeriodReadResult> {
    if (!isRealDbMode()) return { records: [], coLoi: false }

    try {
      const resolvedNhanVienId = resolveEmployeeUuid(nhanVienId) || nhanVienId
      let query = supabase
        .from('cham_cong')
        .select([
          'id',
          'nhan_vien_id',
          'ngay',
          'thoi_gian_check_in',
          'thoi_gian_check_out',
          'so_gio_thuc_te',
          'so_gio_tang_ca',
          'trang_thai',
          'phut_di_muon',
          'phut_ve_som',
          'cua_hang_id',
          'lich_phan_ca_id',
          'ghi_chu',
        ].join(', '))
        .gte('ngay', tuNgay)
        .lte('ngay', denNgay)
        .order('ngay', { ascending: true })

      if (resolvedNhanVienId) {
        query = query.eq('nhan_vien_id', resolvedNhanVienId)
      }

      const { data, error } = await query
      if (error) {
        console.error('[AttendanceAdapter] Error fetching attendance by period:', error)
        return { records: [], coLoi: true, loi: error.message || 'LOI_DOC_CHAM_CONG' }
      }

      return { records: ((data || []) as unknown as Record<string, unknown>[]).map(row => mapAttendancePeriodRow(row)), coLoi: false }
    } catch (error) {
      console.error('[AttendanceAdapter] Error fetching attendance by period:', error)
      return { records: [], coLoi: true, loi: error instanceof Error ? error.message : 'LOI_DOC_CHAM_CONG' }
    }
  },
};
