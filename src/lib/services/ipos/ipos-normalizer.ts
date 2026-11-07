import {
  getServerDb,
  saveServerDb,
  type ServerDatabaseSchema,
  type ServerEmployee,
  type ServerSalarySlip,
  type ServerAttendanceLog,
} from '@/lib/server/db'
import { updateSchemaRegistry } from './ipos-schema-detector'

export interface IposRawPayload {
  source?: string
  module: 'payroll' | 'attendance' | 'employees' | 'shifts' | 'pos_revenue' | 'all'
  store_raw_code?: string
  period?: string
  raw_data: any[]
  timestamp?: string
}

export interface IposNormalizeResult {
  success: boolean
  module: string
  count: number
  store_id: string
  period: string
  message: string
  details?: Record<string, any>
}

/**
 * Quy đổi mã chi nhánh iPOS sang mã chi nhánh chuẩn của Homies HRM
 */
export function mapIposStoreCode(rawStoreCode?: string): string {
  if (!rawStoreCode) return 'store-001'
  const upper = rawStoreCode.toUpperCase()
  if (upper.includes('HBP') || upper.includes('HỒ BÁ PHẤN') || upper.includes('BA PHAN')) {
    return 'store-001'
  }
  if (upper.includes('429') || upper.includes('TĂNG NHƠN PHÚ') || upper.includes('TANG NHON PHU')) {
    return 'store-002'
  }
  if (upper.includes('LVS') || upper.includes('LÊ VĂN SỸ') || upper.includes('LE VAN SY') || upper.includes('350')) {
    return 'store-003'
  }
  return 'store-001'
}

/**
 * Xử lý chuẩn hóa và lưu trữ dữ liệu từ iPOS vào Database Homies HRM
 */
