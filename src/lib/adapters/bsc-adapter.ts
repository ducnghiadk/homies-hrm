// ============================================
// Homies Milk Tea 🧋 — BSC Data Adapter
// Unified Repository Layer for BSC Bonus System
// Seamlessly switching between Supabase Real DB, LocalStorage Persistence & Mock Data
// ============================================

import { isRealDbMode } from './repository-config'
import { supabase } from '../supabase'
import { employeeAdapter } from './employee-adapter'
import type {
  BSCRevenueTarget,
  BSCOperationErrorRecord,
  BSCPersonalErrorRecord,
  BSCCriteriaInfo,
  BSCBonusTier,
  BSCPositionMultiplier,
  BSCDeductionPolicy,
  BSCSafetySettings,
  BSCEmployeePersonalData,
} from '../bsc-types'
import {
  mockBSCRevenueTargets,
  mockBSCOperationErrors,
  mockBSCEmployeeData,
  bscCriteriaCatalog,
  bscBonusTiersCatalog,
  bscPositionMultipliersCatalog,
  bscDeductionPolicy,
  bscSafetySettings,
} from '../mock-data-bsc'

const STORAGE_KEYS = {
  REVENUE_TARGETS: 'homies_bsc_revenue_targets',
  OPERATION_ERRORS: 'homies_bsc_operation_errors',
  EMPLOYEE_DATA: 'homies_bsc_employee_data',
  CRITERIA_CATALOG: 'homies_bsc_criteria_catalog',
  BONUS_TIERS: 'homies_bsc_bonus_tiers',
  SAFETY_SETTINGS: 'homies_bsc_safety_settings',
  DEDUCTION_POLICY: 'homies_bsc_deduction_policy',
  POSITION_MULTIPLIERS: 'homies_bsc_position_multipliers',
}

