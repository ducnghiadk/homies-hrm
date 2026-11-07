/**
 * STRICT SHIFT VALIDATOR & 10 KHUNG CA CHUẨN HOMIES F&B
 * ========================================================
 * 1. Khóa 10 Khung ca chuẩn của Homies Milk Tea (kết thúc <= 22:00).
 * 2. Quán đóng cửa lúc 22:00, việc dọn dẹp đã nằm trọn trong Ca Tối (17:00 - 22:00).
 * 3. Loại bỏ hoàn toàn 100% "Ca Dọn Quầy" (22:00 - 01:30) và "Ca Linh Động" (11:30 - 14:30).
 * 4. Bất kỳ ca nào vượt mốc 22:00 đều tự động cảnh báo bất thường và KHÔNG được tính vào tổng giờ tự động.
 */

export interface StandardShiftFrame {
  id: string
  name: string
  code: string
  start: string
  end: string
  hours: number
  description: string
  color: string
}

/** 10 Khung ca chuẩn vận hành Homies F&B */
export const HOMIES_10_STANDARD_SHIFTS: StandardShiftFrame[] = [
  {
    id: 'shift-std-01',
    name: 'Ca Sáng Sớm Mở Cửa',
    code: 'MORNING_EARLY',
    start: '06:30',
    end: '12:00',
    hours: 5.5,
    description: 'Ca mở cửa nhận hàng sớm và chuẩn bị quầy bar',
    color: '#D97706',
  },
  {
    id: 'shift-std-02',
    name: 'Ca Sáng Chuẩn',
    code: 'MORNING_STD',
    start: '08:30',
    end: '12:00',
    hours: 3.5,
    description: 'Ca sáng tiêu chuẩn phục vụ khách',
    color: '#2F6FA8',
  },
  {
    id: 'shift-std-03',
    name: 'Ca Sáng Thu Ngân',
    code: 'MORNING_CASHIER',
    start: '08:30',
    end: '12:00',
    hours: 3.5,
    description: 'Ca sáng thu ngân quản lý két tiền và order',
    color: '#0D9488',
  },
  {
    id: 'shift-std-04',
    name: 'Ca Chiều / Trưa',
    code: 'AFTERNOON_STD',
    start: '12:00',
    end: '17:00',
    hours: 5.0,
    description: 'Ca chiều tiêu chuẩn đứng quầy pha chế & thu ngân',
    color: '#F59E0B',
  },
  {
    id: 'shift-std-05',
    name: 'Ca Chiều Mở Rộng',
    code: 'AFTERNOON_EXTENDED',
    start: '12:00',
    end: '17:30',
    hours: 5.5,
    description: 'Ca chiều tăng cường giờ cao điểm tan tầm',
    color: '#EA580C',
  },
  {
    id: 'shift-std-06',
    name: 'Ca Trưa Lẻ',
    code: 'NOON_PARTIAL',
    start: '12:00',
    end: '15:00',
    hours: 3.0,
    description: 'Ca phụ trưa hỗ trợ giờ cao điểm order',
    color: '#8B5CF6',
  },
  {
    id: 'shift-std-07',
    name: 'Ca Chiều Lẻ',
    code: 'AFTERNOON_PARTIAL',
    start: '14:00',
    end: '18:00',
    hours: 4.0,
    description: 'Ca lẻ chiều bổ sung chuẩn bị nguyên liệu',
    color: '#6366F1',
  },
  {
    id: 'shift-std-08',
    name: 'Ca Bếp / Sơ Chế',
    code: 'KITCHEN_PREP',
    start: '13:00',
    end: '20:00',
    hours: 7.0,
    description: 'Nấu trân châu, pudding, thạch phô mai và sơ chế nguyên vật liệu',
    color: '#059669',
  },
  {
    id: 'shift-std-09',
    name: 'Ca Tối (Đóng Quán)',
    code: 'EVENING_CLOSE',
    start: '17:00',
    end: '22:00',
    hours: 5.0,
    description: 'Ca tối bán hàng và hoàn tất 100% dọn dẹp quán trước 22:00',
    color: '#001D3D',
  },
  {
    id: 'shift-std-10',
    name: 'KIỂM KHO GIỮA THÁNG',
    code: 'INVENTORY_AUDIT',
    start: '17:00',
    end: '22:00',
    hours: 5.0,
    description: 'Kiểm kê kho NVL, CCDC và đối soát doanh thu POS',
    color: '#475569',
  },
]

