import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { ADMIN_ROLES, isAdminRole, requireAuth } from '@/lib/server/auth-helper'
import { buildKpiViewer } from '@/lib/server/kpi-viewer'
import {
  filterKpiDatabaseForViewer,
  isKpiDatabaseEmpty,
  KpiWriteForbiddenError,
  mergeKpiDatabaseWrite,
  normalizeKpiDatabase,
} from '@/lib/kpi/kpi-access-policy'

// Dữ liệu KPI tháng (bộ tiêu chí, kỳ KPI, phiếu chấm, sự cố, khiếu nại...) lưu trên máy chủ
// để mọi máy, mọi người dùng thấy cùng một dữ liệu. Trước đây chỉ lưu trên trình duyệt.
// Mỗi người chỉ nhận phần được phép xem; khi lưu, máy chủ ghép theo quyền (xem kpi-access-policy).

const MAX_BYTES = 8_000_000

function saveFailed(reason?: string) {
  return NextResponse.json(
    { success: false, error: `Chưa lưu được dữ liệu KPI lên kho đám mây${reason ? `: ${reason}` : ''}. Vui lòng thử lại.` },
    { status: 503 }
  )
}

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const db = await getServerDb()
  const stored = normalizeKpiDatabase(db.kpi_database)
  const view = filterKpiDatabaseForViewer(stored, buildKpiViewer(gate.user, db))
  return NextResponse.json({
    success: true,
    data: view,
    server_empty: isKpiDatabaseEmpty(stored),
    can_import: isAdminRole(gate.user.role) && isKpiDatabaseEmpty(stored),
  })
}

export async function PUT(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const raw = await req.text()
  if (raw.length > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Dữ liệu KPI quá lớn.' }, { status: 413 })
  }
  const body = (() => { try { return JSON.parse(raw) } catch { return null } })()
  const incoming = body?.database
  const expectedRevision = body?.expected_revision
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming) || typeof expectedRevision !== 'number') {
    return NextResponse.json({ success: false, error: 'Thiếu dữ liệu KPI hoặc số phiên bản.' }, { status: 400 })
  }

  const db = await getServerDb()
  const stored = normalizeKpiDatabase(db.kpi_database)
  if (stored.revision !== expectedRevision) {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu KPI vừa được người khác cập nhật. Vui lòng tải lại trang rồi thử lại.' },
      { status: 409 }
    )
  }

  const viewer = buildKpiViewer(gate.user, db)
  let merged
  try {
    merged = mergeKpiDatabaseWrite(stored, incoming, viewer)
  } catch (error) {
    if (error instanceof KpiWriteForbiddenError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 })
    }
    throw error
  }

  db.kpi_database = merged
  const result = await saveServerDb(db)
  if (!result.ok) return saveFailed(result.reason)
  return NextResponse.json({ success: true, data: filterKpiDatabaseForViewer(merged, viewer) })
}

/** Chuyển dữ liệu KPI cũ từ trình duyệt lên máy chủ (một lần, chỉ CEO/HR, chỉ khi máy chủ còn trống). */
export async function POST(req: NextRequest) {
  const gate = await requireAuth(req, ADMIN_ROLES)
  if (!gate.ok) return gate.response
  const raw = await req.text()
  if (raw.length > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Dữ liệu KPI quá lớn.' }, { status: 413 })
  }
  const body = (() => { try { return JSON.parse(raw) } catch { return null } })()
  if (body?.action !== 'import_from_browser' || !body?.database || typeof body.database !== 'object') {
    return NextResponse.json({ success: false, error: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  }

  const db = await getServerDb()
  const stored = normalizeKpiDatabase(db.kpi_database)
  if (!isKpiDatabaseEmpty(stored)) {
    return NextResponse.json(
      { success: false, error: 'Máy chủ đã có dữ liệu KPI, không chuyển đè để tránh mất dữ liệu.' },
      { status: 409 }
    )
  }
  const imported = normalizeKpiDatabase(body.database)
  if (isKpiDatabaseEmpty(imported)) {
    return NextResponse.json({ success: false, error: 'Trình duyệt này không có dữ liệu KPI để chuyển.' }, { status: 400 })
  }
  imported.revision = stored.revision + 1
  imported.audit_logs = [
    ...imported.audit_logs,
    {
      id: `audit_kpi_import_${Date.now()}`,
      entity_type: 'kpi_database',
      entity_id: 'kpi_database',
      action: 'import_from_browser',
      actor_id: gate.user.userId,
      reason: 'Chuyển dữ liệu KPI cũ từ trình duyệt lên máy chủ',
      created_at: new Date().toISOString(),
    },
  ]
  db.kpi_database = imported
  const result = await saveServerDb(db)
  if (!result.ok) return saveFailed(result.reason)
  return NextResponse.json({ success: true, data: imported })
}
