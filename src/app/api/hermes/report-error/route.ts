import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getServerDb, saveServerDb, type ServerBscLog } from '@/lib/server/db'
import { bscSubErrorCatalog } from '@/lib/mock-data-bsc'

// ══════════════════════════════════════════════════════════════════════════
// CỔNG TÍCH HỢP HERMES BOT - TỰ ĐỘNG TRA CỨU & GHI NHẬN LỖI BSC (VẬN HÀNH & CÁ NHÂN)
// - GET: Bot lấy danh mục lỗi chuẩn (mã lỗi, tên, điểm trừ) + danh sách NV + Cửa hàng
// - POST: Bot ghi nhận lỗi (có hỗ trợ tự động dò mã lỗi theo tên/mô tả nếu bot gửi thiếu)
// - CEO DUYỆT CUỐI: Luôn ở trạng thái "proposed_manager" (Chờ CEO duyệt)
// ══════════════════════════════════════════════════════════════════════════

const PERSONAL_GROUP_KEYS = new Set([
  'gio_lam_cham_cong',
  'dong_phuc_tac_phong',
  'thai_do_khach',
  'tap_trung_trong_ca',
  'thuc_hien_checklist_giao',
  've_sinh_ca_nhan',
  'bao_quan_tai_san',
  'trung_thuc_minh_bach',
  'nghiem_trong_ca_nhan',
])

const GROUP_NAME_MAP: Record<string, string> = {
  gio_lam_cham_cong: 'Giờ làm & Chấm công',
  dong_phuc_tac_phong: 'Đồng phục & Tác phong',
  thai_do_khach: 'Thái độ & Giao tiếp',
  tap_trung_trong_ca: 'Tập trung trong ca',
  thuc_hien_checklist_giao: 'Checklist phân công',
  ve_sinh_ca_nhan: 'Vệ sinh cá nhân',
  bao_quan_tai_san: 'Bảo quản tài sản',
  trung_thuc_minh_bach: 'Trung thực & Dữ liệu',
  nghiem_trong_ca_nhan: 'Nghiêm trọng cá nhân',
  lam_don: 'Làm đơn & Công thức',
  kiem_giao_don: 'Kiểm đơn & Giao đơn',
  dong_goi_giao_app: 'Đóng gói giao App',
  dong_goi: 'Đóng gói & Tem dán',
  thu_ngan_pos: 'Thu ngân & POS',
  checklist_quy_trinh: 'Checklist & Quy trình',
  attp_tem_date: 'ATTP & Tem Date',
  qc_pouring: 'QC Định lượng & Pha chế',
  ve_sinh_5s: 'Vệ sinh 5S quầy',
  cuoi_ca_ban_giao: 'Cuối ca & Bàn giao',
  qa_audit_store: 'QA Audit cửa hàng',
  critical_attp: 'Nghiêm trọng ATTP',
}

