import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { ADMIN_ROLES, requireAuth } from '@/lib/server/auth-helper'

// Chính sách lương (Cài đặt lương) lưu trên máy chủ để mọi máy, mọi người dùng cùng một cấu hình.
// Trước đây chỉ lưu trên trình duyệt nên mỗi máy có thể tính lương theo cài đặt khác nhau.

const MAX_POLICY_BYTES = 500_000

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const db = await getServerDb()
  const saved = db.payroll_policy
  return NextResponse.json({
    success: true,
    configured: Boolean(saved?.policy),
    data: saved?.policy ?? null,
    updated_at: saved?.updated_at ?? null,
  })
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req, ADMIN_ROLES)
  if (!gate.ok) return gate.response
  const body = await req.json().catch(() => null)
  const policy = body?.policy
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    return NextResponse.json({ success: false, error: 'Thiếu dữ liệu cài đặt lương.' }, { status: 400 })
  }
  if (JSON.stringify(policy).length > MAX_POLICY_BYTES) {
    return NextResponse.json({ success: false, error: 'Cài đặt lương quá lớn.' }, { status: 413 })
  }
  const db = await getServerDb()
  db.payroll_policy = {
    policy: policy as Record<string, unknown>,
    updated_at: new Date().toISOString(),
    updated_by: gate.user.userId,
  }
  await saveServerDb(db)
  return NextResponse.json({ success: true, updated_at: db.payroll_policy.updated_at })
}
