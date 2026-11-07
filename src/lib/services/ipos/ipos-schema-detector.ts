import {
  getServerDb,
  saveServerDb,
  type IposSchemaFieldInfo,
  type IposSchemaRecommendation,
} from '@/lib/server/db'
import type { IposRawPayload } from './ipos-normalizer'

// Từ điển định danh các trường của iPOS HRM sang tiếng Việt dễ hiểu
const IPOS_FIELD_DICTIONARY: Record<
  string,
  { label_vi: string; homies_field?: string; description: string; recommendation?: { importance: 'high' | 'medium' | 'low'; reason: string; suggested_action: string } }
> = {
  // --- BẢNG LƯƠNG & CÔNG CHU KỲ (PAYROLL) ---
  employeeCode: { label_vi: 'Mã nhân viên', homies_field: 'employee_code', description: 'Mã định danh duy nhất của nhân viên trên iPOS HRM' },
  code: { label_vi: 'Mã nhân viên', homies_field: 'employee_code', description: 'Mã nhân sự rút gọn' },
  employeeName: { label_vi: 'Họ và tên', homies_field: 'employee_name', description: 'Họ tên đầy đủ của nhân sự' },
  name: { label_vi: 'Họ và tên', homies_field: 'employee_name', description: 'Tên nhân sự' },
  position: { label_vi: 'Vị trí / Chức vụ', homies_field: 'position', description: 'Vị trí công việc (Quản lý, Pha chế, Thu ngân...)' },
  regularHours: { label_vi: 'Số giờ làm chuẩn', homies_field: 'total_hours', description: 'Tổng số giờ công được ghi nhận trong chu kỳ' },
  total_hours: { label_vi: 'Tổng giờ công', homies_field: 'total_hours', description: 'Tổng giờ làm việc thực tế' },
  hourlyRate: { label_vi: 'Đơn giá lương giờ', homies_field: 'hourly_rate', description: 'Mức lương thỏa thuận theo từng giờ làm' },
  netSalary: { label_vi: 'Lương thực nhận', homies_field: 'net_salary', description: 'Số tiền thực tế chuyển khoản sau khi trừ phạt & tạm ứng' },
  bonus: { label_vi: 'Thưởng / Phụ cấp', homies_field: 'bonus', description: 'Các khoản thưởng chuyên cần, tip hoặc trợ cấp' },
  deductions: { label_vi: 'Tạm ứng / Khấu trừ', homies_field: 'deductions', description: 'Khoản tiền đã ứng trước hoặc phạt nội bộ' },
  lateDeduction: { label_vi: 'Phạt đi trễ', homies_field: 'late_deduction', description: 'Số tiền khấu trừ do quẹt thẻ vào trễ ca' },
  workDays: { label_vi: 'Số ngày đi làm', homies_field: 'work_days', description: 'Tổng số ngày có phát sinh quẹt thẻ trong tháng' },
  bankName: { label_vi: 'Ngân hàng thụ hưởng', homies_field: 'bank_name', description: 'Tên ngân hàng mở thẻ của nhân viên' },
  bankAccountNo: { label_vi: 'Số tài khoản ngân hàng', homies_field: 'bank_account_no', description: 'Số tài khoản nhận chuyển khoản lương' },

  // --- TRƯỜNG IPOS ĐẶC THÙ & ĐỀ XUẤT (GAP RECOMMENDATIONS) ---
  missingCheckoutCount: {
    label_vi: 'Số lần quên checkout',
    description: 'Số ca nhân viên có quẹt thẻ vào nhưng quên quẹt thẻ ra',
    recommendation: {
      importance: 'high',
      reason: 'Giúp chuỗi tự động lọc ra nhân sự quên quẹt ra để quản lý nhắc nhở hoặc trừ giờ công ảo.',
      suggested_action: 'Lưu vào hồ sơ chấm công để hiển thị huy hiệu [Quên quẹt thẻ ra].',
    },
  },
  terminalId: {
    label_vi: 'Mã máy vân tay',
    description: 'Mã thiết bị máy chấm công thực tế tại chi nhánh (HBP/429)',
    recommendation: {
      importance: 'medium',
      reason: 'Xác thực nhân viên quẹt thẻ đúng máy tại cửa hàng được giao, chống gian lận vị trí.',
      suggested_action: 'Bổ sung trường [Mã máy chấm công] vào nhật ký quẹt thẻ.',
    },
  },
  allowanceResponsibility: {
    label_vi: 'Phụ cấp trách nhiệm',
    description: 'Khoản phụ cấp quản lý cửa hàng hoặc trưởng ca',
    recommendation: {
      importance: 'high',
      reason: 'Phân tách rõ ràng giữa lương giờ thông thường và phụ cấp chức vụ của cấp quản lý.',
      suggested_action: 'Tách riêng cột [Phụ cấp trách nhiệm] trong phiếu lương.',
    },
  },
  overtimeHours: {
    label_vi: 'Giờ làm thêm (OT)',
    description: 'Số giờ tăng ca ngoài khung giờ phân ca chuẩn',
    recommendation: {
      importance: 'high',
      reason: 'Cần thiết để tính hệ số lương OT 1.5x hoặc 2.0x theo quy định chuỗi.',
      suggested_action: 'Thêm cột [Giờ tăng ca OT] vào bảng chấm công và tính lương.',
    },
  },
  advancePaymentNote: {
    label_vi: 'Lý do tạm ứng lương',
    description: 'Ghi chú lý do nhân sự xin ứng tiền giữa tháng',
    recommendation: {
      importance: 'low',
      reason: 'Giúp kế toán đối soát minh bạch khi phát sinh thắc mắc về phiếu lương.',
      suggested_action: 'Lưu ghi chú tạm ứng vào chi tiết phiếu lương.',
    },
  },

  // --- BẢNG CHẤM CÔNG (ATTENDANCE) ---
  checkInTime: { label_vi: 'Giờ check-in', homies_field: 'check_in_time', description: 'Thời điểm quẹt vân tay vào ca' },
  checkOutTime: { label_vi: 'Giờ check-out', homies_field: 'check_out_time', description: 'Thời điểm quẹt vân tay ra ca' },
  date: { label_vi: 'Ngày công', homies_field: 'date', description: 'Ngày phát sinh ca làm việc' },
  isLate: { label_vi: 'Đi trễ ca', homies_field: 'status', description: 'Đánh dấu quẹt thẻ sau giờ bắt đầu ca' },
}

