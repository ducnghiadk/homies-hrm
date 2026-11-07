/**
 * Dịch vụ Quản lý Phân quyền Người Ghi Nhận Sự Cố (Quản lý / Trưởng ca)
 * Cho phép Admin cấu hình ai được quyền lập biên bản sự cố tại từng chi nhánh.
 */

import { employeeAdapter } from '@/lib/adapters/employee-adapter'

export interface AuthorizedVerifier {
  employee_id: string
  employee_code?: string
  full_name: string
  role: string
  role_title: string
  store_id: string
  is_enabled: boolean
}

const STORAGE_KEY = 'homies_authorized_verifiers'
const PINS_STORAGE_KEY = 'homies_store_pins'

// Danh sách mặc định khởi tạo từ danh mục nhân viên
function buildDefaultVerifiers(): AuthorizedVerifier[] {
  const result: AuthorizedVerifier[] = [
    // Chi nhánh Hồ Bá Phấn (store-001)
    {
      employee_id: '9392ab72-eacc-4211-a0b3-a183c0db75d5',
      employee_code: 'NV0027',
      full_name: 'Trần Công Huy',
      role: 'store_manager',
      role_title: 'Quản lý cửa hàng',
      store_id: 'store-001',
      is_enabled: true,
    },
    {
      employee_id: 'emp-hbp-shift1',
      employee_code: 'TL-01',
      full_name: 'Tổ Trưởng Ca Sáng (HBP)',
      role: 'shift_leader',
      role_title: 'Tổ trưởng ca',
      store_id: 'store-001',
      is_enabled: true,
    },
    {
      employee_id: 'emp-hbp-shift2',
      employee_code: 'TL-02',
      full_name: 'Tổ Trưởng Ca Chiều (HBP)',
      role: 'shift_leader',
      role_title: 'Tổ trưởng ca',
      store_id: 'store-001',
      is_enabled: true,
    },
    // Chi nhánh 429 (store-002)
    {
      employee_id: '10a4897f-9936-41a7-804f-8a4556eaaf0c',
      employee_code: 'NV0016',
      full_name: 'Nguyễn Thị Kiều Ý',
      role: 'store_manager',
      role_title: 'Quản lý cửa hàng',
      store_id: 'store-002',
      is_enabled: true,
    },
    {
      employee_id: 'emp-429-shift1',
      employee_code: 'TL-03',
      full_name: 'Tổ Trưởng Ca Sáng (429)',
      role: 'shift_leader',
      role_title: 'Tổ trưởng ca',
      store_id: 'store-002',
      is_enabled: true,
    },
    {
      employee_id: 'emp-429-shift2',
      employee_code: 'TL-04',
      full_name: 'Tổ Trưởng Ca Chiều (429)',
      role: 'shift_leader',
      role_title: 'Tổ trưởng ca',
      store_id: 'store-002',
      is_enabled: true,
    },
    // Admin / CEO
    {
      employee_id: 'emp-001',
      employee_code: 'BH-001',
      full_name: 'Nguyễn Đức Nghĩa',
      role: 'ceo',
      role_title: 'CEO / Ban Giám Đốc',
      store_id: 'all',
      is_enabled: true,
    },
  ]

  return result
}

export function normalizeStoreId(id?: string): string {
  if (!id) return ''
  if (id === 'c0000000-0000-0000-0000-000000000001' || id === 'store-001') return 'store-001'
  if (id === 'c0000000-0000-0000-0000-000000000002' || id === 'store-002') return 'store-002'
  if (id === 'c0000000-0000-0000-0000-000000000003' || id === 'store-003') return 'store-003'
  return id
}

export function isStoreMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false
  if (a === 'all' || b === 'all') return true
  if (a === b) return true
  return normalizeStoreId(a) === normalizeStoreId(b)
}

