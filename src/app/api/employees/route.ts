import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerEmployee } from '@/lib/server/db'
import { fetchIposEmployees, type MappedIposEmployee } from '@/lib/services/ipos/ipos-cloud-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    // 1. Thử tải dữ liệu trực tiếp từ iPOS Cloud API
    const iposRes = await fetchIposEmployees()
    let list: Array<ServerEmployee | MappedIposEmployee> = []
    let dataSource = 'ipos_cloud'

    if (iposRes.success && !iposRes.isFallback && iposRes.data.length > 0) {
      list = iposRes.data
    } else {
      // 2. Cơ chế Dự phòng An toàn (Fallback): Đọc từ CSDL nội bộ
      const db = await getServerDb()
      list = db.employees || []
      dataSource = 'internal_db'
    }

    if (storeId) {
      list = list.filter(
        (e) =>
          e.store_id === storeId ||
          (e.secondary_store_ids && e.secondary_store_ids.includes(storeId))
      )
    }

    if (role) {
      list = list.filter((e) => e.role === role)
    }

    if (status) {
      list = list.filter((e) => e.status === status)
    }

    // Trả về danh sách an toàn không lộ mật khẩu
    const safeList = list.map((u) => {
      const item = { ...u } as Record<string, unknown>
      delete item.password
      return item
    })

    return NextResponse.json({
      success: true,
      source: dataSource,
      count: safeList.length,
      data: safeList,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = await getServerDb()

    // Xử lý khi client gửi mảng danh sách nhân sự (ví dụ từ saveDb)
    if (Array.isArray(body)) {
      let updatedCount = 0
      for (const item of body) {
        if (!item || typeof item !== 'object') continue
        const { id, full_name, email, role, store_id, position_id, phone, employee_code } = item
        const cleanPhone = phone ? String(phone).replace(/\D/g, '') : ''
        const cleanEmail = email ? String(email).trim().toLowerCase() : ''

        const existingIndex = db.employees.findIndex((e) => {
          if (id && e.id === id) return true
          if (employee_code && e.employee_code === employee_code) return true
          if (cleanEmail && e.email.toLowerCase() === cleanEmail) return true
          if (cleanPhone && cleanPhone.length >= 9) {
            const empPhone = (e.phone || '').replace(/\D/g, '')
            if (empPhone && empPhone === cleanPhone) return true
          }
          return false
        })

        if (existingIndex >= 0) {
          const current = db.employees[existingIndex]
          db.employees[existingIndex] = {
            ...current,
            ...item,
            id: current.id,
            email: cleanEmail || current.email,
            phone: item.phone !== undefined ? String(item.phone).trim() : current.phone,
          }
          updatedCount++
        } else if (full_name && (cleanEmail || cleanPhone)) {
          const newId = id || `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          const newCode = employee_code || `NV${String(db.employees.length + 1).padStart(4, '0')}`
          db.employees.push({
            id: newId,
            full_name,
            email: cleanEmail || '',
            role: role || 'employee',
            store_id: store_id || 'store-001',
            position_id: position_id || 'pos-001',
            phone: phone || '',
            employee_code: newCode,
            status: item.status || 'active',
            account_status: item.account_status || 'dang_hoat_dong',
            department_name: item.department_name || 'Vận hành cửa hàng',
            base_salary: item.base_salary || item.official_salary || 7000000,
            hourly_rate: item.hourly_rate || 0,
            hire_date: item.hire_date || new Date().toISOString().split('T')[0],
          })
          updatedCount++
        }
      }

      await saveServerDb(db)
      return NextResponse.json({
        success: true,
        message: `Đã đồng bộ ${updatedCount} nhân sự lên máy chủ`,
        count: updatedCount,
      })
    }

    // Xử lý 1 nhân sự đơn lẻ
    const { id, full_name, email, role, store_id, position_id, phone, employee_code } = body
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : ''
    const cleanEmail = email ? String(email).trim().toLowerCase() : ''

    const existingIndex = db.employees.findIndex((e) => {
      if (id && e.id === id) return true
      if (employee_code && e.employee_code === employee_code) return true
      if (cleanEmail && e.email.toLowerCase() === cleanEmail) return true
      if (cleanPhone && cleanPhone.length >= 9) {
        const empPhone = (e.phone || '').replace(/\D/g, '')
        if (empPhone && empPhone === cleanPhone) return true
      }
      return false
    })

    if (existingIndex < 0 && (!full_name || (!email && !cleanPhone))) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc khi thêm nhân viên mới (họ tên, email hoặc SĐT)' },
        { status: 400 }
      )
    }

    let updatedEmployee: ServerEmployee

    if (existingIndex >= 0) {
      // Cập nhật thông tin nhân viên có sẵn
      const current = db.employees[existingIndex]
      updatedEmployee = {
        ...current,
        ...body,
        id: current.id,
        email: cleanEmail || current.email,
        phone: body.phone !== undefined ? String(body.phone).trim() : current.phone,
      }
      db.employees[existingIndex] = updatedEmployee
    } else {
      // Thêm nhân viên mới
      const newId = id || `emp-${Date.now()}`
      const newCode = employee_code || `NV${String(db.employees.length + 1).padStart(4, '0')}`
      updatedEmployee = {
        id: newId,
        full_name,
        email: String(email).trim().toLowerCase(),
        role: role || 'employee',
        store_id: store_id || 'store-001',
        position_id: position_id || 'pos-001',
        phone: phone || '',
        employee_code: newCode,
        status: body.status || 'active',
        account_status: body.account_status || 'dang_hoat_dong',
        department_name: body.department_name || 'Vận hành cửa hàng',
        base_salary: body.base_salary || body.official_salary || 7000000,
        hourly_rate: body.hourly_rate || 0,
        hire_date: body.hire_date || new Date().toISOString().split('T')[0],
      }
      db.employees.push(updatedEmployee)
    }

    await saveServerDb(db)

    const safeResult = { ...updatedEmployee } as Record<string, unknown>
    delete safeResult.password

    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Cập nhật hồ sơ nhân sự thành công' : 'Thêm mới nhân sự thành công',
      data: safeResult,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  return POST(req)
}
