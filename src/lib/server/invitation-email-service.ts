import nodemailer from 'nodemailer'
import type { EmployeeInvitation } from '@/lib/mock-data-employee-ext'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { getSmtpEmailConfig, validateSmtpEmailConfig } from './email-config'

export interface SendInvitationEmailInput {
  invitation: Pick<
    EmployeeInvitation,
    'id' | 'full_name' | 'email' | 'store_id' | 'position_id' | 'email_subject' | 'email_personal_note' | 'email_deadline' | 'email_support_name' | 'email_support_info' | 'hire_date' | 'department_name' | 'employee_type' | 'job_level' | 'official_salary' | 'kpi_salary' | 'is_probationary' | 'probation_end_date' | 'probation_salary_value'
  >
}

function buildInvitationEmailHtml(invitation: SendInvitationEmailInput['invitation'], appBaseUrl: string) {
  const storeLabel = mockStores.find((store) => store.id === invitation.store_id)?.name.replace('Homies Milk Tea - ', '') || invitation.store_id
  const positionLabel = mockPositions.find((position) => position.id === invitation.position_id)?.name || invitation.position_id
  const shareUrl = `${appBaseUrl.replace(/\/$/, '')}/employees/invitations/form?id=${invitation.id}`

  return `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px; color:#1f2937;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
        <div style="padding:20px; background:#fff7ed; border-bottom:1px solid #fde68a; text-align:center;">
          <div style="font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#b45309;">Homies Milk Tea</div>
          <h1 style="margin:8px 0 0; font-size:20px; color:#111827;">Thư mời hoàn tất hồ sơ nhận việc</h1>
        </div>
        <div style="padding:24px; line-height:1.7;">
          <p>Kính gửi <strong>${invitation.full_name || 'Ứng viên'}</strong>,</p>
          <p>${invitation.email_personal_note || 'Chúng tôi rất ấn tượng với hồ sơ của bạn và mong muốn bạn đồng hành cùng đội ngũ Homies.'}</p>
          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin:16px 0;">
            <div><strong>Vị trí dự kiến:</strong> ${positionLabel}</div>
            <div><strong>Chi nhánh dự kiến:</strong> ${storeLabel}</div>
            <div><strong>Bộ phận:</strong> ${invitation.department_name || 'Chưa thiết lập'}</div>
            <div><strong>Ngày gia nhập:</strong> ${invitation.hire_date || 'Chưa thiết lập'}</div>
            <div><strong>Loại nhân viên:</strong> ${invitation.employee_type || 'Chưa thiết lập'} · ${invitation.job_level || 'Chưa thiết lập'}</div>
            <div><strong>Lương chính thức:</strong> ${(invitation.official_salary || 0).toLocaleString('vi-VN')} đ</div>
            <div><strong>Lương KPI:</strong> ${(invitation.kpi_salary || 0).toLocaleString('vi-VN')} đ</div>
            <div><strong>Thử việc:</strong> ${invitation.is_probationary ? `Có, đến ${invitation.probation_end_date || 'chưa thiết lập'} · ${(invitation.probation_salary_value || 0).toLocaleString('vi-VN')} đ` : 'Không áp dụng'}</div>
            <div><strong>Hạn hoàn tất hồ sơ:</strong> ${invitation.email_deadline || 'Chưa thiết lập'}</div>
          </div>
          <p>Vui lòng hoàn tất thông tin nhận việc theo liên kết bên dưới để bộ phận nhân sự tiếp tục xác nhận hồ sơ của bạn.</p>
          <div style="text-align:center; margin:24px 0;">
            <a href="${shareUrl}" style="display:inline-block; background:#0ea5e9; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:10px; font-weight:700;">
              Hoàn tất thông tin nhận việc
            </a>
          </div>
          <p>Nếu cần hỗ trợ, vui lòng liên hệ <strong>${invitation.email_support_name || 'Bộ phận HR'}</strong> - ${invitation.email_support_info || 'Chưa thiết lập thông tin liên hệ'}.</p>
          <p style="font-size:12px; color:#6b7280; margin-top:24px;">
            Lưu ý: Đây chưa phải là xác nhận trở thành nhân viên chính thức. Sau khi bạn gửi hồ sơ, HR sẽ xem xét và phản hồi lại.
          </p>
        </div>
      </div>
    </div>
  `
}

export async function sendInvitationEmail(input: SendInvitationEmailInput) {
  const config = getSmtpEmailConfig()
  const validation = validateSmtpEmailConfig(config)

  if (!validation.ok) {
    return {
      ok: false as const,
      error: `Thiếu cấu hình email: ${validation.missing.join(', ')}`,
    }
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  const html = buildInvitationEmailHtml(input.invitation, config.appBaseUrl)
  const text = [
    `Kính gửi ${input.invitation.full_name || 'Ứng viên'},`,
    '',
    input.invitation.email_personal_note || 'Chúng tôi rất ấn tượng với hồ sơ của bạn và mong muốn bạn đồng hành cùng đội ngũ Homies.',
    '',
    `Vị trí dự kiến: ${mockPositions.find((position) => position.id === input.invitation.position_id)?.name || input.invitation.position_id}`,
    `Chi nhánh dự kiến: ${mockStores.find((store) => store.id === input.invitation.store_id)?.name.replace('Homies Milk Tea - ', '') || input.invitation.store_id}`,
    `Bộ phận: ${input.invitation.department_name || 'Chưa thiết lập'}`,
    `Ngày gia nhập: ${input.invitation.hire_date || 'Chưa thiết lập'}`,
    `Loại nhân viên: ${input.invitation.employee_type || 'Chưa thiết lập'} · ${input.invitation.job_level || 'Chưa thiết lập'}`,
    `Lương chính thức: ${(input.invitation.official_salary || 0).toLocaleString('vi-VN')} đ`,
    `Lương KPI: ${(input.invitation.kpi_salary || 0).toLocaleString('vi-VN')} đ`,
    `Thử việc: ${input.invitation.is_probationary ? `Có, đến ${input.invitation.probation_end_date || 'chưa thiết lập'} · ${(input.invitation.probation_salary_value || 0).toLocaleString('vi-VN')} đ` : 'Không áp dụng'}`,
    `Hạn hoàn tất hồ sơ: ${input.invitation.email_deadline || 'Chưa thiết lập'}`,
    '',
    `Link hoàn tất hồ sơ: ${config.appBaseUrl.replace(/\/$/, '')}/employees/invitations/form?id=${input.invitation.id}`,
    '',
    `Liên hệ hỗ trợ: ${input.invitation.email_support_name || 'Bộ phận HR'} - ${input.invitation.email_support_info || 'Chưa thiết lập thông tin liên hệ'}`,
  ].join('\n')

  try {
    await transporter.sendMail({
      from: config.from,
      to: input.invitation.email,
      subject: input.invitation.email_subject || '[Homies Milk Tea] Thu moi nhan viec va hoan tat ho so',
      text,
      html,
      replyTo: config.user,
    })

    return { ok: true as const }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể gửi email qua Gmail SMTP.'
    return {
      ok: false as const,
      error: message,
    }
  }
}