export const violationPermissionService = {
  /**
   * Lấy danh sách Người ghi nhận được cấp quyền của chi nhánh
   */
  getVerifiers(storeId?: string): AuthorizedVerifier[] {
    if (typeof window === 'undefined') return buildDefaultVerifiers()

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      let list: AuthorizedVerifier[] = raw ? JSON.parse(raw) : buildDefaultVerifiers()

      if (!Array.isArray(list) || list.length === 0) {
        list = buildDefaultVerifiers()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      }

      if (!storeId || storeId === 'all') return list
      const matched = list.filter((v) => isStoreMatch(v.store_id, storeId))
      if (matched.length > 0) return matched
      return buildDefaultVerifiers().filter((v) => isStoreMatch(v.store_id, storeId))
    } catch {
      return buildDefaultVerifiers()
    }
  },

  /**
   * Lấy danh sách Người ghi nhận ĐANG HOẠT ĐỘNG (is_enabled = true)
   */
  getActiveVerifiers(storeId: string): AuthorizedVerifier[] {
    const list = this.getVerifiers(storeId).filter((v) => v.is_enabled)
    if (list.length > 0) return list
    // Fallback nếu tất cả đều bị tắt hoặc chưa nạp kịp
    return buildDefaultVerifiers().filter((v) => isStoreMatch(v.store_id, storeId))
  },

  /**
   * Cập nhật bật/tắt quyền của 1 người
   */
  toggleVerifier(employeeId: string, isEnabled: boolean): void {
    if (typeof window === 'undefined') return
    const all = this.getVerifiers()
    const updated = all.map((v) => (v.employee_id === employeeId ? { ...v, is_enabled: isEnabled } : v))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  },

  /**
   * Thêm 1 nhân sự vào danh sách Người ghi nhận được ủy quyền
   */
  addVerifier(verifier: AuthorizedVerifier): void {
    if (typeof window === 'undefined') return
    const all = this.getVerifiers()
    const idx = all.findIndex((v) => v.employee_id === verifier.employee_id)
    if (idx !== -1) {
      all[idx] = verifier
    } else {
      all.push(verifier)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  },

  /**
   * Xóa quyền ghi nhận
   */
  removeVerifier(employeeId: string): void {
    if (typeof window === 'undefined') return
    const all = this.getVerifiers().filter((v) => v.employee_id !== employeeId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  },

  /**
   * Lấy mã PIN theo từng chi nhánh
   */
  getStorePins(): Record<string, string> {
    const defaultPins = { 'store-001': '3535', 'store-002': '4290', 'store-003': '8888', admin: '8888' }
    if (typeof window === 'undefined') return defaultPins
    try {
      const raw = localStorage.getItem(PINS_STORAGE_KEY)
      return raw ? { ...defaultPins, ...JSON.parse(raw) } : defaultPins
    } catch {
      return defaultPins
    }
  },

  /**
   * Đồng bộ PIN từ danh sách cửa hàng (Database)
   */
  syncPinsFromStores(stores: Array<{ id: string; pin_code?: string }>): void {
    if (typeof window === 'undefined' || !Array.isArray(stores)) return
    const pins = this.getStorePins()
    stores.forEach(s => {
      if (s.id && s.pin_code) {
        pins[s.id] = s.pin_code
      }
    })
    localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(pins))
  },

  /**
   * Đổi mã PIN chi nhánh
   */
  setStorePin(storeId: string, newPin: string): void {
    if (typeof window === 'undefined') return
    const pins = this.getStorePins()
    pins[storeId] = newPin
    localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(pins))
  },

  /**
   * Đồng bộ danh sách Người ghi nhận từ Supabase DB thật (bảng nhan_vien)
   */
  async syncVerifiersFromDb(): Promise<AuthorizedVerifier[]> {
    try {
      const employees = await employeeAdapter.getAllEmployees()
      const currentList = this.getVerifiers()
      const existingIds = new Set(currentList.map((v) => v.employee_id))

      const leadershipRoles = ['store_manager', 'shift_leader', 'ceo', 'quan_ly_cua_hang', 'truong_ca', 'ban_giam_doc']
      const newFromDb: AuthorizedVerifier[] = []

      for (const emp of employees) {
        const roleStr = String(emp.role || '')
        if (leadershipRoles.includes(roleStr) && !existingIds.has(emp.id)) {
          let role_title = 'Quản lý / Trưởng ca'
          if (roleStr === 'ceo' || roleStr === 'ban_giam_doc') role_title = 'CEO / Ban Giám Đốc'
          else if (roleStr === 'store_manager' || roleStr === 'quan_ly_cua_hang') role_title = 'Quản lý cửa hàng'
          else if (roleStr === 'shift_leader' || roleStr === 'truong_ca') role_title = 'Trưởng ca'

          newFromDb.push({
            employee_id: emp.id,
            employee_code: emp.employee_code,
            full_name: emp.full_name,
            role: roleStr,
            role_title,
            store_id: normalizeStoreId(emp.store_id) || 'all',
            is_enabled: true,
          })
        }
      }

      if (newFromDb.length > 0) {
        const merged = [...currentList, ...newFromDb]
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        }
        return merged
      }
      return currentList
    } catch {
      return this.getVerifiers()
    }
  },
}

