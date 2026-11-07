import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, ...formData } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã xác thực lời mời (token)' },
        { status: 400 }
      )
    }

    const db = await getServerDb()
    if (!db.invitations) {
      db.invitations = []
    }

    const index = db.invitations.findIndex((item) => item.token === token || item.id === token)
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy hồ sơ lời mời tương ứng để nộp.' },
        { status: 404 }
      )
    }

    const current = db.invitations[index]

    if (current.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Hồ sơ này đã được phê duyệt trước đó.' },
        { status: 400 }
      )
    }

    // Cập nhật thông tin ứng viên tự điền
    const updated = {
      ...current,
      full_name: formData.full_name?.trim() || current.full_name,
      phone: formData.phone?.trim() || current.phone,
      email: formData.email?.trim()?.toLowerCase() || current.email,
      date_of_birth: formData.date_of_birth || current.date_of_birth,
      gender: formData.gender || current.gender,
      address: formData.address?.trim() || current.address,
      cccd: formData.cccd?.trim() || current.cccd,
      emergency_contact_name: formData.emergency_contact_name?.trim() || current.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone?.trim() || current.emergency_contact_phone,
      uniform_size: formData.shirt_size || formData.uniform_size || current.shirt_size || current.uniform_size,
      shirt_size: formData.shirt_size || formData.uniform_size || current.shirt_size || current.uniform_size,
      id_card_front_url: formData.id_card_front_url || current.id_card_front_url,
      id_card_back_url: formData.id_card_back_url || current.id_card_back_url,
      health_cert_expiry: formData.health_cert_date || formData.health_cert_expiry || current.health_cert_date || current.health_cert_expiry,
      health_cert_date: formData.health_cert_date || formData.health_cert_expiry || current.health_cert_date || current.health_cert_expiry,
      bank_name: formData.bank_name?.trim() || current.bank_name,
      bank_account_number: formData.bank_account_number?.trim() || current.bank_account_number,
      bank_account_name: formData.bank_account_name?.trim()?.toUpperCase() || current.bank_account_name,
      policy_agreed: Boolean(formData.policy_agreed),
      notes: formData.candidate_notes?.trim() || current.notes,
      candidate_notes: formData.candidate_notes?.trim() || current.candidate_notes,
      status: 'submitted' as const,
      submitted_at: new Date().toISOString(),
    }

    db.invitations[index] = updated
    await saveServerDb(db)

    return NextResponse.json({
      ok: true,
      success: true,
      message: 'Nộp hồ sơ ứng viên thành công!',
      invitation: updated,
      data: updated,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
