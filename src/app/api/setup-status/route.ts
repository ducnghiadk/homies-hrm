import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/server/db'
import { ADMIN_ROLES, requireAuth } from '@/lib/server/auth-helper'
import { normalizeCareerPathSettings } from '@/lib/career-path/settings'
import { buildSetupChecklist } from '@/lib/settings/setup-checklist'

// "Việc cần cài đặt": chỉ CEO / HR xem. Chỉ đọc, không ghi gì.
export async function GET(req: NextRequest) {
  const gate = await requireAuth(req, ADMIN_ROLES)
  if (!gate.ok) return gate.response
  const db = await getServerDb()

  const checklist = buildSetupChecklist({
    stores: (db.stores || []).map((s) => ({
      name: s.name,
      is_active: s.is_active,
      latitude: s.latitude,
      longitude: s.longitude,
      pin_code: s.pin_code,
      checkin_method: s.checkin_method,
      wifi_public_ips: s.wifi_public_ips,
    })),
    shiftTemplateCount: (db.shift_templates || []).filter((t) => t.is_active !== false).length,
    operationSettingsSaved: Boolean(db.operation_settings),
    payrollPolicy: db.payroll_policy?.policy ?? null,
    taxSettingsSaved: Boolean(db.payroll_tax_settings),
    employees: (db.employees || []).map((e) => ({
      full_name: e.full_name,
      role: e.role,
      status: e.status,
      base_salary: e.base_salary,
      hourly_rate: e.hourly_rate,
    })),
    careerPathConfigured: normalizeCareerPathSettings(db.career_settings).configured,
  })

  return NextResponse.json({ success: true, data: checklist })
}