/**
 * Phân tích cấu trúc trường dữ liệu từ gói iPOS gửi về
 */
export function analyzeIposPayload(payload: IposRawPayload): {
  detectedFields: IposSchemaFieldInfo[]
  recommendations: IposSchemaRecommendation[]
} {
  const detectedFields: IposSchemaFieldInfo[] = []
  const recommendations: IposSchemaRecommendation[] = []
  const rawList = Array.isArray(payload.raw_data) ? payload.raw_data : []
  const now = new Date().toISOString()

  // Thu thập tất cả các key xuất hiện trong gói dữ liệu
  const keyMap = new Map<string, any>()
  for (const item of rawList) {
    if (item && typeof item === 'object') {
      for (const [k, v] of Object.entries(item)) {
        if (!keyMap.has(k) && v !== undefined && v !== null) {
          keyMap.set(k, v)
        }
      }
    }
  }

  // Quét qua từng trường đã phát hiện
  for (const [key, sampleVal] of keyMap.entries()) {
    const meta = IPOS_FIELD_DICTIONARY[key]
    const valType = typeof sampleVal
    let dataType: IposSchemaFieldInfo['data_type'] = 'string'
    if (valType === 'number') dataType = 'number'
    else if (valType === 'boolean') dataType = 'boolean'
    else if (typeof sampleVal === 'string' && sampleVal.includes('T') && !isNaN(Date.parse(sampleVal))) {
      dataType = 'date'
    }

    const isMapped = Boolean(meta?.homies_field)
    const fieldInfo: IposSchemaFieldInfo = {
      key,
      label_vi: meta?.label_vi || key,
      sample_value: sampleVal,
      data_type: dataType,
      is_mapped: isMapped,
      mapped_homies_field: meta?.homies_field,
      target_module: (payload.module === 'all' ? 'payroll' : payload.module) as any,
      is_recommended: Boolean(meta?.recommendation),
      description: meta?.description || `Trường dữ liệu nguyên bản từ iPOS HRM (${key})`,
    }

    detectedFields.push(fieldInfo)

    // Nếu là trường iPOS có mà Homies chưa map chính thức, tạo đề xuất thông minh
    if (!isMapped && meta?.recommendation) {
      recommendations.push({
        id: `rec-${key}-${Date.now()}`,
        module: fieldInfo.target_module,
        field_key: key,
        field_title: meta.label_vi,
        importance: meta.recommendation.importance,
        reason: meta.recommendation.reason,
        suggested_action: meta.recommendation.suggested_action,
        status: 'pending',
        detected_at: now,
      })
    }
  }

  return { detectedFields, recommendations }
}

