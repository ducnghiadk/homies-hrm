// ============================================
// Homies Milk Tea 🧋 — BSC Data Adapter
// Direct API Protocol Layer for BSC Bonus System
// 100% Backend REST API & Server Database Driven
// ============================================

import { employeeAdapter } from './employee-adapter'
import { mockEmployees } from '../mock-data'
import type {
  BSCRevenueTarget,
  BSCOperationErrorRecord,
  BSCPersonalErrorRecord,
  BSCPeriod,
  BSCPersonalErrorGroup,
  BSCCriteriaInfo,
  BSCBonusTier,
  BSCPositionMultiplier,
  BSCDeductionPolicy,
  BSCSafetySettings,
  BSCEmployeePersonalData,
  BSCApprovalStatus,
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

function getApiBase(): string {
  if (typeof window !== 'undefined') return ''
  return process.env.APP_BASE_URL || 'http://localhost:3535'
}

export const bscAdapter = {
  // ═══════════════════════════════════
  // 1. REVENUE TARGETS & STORE METRICS
  // ═══════════════════════════════════

  async getRevenueTargets(storeId?: string, period?: string): Promise<BSCRevenueTarget[]> {
    try {
      const base = getApiBase()
      const params = new URLSearchParams()
      if (storeId && storeId !== 'all') params.set('store_id', storeId)
      if (period && period !== 'all') params.set('period', period)

      const res = await fetch(`${base}/api/bsc/targets?${params.toString()}`, {
        cache: 'no-store',
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data as BSCRevenueTarget[]
        }
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error calling GET /api/bsc/targets, falling back to mock:', err)
    }

    return mockBSCRevenueTargets.filter(t => {
      if (storeId && storeId !== 'all' && t.store_id !== storeId) return false
      if (period && period !== 'all' && t.period !== period) return false
      return true
    })
  },

  async saveRevenueTarget(storeId: string, period: string, updates: Partial<BSCRevenueTarget>): Promise<boolean> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          period,
          ...updates,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        return Boolean(json.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error calling POST /api/bsc/targets:', err)
    }

    return false
  },

  // ═══════════════════════════════════
  // 2. OPERATION ERRORS & LOGS
  // ═══════════════════════════════════

  async getOperationErrors(storeId?: string, period?: string): Promise<BSCOperationErrorRecord[]> {
    try {
      const base = getApiBase()
      const params = new URLSearchParams()
      if (storeId && storeId !== 'all') params.set('store_id', storeId)
      if (period && period !== 'all') params.set('period', period)
      params.set('type', 'operation')

      const res = await fetch(`${base}/api/bsc/logs?${params.toString()}`, {
        cache: 'no-store',
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data.map((item: Record<string, unknown>) => ({
            ...item,
            example: String(item.example || item.sub_error_name || item.evidence_note || 'Lỗi vận hành quán'),
          })) as BSCOperationErrorRecord[]
        }
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error calling GET /api/bsc/logs (operation):', err)
    }

    return mockBSCOperationErrors.filter(e => {
      if (storeId && storeId !== 'all' && e.store_id !== storeId) return false
      if (period && period !== 'all' && e.period !== period) return false
      return true
    })
  },

  async addOperationError(record: BSCOperationErrorRecord): Promise<boolean> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...record,
          log_type: 'operation',
          store_id: record.store_id || 'store-001',
          period: record.period || '2026-08',
        }),
      })

      if (res.ok) {
        const json = await res.json()
        return Boolean(json.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error calling POST /api/bsc/logs (operation):', err)
    }

    return false
  },

  async removeOperationError(id: string): Promise<boolean> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/logs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        const json = await res.json()
        return Boolean(json.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error calling DELETE /api/bsc/logs:', err)
    }

    return false
  },

  async approveLog(id: string, approverName: string = 'CEO Nguyễn Đức Nghĩa'): Promise<boolean> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'approve',
          approval_status: 'confirmed',
          verifier_name: approverName,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        return Boolean(json.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error approving log:', err)
    }

    return false
  },

  // ═══════════════════════════════════
  // 3. PERSONAL ERRORS & EMPLOYEE DATA
  // ═══════════════════════════════════

  async getEmployeePersonalData(storeId?: string, period?: string): Promise<BSCEmployeePersonalData[]> {
    const isAllStores = !storeId || storeId === 'all'
    const isAllPeriods = !period || period === 'all'
    const targetPeriod = isAllPeriods ? '2026-08' : period

    // 1. Lấy lỗi cá nhân từ server REST API /api/bsc/logs?type=personal
    const dbPersonalErrors: Record<string, BSCPersonalErrorRecord[]> = {}
    const empNameById: Record<string, string> = {}
    const empStoreById: Record<string, string> = {}
    try {
      const base = getApiBase()
      const params = new URLSearchParams()
      if (!isAllStores) params.set('store_id', storeId)
      if (!isAllPeriods) params.set('period', targetPeriod)
      params.set('type', 'personal')

      const res = await fetch(`${base}/api/bsc/logs?${params.toString()}`, {
        cache: 'no-store',
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          json.data.forEach((item: Record<string, unknown>) => {
            let empId = String(item.employee_id || '')
            const empName = String(item.employee_name || '')
            if (!empId && empName) {
              const q = empName.trim().toLowerCase()
              const found = mockEmployees.find(e => {
                if (!e?.full_name) return false
                const fn = e.full_name.toLowerCase()
                return fn === q || fn.includes(q) || q.includes(fn)
              })
              if (found) {
                empId = found.id
              } else {
                empId = `emp-${q.replace(/\s+/g, '-')}`
              }
            }
            if (empId) {
              if (empName) empNameById[empId] = empName
              if (item.store_id) empStoreById[empId] = String(item.store_id)
              if (!dbPersonalErrors[empId]) dbPersonalErrors[empId] = []
              dbPersonalErrors[empId].push({
                id: String(item.id || ''),
                event_id: String(item.event_id || item.id || `ERR-${empId}`),
                employee_id: empId,
                period: targetPeriod as BSCPeriod,
                group: (String(item.group_key || item.group || 'gio_lam_cham_cong')) as BSCPersonalErrorGroup,
                group_name: String(item.group_name || ''),
                sub_error_id: String(item.sub_error_id || item.code || 'ERR-01'),
                sub_error_name: String(item.sub_error_name || item.name || item.group_name || ''),
                example: String(item.example || item.sub_error_name || item.evidence_note || item.name || 'Lỗi cá nhân'),
                impact: String(item.impact || ''),
                points: Number(item.points || 1),
                occurred_at: String(item.occurred_at || new Date().toISOString()),
                is_serious: Boolean(item.locks_personal_bonus ?? item.is_serious),
                approval_status: (item.approval_status as BSCApprovalStatus) || 'proposed_manager',
              })
            }
          })
        }
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error loading personal errors from /api/bsc/logs:', err)
    }

    // 2. Lấy danh sách nhân viên thực tế từ Master Data / Server DB
    try {
      const allMasterEmployees = await employeeAdapter.getAllEmployees()
      const storeEmployees = allMasterEmployees.filter(emp => {
        if (emp.status === 'resigned' || emp.status === 'inactive') return false
        // Loại trừ vai trò văn phòng/HQ không hưởng quỹ thưởng trực tiếp tại chi nhánh
        if (emp.role === 'ceo' || emp.role === 'hr_admin') return false
        if (!isAllStores) {
          return (
            emp.store_id === storeId ||
            (Array.isArray(emp.secondary_store_ids) && emp.secondary_store_ids.includes(storeId))
          )
        }
        return true
      })

      if (storeEmployees.length > 0) {
        // Lấy dữ liệu giờ công từ bảng lương tháng (/api/payroll)
        const payrollHoursByEmpStore: Record<string, number> = {}
        const payrollTotalHoursByEmp: Record<string, number> = {}
        try {
          const base = getApiBase()
          const payrollRes = await fetch(`${base}/api/payroll?period=${targetPeriod}`, {
            cache: 'no-store',
          })
          if (payrollRes.ok) {
            const payrollData = await payrollRes.json()
            if (payrollData?.success && Array.isArray(payrollData.salary_slips)) {
              for (const slip of payrollData.salary_slips) {
                const hours = Number(slip.total_hours || (slip.work_days ? slip.work_days * 5.5 : 0))
                const empId = slip.employee_id
                const empCode = slip.employee_code
                const empName = slip.employee_name ? slip.employee_name.trim().toLowerCase() : ''
                const sId = slip.store_id

                if (empId) {
                  payrollTotalHoursByEmp[empId] = (payrollTotalHoursByEmp[empId] || 0) + hours
                  if (sId) payrollHoursByEmpStore[`${empId}__${sId}`] = hours
                }
                if (empCode) {
                  payrollTotalHoursByEmp[empCode] = (payrollTotalHoursByEmp[empCode] || 0) + hours
                  if (sId) payrollHoursByEmpStore[`${empCode}__${sId}`] = hours
                }
                if (empName) {
                  payrollTotalHoursByEmp[empName] = (payrollTotalHoursByEmp[empName] || 0) + hours
                  if (sId) payrollHoursByEmpStore[`${empName}__${sId}`] = hours
                }
              }
            }
          }
        } catch (e) {
          console.warn('[BSCAdapter] Could not fetch payroll hours from API:', e)
        }

        // Map danh sách nhân sự thực và gán giờ công, lỗi cá nhân
        const matchedKeys = new Set<string>()
        const result: BSCEmployeePersonalData[] = storeEmployees.map(emp => {
          let errors = dbPersonalErrors[emp.id] || dbPersonalErrors[emp.employee_code] || []
          if (dbPersonalErrors[emp.id]) matchedKeys.add(emp.id)
          if (dbPersonalErrors[emp.employee_code]) matchedKeys.add(emp.employee_code)
          if (errors.length === 0 && emp.full_name) {
            const fnLower = emp.full_name.trim().toLowerCase()
            for (const [k, v] of Object.entries(dbPersonalErrors)) {
              if (!matchedKeys.has(k)) {
                const knownName = (empNameById[k] || '').trim().toLowerCase()
                if (knownName && (knownName.includes(fnLower) || fnLower.includes(knownName))) {
                  errors = v
                  matchedKeys.add(k)
                  break
                }
              }
            }
          }
          const targetStoreId = (!isAllStores && storeId) ? storeId : (emp.store_id || 'store-001')

          let payrollHours: number
          if (!isAllStores && storeId) {
            payrollHours = payrollHoursByEmpStore[`${emp.id}__${storeId}`] ??
                           payrollHoursByEmpStore[`${emp.employee_code}__${storeId}`] ??
                           (emp.full_name ? payrollHoursByEmpStore[`${emp.full_name.trim().toLowerCase()}__${storeId}`] : undefined) ??
                           (emp.store_id === storeId ? (payrollTotalHoursByEmp[emp.id] ?? 0) : 0)
          } else {
            payrollHours = payrollTotalHoursByEmp[emp.id] ??
                           payrollTotalHoursByEmp[emp.employee_code] ??
                           (emp.full_name ? payrollTotalHoursByEmp[emp.full_name.trim().toLowerCase()] : undefined) ??
                           0
          }

          const totalHours = payrollTotalHoursByEmp[emp.id] ??
                             payrollTotalHoursByEmp[emp.employee_code] ??
                             (emp.full_name ? payrollTotalHoursByEmp[emp.full_name.trim().toLowerCase()] : undefined) ??
                             payrollHours

          const effectiveRole = emp.role === 'store_manager'
            ? 'store_manager'
            : emp.role === 'shift_leader'
              ? 'shift_leader'
              : 'full_time'

          return {
            employee_id: emp.id,
            employee_name: emp.full_name,
            employee_code: emp.employee_code,
            role: effectiveRole,
            store_id: targetStoreId,
            period: targetPeriod,
            work_hours: payrollHours,
            total_work_hours: totalHours,
            errors,
            bank_name: (emp as { bank_name?: string }).bank_name,
            bank_account_no: (emp as { bank_account_no?: string }).bank_account_no,
            bank_account_holder: (emp as { bank_account_holder?: string }).bank_account_holder,
          }
        })

        // Bổ sung nhân sự có lỗi từ Bot Hermes nhưng chưa có hồ sơ nhân viên chính thức
        for (const [k, errList] of Object.entries(dbPersonalErrors)) {
          if (!matchedKeys.has(k) && errList.length > 0) {
            const itemStoreId = empStoreById[k] || 'store-001'
            if (isAllStores || itemStoreId === storeId) {
              result.push({
                employee_id: k,
                employee_name: empNameById[k] || 'Nhân sự',
                employee_code: k,
                role: 'full_time',
                store_id: itemStoreId,
                period: targetPeriod,
                work_hours: 0,
                total_work_hours: 0,
                errors: errList,
              })
            }
          }
        }

        return result
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error loading master employees:', err)
    }

    // 3. Fallback mock employees nếu chưa có master data
    return mockEmployees
      .filter(emp => emp.role !== 'ceo' && emp.role !== 'hr_admin' && (isAllStores || emp.store_id === storeId))
      .map(emp => ({
        employee_id: emp.id,
        employee_name: emp.full_name,
        role: (emp.role as 'store_manager' | 'shift_leader' | 'full_time' | 'part_time') || 'full_time',
        store_id: emp.store_id || 'store-001',
        period: targetPeriod,
        work_hours: 0,
        errors: dbPersonalErrors[emp.id] || [],
      }))
  },

  async addPersonalError(employeeId: string, period: string, record: BSCPersonalErrorRecord): Promise<boolean> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...record,
          log_type: 'personal',
          employee_id: employeeId,
          store_id: record.scope_reason || 'store-001',
          period,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        return Boolean(json.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error calling POST /api/bsc/logs (personal):', err)
    }

    return false
  },

  async removePersonalError(_employeeId: string, _period: string, errorId: string): Promise<boolean> {
    return this.removeOperationError(errorId)
  },

  // ═══════════════════════════════════
  // 4. CEO APPROVAL ACTION
  // ═══════════════════════════════════

  async approveBSC(
    storeId: string,
    period: string,
    action: 'submit' | 'submit_ceo' | 'approve' | 'reject' | 'reopen' = 'approve',
    approverName: string = 'CEO Nguyễn Đức Nghĩa'
  ): Promise<{ success: boolean; message?: string; approval_status?: string }> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          period,
          action,
          approver_name: approverName,
        }),
      })

      const json = await res.json()
      return json
    } catch (err) {
      console.warn('[BSCAdapter] Error calling POST /api/bsc/approve:', err)
      return { success: false, message: 'Lỗi mạng khi gọi API phê duyệt BSC' }
    }
  },

  // ═══════════════════════════════════
  // 5. CONFIGURATIONS & CATALOGS (100% SERVER API SYNC)
  // ═══════════════════════════════════

  async getCriteriaCatalog(): Promise<BSCCriteriaInfo[]> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.settings?.criteria && Array.isArray(data.settings.criteria) && data.settings.criteria.length > 0) {
          return data.settings.criteria
        }
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error loading criteria catalog from API:', err)
    }
    return bscCriteriaCatalog
  },

  async saveCriteriaCatalog(list: BSCCriteriaInfo[]): Promise<boolean> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria: list }),
      })
      if (res.ok) {
        const data = await res.json()
        return Boolean(data.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error saving criteria catalog to API:', err)
    }
    return false
  },

  async getBonusTiers(): Promise<BSCBonusTier[]> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.settings?.bonus_tiers && Array.isArray(data.settings.bonus_tiers) && data.settings.bonus_tiers.length > 0) {
          return data.settings.bonus_tiers
        }
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error loading bonus tiers from API:', err)
    }
    return bscBonusTiersCatalog
  },

  async saveBonusTiers(tiers: BSCBonusTier[]): Promise<boolean> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonus_tiers: tiers }),
      })
      if (res.ok) {
        const data = await res.json()
        return Boolean(data.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error saving bonus tiers to API:', err)
    }
    return false
  },

  async getSafetySettings(): Promise<BSCSafetySettings> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.settings?.safety_settings) {
          Object.assign(bscSafetySettings, data.settings.safety_settings)
          return { ...bscSafetySettings, ...data.settings.safety_settings }
        }
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error loading safety settings from API:', err)
    }
    return { ...bscSafetySettings }
  },

  async saveSafetySettings(settings: Partial<BSCSafetySettings>): Promise<boolean> {
    Object.assign(bscSafetySettings, settings)
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safety_settings: settings }),
      })
      if (res.ok) {
        const data = await res.json()
        return Boolean(data.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error saving safety settings to API:', err)
    }
    return false
  },

  async getDeductionPolicy(): Promise<BSCDeductionPolicy> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.settings?.deduction_policy) {
          Object.assign(bscDeductionPolicy, data.settings.deduction_policy)
          return { ...bscDeductionPolicy, ...data.settings.deduction_policy }
        }
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error loading deduction policy from API:', err)
    }
    return bscDeductionPolicy
  },

  async saveDeductionPolicy(policy: Partial<BSCDeductionPolicy>): Promise<boolean> {
    Object.assign(bscDeductionPolicy, policy)
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deduction_policy: policy }),
      })
      if (res.ok) {
        const data = await res.json()
        return Boolean(data.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error saving deduction policy to API:', err)
    }
    return false
  },

  async getPositionMultipliers(): Promise<BSCPositionMultiplier[]> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.settings?.position_multipliers && Array.isArray(data.settings.position_multipliers) && data.settings.position_multipliers.length > 0) {
          return data.settings.position_multipliers
        }
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error loading position multipliers from API:', err)
    }
    return bscPositionMultipliersCatalog
  },

  async savePositionMultipliers(multipliers: BSCPositionMultiplier[]): Promise<boolean> {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/api/bsc/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position_multipliers: multipliers }),
      })
      if (res.ok) {
        const data = await res.json()
        return Boolean(data.success)
      }
    } catch (err) {
      console.warn('[BSCAdapter] Error saving position multipliers to API:', err)
    }
    return false
  },
}