function isValidBotToken(req: NextRequest): boolean {
  const expected = process.env.HERMES_BOT_TOKEN
  if (!expected) return false // Chưa có mã bí mật -> Khóa cổng bảo vệ an toàn
  const header = req.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : req.headers.get('x-hermes-token') || ''
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ──────────────────────────────────────────────────────────────────────────
// 1. GET: Cung cấp toàn bộ từ điển danh mục lỗi chuẩn F&B cho Hermes Bot
// ──────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isValidBotToken(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Sai hoặc thiếu mã bảo mật bot' }, { status: 401 })
  }

  try {
    const db = await getServerDb()
    const stores = (db.stores || []).map(s => ({
      id: s.id,
      name: s.name,
      code: s.id,
    }))

    const employees = (db.employees || []).map(e => ({
      id: e.id,
      name: e.full_name,
      employee_code: e.employee_code,
      store_id: e.store_id,
      role: e.role,
    }))

    const catalog = bscSubErrorCatalog.map(item => ({
      id: item.id,
      code: item.code,
      name: item.name,
      group_key: item.group_key,
      group_name: GROUP_NAME_MAP[item.group_key] || item.group_key,
      log_type: PERSONAL_GROUP_KEYS.has(item.group_key) ? 'personal' : 'operation',
      suggested_points: item.suggested_points,
      severity: item.severity,
      description: item.description,
    }))

    return NextResponse.json({
      success: true,
      data: {
        total_errors: catalog.length,
        catalog,
        stores,
        employees,
        instructions: {
          flow: 'Bot tra cứu danh mục để lấy mã (code) hoặc tên chuẩn. Khi người dùng báo lỗi trong nhóm, bot gọi POST với mã lỗi hoặc tên lỗi để HRM tự động khớp điểm trừ.',
          report_endpoint: '/api/hermes/report-error',
          method: 'POST',
        },
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi lấy danh mục lỗi'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 2. POST: Ghi nhận lỗi có hỗ trợ tự động rà lỗi (Smart Matching)
// ──────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!isValidBotToken(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Sai hoặc thiếu mã bảo mật bot' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const db = await getServerDb()

    // ── BƯỚC 1: TỰ ĐỘNG DÒ LỖI TRONG DANH MỤC BSC CHUẨN ──
    const searchCode = (body.code || body.sub_error_code || '').trim().toUpperCase()
    const searchName = (body.name || body.sub_error_name || body.description || '').trim().toLowerCase()

    let matchedItem = bscSubErrorCatalog.find(
      item => (searchCode && item.code.toUpperCase() === searchCode) || item.id === body.sub_error_id
    )

    // Nếu không khớp mã, thử dò theo từ khóa tên lỗi
    if (!matchedItem && searchName) {
      matchedItem = bscSubErrorCatalog.find(item => {
        const itemLower = item.name.toLowerCase()
        return searchName.includes(itemLower) || itemLower.includes(searchName)
      })
    }

    // ── BƯỚC 2: XÁC ĐỊNH LOẠI LỖI (VẬN HÀNH HAY CÁ NHÂN) ──
    const groupKey = body.group_key || matchedItem?.group_key || 'lam_don'
    const isPersonal = body.log_type === 'personal' || (matchedItem && PERSONAL_GROUP_KEYS.has(matchedItem.group_key))
    const logType: 'operation' | 'personal' = isPersonal ? 'personal' : 'operation'

    // Tự động nhận diện cửa hàng nếu thiếu
    let storeId = body.store_id
    if (!storeId && db.stores && db.stores.length > 0) {
      storeId = db.stores[0].id // Mặc định chi nhánh đầu tiên nếu chưa gán
    }

    // Kiểm tra nhân viên nếu là lỗi cá nhân
    let employeeId = body.employee_id
    let employeeName = body.employee_name

    // Tự động rà tên nhân viên trong danh sách nếu có
    if (logType === 'personal' && !employeeId && employeeName && db.employees) {
      const foundEmp = db.employees.find(e => e?.full_name && e.full_name.toLowerCase() === employeeName.toLowerCase())
      if (foundEmp) {
        employeeId = foundEmp.id
        employeeName = foundEmp.full_name
      }
    }

    if (logType === 'personal' && !employeeId && !employeeName) {
      return NextResponse.json(
        { success: false, error: 'Lỗi cá nhân cần tên nhân viên (employee_name) hoặc mã nhân viên (employee_id)' },
        { status: 400 }
      )
    }

    const subErrorName = matchedItem?.name || body.sub_error_name || body.description || 'Lỗi vận hành ca'
    const groupName = GROUP_NAME_MAP[groupKey] || body.group_name || 'Vận hành quán'
    const points = Number(body.points || matchedItem?.suggested_points || 1)

    const source = [body.source_platform, body.source_group, body.reporter_name].filter(Boolean).join(' / ')
    const note = [
      body.description || matchedItem?.description,
      source ? `[Bot Hermes ghi từ: ${source}]` : '[Bot Hermes ghi]',
    ]
      .filter(Boolean)
      .join(' ')

    const id = `bsc-log-bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newLog: ServerBscLog = {
      id,
      event_id: `BOT-${Date.now().toString().slice(-6)}`,
      store_id: String(storeId || 'store-001'),
      period: String(body.period || currentPeriod()),
      log_type: logType,
      group_key: groupKey,
      group_name: groupName,
      sub_error_id: matchedItem?.id || body.sub_error_id,
      sub_error_name: subErrorName,
      employee_id: employeeId,
      employee_name: employeeName,
      points,
      occurred_at: body.occurred_at || new Date().toISOString(),
      shift_name: body.shift_name,
      order_code: body.order_code,
      evidence_type: body.evidence_url ? body.evidence_type || 'image' : body.evidence_type,
      evidence_url: body.evidence_url,
      evidence_note: note,
      verifier_name: 'Hermes Bot',
      affects_op_score: logType === 'operation',
      affects_personal_multiplier: logType === 'personal',
      approval_status: 'proposed_manager', // Bắt buộc ở trạng thái chờ duyệt, CEO duyệt cuối
      created_at: new Date().toISOString(),
    }

    if (!db.bsc_logs) db.bsc_logs = []
    db.bsc_logs.unshift(newLog)
    await saveServerDb(db)

    // Tạo thông điệp báo cáo định dạng đẹp để Bot gửi ngay vào nhóm Zalo/Telegram
    const targetLabel = logType === 'personal' ? `👤 Nhân viên: ${employeeName}` : `🏪 Cửa hàng: ${storeId}`
    const telegramCard = [
      `📋 *[BIÊN BẢN GHI NHẬN LỖI - CHỜ DUYỆT]*`,
      `• ${targetLabel}`,
      `• Phân loại: ${logType === 'personal' ? 'Lỗi cá nhân' : 'Lỗi vận hành quán'}`,
      `• Lỗi vi phạm: ${subErrorName} ${matchedItem ? `(${matchedItem.code})` : ''}`,
      `• Nhóm lỗi: ${groupName}`,
      `• Điểm trừ đề xuất: -${points} điểm`,
      body.shift_name ? `• Ca làm: ${body.shift_name}` : null,
      body.order_code ? `• Mã đơn: ${body.order_code}` : null,
      body.evidence_url ? `• Bằng chứng ảnh: ${body.evidence_url}` : null,
      `⏳ Trạng thái: Chờ CEO duyệt cuối`,
      `🔗 Xem trên HRM: /bsc-bonus`,
    ]
      .filter(Boolean)
      .join('\n')

    return NextResponse.json({
      success: true,
      message: 'Đã ghi nhận lỗi thành công, đang ở trạng thái chờ CEO duyệt',
      id: newLog.id,
      event_id: newLog.event_id,
      approval_status: newLog.approval_status,
      log_type: logType,
      matched_error: matchedItem
        ? {
            code: matchedItem.code,
            name: matchedItem.name,
            points: matchedItem.suggested_points,
          }
        : null,
      review_url: '/bsc-bonus',
      telegram_card: telegramCard,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống khi bot ghi lỗi'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