/**
 * Ghi nhận và lưu vết schema thực tế vào CSDL Server
 */
export async function updateSchemaRegistry(payload: IposRawPayload): Promise<{
  fields: IposSchemaFieldInfo[]
  recommendations: IposSchemaRecommendation[]
}> {
  const db = await getServerDb()
  if (!db.ipos_integration) {
    db.ipos_integration = {
      is_enabled: true,
      api_endpoint: 'https://api.hrm.ipos.vn',
      username: 'homies.quanly@bobahouse.vn',
      store_codes: ['HBP', '429'],
      sync_schedule: 'daily_midnight',
      sync_attendance: true,
      sync_payroll: true,
      sync_employees: true,
      sync_shifts: true,
      sync_pos_revenue: true,
      sync_inventory: true,
      sync_logs: [],
    }
  }

  const { detectedFields, recommendations } = analyzeIposPayload(payload)

  // Merge danh sách các trường đã biết
  const existingFields = db.ipos_integration.detected_fields || []
  const fieldDict = new Map<string, IposSchemaFieldInfo>()
  existingFields.forEach((f) => fieldDict.set(f.key, f))

  detectedFields.forEach((newF) => {
    fieldDict.set(newF.key, {
      ...fieldDict.get(newF.key),
      ...newF,
    })
  })

  // Merge danh sách đề xuất (tránh trùng lặp)
  const existingRecs = db.ipos_integration.schema_recommendations || []
  const recMap = new Map<string, IposSchemaRecommendation>()
  existingRecs.forEach((r) => recMap.set(r.field_key, r))

  recommendations.forEach((newR) => {
    if (!recMap.has(newR.field_key)) {
      recMap.set(newR.field_key, newR)
    }
  })

  db.ipos_integration.detected_fields = Array.from(fieldDict.values())
  db.ipos_integration.schema_recommendations = Array.from(recMap.values())

  await saveServerDb(db)

  return {
    fields: db.ipos_integration.detected_fields,
    recommendations: db.ipos_integration.schema_recommendations,
  }
}

/**
 * Áp dụng đề xuất trường mới (Chuyển sang trạng thái applied & kích hoạt lưu trữ mở rộng)
 */
export async function applySchemaRecommendation(recommendationId: string): Promise<boolean> {
  const db = await getServerDb()
  if (!db.ipos_integration || !db.ipos_integration.schema_recommendations) return false

  const rec = db.ipos_integration.schema_recommendations.find((r) => r.id === recommendationId || r.field_key === recommendationId)
  if (!rec) return false

  rec.status = 'applied'

  // Đánh dấu trường trong danh sách detected_fields là đã map
  if (db.ipos_integration.detected_fields) {
    const f = db.ipos_integration.detected_fields.find((field) => field.key === rec.field_key)
    if (f) {
      f.is_mapped = true
      f.mapped_homies_field = `custom_${rec.field_key}`
    }
  }

  // Lưu vào danh sách mapping mở rộng
  if (!db.ipos_integration.custom_mapped_fields) {
    db.ipos_integration.custom_mapped_fields = {}
  }
  db.ipos_integration.custom_mapped_fields[rec.field_key] = `custom_${rec.field_key}`

  await saveServerDb(db)
  return true
}

/**
 * Bỏ qua đề xuất
 */
export async function dismissSchemaRecommendation(recommendationId: string): Promise<boolean> {
  const db = await getServerDb()
  if (!db.ipos_integration || !db.ipos_integration.schema_recommendations) return false

  const rec = db.ipos_integration.schema_recommendations.find((r) => r.id === recommendationId || r.field_key === recommendationId)
  if (!rec) return false

  rec.status = 'dismissed'
  await saveServerDb(db)
  return true
}

/**
 * Lấy báo cáo tổng hợp trạng thái schema
 */
export async function getSchemaStatus(): Promise<{
  fields: IposSchemaFieldInfo[]
  recommendations: IposSchemaRecommendation[]
  mappedCount: number
  unmappedCount: number
  pendingRecommendationsCount: number
}> {
  const db = await getServerDb()
  const fields = db.ipos_integration?.detected_fields || []
  const recommendations = db.ipos_integration?.schema_recommendations || []

  const mappedCount = fields.filter((f) => f.is_mapped).length
  const unmappedCount = fields.filter((f) => !f.is_mapped).length
  const pendingRecommendationsCount = recommendations.filter((r) => r.status === 'pending').length

  return {
    fields,
    recommendations,
    mappedCount,
    unmappedCount,
    pendingRecommendationsCount,
  }
}
