import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerInvitation } from '@/lib/server/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const status = searchParams.get('status')

    const db = await getServerDb()
    let list = db.invitations || []

    if (storeId) {
      list = list.filter((item) => item.store_id === storeId)
    }

    if (status && status !== 'all') {
      list = list.filter((item) => item.status === status)
    }

    return NextResponse.json({
      ok: true,
      success: true,
      count: list.length,
      data: list,
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
    if (!db.invitations) {
      db.invitations = []
    }

    const {
      full_name,
      phone,
      email,
      store_id,
      position_id,
      role = 'employee',
      department_name,
      hire_date,
      official_salary,
      hourly_rate,
      notes,
    } = body

    if (!full_name || !phone || !email || !store_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (họ tên, số điện thoại, email, cơ sở)' },
        { status: 400 }
      )
    }

    const token = `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const nextNum = (db.invitations.length + 1).toString().padStart(3, '0')
    const id = `inv-${nextNum}`

    const newInvitation: ServerInvitation = {
      id,
      token,
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      store_id,
      position_id: position_id || 'pos-pha-che',
      role: role as 'employee' | 'shift_leader',
      status: 'pending',
      department_name: department_name?.trim(),
      hire_date: hire_date || new Date().toISOString().split('T')[0],
      official_salary: official_salary ? Number(official_salary) : undefined,
      hourly_rate: hourly_rate ? Number(hourly_rate) : undefined,
      notes: notes?.trim(),
      created_at: new Date().toISOString(),
    }

    db.invitations.unshift(newInvitation)
    await saveServerDb(db)

    const publicUrl = `/employees/invitations/form?token=${token}`

    return NextResponse.json({
      ok: true,
      success: true,
      token,
      public_url: publicUrl,
      invitation: newInvitation,
      data: newInvitation,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
