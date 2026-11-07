export type ErrorScope = 'individual' | 'store_operation' | 'dual_impact'

export type ErrorGroup =
  | 'Đơn Hàng & Khách Hàng (App / Tại Quán)'
  | 'Pha Chế & SOP Chất Lượng'
  | 'Vệ Sinh & An Toàn Thực Phẩm'
  | 'Giờ Công & Kỷ Luật'
  | 'Khác / Bổ Sung'

export interface UnifiedErrorCategory {
  code: string
  name: string
  group: ErrorGroup
  scope: ErrorScope
  defaultEmployeePoints: number
  defaultStorePoints: number
  impactCSAT?: boolean
  isLockBonus?: boolean
  hasOrderCode?: boolean
  isActive?: boolean
  isCustom?: boolean
  severity: 'minor' | 'medium' | 'major' | 'critical'
  explanation: string
}

export const DEFAULT_FNB_ERROR_CATEGORIES: UnifiedErrorCategory[] = [
  // ── NHÓM 1: ĐƠN HÀNG & KHÁCH HÀNG (APP / TẠI QUÁN) ──
  {
    code: 'ORD-01',
    name: 'Làm thiếu món / quên topping (Bị khiếu nại hoặc dính 1 sao App)',
    group: 'Đơn Hàng & Khách Hàng (App / Tại Quán)',
    scope: 'dual_impact',
    defaultEmployeePoints: 2,
    defaultStorePoints: 10,
    impactCSAT: true,
    hasOrderCode: true,
    isActive: true,
    severity: 'major',
    explanation: 'Tác động kép: Phạt 2đ nhân viên làm đơn VÀ trừ 10đ CSAT của Quán trên bảng BSC',
  },
  {
    code: 'ORD-02',
    name: 'Giao nhầm đơn cho Shipper / Khách mang về',
    group: 'Đơn Hàng & Khách Hàng (App / Tại Quán)',
    scope: 'dual_impact',
    defaultEmployeePoints: 2,
    defaultStorePoints: 5,
    impactCSAT: true,
    hasOrderCode: true,
    isActive: true,
    severity: 'medium',
    explanation: 'Tác động kép: Phạt 2đ nhân viên giao đơn VÀ trừ 5đ điểm Vận Hành của Quán',
  },
  {
    code: 'ORD-03',
    name: 'Đóng gói ẩu / Đổ bể / Rách màng ép ly giao hàng',
    group: 'Đơn Hàng & Khách Hàng (App / Tại Quán)',
    scope: 'individual',
    defaultEmployeePoints: 1,
    defaultStorePoints: 0,
    hasOrderCode: true,
    isActive: true,
    severity: 'minor',
    explanation: 'Phạt 1đ lỗi cá nhân nhân viên đóng gói đơn',
  },
  {
    code: 'ORD-04',
    name: 'Thái độ thiếu chuẩn mực / Khách phàn nàn trực tiếp',
    group: 'Đơn Hàng & Khách Hàng (App / Tại Quán)',
    scope: 'dual_impact',
    defaultEmployeePoints: 3,
    defaultStorePoints: 10,
    impactCSAT: true,
    hasOrderCode: true,
    isActive: true,
    severity: 'major',
    explanation: 'Tác động kép: Phạt 3đ nhân viên phục vụ VÀ trừ 10đ CSAT của Quán',
  },

  // ── NHÓM 2: PHA CHẾ & SOP CHẤT LƯỢNG ──
  {
    code: 'SOP-01',
    name: 'Pha sai công thức (% đường / đá / sai định lượng chuỗi)',
    group: 'Pha Chế & SOP Chất Lượng',
    scope: 'individual',
    defaultEmployeePoints: 2,
    defaultStorePoints: 0,
    hasOrderCode: true,
    isActive: true,
    severity: 'medium',
    explanation: 'Phạt 2đ nhân viên pha chế trực tiếp ly đồ uống',
  },
  {
    code: 'SOP-02',
    name: 'Để cốt trà / thạch / trân châu quá hạn dùng SOP',
    group: 'Pha Chế & SOP Chất Lượng',
    scope: 'store_operation',
    defaultEmployeePoints: 0,
    defaultStorePoints: 5,
    isActive: true,
    severity: 'medium',
    explanation: 'Lỗi vận hành ca: Trừ 5đ Vận Hành của Quán (Trách nhiệm toàn ca)',
  },
  {
    code: 'SOP-03',
    name: 'Quên dán tem date / Không ghi hạn mở nắp nguyên liệu',
    group: 'Pha Chế & SOP Chất Lượng',
    scope: 'store_operation',
    defaultEmployeePoints: 0,
    defaultStorePoints: 5,
    isActive: true,
    severity: 'minor',
    explanation: 'Lỗi vận hành ca: Trừ 5đ Vận Hành của Quán (Trách nhiệm toàn ca)',
  },

  // ── NHÓM 3: VỆ SINH & AN TOÀN THỰC PHẨM (VSATTP) ──
  {
    code: 'HYG-01',
    name: 'Dính dị vật trong đồ uống (tóc, côn trùng...) - Đặc biệt nghiêm trọng',
    group: 'Vệ Sinh & An Toàn Thực Phẩm',
    scope: 'dual_impact',
    defaultEmployeePoints: 5,
    defaultStorePoints: 20,
    impactCSAT: true,
    isLockBonus: true,
    hasOrderCode: true,
    isActive: true,
    severity: 'critical',
    explanation: 'Đặc biệt nghiêm trọng: Khóa thưởng nhân viên 0đ VÀ trừ 20đ uy tín của quán',
  },
  {
    code: 'HYG-02',
    name: 'Khu vực quầy bar dơ bẩn / Không hoàn thành checklist ca',
    group: 'Vệ Sinh & An Toàn Thực Phẩm',
    scope: 'store_operation',
    defaultEmployeePoints: 0,
    defaultStorePoints: 5,
    isActive: true,
    severity: 'minor',
    explanation: 'Lỗi vận hành ca: Trừ 5đ Vận Hành của Quán (Trách nhiệm toàn ca)',
  },
  {
    code: 'HYG-03',
    name: 'Quên tắt máy lạnh / máy ép / thiết bị điện qua đêm',
    group: 'Vệ Sinh & An Toàn Thực Phẩm',
    scope: 'store_operation',
    defaultEmployeePoints: 0,
    defaultStorePoints: 5,
    isActive: true,
    severity: 'minor',
    explanation: 'Lỗi vận hành ca: Trừ 5đ Vận Hành của Quán (Trách nhiệm toàn ca)',
  },

  // ── NHÓM 4: GIỜ CÔNG, KỶ LUẬT & TIỀN BẠC ──
  {
    code: 'ATT-01',
    name: 'Đi trễ / Về sớm dưới 15 phút',
    group: 'Giờ Công & Kỷ Luật',
    scope: 'individual',
    defaultEmployeePoints: 1,
    defaultStorePoints: 0,
    isActive: true,
    severity: 'minor',
    explanation: 'Trừ 1đ lỗi cá nhân nhân viên vi phạm',
  },
  {
    code: 'ATT-02',
    name: 'Đi trễ / Về sớm từ 15 - 30 phút',
    group: 'Giờ Công & Kỷ Luật',
    scope: 'individual',
    defaultEmployeePoints: 2,
    defaultStorePoints: 0,
    isActive: true,
    severity: 'medium',
    explanation: 'Trừ 2đ lỗi cá nhân nhân viên vi phạm',
  },
  {
    code: 'ATT-03',
    name: 'Đi trễ quá 30 phút',
    group: 'Giờ Công & Kỷ Luật',
    scope: 'individual',
    defaultEmployeePoints: 3,
    defaultStorePoints: 0,
    isActive: true,
    severity: 'major',
    explanation: 'Trừ 3đ lỗi cá nhân & lưu biên bản KPI',
  },
  {
    code: 'ATT-04',
    name: 'Bỏ ca không phép / Vắng mặt no-show',
    group: 'Giờ Công & Kỷ Luật',
    scope: 'individual',
    defaultEmployeePoints: 5,
    defaultStorePoints: 0,
    isLockBonus: true,
    isActive: true,
    severity: 'critical',
    explanation: 'Lỗi kỷ luật nặng: Khóa thưởng BSC tháng về 0đ',
  },
  {
    code: 'ATT-06',
    name: 'Gian lận chấm công / Quẹt thẻ hộ',
    group: 'Giờ Công & Kỷ Luật',
    scope: 'individual',
    defaultEmployeePoints: 5,
    defaultStorePoints: 0,
    isLockBonus: true,
    isActive: true,
    severity: 'critical',
    explanation: 'Lỗi kỷ luật nặng: Khóa thưởng BSC tháng về 0đ',
  },
  {
    code: 'CASH-01',
    name: 'Lệch két tiền / Thiếu tiền bàn giao ca',
    group: 'Giờ Công & Kỷ Luật',
    scope: 'individual',
    defaultEmployeePoints: 2,
    defaultStorePoints: 0,
    isActive: true,
    severity: 'medium',
    explanation: 'Trừ 2đ thu ngân chịu trách nhiệm két',
  },
  {
    code: 'UNI-01',
    name: 'Quên thẻ tên / Tạp dề / Sai đồng phục chuỗi',
    group: 'Giờ Công & Kỷ Luật',
    scope: 'individual',
    defaultEmployeePoints: 1,
    defaultStorePoints: 0,
    isActive: true,
    severity: 'minor',
    explanation: 'Trừ 1đ tác phong cá nhân',
  },

  // ── NHÓM 5: KHÁC / BỔ SUNG ──
  {
    code: 'CUSTOM-OTHER',
    name: 'Sự cố phát sinh khác (Tự nhập tên & phân loại linh hoạt)',
    group: 'Khác / Bổ Sung',
    scope: 'individual',
    defaultEmployeePoints: 2,
    defaultStorePoints: 5,
    hasOrderCode: true,
    isActive: true,
    severity: 'medium',
    explanation: 'Tự định mức điểm và đối tượng chịu lỗi',
  },
]