export async function normalizeIposData(payload: IposRawPayload): Promise<IposNormalizeResult> {
  const db = await getServerDb()
  const storeId = mapIposStoreCode(payload.store_raw_code)
  const currentPeriod = payload.period || new Date().toISOString().slice(0, 7)
  const now = payload.timestamp || new Date().toISOString()

  // 1. Tự động ghi nhận cấu trúc trường và kích hoạt đối soát đề xuất trường thiếu
  try {
    await updateSchemaRegistry(payload)
  } catch (err) {
    console.error('[iPOS Schema Detection Warning]:', err)
  }

  let processedCount = 0

  // Đảm bảo các bảng cần thiết tồn tại
  if (!db.salary_slips) db.salary_slips = []
  if (!db.attendance) db.attendance = []
  if (!db.employees) db.employees = []
  if (!db.payroll_summaries) db.payroll_summaries = []

  const rawList = Array.isArray(payload.raw_data) ? payload.raw_data : []

  // ============================================================
  // MODULE: PAYROLL (BẢNG LƯƠNG CHU KỲ TỪ IPOS)
  // ============================================================
  if (payload.module === 'payroll' || payload.module === 'all') {
    for (const item of rawList) {
      const empCode = item.employeeCode || item.employee_code || item.code || ''
      const empName = item.employeeName || item.employee_name || item.name || 'Nhân viên iPOS'
      const pos = item.position || 'Nhân viên F&B'
      const hours = Number(item.regularHours || item.total_hours || item.hours || 0)
      const hourlyRate = Number(item.hourlyRate || item.hourly_rate || 20000)
      const netSalary = Number(item.netSalary || item.net_salary || (hours * hourlyRate))
      const bonus = Number(item.bonus || item.allowances || 0)
      const deductions = Number(item.deductions || 0)
      const lateDed = Number(item.lateDeduction || item.late_deduction || 0)
      const workDays = Number(item.workDays || item.work_days || 26)

      // 1. Tìm hoặc tạo nhân viên tương ứng
      let emp = db.employees.find((e) => (empCode && e.employee_code?.toUpperCase() === empCode.toUpperCase()) || e.full_name === empName)

      const itemStoreId = item.storeCode ? mapIposStoreCode(item.storeCode) : (emp ? emp.store_id : storeId)

      if (!emp) {
        const newEmpId = `emp-${empCode ? empCode.toLowerCase().replace(/[^a-z0-9]/g, '') : Date.now()}`
        emp = {
          id: newEmpId,
          full_name: empName,
          email: `${newEmpId}@homies.vn`,
          role: 'employee',
          store_id: itemStoreId,
          position_id: 'pos-fnb',
          phone: item.phone || '0900000000',
          employee_code: empCode || `IPOS-${Date.now().toString().slice(-4)}`,
          status: 'active',
          account_status: 'dang_hoat_dong',
          department_name: pos,
          base_salary: 0,
          hourly_rate: hourlyRate,
          bank_name: item.bankName || item.bank_name,
          bank_account_no: item.bankAccountNo || item.bank_account_no,
        }
        db.employees.push(emp)
      }

      // 2. Upsert Phiếu lương (ServerSalarySlip)
      const slipId = `slip-${emp.id}-${itemStoreId}-${currentPeriod.replace('-', '')}`
      const existingSlipIndex = db.salary_slips.findIndex((s) => s.id === slipId || (s.employee_id === emp!.id && s.period === currentPeriod))

      const slipData: ServerSalarySlip = {
        id: existingSlipIndex >= 0 ? db.salary_slips[existingSlipIndex].id : slipId,
        employee_id: emp.id,
        employee_name: emp.full_name,
        employee_code: emp.employee_code,
        position: pos || emp.department_name || 'Nhân viên F&B',
        store_id: itemStoreId,
        period: currentPeriod,
        work_days: workDays,
        total_hours: hours,
        standard_days: 26,
        base_salary: 0,
        allowances: 0,
        bonus,
        deductions,
        late_deduction: lateDed,
        net_salary: netSalary,
        status: 'locked',
        source: 'ipos',
        synced_at: now,
        hourly_rate: hourlyRate,
      } as any

      if (existingSlipIndex >= 0) {
        db.salary_slips[existingSlipIndex] = {
          ...db.salary_slips[existingSlipIndex],
          ...slipData,
        }
      } else {
        db.salary_slips.push(slipData)
      }

      processedCount++
    }

    // Cập nhật lại Payroll Summary cho từng cơ sở phát sinh lương
    const uniqueStoreIds = Array.from(new Set(rawList.map((item: any) => item.storeCode ? mapIposStoreCode(item.storeCode) : storeId)))
    for (const sid of uniqueStoreIds) {
      const storeSlips = db.salary_slips.filter((s) => s.store_id === sid && s.period === currentPeriod)
      const summaryIndex = db.payroll_summaries.findIndex((ps) => ps.store_id === sid && ps.period === currentPeriod)
      const storeObj = db.stores.find((st) => st.id === sid)

      const summaryData = {
        period: currentPeriod,
        store_id: sid,
        store_name: storeObj?.name || (sid === 'store-002' ? 'Homies Milk Tea - Đường 429' : sid === 'store-003' ? 'Homies Milk Tea - Lê Văn Sỹ' : 'Homies Milk Tea - Hồ Bá Phấn'),
        employee_count: storeSlips.length,
        total_base: 0,
        total_allowance: 0,
        total_bonus: storeSlips.reduce((sum, s) => sum + (s.bonus || 0), 0),
        total_deduction: storeSlips.reduce((sum, s) => sum + (s.deductions || 0), 0),
        total_net: storeSlips.reduce((sum, s) => sum + (s.net_salary || 0), 0),
        status: 'locked' as const,
        locked_by: 'iPOS Cloud Multi-Store Sync',
        locked_at: now,
      }

      if (summaryIndex >= 0) {
        db.payroll_summaries[summaryIndex] = summaryData
      } else {
        db.payroll_summaries.push(summaryData)
      }
    }
  }

  // ============================================================
  // MODULE: ATTENDANCE (BẢNG CHẤM CÔNG THEO GIỜ TỪ IPOS)
  // ============================================================
  if (payload.module === 'attendance') {
    for (const item of rawList) {
      const empCode = item.employeeCode || item.employee_code || item.code || ''
      const empName = item.employeeName || item.employee_name || item.name || ''
      const logDate = item.date || item.workDate || now.slice(0, 10)
      const emp = db.employees.find((e) => (empCode && e.employee_code?.toUpperCase() === empCode.toUpperCase()) || e.full_name === empName)

      if (!emp) continue

      const logId = `att-${emp.id}-${logDate}-${item.shift_id || 'shift'}`
      const existingLogIndex = db.attendance.findIndex((a) => a.id === logId)

      const attRecord: ServerAttendanceLog = {
        id: logId,
        employee_id: emp.id,
        employee_name: emp.full_name,
        store_id: storeId,
        store_name: db.stores.find((st) => st.id === storeId)?.name || 'Homies Milk Tea',
        shift_id: item.shift_id || 'shift-001',
        check_in_time: item.checkInTime || item.check_in_time || `${logDate}T08:30:00.000Z`,
        check_out_time: item.checkOutTime || item.check_out_time || `${logDate}T12:00:00.000Z`,
        check_in_lat: 10.8224,
        check_in_lng: 106.7626,
        check_in_distance_meters: 10,
        status: item.isLate ? 'late' : 'checked_out',
        is_late: Boolean(item.isLate),
        late_minutes: Number(item.lateMinutes || 0),
        total_hours: Number(item.totalHours || item.hours || 3.5),
        date: logDate,
        source: 'ipos',
        synced_at: now,
      } as any

      if (existingLogIndex >= 0) {
        db.attendance[existingLogIndex] = attRecord
      } else {
        db.attendance.push(attRecord)
      }
      processedCount++
    }
  }

  // ============================================================
  // MODULE: EMPLOYEES (DANH SÁCH NHÂN VIÊN TỪ IPOS)
  // ============================================================
  if (payload.module === 'employees') {
    for (const item of rawList) {
      const empCode = item.employeeCode || item.code || ''
      const empName = item.fullName || item.full_name || item.name || ''
      if (!empName) continue

      let emp = db.employees.find((e) => (empCode && e.employee_code?.toUpperCase() === empCode.toUpperCase()) || e.full_name === empName)

      if (emp) {
        emp.phone = item.phone || emp.phone
        emp.department_name = item.position || emp.department_name
        emp.bank_name = item.bankName || emp.bank_name
        emp.bank_account_no = item.bankAccountNo || emp.bank_account_no
      } else {
        const newEmpId = `emp-${empCode ? empCode.toLowerCase().replace(/[^a-z0-9]/g, '') : Date.now()}`
        db.employees.push({
          id: newEmpId,
          full_name: empName,
          email: `${newEmpId}@homies.vn`,
          role: 'employee',
          store_id: storeId,
          position_id: 'pos-fnb',
          phone: item.phone || '0900000000',
          employee_code: empCode || `IPOS-${Date.now().toString().slice(-4)}`,
          status: 'active',
          account_status: 'dang_hoat_dong',
          department_name: item.position || 'Nhân viên F&B',
          base_salary: 0,
          hourly_rate: Number(item.hourlyRate || 20000),
          bank_name: item.bankName,
          bank_account_no: item.bankAccountNo,
        })
      }
      processedCount++
    }
  }

  // Lưu lại database
  await saveServerDb(db)

  return {
    success: true,
    module: payload.module,
    count: processedCount,
    store_id: storeId,
    period: currentPeriod,
    message: `Đã đồng bộ thành công ${processedCount} bản ghi từ iPOS (${payload.module}) cho cơ sở ${storeId}`,
  }
}