/** Chuyển "HH:mm" thành phút trong ngày */
export function timeStrToMinutes(timeStr?: string): number {
  if (!timeStr) return 0
  let clean = timeStr.trim()
  if (clean.includes('T')) {
    clean = clean.split('T')[1].slice(0, 5)
  } else if (clean.includes(' ')) {
    clean = clean.split(' ')[1].slice(0, 5)
  }
  const parts = clean.split(':').map(Number)
  const h = isNaN(parts[0]) ? 0 : parts[0]
  const m = isNaN(parts[1]) ? 0 : parts[1]
  return h * 60 + m
}

export interface ShiftInput {
  id?: string
  shift_id?: string
  name?: string
  shift_name?: string
  start?: string
  end?: string
  start_time?: string
  end_time?: string
  scheduledIn?: string
  scheduledOut?: string
  actualIn?: string
  actualOut?: string
  hours?: number
  totalHours?: number
  notes?: string
}

/**
 * Kiểm tra xem ca làm việc có phải là Ca Rác (Ca Dọn Quầy hoặc Ca Linh Động 11:30-14:30) hay không
 */
export function isTrashShift(input: ShiftInput | string, startParam?: string, endParam?: string): boolean {
  let shift: ShiftInput
  if (typeof input === 'string') {
    shift = {
      name: input,
      shift_name: input,
      start: startParam,
      scheduledIn: startParam,
      end: endParam,
      scheduledOut: endParam,
    }
  } else {
    shift = input || {}
  }

  const text = `${shift.id || ''} ${shift.shift_id || ''} ${shift.name || ''} ${shift.shift_name || ''} ${shift.notes || ''}`.toLowerCase()
  const startStr = shift.start || shift.start_time || shift.scheduledIn || ''
  const endStr = shift.end || shift.end_time || shift.scheduledOut || ''

  // 1. Ca Dọn Quầy (22:00 - 01:30 hoặc shift-005)
  if (
    text.includes('dọn quầy') ||
    text.includes('don quay') ||
    text.includes('night_clean') ||
    shift.shift_id === 'shift-005' ||
    shift.id === 'shift-005' ||
    (startStr.startsWith('22:') && (endStr.startsWith('01:') || endStr.startsWith('02:') || endStr.startsWith('00:')))
  ) {
    return true
  }

  // 2. Ca Linh Động (11:30 - 14:30 hoặc shift-004)
  if (
    (text.includes('linh động') || text.includes('linh dong') || text.includes('phát sinh') || text.includes('cao điểm trưa') || shift.shift_id === 'shift-004' || shift.id === 'shift-004') &&
    startStr.startsWith('11:30') &&
    endStr.startsWith('14:30')
  ) {
    return true
  }

  return false
}

/**
 * Kiểm tra xem ca làm việc có vượt mốc 22:00 (quán đóng cửa) hay không
 */
export function isShiftPast22PM(input: ShiftInput | string, endParam?: string): boolean {
  let shift: ShiftInput
  if (typeof input === 'string') {
    shift = {
      start: input,
      scheduledIn: input,
      end: endParam,
      scheduledOut: endParam,
    }
  } else {
    shift = input || {}
  }

  const startStr = shift.start || shift.start_time || shift.scheduledIn || shift.actualIn || ''
  const endStr = shift.end || shift.end_time || shift.scheduledOut || shift.actualOut || ''

  if (!endStr) return false

  const startMin = timeStrToMinutes(startStr)
  let endMin = timeStrToMinutes(endStr)

  // Ca xuyên qua đêm (00:00 - 06:00)
  if (endMin <= startMin && endMin > 0) {
    return true
  }

  // Mốc 22:00 là 22 * 60 = 1320 phút
  // Cho phép dung sai 30 phút checkout thực tế sau khi đóng quán dọn dẹp (đến 22:30)
  if (endMin > 22 * 60 + 30) {
    return true
  }

  return false
}

export interface StrictValidationResult {
  isValid: boolean
  isTrash: boolean
  isPast22: boolean
  isAbnormal: boolean
  isStandard: boolean
  standardShift?: StandardShiftFrame
  hours: number
  warning?: string
  statusLabel: 'VALID' | 'TRASH_REJECTED' | 'OVER_22_REJECTED' | 'WARNING'
}