const STORAGE_KEY = 'homies_fnb_error_categories'
const EVENT_NAME = 'homies_catalog_updated'

export const incidentCatalogService = {
  getCatalog(): UnifiedErrorCategory[] {
    if (typeof window === 'undefined') return DEFAULT_FNB_ERROR_CATEGORIES
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.warn('[IncidentCatalog] Error reading from localStorage:', e)
    }
    return DEFAULT_FNB_ERROR_CATEGORIES
  },

  getActiveCategories(): UnifiedErrorCategory[] {
    return this.getCatalog().filter(c => c.isActive !== false)
  },

  saveCatalog(categories: UnifiedErrorCategory[]): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: categories }))
    } catch (e) {
      console.warn('[IncidentCatalog] Error saving to localStorage:', e)
    }
  },

  resetCatalog(): UnifiedErrorCategory[] {
    this.saveCatalog(DEFAULT_FNB_ERROR_CATEGORIES)
    return DEFAULT_FNB_ERROR_CATEGORIES
  },

  updateCategory(updated: UnifiedErrorCategory): UnifiedErrorCategory[] {
    const list = this.getCatalog()
    const next = list.map(item => item.code === updated.code ? updated : item)
    this.saveCatalog(next)
    return next
  },

  toggleCategoryActive(code: string): UnifiedErrorCategory[] {
    const list = this.getCatalog()
    const next = list.map(item => {
      if (item.code === code) {
        return { ...item, isActive: item.isActive === false ? true : false }
      }
      return item
    })
    this.saveCatalog(next)
    return next
  },

  addCategory(newCat: UnifiedErrorCategory): UnifiedErrorCategory[] {
    const list = this.getCatalog()
    // Đảm bảo không trùng code
    const existingIndex = list.findIndex(c => c.code === newCat.code)
    let next: UnifiedErrorCategory[]
    if (existingIndex >= 0) {
      next = list.map(c => c.code === newCat.code ? newCat : c)
    } else {
      // Chèn trước CUSTOM-OTHER
      const customIdx = list.findIndex(c => c.code === 'CUSTOM-OTHER')
      if (customIdx >= 0) {
        next = [...list.slice(0, customIdx), newCat, ...list.slice(customIdx)]
      } else {
        next = [...list, newCat]
      }
    }
    this.saveCatalog(next)
    return next
  },

  deleteCategory(code: string): UnifiedErrorCategory[] {
    const list = this.getCatalog()
    const next = list.filter(item => item.code !== code)
    this.saveCatalog(next)
    return next
  },

  subscribeToUpdates(callback: (list: UnifiedErrorCategory[]) => void): () => void {
    if (typeof window === 'undefined') return () => {}
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<UnifiedErrorCategory[]>
      callback(customEvent.detail || this.getCatalog())
    }
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  },
}
