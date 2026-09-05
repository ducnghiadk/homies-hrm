/**
 * Homies Milk Tea HRM - Shift & Employee Mapping Smart Memory Service
 * Bộ nhớ tự học & Nhận diện thông minh cho Mẫu Ca & Nhân Viên khi Xếp Ca / Import Excel
 */

const SHIFT_MAPPING_MEMORY_KEY = 'homies_smart_shift_mapping_memory'
const EMP_MAPPING_MEMORY_KEY = 'homies_smart_emp_mapping_memory'

export interface ShiftMappingRule {
  templateId: string
  positionId?: string
  lastUpdated?: string
}

export function removeVietnameseTones(str: string): string {
  let strOut = (str || '').toLowerCase().trim()
  strOut = strOut.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
  strOut = strOut.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
  strOut = strOut.replace(/ì|í|ị|ỉ|ĩ/g, 'i')
  strOut = strOut.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
  strOut = strOut.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
  strOut = strOut.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
  strOut = strOut.replace(/đ/g, 'd')
  return strOut
}

export function normalizeMappingKey(text: string): string {
  return removeVietnameseTones(text).replace(/\s+/g, ' ').trim()
}

/**
 * Lấy toàn bộ bộ nhớ quy tắc mapping ca đã từng chỉnh sửa
 */
export function getRememberedShiftMappings(): Record<string, ShiftMappingRule> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(SHIFT_MAPPING_MEMORY_KEY)
    if (!raw) return {}
    return JSON.parse(raw) || {}
  } catch (err) {
    console.warn('[ShiftMemory] Failed to load shift mapping memory', err)
    return {}
  }
}

/**
 * Lưu quy tắc mapping ca vào bộ nhớ
 */
export function saveShiftMappingMemory(shiftText: string, templateId: string, positionId?: string) {
  if (typeof window === 'undefined' || !shiftText) return
  try {
    const current = getRememberedShiftMappings()
    const rawKey = shiftText.trim()
    const normKey = normalizeMappingKey(shiftText)
    const rule: ShiftMappingRule = {
      templateId,
      positionId,
      lastUpdated: new Date().toISOString(),
    }

    current[rawKey] = rule
    if (normKey && normKey !== rawKey) {
      current[normKey] = rule
    }

    localStorage.setItem(SHIFT_MAPPING_MEMORY_KEY, JSON.stringify(current))
  } catch (err) {
    console.warn('[ShiftMemory] Failed to save shift mapping memory', err)
  }
}

/**
 * Lưu hàng loạt quy tắc mapping ca vào bộ nhớ
 */
export function saveBatchShiftMappingMemory(mappings: Record<string, { templateId: string; positionId?: string }>) {
  if (typeof window === 'undefined') return
  try {
    const current = getRememberedShiftMappings()
    const now = new Date().toISOString()

    Object.entries(mappings).forEach(([shiftText, rule]) => {
      if (!shiftText) return
      const rawKey = shiftText.trim()
      const normKey = normalizeMappingKey(shiftText)
      const fullRule: ShiftMappingRule = {
        templateId: rule.templateId,
        positionId: rule.positionId,
        lastUpdated: now,
      }
      current[rawKey] = fullRule
      if (normKey && normKey !== rawKey) {
        current[normKey] = fullRule
      }
    })

    localStorage.setItem(SHIFT_MAPPING_MEMORY_KEY, JSON.stringify(current))
  } catch (err) {
    console.warn('[ShiftMemory] Failed to save batch shift mapping memory', err)
  }
}

/**
 * Lấy toàn bộ bộ nhớ ghép nhân viên thủ công
 */
export function getRememberedEmpMappings(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(EMP_MAPPING_MEMORY_KEY)
    if (!raw) return {}
    return JSON.parse(raw) || {}
  } catch (err) {
    console.warn('[ShiftMemory] Failed to load emp mapping memory', err)
    return {}
  }
}

/**
 * Lưu quy tắc ghép nhân viên vào bộ nhớ
 */