/**
 * STRICT VALIDATOR CHÍNH:
 * - Đối với cơ sở HBP (store-001) trong Tháng 8:
 *   + 100% Ca Dọn Quầy và Ca Linh Động bị LOẠI BỎ (hours = 0, isValid = false).
 *   + Mọi ca vượt mốc 22:00 đều tự động cảnh báo bất thường và KHÔNG được tính vào tổng giờ (hours = 0).
 *   + Chỉ ca thuộc 10 Khung ca chuẩn hoặc kết thúc <= 22:00 mới được ghi nhận giờ công thực tế.
 */
export function validateHomiesShift(
  input: ShiftInput | string,
  startOrStoreId?: string,
  endOrAugust?: string | boolean,
  storeId?: string,
  isAugust2026?: boolean
): StrictValidationResult {
  let shift: ShiftInput
  let actualStoreId = storeId
  let actualIsAugust = isAugust2026

  if (typeof input === 'string') {
    shift = {
      name: input,
      shift_name: input,
      start: startOrStoreId,
      scheduledIn: startOrStoreId,
      end: typeof endOrAugust === 'string' ? endOrAugust : undefined,
      scheduledOut: typeof endOrAugust === 'string' ? endOrAugust : undefined,
    }
  } else {
    shift = input || {}
    if (typeof startOrStoreId === 'string') actualStoreId = startOrStoreId
    if (typeof endOrAugust === 'boolean') actualIsAugust = endOrAugust
  }

  const isHbp = !actualStoreId || actualStoreId === 'store-001' || actualStoreId.includes('HBP')
  const trash = isTrashShift(shift)
  const past22 = isShiftPast22PM(shift)

  // 1. Ca rác bị loại bỏ hoàn toàn tại HBP
  if (trash && (isHbp || actualIsAugust)) {
    return {
      isValid: false,
      isTrash: true,
      isPast22: past22,
      isAbnormal: true,
      isStandard: false,
      hours: 0,
      warning: 'Ca rác (Ca Dọn Quầy / Linh Động) bị loại bỏ 100% tại cơ sở HBP',
      statusLabel: 'TRASH_REJECTED',
    }
  }

  // 2. Ca vượt mốc 22:00 bị loại khỏi tổng giờ tự động
  if (past22) {
    return {
      isValid: false,
      isTrash: trash,
      isPast22: true,
      isAbnormal: true,
      isStandard: false,
      hours: 0,
      warning: 'Ca kết thúc sau 22:00 (Homies đóng cửa lúc 22h, dọn dẹp đã nằm trong ca tối)',
      statusLabel: 'OVER_22_REJECTED',
    }
  }

  // 3. Khớp với 10 Khung ca chuẩn
  const matchedStd = findMatchingStandardShift(shift)
  if (matchedStd) {
    return {
      isValid: true,
      isTrash: false,
      isPast22: false,
      isAbnormal: false,
      isStandard: true,
      standardShift: matchedStd,
      hours: matchedStd.hours,
      statusLabel: 'VALID',
    }
  }

  // 4. Ca hợp lệ kết thúc <= 22:00 nhưng không khớp tên chuẩn
  const startStr = shift.start || shift.start_time || shift.scheduledIn || '08:30'
  const endStr = shift.end || shift.end_time || shift.scheduledOut || '17:00'
  const computedHours = shift.hours || shift.totalHours || Math.max(0, (timeStrToMinutes(endStr) - timeStrToMinutes(startStr)) / 60)

  return {
    isValid: true,
    isTrash: false,
    isPast22: false,
    isAbnormal: false,
    isStandard: false,
    hours: Math.round(computedHours * 10) / 10,
    statusLabel: 'VALID',
  }
}

/**
 * Tìm kiếm khung ca chuẩn khớp với thông tin ca
 */
export function findMatchingStandardShift(shift: ShiftInput): StandardShiftFrame | undefined {
  const shiftText = `${shift.shift_id || ''} ${shift.name || ''} ${shift.shift_name || ''} ${shift.notes || ''}`.toLowerCase()
  const startStr = shift.start || shift.start_time || shift.scheduledIn || ''
  const endStr = shift.end || shift.end_time || shift.scheduledOut || ''

  return HOMIES_10_STANDARD_SHIFTS.find((frame) => {
    if (shift.shift_id === frame.id || shift.id === frame.id) return true
    if (startStr === frame.start && endStr === frame.end) return true
    if (frame.code.toLowerCase() === shiftText) return true
    if (shiftText.includes(frame.name.toLowerCase())) return true
    return false
  })
}
