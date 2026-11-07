import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { getAuthenticatedUser } from '@/lib/server/auth-helper'

// Chỉ CEO hoặc HR Admin mới có quyền khóa sổ lương
const ALLOWED_PAYROLL_LOCK_ROLES = ['ceo', 'hr_admin']

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để thực hiện khóa bảng lương' },
        { status: 401 }
      )
    }

    if (!ALLOWED_PAYROLL_LOCK_ROLES.includes(auth.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thao tác bị từ chối: Bảng lương chỉ có thể được khóa sổ bởi CEO hoặc HR Admin.',
        },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { period, store_id } = body
    const locker = auth.employee?.full_name || auth.userId || 'CEO'

    if (!period) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp kỳ lương cần khóa (ví dụ: 2026-08)' },
        { status: 400 }
      )
    }

    const db = await getServerDb()

    const now = new Date().toISOString()
    let lockedCount = 0

    // Khóa các bản tổng hợp chi nhánh
    db.payroll_summaries = db.payroll_summaries.map((summary) => {
      if (summary.period === period && (!store_id || summary.store_id === store_id)) {
        lockedCount++
        return {
          ...summary,
          status: 'locked',
          locked_by: locker,
          locked_at: now,
        }
      }
      return summary
    })

    // Khóa phiếu lương từng nhân viên
    db.salary_slips = db.salary_slips.map((slip) => {
      if (slip.period === period && (!store_id || slip.store_id === store_id)) {
        return {
          ...slip,
          status: 'locked',
        }
      }
      return slip
    })

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      status: 'locked',
      message: `Đã khóa sổ thành công bảng lương kỳ ${period}`,
      period,
      locked_store_count: lockedCount,
      locked_at: now,
      locked_by: locker,
      data: {
        status: 'locked',
        period,
        locked_store_count: lockedCount,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
