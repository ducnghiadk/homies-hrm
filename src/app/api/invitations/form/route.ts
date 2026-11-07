import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/server/db'
import { getPositionById, getStoreById } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã xác thực lời mời (token)' },
        { status: 400 }
      )
    }

    const db = await getServerDb()
    const list = db.invitations || []
    const invitation = list.find((item) => item.token === token || item.id === token)

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Liên kết không hợp lệ hoặc lời mời đã hết hạn. Vui lòng liên hệ bộ phận nhân sự Homies Milk Tea để được cấp lại link mới.',
        },
        { status: 404 }
      )
    }

    if (invitation.status === 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: 'Hồ sơ nhận việc này đã được phê duyệt và kích hoạt tài khoản thành công. Bạn có thể đăng nhập vào hệ thống Homies HRM.',
          status: 'approved',
          data: invitation,
        },
        { status: 400 }
      )
    }

    // Gắn thêm thông tin tên quán và vị trí tuyển dụng
    const store = db.stores.find((s) => s.id === invitation.store_id) || getStoreById(invitation.store_id)
    const position = getPositionById(invitation.position_id)

    return NextResponse.json({
      ok: true,
      success: true,
      invitation: {
        ...invitation,
        store_name: store?.name || 'Homies Milk Tea',
        store_address: store?.address || 'TP. Thủ Đức, TP.HCM',
        position_name: position?.name || 'Nhân viên',
      },
      store: store ? { id: store.id, name: store.name, address: store.address } : undefined,
      position: position ? { id: position.id, name: position.name } : undefined,
      data: {
        ...invitation,
        store_name: store?.name || 'Homies Milk Tea',
        store_address: store?.address || 'TP. Thủ Đức, TP.HCM',
        position_name: position?.name || 'Nhân viên',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