// LocalStorage Helper
function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (err) {
    console.warn(`[BSCAdapter] Error reading LocalStorage key "${key}":`, err)
    return defaultValue
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[BSCAdapter] Error saving LocalStorage key "${key}":`, err)
  }
}

export const bscAdapter = {
  // ═══════════════════════════════════
  // 1. REVENUE TARGETS & STORE METRICS
  // ═══════════════════════════════════

  async getRevenueTargets(storeId?: string, period?: string): Promise<BSCRevenueTarget[]> {
    if (isRealDbMode()) {
      try {
        let query = supabase.from('bsc_muc_tieu_doanh_thu').select('*')
        if (storeId && storeId !== 'all') query = query.eq('cua_hang_id', storeId)
        if (period && period !== 'all') query = query.eq('ky_luong_id', period)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map((row: Record<string, unknown>) => ({
            store_id: String(row.cua_hang_id || 'store-001'),
            store_name: String(row.ten_cua_hang || 'Homies Cửa Hàng'),
            period: String(row.ky_luong_id || period || '2026-07'),
            profit_threshold_daily: Number(row.moc_hoa_von_ngay || 6500000),
            avg_3_6_months_daily: Number(row.doanh_thu_trung_binh_ngay || 7000000),
            target_daily: Number(row.target_ngay || 8000000),
            target_monthly: Number(row.target_thang || 248000000),
            days_in_month: Number(row.so_ngay_trong_thang || 31),
            actual_revenue_monthly: Number(row.doanh_thu_thuc_te_thang || 255440000),
            actual_revenue_daily: Number(row.doanh_thu_thuc_te_ngay || 8240000),
            is_unlocked: Boolean(row.mo_thuong ?? true),
            cogs_budget: Number(row.cogs_dinh_muc || 85000000),
            cogs_actual: Number(row.cogs_thuc_te || 87125000),
            has_attp_foreign_body: Boolean(row.vi_pham_attp ?? false),
            min_hours_threshold: Number(row.moc_gio_toi_thieu || 110),
            approval_status: (row.trang_thai_duyet as 'draft' | 'pending_ceo' | 'approved_published') || 'approved_published',
            approved_by: String(row.nguoi_duyet || ''),
            approved_at: String(row.ngay_duyet || ''),
          }))
        }
      } catch (err) {
        console.warn('[BSCAdapter] DB read exception for revenue targets, falling back:', err)
      }
    }

    // LocalStorage Fallback
    const targets = getLocalStorage<BSCRevenueTarget[]>(STORAGE_KEYS.REVENUE_TARGETS, mockBSCRevenueTargets)
    
    // Nếu tìm theo 1 store và 1 period cụ thể
    if (storeId && storeId !== 'all' && period && period !== 'all') {
      const exactMatch = targets.find(t => t.store_id === storeId && t.period === period)
      if (exactMatch) return [exactMatch]

      // Tìm chính sách bao trùm theo khoảng thời hạn valid_from <= period <= valid_to
      const policyMatch = targets.find(t => 
        t.store_id === storeId && 
        t.valid_from && t.valid_to && 
        t.valid_from <= period && period <= t.valid_to
      )

      if (policyMatch) {
        return [{
          ...policyMatch,
          period,
          actual_revenue_monthly: 0,
          actual_revenue_daily: 0,
          cogs_budget: 0,
          cogs_actual: 0,
          has_attp_foreign_body: false,
          approval_status: 'draft',
        }]
      }
    }

    return targets.filter(t => {
      if (storeId && storeId !== 'all' && t.store_id !== storeId) return false
      if (period && period !== 'all' && t.period !== period) return false
      return true
    })
  },

  async saveRevenueTarget(storeId: string, period: string, updates: Partial<BSCRevenueTarget>): Promise<boolean> {
    if (isRealDbMode()) {
      try {
        const payload = {
          cua_hang_id: storeId,
          ky_luong_id: period,
          moc_hoa_von_ngay: updates.profit_threshold_daily,
          doanh_thu_trung_binh_ngay: updates.avg_3_6_months_daily,
          target_ngay: updates.target_daily,
          moc_gio_toi_thieu: updates.min_hours_threshold,
          trang_thai_duyet: updates.approval_status,
          nguoi_duyet: updates.approved_by,
          ngay_duyet: updates.approved_at,
        }
        const { error } = await supabase.from('bsc_muc_tieu_doanh_thu').upsert([payload])
        if (!error) return true
      } catch (err) {
        console.warn('[BSCAdapter] DB write exception for revenue target:', err)
      }
    }

    // LocalStorage Persist
    const targets = getLocalStorage<BSCRevenueTarget[]>(STORAGE_KEYS.REVENUE_TARGETS, mockBSCRevenueTargets)
    const idx = targets.findIndex(t => t.store_id === storeId && t.period === period)
    if (idx !== -1) {
      Object.assign(targets[idx], updates)
    } else {
      targets.push({
        store_id: storeId,
        store_name: storeId === 'store-002' ? 'Homies Chi Nhánh 429' : 'Homies Hồ Bá Phấn',
        period,
        profit_threshold_daily: updates.profit_threshold_daily || 6500000,
        target_mode: updates.target_mode || 'auto_3_6_months',
        avg_3_6_months_daily: updates.avg_3_6_months_daily || 7000000,
        manual_target_daily: updates.manual_target_daily || 8050000,
        target_daily: updates.target_daily || 8000000,
        target_monthly: (updates.target_daily || 8000000) * 31,
        days_in_month: 31,
        actual_revenue_monthly: 250000000,
        actual_revenue_daily: 8000000,
        is_unlocked: true,
        valid_from: updates.valid_from,
        valid_to: updates.valid_to,
        target_period_scope: updates.target_period_scope,
        ...updates,
      })
    }

    // Nếu cấu hình có khoảng thời hạn valid_from -> valid_to, cập nhật cho các tháng liên quan
    if (updates.valid_from && updates.valid_to && updates.target_period_scope === 'range_months') {
      targets.forEach(t => {
        if (t.store_id === storeId && t.period >= updates.valid_from! && t.period <= updates.valid_to!) {
          t.profit_threshold_daily = updates.profit_threshold_daily ?? t.profit_threshold_daily
          t.target_mode = updates.target_mode ?? t.target_mode
          t.avg_3_6_months_daily = updates.avg_3_6_months_daily ?? t.avg_3_6_months_daily
          t.manual_target_daily = updates.manual_target_daily ?? t.manual_target_daily
          t.target_daily = updates.target_daily ?? t.target_daily
          t.target_monthly = (updates.target_daily ?? t.target_daily) * t.days_in_month
          t.min_hours_threshold = updates.min_hours_threshold ?? t.min_hours_threshold
          t.valid_from = updates.valid_from
          t.valid_to = updates.valid_to
          t.target_period_scope = updates.target_period_scope
        }
      })
    }

    setLocalStorage(STORAGE_KEYS.REVENUE_TARGETS, targets)
    return true
  },

  // ═══════════════════════════════════
  // 2. OPERATION ERRORS
  // ═══════════════════════════════════

  async getOperationErrors(storeId?: string, period?: string): Promise<BSCOperationErrorRecord[]> {
    if (isRealDbMode()) {
      try {
        let query = supabase.from('bsc_loi_van_hanh').select('*').order('occurred_at', { ascending: false })
        if (storeId && storeId !== 'all') query = query.eq('store_id', storeId)
        if (period && period !== 'all') query = query.eq('period', period)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data as BSCOperationErrorRecord[]
        }
      } catch (err) {
        console.warn('[BSCAdapter] DB read exception for op errors:', err)
      }
    }

    const errors = getLocalStorage<BSCOperationErrorRecord[]>(STORAGE_KEYS.OPERATION_ERRORS, mockBSCOperationErrors)
    return errors.filter(e => {
      if (storeId && storeId !== 'all' && e.store_id !== storeId) return false
      if (period && period !== 'all' && e.period !== period) return false
      return true
    })
  },

  async addOperationError(record: BSCOperationErrorRecord): Promise<boolean> {
    if (isRealDbMode()) {
      try {
        const { error } = await supabase.from('bsc_loi_van_hanh').insert([record])
        if (!error) return true
      } catch (err) {
        console.warn('[BSCAdapter] DB write error for op error:', err)
      }
    }

    const errors = getLocalStorage<BSCOperationErrorRecord[]>(STORAGE_KEYS.OPERATION_ERRORS, mockBSCOperationErrors)
    errors.unshift(record)
    setLocalStorage(STORAGE_KEYS.OPERATION_ERRORS, errors)
    return true
  },

  async removeOperationError(id: string): Promise<boolean> {
    if (isRealDbMode()) {
      try {
        const { error } = await supabase.from('bsc_loi_van_hanh').delete().eq('id', id)
        if (!error) return true
      } catch (err) {
        console.warn('[BSCAdapter] DB delete error for op error:', err)
      }
    }

    const errors = getLocalStorage<BSCOperationErrorRecord[]>(STORAGE_KEYS.OPERATION_ERRORS, mockBSCOperationErrors)
    const filtered = errors.filter(e => e.id !== id)
    setLocalStorage(STORAGE_KEYS.OPERATION_ERRORS, filtered)
    return true
  },

  // ═══════════════════════════════════
  // 3. PERSONAL ERRORS & EMPLOYEE DATA
  // ═══════════════════════════════════

  async getEmployeePersonalData(storeId?: string, period?: string): Promise<BSCEmployeePersonalData[]> {
    const targetStoreId = storeId && storeId !== 'all' ? storeId : 'store-001'
    const targetPeriod = period && period !== 'all' ? period : '2026-07'

    // 1. Kiểm tra bảng Supabase bsc_loi_ca_nhan trước nếu có
    const dbPersonalErrors: Record<string, BSCPersonalErrorRecord[]> = {}
    if (isRealDbMode()) {
      try {
        let query = supabase.from('bsc_loi_ca_nhan').select('*')
        if (storeId && storeId !== 'all') query = query.eq('store_id', targetStoreId)
        if (period && period !== 'all') query = query.eq('period', targetPeriod)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          data.forEach((row: Record<string, unknown>) => {
            const empId = String(row.employee_id || '')
            if (!dbPersonalErrors[empId]) dbPersonalErrors[empId] = []
            if (row.error_record) {
              dbPersonalErrors[empId].push(row.error_record as BSCPersonalErrorRecord)
            }
          })
        }
      } catch (err) {
        console.warn('[BSCAdapter] DB read exception for employee errors:', err)
      }
    }

    // 2. Lấy danh sách nhân viên thực tế từ Supabase / Master Data
    try {
      const allMasterEmployees = await employeeAdapter.getAllEmployees()
      const storeEmployees = allMasterEmployees.filter(emp => {
        if (emp.status === 'resigned' || emp.status === 'inactive') return false
        // Bỏ qua vai trò văn phòng/HQ không hưởng quỹ thưởng trực tiếp tại chi nhánh
        if (emp.role === 'ceo' || emp.role === 'hr_admin') return false
        return (
          emp.store_id === targetStoreId ||
          (Array.isArray(emp.secondary_store_ids) && emp.secondary_store_ids.includes(targetStoreId))
        )
      })

      if (storeEmployees.length > 0) {
        // Map danh sách nhân sự thực từ Supabase
        return storeEmployees.map((emp, index) => {
          const errors = dbPersonalErrors[emp.id] || dbPersonalErrors[emp.employee_code] || []
          
          // Giờ làm việc phân bổ chuẩn theo vai trò trong tháng
          let work_hours = 160
          if (emp.role === 'store_manager') work_hours = 190
          else if (emp.role === 'shift_leader') work_hours = 180
          else if (emp.employee_type === 'part_time') work_hours = index === storeEmployees.length - 1 ? 80 : 120
          else work_hours = 150 + (index * 5)

          return {
            employee_id: emp.id,
            employee_name: emp.full_name,
            role: emp.role || 'employee',
            store_id: targetStoreId,
            period: targetPeriod,
            work_hours,
            errors,
          }
        })
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error loading master employees:', err)
    }

    // 3. Fallback: Lấy từ LocalStorage hoặc mock data chuẩn
    const cached = getLocalStorage<BSCEmployeePersonalData[]>(STORAGE_KEYS.EMPLOYEE_DATA, mockBSCEmployeeData)
    // Nếu cache cũ chứa tên lỗi thời (VD: Đặng Đức Nghĩa), reset về mockBSCEmployeeData mới chuẩn
    const isOldCache = cached.some(e => e.employee_name === 'Đặng Đức Nghĩa' || e.employee_name === 'Phạm Thị Hoa')
    const finalData = isOldCache ? mockBSCEmployeeData : cached

    if (isOldCache) {
      setLocalStorage(STORAGE_KEYS.EMPLOYEE_DATA, mockBSCEmployeeData)
    }

    return finalData.filter(e => {
      if (storeId && storeId !== 'all' && e.store_id !== targetStoreId) return false
      if (period && period !== 'all' && e.period !== targetPeriod) return false
      return true
    })
  },

  async addPersonalError(employeeId: string, period: string, record: BSCPersonalErrorRecord): Promise<boolean> {
    if (isRealDbMode()) {
      try {
        const { error } = await supabase.from('bsc_loi_ca_nhan').insert([{
          employee_id: employeeId,
          period,
          store_id: record.scope_reason || 'store-001',
          error_record: record,
        }])
        if (!error) return true
      } catch (err) {
        console.warn('[BSCAdapter] DB write error for personal error:', err)
      }
    }

    const data = getLocalStorage<BSCEmployeePersonalData[]>(STORAGE_KEYS.EMPLOYEE_DATA, mockBSCEmployeeData)
    const emp = data.find(e => e.employee_id === employeeId && e.period === period)
    if (emp) {
      emp.errors.unshift(record)
    } else {
      data.push({
        employee_id: employeeId,
        employee_name: record.group_name || 'Nhân viên',
        role: 'employee',
        store_id: 'store-001',
        period,
        work_hours: 120,
        errors: [record],
      })
    }
    setLocalStorage(STORAGE_KEYS.EMPLOYEE_DATA, data)
    return true
  },

  async removePersonalError(employeeId: string, period: string, errorId: string): Promise<boolean> {
    if (isRealDbMode()) {
      try {
        const { error } = await supabase.from('bsc_loi_ca_nhan').delete().eq('id', errorId)
        if (!error) return true
      } catch (err) {
        console.warn('[BSCAdapter] DB delete error for personal error:', err)
      }
    }

    const data = getLocalStorage<BSCEmployeePersonalData[]>(STORAGE_KEYS.EMPLOYEE_DATA, mockBSCEmployeeData)
    const emp = data.find(e => e.employee_id === employeeId && e.period === period)
    if (emp) {
      emp.errors = emp.errors.filter(e => e.id !== errorId)
      setLocalStorage(STORAGE_KEYS.EMPLOYEE_DATA, data)
    }
    return true
  },

  // ═══════════════════════════════════
  // 4. CONFIGURATIONS & CATALOGS
  // ═══════════════════════════════════

  async getCriteriaCatalog(): Promise<BSCCriteriaInfo[]> {
    return getLocalStorage<BSCCriteriaInfo[]>(STORAGE_KEYS.CRITERIA_CATALOG, bscCriteriaCatalog)
  },

  async saveCriteriaCatalog(list: BSCCriteriaInfo[]): Promise<boolean> {
    setLocalStorage(STORAGE_KEYS.CRITERIA_CATALOG, list)
    return true
  },

  async getBonusTiers(): Promise<BSCBonusTier[]> {
    return getLocalStorage<BSCBonusTier[]>(STORAGE_KEYS.BONUS_TIERS, bscBonusTiersCatalog)
  },

  async saveBonusTiers(tiers: BSCBonusTier[]): Promise<boolean> {
    setLocalStorage(STORAGE_KEYS.BONUS_TIERS, tiers)
    return true
  },

  async getSafetySettings(): Promise<BSCSafetySettings> {
    return getLocalStorage<BSCSafetySettings>(STORAGE_KEYS.SAFETY_SETTINGS, bscSafetySettings)
  },

  async saveSafetySettings(settings: Partial<BSCSafetySettings>): Promise<boolean> {
    const current = await this.getSafetySettings()
    const updated = { ...current, ...settings }
    setLocalStorage(STORAGE_KEYS.SAFETY_SETTINGS, updated)
    return true
  },

  async getDeductionPolicy(): Promise<BSCDeductionPolicy> {
    return getLocalStorage<BSCDeductionPolicy>(STORAGE_KEYS.DEDUCTION_POLICY, bscDeductionPolicy)
  },

  async saveDeductionPolicy(policy: Partial<BSCDeductionPolicy>): Promise<boolean> {
    const current = await this.getDeductionPolicy()
    const updated = { ...current, ...policy }
    setLocalStorage(STORAGE_KEYS.DEDUCTION_POLICY, updated)
    return true
  },

  async getPositionMultipliers(): Promise<BSCPositionMultiplier[]> {
    return getLocalStorage<BSCPositionMultiplier[]>(STORAGE_KEYS.POSITION_MULTIPLIERS, bscPositionMultipliersCatalog)
  },

  async savePositionMultipliers(multipliers: BSCPositionMultiplier[]): Promise<boolean> {
    setLocalStorage(STORAGE_KEYS.POSITION_MULTIPLIERS, multipliers)
    return true
  },
}
