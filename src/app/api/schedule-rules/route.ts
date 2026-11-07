import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerScheduleRule, ServerScheduleRuleOverride } from '@/lib/server/db'

export async function GET() {
  try {
    const db = await getServerDb()
    return NextResponse.json({
      success: true,
      rules: db.schedule_rules || [],
      overrides: db.rule_overrides || [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

const ALLOWED_SCHEDULE_RULE_ROLES = ['ceo', 'hr_admin', 'store_manager', 'area_manager']

function resolveRole(req: NextRequest, body: Record<string, unknown>, sessions: Record<string, { role: string }>): string | null {
  const directRole = body.approver_role || body.user_role || body.role
  if (typeof directRole === 'string' && directRole) return directRole.toLowerCase()

  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    if (sessions[token]?.role) return sessions[token].role.toLowerCase()
  }

  const headerRole = req.headers.get('x-user-role')
  if (headerRole) return headerRole.toLowerCase()

  const sessionCookie = req.cookies.get('homies_session')?.value
  if (sessionCookie && sessions[sessionCookie]?.role) {
    return sessions[sessionCookie].role.toLowerCase()
  }

  const hrmAuth = req.cookies.get('hrm-auth')?.value
  if (hrmAuth) {
    try {
      const parsed = JSON.parse(decodeURIComponent(hrmAuth))
      const r = parsed?.state?.user?.role || parsed?.user?.role
      if (r) return String(r).toLowerCase()
    } catch {}
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = await getServerDb()

    const role = resolveRole(req, body, db.sessions || {})
    if (!role || !ALLOWED_SCHEDULE_RULE_ROLES.includes(role.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không đủ thẩm quyền: Chỉ Quản lý cửa hàng (Store Manager) hoặc Ban Giám đốc (CEO, HR) mới được cấu hình quy tắc ca.',
        },
        { status: 403 }
      )
    }

    const scheduleRules = db.schedule_rules = Array.isArray(db.schedule_rules) ? db.schedule_rules : []
    const ruleOverrides = db.rule_overrides = Array.isArray(db.rule_overrides) ? db.rule_overrides : []

    // 1. Bulk update rules
    if (Array.isArray(body.rules)) {
      db.schedule_rules = body.rules.map((r: Partial<ServerScheduleRule>) => ({
        id: String(r.id || `rule-${Date.now()}`),
        rule_key: String(r.rule_key || ''),
        label: String(r.label || ''),
        description: String(r.description || ''),
        warning_value: Number(r.warning_value || 0),
        block_value: Number(r.block_value || 0),
        warning_level: (r.warning_level || 'warning') as 'info' | 'warning' | 'block',
        is_active: Boolean(r.is_active),
      }))
    }

    // 2. Bulk update overrides
    if (Array.isArray(body.overrides)) {
      db.rule_overrides = body.overrides.map((o: Partial<ServerScheduleRuleOverride>) => ({
        id: String(o.id || `ov-${Date.now()}`),
        rule_key: String(o.rule_key || ''),
        position_id: o.position_id ? String(o.position_id) : null,
        season_id: o.season_id ? String(o.season_id) : null,
        override_warning: Number(o.override_warning || 0),
        override_block: Number(o.override_block || 0),
      }))
    }

    // 3. Single rule update
    if (body.rule && typeof body.rule === 'object') {
      const r = body.rule
      const currentRules = db.schedule_rules || []
      const idx = currentRules.findIndex((item) => item.rule_key === r.rule_key || item.id === r.id)
      const updated: ServerScheduleRule = {
        id: String(r.id || (idx >= 0 ? currentRules[idx].id : `rule-${Date.now()}`)),
        rule_key: String(r.rule_key || (idx >= 0 ? currentRules[idx].rule_key : '')),
        label: String(r.label || (idx >= 0 ? currentRules[idx].label : '')),
        description: String(r.description || (idx >= 0 ? currentRules[idx].description : '')),
        warning_value: Number(r.warning_value !== undefined ? r.warning_value : (idx >= 0 ? currentRules[idx].warning_value : 0)),
        block_value: Number(r.block_value !== undefined ? r.block_value : (idx >= 0 ? currentRules[idx].block_value : 0)),
        warning_level: (r.warning_level || (idx >= 0 ? currentRules[idx].warning_level : 'warning')) as 'info' | 'warning' | 'block',
        is_active: r.is_active !== undefined ? Boolean(r.is_active) : (idx >= 0 ? currentRules[idx].is_active : true),
      }

      if (idx >= 0) {
        currentRules[idx] = updated
      } else {
        currentRules.push(updated)
      }
      db.schedule_rules = currentRules
    }

    // 4. Single override add/update
    if (body.override && typeof body.override === 'object') {
      const o = body.override
      const currentOverrides = db.rule_overrides || []
      const idx = currentOverrides.findIndex((item) => item.id === o.id)
      const updated: ServerScheduleRuleOverride = {
        id: String(o.id || `ov-${Date.now()}`),
        rule_key: String(o.rule_key || ''),
        position_id: o.position_id ? String(o.position_id) : null,
        season_id: o.season_id ? String(o.season_id) : null,
        override_warning: Number(o.override_warning || 0),
        override_block: Number(o.override_block || 0),
      }

      if (idx >= 0) {
        currentOverrides[idx] = updated
      } else {
        currentOverrides.push(updated)
      }
      db.rule_overrides = currentOverrides
    }

    // 5. Delete override by id
    if (body.delete_override_id) {
      db.rule_overrides = (db.rule_overrides || []).filter((o) => o.id !== body.delete_override_id)
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình quy tắc ca vào máy chủ thành công!',
      rules: db.schedule_rules,
      overrides: db.rule_overrides,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi cập nhật quy tắc ca'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
