import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerShiftRegistration } from '@/lib/server/db'
import { getAuthenticatedUser } from '@/lib/server/auth-helper'

const ALLOWED_APPROVER_ROLES = ['ceo', 'hr_admin', 'store_manager', 'area_manager']

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để thực hiện phê duyệt ca làm việc' },
        { status: 401 }
      )
    }

    if (!ALLOWED_APPROVER_ROLES.includes(auth.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không đủ thẩm quyền: Chỉ Quản lý cửa hàng (Store Manager) hoặc Ban Giám đốc (CEO, HR) mới được duyệt lịch ca.',
        },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { registration_ids, week_start_date, store_id } = body
    const approver = auth.employee?.full_name || auth.userId || 'Quản lý'

    const db = await getServerDb()

    const updatedList: ServerShiftRegistration[] = []
    const now = new Date().toISOString()

    db.shifts = db.shifts.map((shift) => {
      let shouldApprove = false

      if (registration_ids && Array.isArray(registration_ids) && registration_ids.includes(shift.id)) {
        shouldApprove = true
      } else if (!registration_ids) {
        if (store_id && shift.store_id !== store_id) {
          shouldApprove = false
        } else if (week_start_date && shift.week_start_date !== week_start_date) {
          shouldApprove = false
        } else {
          shouldApprove = shift.status === 'PENDING'
        }
      }

      if (shouldApprove) {
        const approvedItem: ServerShiftRegistration = {
          ...shift,
          status: 'APPROVED',
          approved_by: approver,
          approved_at: now,
        }
        updatedList.push(approvedItem)
        return approvedItem
      }

      return shift
    })

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: `Đã duyệt thành công ${updatedList.length} ca làm việc tuần`,
      approved_count: updatedList.length,
      data: updatedList,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
