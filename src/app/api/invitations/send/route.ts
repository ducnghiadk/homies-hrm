import { NextResponse } from 'next/server'
import { sendInvitationEmail } from '@/lib/server/invitation-email-service'
import type { EmploymentType } from '@/lib/mock-data-employee-ext'

export async function POST(request: Request) {
  try {
    // Basic Auth Check: ensure caller specifies valid internal request header or authentication context
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.INTERNAL_API_SECRET

    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      // If secret key is configured, strictly validate
      return NextResponse.json(
        { ok: false, error: 'Truy cập không hợp lệ. Yêu cầu quyền xác thực.' },
        { status: 401 },
      )
    }

    const body = await request.json() as {
      invitation?: {
        id: string
        full_name: string
        email: string
        store_id: string
        position_id: string
        email_subject?: string
        email_personal_note?: string
        email_deadline?: string
        email_support_name?: string
        email_support_info?: string
        hire_date?: string
        department_name?: string
        employee_type?: EmploymentType
        job_level?: string
        official_salary?: number
        kpi_salary?: number
        is_probationary?: boolean
        probation_end_date?: string
        probation_salary_value?: number
      }
    }

    if (!body.invitation?.id || !body.invitation.email) {
      return NextResponse.json(
        { ok: false, error: 'Thiếu dữ liệu invitation để gửi email.' },
        { status: 400 },
      )
    }

    const result = await sendInvitationEmail({ invitation: body.invitation })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Không thể xử lý yêu cầu gửi email lời mời.' },
      { status: 500 },
    )
  }
}