export function saveEmpMappingMemory(rawName: string, empId: string) {
  if (typeof window === 'undefined' || !rawName || !empId) return
  try {
    const current = getRememberedEmpMappings()
    const rawKey = rawName.trim()
    const normKey = normalizeMappingKey(rawName)

    current[rawKey] = empId
    if (normKey && normKey !== rawKey) {
      current[normKey] = empId
    }

    localStorage.setItem(EMP_MAPPING_MEMORY_KEY, JSON.stringify(current))
  } catch (err) {
    console.warn('[ShiftMemory] Failed to save emp mapping memory', err)
  }
}

/**
 * Nhận diện Mẫu Ca thông minh đa tầng:
 * 1. Ưu tiên kiểm tra Bộ nhớ đã lưu từ những lần trước (Smart Memory)
 * 2. Nhận diện từ khóa Ca Linh Hoạt / Phát Sinh / Bổ Sung (kể cả không dấu, viết hoa)
 * 3. Khớp tên mẫu ca chính xác
 * 4. Nhận diện theo từ khóa Ca Sáng, Ca Trưa, Ca Tối
 * 5. Khớp theo khung giờ bắt đầu [HH:mm - HH:mm]
 */
export function smartResolveShiftTemplate(
  shiftText: string,
  templates: Array<{ id: string; name: string; start_time?: string; end_time?: string; is_flexible?: boolean; code?: string }>,
  rememberedMap?: Record<string, ShiftMappingRule>
): string {
  const effectiveMemory = rememberedMap || getRememberedShiftMappings()
  const rawKey = (shiftText || '').trim()
  const normKey = normalizeMappingKey(shiftText)

  // 1. Kiểm tra bộ nhớ đã lưu
  if (effectiveMemory[rawKey]?.templateId) {
    const memTplId = effectiveMemory[rawKey].templateId
    if (templates.some(t => t.id === memTplId)) return memTplId
  }
  if (effectiveMemory[normKey]?.templateId) {
    const memTplId = effectiveMemory[normKey].templateId
    if (templates.some(t => t.id === memTplId)) return memTplId
  }

  const cleanText = normKey
  const flexTpl = templates.find(
    t => t.id === 'shift-004' || t.is_flexible || t.code?.includes('FLEX') || removeVietnameseTones(t.name).includes('linh hoat') || removeVietnameseTones(t.name).includes('phat sinh')
  )
  const flexTplId = flexTpl?.id || 'shift-004'

  // 2. Nhận diện từ khóa Ca Phát Sinh / Linh Hoạt / Bổ Sung / Lẻ / Tăng ca
  const flexKeywords = [
    'phat sinh',
    'bo sung',
    'linh hoat',
    'ca le',
    'tang ca',
    'tang cuong',
    'parttime',
    'part-time',
    'part time',
    'ot',
    'overtime',
    'ngoai gio',
    'tang gio',
    'ca phat sinh',
    'ca bo sung',
    'ca linh hoat',
    'linh dong',
    'phu ca',
    'le',
  ]
  if (flexKeywords.some(kw => cleanText.includes(kw))) {
    return flexTplId
  }

  // 3. Khớp trực tiếp tên mẫu ca trong hệ thống
  const exactTpl = templates.find(t => {
    const tplClean = removeVietnameseTones(t.name)
    return cleanText.includes(tplClean)
  })
  if (exactTpl) return exactTpl.id

  // 4. Bóc tách khung giờ [HH:mm - HH:mm]
  const timeMatch = shiftText.match(/\[?(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\]?/)
  const startTime = timeMatch ? timeMatch[1] : ''

  // 5. Nhận diện theo từ khóa & Khung giờ
  const morningTpl = templates.find(t => t.id === 'shift-001' || removeVietnameseTones(t.name).includes('sang'))
  const eveningTpl = templates.find(t => t.id === 'shift-003' || removeVietnameseTones(t.name).includes('toi') || removeVietnameseTones(t.name).includes('dem'))
  const afternoonTpl = templates.find(t => t.id === 'shift-002' || removeVietnameseTones(t.name).includes('chieu') || removeVietnameseTones(t.name).includes('trua'))

  if (cleanText.includes('sang') || cleanText.includes('ca 1') || cleanText.includes('morning') || (startTime && startTime < '12:00')) {
    return morningTpl?.id || 'shift-001'
  }
  if (cleanText.includes('toi') || cleanText.includes('dem') || cleanText.includes('ca 3') || cleanText.includes('evening') || cleanText.includes('night') || (startTime && startTime >= '17:00')) {
    return eveningTpl?.id || 'shift-003'
  }
  if (cleanText.includes('chieu') || cleanText.includes('trua') || cleanText.includes('ca 2') || cleanText.includes('afternoon') || (startTime && startTime >= '12:00')) {
    return afternoonTpl?.id || 'shift-002'
  }

  return templates[0]?.id || 'shift-001'
}

/**
 * Nhận diện Vị trí công việc thông minh:
 * 1. Ưu tiên kiểm tra Bộ nhớ đã lưu (Smart Memory)
 * 2. Nhận diện từ khóa chức danh (Thu ngân, Pha chế, Phục vụ, Bếp, Quản lý, Giám sát...)
 * 3. Mặc định là Pha chế (pos-001)
 */
export function smartResolvePosition(
  shiftText: string,
  positions: Array<{ id: string; name: string }>,
  rememberedMap?: Record<string, ShiftMappingRule>
): string {
  const effectiveMemory = rememberedMap || getRememberedShiftMappings()
  const rawKey = (shiftText || '').trim()
  const normKey = normalizeMappingKey(shiftText)

  // 1. Kiểm tra bộ nhớ đã lưu
  if (effectiveMemory[rawKey]?.positionId) {
    const memPosId = effectiveMemory[rawKey].positionId
    if (positions.some(p => p.id === memPosId)) return memPosId
  }
  if (effectiveMemory[normKey]?.positionId) {
    const memPosId = effectiveMemory[normKey].positionId
    if (positions.some(p => p.id === memPosId)) return memPosId
  }

  const cleanText = normKey

  // 2. Nhận diện từ khóa chức vụ
  if (cleanText.includes('thu ngan') || cleanText.includes('cashier') || cleanText.includes('tn') || cleanText.includes('t.ngan') || cleanText.includes('t ngan')) {
    return positions.find(p => p.id === 'pos-002' || removeVietnameseTones(p.name).includes('thu ngan'))?.id || 'pos-002'
  }
  if (cleanText.includes('pha che') || cleanText.includes('barista') || cleanText.includes('pc') || cleanText.includes('p.che') || cleanText.includes('p che') || cleanText.includes('bar')) {
    return positions.find(p => p.id === 'pos-001' || removeVietnameseTones(p.name).includes('pha che'))?.id || 'pos-001'
  }
  if (cleanText.includes('phuc vu') || cleanText.includes('service') || cleanText.includes('pv') || cleanText.includes('p.vu') || cleanText.includes('p vu') || cleanText.includes('chay ban')) {
    return positions.find(p => p.id === 'pos-003' || removeVietnameseTones(p.name).includes('phuc vu'))?.id || 'pos-003'
  }
  if (cleanText.includes('bep') || cleanText.includes('kitchen') || cleanText.includes('cook') || cleanText.includes('nau')) {
    return positions.find(p => p.id === 'pos-004' || removeVietnameseTones(p.name).includes('bep'))?.id || 'pos-004'
  }
  if (cleanText.includes('quan ly') || cleanText.includes('manager') || cleanText.includes('ql') || cleanText.includes('cht')) {
    return positions.find(p => p.id === 'pos-005' || removeVietnameseTones(p.name).includes('quan ly'))?.id || 'pos-005'
  }
  if (cleanText.includes('giam sat') || cleanText.includes('supervisor') || cleanText.includes('gs') || cleanText.includes('ca truong')) {
    return positions.find(p => p.id === 'pos-006' || removeVietnameseTones(p.name).includes('giam sat'))?.id || 'pos-006'
  }

  // Khớp tên vị trí bất kỳ trong positions
  const matchedPos = positions.find(p => cleanText.includes(removeVietnameseTones(p.name)))
  if (matchedPos) return matchedPos.id

  // 3. Mặc định là Pha chế (vị trí nòng cốt)
  const defaultPos = positions.find(p => p.id === 'pos-001' || removeVietnameseTones(p.name).includes('pha che'))
  return defaultPos?.id || positions[0]?.id || 'pos-001'
}

/**
 * Kiểm tra xem một chuỗi tên ca / ghi chú có phải là ca linh hoạt / phát sinh không (không phân biệt dấu, hoa thường)
 */
export function isFlexibleShiftText(text: string): boolean {
  if (!text) return false
  const clean = removeVietnameseTones(text).toLowerCase().trim()
  
  // Nếu có từ khóa ca chuẩn (sáng, trưa, chiều, tối, đêm, kiểm kho) mà không có từ phát sinh / đột xuất / linh hoạt rõ ràng
  const hasStandardShiftWord = 
    clean.includes('ca sang') || 
    clean.includes('ca trua') || 
    clean.includes('ca chieu') || 
    clean.includes('ca toi') || 
    clean.includes('ca dem') || 
    clean.includes('kiem kho') ||
    clean.includes('mo quay') ||
    clean.includes('dong quay')

  const hasExplicitFlexWord = 
    clean.includes('phat sinh') || 
    clean.includes('dot xuat') || 
    clean.includes('linh hoat') || 
    clean.includes('bo sung') || 
    clean.includes('tang cuong') ||
    clean.includes('ca le')

  if (hasStandardShiftWord && !hasExplicitFlexWord) {
    return false
  }

  return hasExplicitFlexWord || (
    clean.includes('phat sinh') ||
    clean.includes('bo sung') ||
    clean.includes('linh hoat') ||
    clean.includes('ca le') ||
    clean.includes('tang ca') ||
    clean.includes('tang cuong') ||
    clean.includes('dot xuat') ||
    clean.includes('linh dong') ||
    clean.includes('phu ca')
  )
}

/**
 * Kiểm tra xem một assignment trên lịch có phải là ca phát sinh / linh hoạt không
 */
export function isFlexibleAssignment(
  asg: { shift_id: string; notes?: string },
  regularTemplateIds?: Set<string>,
  templates?: Array<{ id: string; name: string }>
): boolean {
  if (asg.shift_id === 'shift-004' || asg.shift_id.startsWith('shift-flex') || asg.shift_id === 'shift-adhoc') return true
  
  const notes = asg.notes || ''
  if (notes && isFlexibleShiftText(notes)) return true

  // Nếu shift_id thuộc ca chuẩn mẫu mặc định (Sáng, Chiều, Tối/Đêm) -> KHÔNG phải ca phát sinh
  if (['shift-001', 'shift-002', 'shift-003'].includes(asg.shift_id)) return false

  // Nếu shift_id có trong danh sách ca cố định của cửa hàng
  if (regularTemplateIds && regularTemplateIds.has(asg.shift_id)) return false

  // Nếu tên ghi chú chứa từ khóa ca tiêu chuẩn (Sáng, Trưa, Chiều, Tối, Đêm, Kiểm kho) -> KHÔNG phải ca phát sinh
  const cleanNotes = removeVietnameseTones(notes).toLowerCase()
  if (
    cleanNotes.includes('sang') ||
    cleanNotes.includes('trua') ||
    cleanNotes.includes('chieu') ||
    cleanNotes.includes('toi') ||
    cleanNotes.includes('dem') ||
    cleanNotes.includes('ca 1') ||
    cleanNotes.includes('ca 2') ||
    cleanNotes.includes('ca 3') ||
    cleanNotes.includes('mo quay') ||
    cleanNotes.includes('dong quay') ||
    cleanNotes.includes('kiem kho')
  ) {
    return false
  }

  // Nếu truyền templates, kiểm tra xem có khớp template nào không
  if (templates && templates.length > 0) {
    const matched = templates.some(t => {
      if (t.id === asg.shift_id) return true
      const tplClean = removeVietnameseTones(t.name).toLowerCase()
      return cleanNotes.includes(tplClean)
    })
    if (matched) return false
  }

  // Chỉ trả về true nếu hoàn toàn không khớp bất kỳ ca nào
  if (regularTemplateIds && regularTemplateIds.size > 0 && !regularTemplateIds.has(asg.shift_id)) {
    return true
  }

  return false
}
