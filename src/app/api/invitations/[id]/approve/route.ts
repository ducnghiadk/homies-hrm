import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerEmployee } from '@/lib/server/db'

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const db = await getServerDb()
    if (!db.invitations) {
      db.invitations = []
    }
    if (!db.employees) {
      db.employees = []
    }

    const invIndex = db.invitations.findIndex((item) => item.id === id || item.token === id)
    if (invIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy thông tin lời mời để phê duyệt' },
        { status: 404 }
      )
    }

    const inv = db.invitations[invIndex]

    if (inv.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Lời mời này đã được phê duyệt trước đó' },
        { status: 400 }
      )
    }

    // Tạo mã nhân viên tự động NVxxxx
    let maxNum = 28
    for (const emp of db.employees) {
      const match = emp.employee_code?.match(/NV0*(\d+)/i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxNum) maxNum = num
      }
    }
    const nextNum = maxNum + 1
    const newCode = `NV${nextNum.toString().padStart(4, '0')}`
    const newEmpId = `emp-${Date.now()}`

    const newEmployee: ServerEmployee = {
      id: newEmpId,
      full_name: inv.full_name,
      email: inv.email,
      password: '123456', // Mật khẩu mặc định theo yêu cầu Founder
      role: (inv.role as ServerEmployee['role']) || 'employee',
      store_id: inv.store_id || 'store-001',
      position_id: inv.position_id || 'pos-pha-che',
      phone: inv.phone,
      employee_code: newCode,
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: inv.department_name || 'Vận hành cửa hàng',
      base_salary: inv.official_salary || (inv.role === 'shift_leader' ? 7500000 : 6600000),
      hourly_rate: inv.hourly_rate || 25000,
      hire_date: inv.hire_date || new Date().toISOString().split('T')[0],
      uniform_size: inv.uniform_size,
      bank_name: inv.bank_name,
      bank_account_no: inv.bank_account_number,
      bank_account_holder: inv.bank_account_name,
      id_card_front_url: inv.id_card_front_url,
      id_card_back_url: inv.id_card_back_url,
      health_cert_expiry: inv.health_cert_expiry,
    }

    // Thêm vào danh sách nhân sự chính thức
    db.employees.unshift(newEmployee)

    // Cập nhật trạng thái lời mời sang approved
    inv.status = 'approved'
    inv.approved_at = new Date().toISOString()
    db.invitations[invIndex] = inv

    await saveServerDb(db)

    return NextResponse.json({
      ok: true,
      success: true,
      message: `Đã phê duyệt hồ sơ và kích hoạt tài khoản nhân viên ${inv.full_name} (${newCode})`,
      employee: newEmployee,
      invitation: inv,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
