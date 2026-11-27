import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { isAdminRole, requireAuth } from '@/lib/server/auth-helper'
import { buildKpiActor } from '@/lib/server/kpi-viewer'
import { syncPeerReviewsFromServerDb } from '@/lib/server/kpi-peer-sync'
import { normalizeKpiDatabase } from '@/lib/kpi/kpi-access-policy'
import {
  createEmptyLocalPeerReviewDatabase,
  createLocalPeerReviewRepository,
  type LocalPeerReviewDatabase,
} from '@/lib/kpi/local-peer-review-repository'

// Đánh giá đồng nghiệp ẩn danh chạy trên máy chủ.
// Toàn bộ phiếu, người chấm, điểm từng phiếu chỉ máy chủ đọc; trình duyệt chỉ nhận đúng phần
// người đó được xem (nhân viên: điểm tổng hợp của mình; người chấm: phiếu được giao; quản lý: hàng chờ
// chi nhánh mình; CEO/HR: cờ liêm chính và giải mật có ghi lý do). Vai trò lấy từ phiên đăng nhập.

const STORAGE_KEY = 'server_peer_reviews'
const MAX_BYTES = 8_000_000

const ACTIONS = [
  'listReviewerTasks',
  'listManagerQueue',
  'submitResponse',
  'selectReviewers',
  'approveMonthlyReview',
  'returnMonthlyReview',
  'getEmployeeAggregate',
  'revealReviewerIdentity',
  'listIntegrityFlags',
  'resolveIntegrityFlag',
] as const
type PeerAction = (typeof ACTIONS)[number]

function normalizePeerDb(input: unknown): LocalPeerReviewDatabase {
  const empty = createEmptyLocalPeerReviewDatabase()
  if (!input || typeof input !== 'object') return empty
  const src = input as Partial<LocalPeerReviewDatabase>
  return {
    monthly_reviews: Array.isArray(src.monthly_reviews) ? src.monthly_reviews : [],
    assignments: Array.isArray(src.assignments) ? src.assignments : [],
    responses: Array.isArray(src.responses) ? src.responses : [],
    aggregates: Array.isArray(src.aggregates) ? src.aggregates : [],
    integrity_flags: Array.isArray(src.integrity_flags) ? src.integrity_flags : [],
    candidates_by_review: src.candidates_by_review && typeof src.candidates_by_review === 'object' ? src.candidates_by_review : {},
    audit_logs: Array.isArray(src.audit_logs) ? src.audit_logs : [],
    employee_names: src.employee_names && typeof src.employee_names === 'object' ? src.employee_names : {},
  }
}

function isPeerDbEmpty(db: LocalPeerReviewDatabase): boolean {
  return db.monthly_reviews.length === 0 && db.assignments.length === 0 && db.responses.length === 0
}

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const db = await getServerDb()
  const empty = isPeerDbEmpty(normalizePeerDb(db.kpi_peer_reviews))
  return NextResponse.json({ success: true, server_empty: empty, can_import: empty && isAdminRole(gate.user.role) })
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const raw = await req.text()
  if (raw.length > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Dữ liệu quá lớn.' }, { status: 413 })
  }
  const body = (() => { try { return JSON.parse(raw) } catch { return null } })()
  const action = body?.action as string | undefined
  const db = await getServerDb()
  const current = normalizePeerDb(db.kpi_peer_reviews)

  if (action === 'import_from_browser') {
    if (!isAdminRole(gate.user.role)) {
      return NextResponse.json({ success: false, error: 'Chỉ CEO hoặc HR được chuyển dữ liệu.' }, { status: 403 })
    }
    if (!isPeerDbEmpty(current)) {
      return NextResponse.json({ success: false, error: 'Máy chủ đã có dữ liệu đánh giá đồng nghiệp, không chuyển đè.' }, { status: 409 })
    }
    const imported = normalizePeerDb(body?.database)
    if (isPeerDbEmpty(imported)) {
      return NextResponse.json({ success: false, error: 'Trình duyệt này không có dữ liệu đánh giá đồng nghiệp để chuyển.' }, { status: 400 })
    }
    imported.audit_logs = [...imported.audit_logs, {
      id: `audit_peer_import_${Date.now()}`,
      actor_id: gate.user.userId,
      actor_role: gate.user.role,
      action: 'IMPORT_PEER_REVIEWS_FROM_BROWSER',
      target_id: 'kpi_peer_reviews',
      reason: 'Chuyển dữ liệu đánh giá đồng nghiệp cũ từ trình duyệt lên máy chủ',
      created_at: new Date().toISOString(),
    }]
    db.kpi_peer_reviews = imported
    const result = await saveServerDb(db)
    if (!result.ok) return NextResponse.json({ success: false, error: 'Chưa lưu được lên kho đám mây. Vui lòng thử lại.' }, { status: 503 })
    return NextResponse.json({ success: true })
  }

  if (!action || !ACTIONS.includes(action as PeerAction)) {
    return NextResponse.json({ success: false, error: 'Thao tác không hợp lệ.' }, { status: 400 })
  }
  const rawArgs: unknown[] = Array.isArray(body?.args) ? body.args : []
  // Mốc thời gian duyệt / trả lại do máy chủ ghi, không nhận từ trình duyệt.
  const args = action === 'approveMonthlyReview'
    ? rawArgs.slice(0, 1)
    : action === 'returnMonthlyReview'
      ? rawArgs.slice(0, 2)
      : rawArgs

  // Trước mỗi thao tác: tự tạo hồ sơ tháng cho kỳ KPI đang thu thập và đẩy các bước quá hạn.
  const before = JSON.stringify(current)
  const synced = syncPeerReviewsFromServerDb(db, normalizeKpiDatabase(db.kpi_database), current)
  const working = synced.peer

  // Kho tạm trong bộ nhớ, nạp từ máy chủ; mọi kiểm tra quyền nằm trong kho đánh giá đồng nghiệp.
  let snapshot = JSON.stringify(working)
  const storage = {
    getItem: (key: string) => (key === STORAGE_KEY ? snapshot : null),
    setItem: (key: string, value: string) => { if (key === STORAGE_KEY) snapshot = value },
    removeItem: () => undefined,
  }
  const repository = createLocalPeerReviewRepository({
    storage: storage as unknown as Storage,
    storageKey: STORAGE_KEY,
    initialData: working,
  })
  const actor = buildKpiActor(gate.user)

  let data: unknown
  try {
    const fn = repository[action as PeerAction] as (...input: unknown[]) => Promise<unknown>
    data = await fn.call(repository, actor, ...args)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Không thực hiện được thao tác.' },
      { status: 400 }
    )
  }

  // Trưởng ca xem được hàng chờ nhưng không được biết ai là người chấm (giữ ẩn danh).
  if (action === 'listManagerQueue' && actor.role === 'shift_leader' && Array.isArray(data)) {
    data = (data as Array<Record<string, unknown>>).map((item) => ({ ...item, candidates: [], selected_reviewer_ids: [] }))
  }

  if (snapshot !== before) {
    db.kpi_peer_reviews = normalizePeerDb(JSON.parse(snapshot))
    const result = await saveServerDb(db)
    if (!result.ok) return NextResponse.json({ success: false, error: 'Chưa lưu được lên kho đám mây. Vui lòng thử lại.' }, { status: 503 })
  }
  return NextResponse.json({ success: true, data: data ?? null })
}
