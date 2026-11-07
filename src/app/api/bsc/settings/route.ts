import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, getInitialBscSettingsSeed, type ServerBscSettings } from '@/lib/server/db'

export async function GET() {
  try {
    const db = await getServerDb()
    const settings: ServerBscSettings = db.bsc_settings || getInitialBscSettingsSeed()
    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('[API /api/bsc/settings GET] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi tải cài đặt BSC từ máy chủ' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = await getServerDb()
    
    if (!db.bsc_settings) {
      db.bsc_settings = getInitialBscSettingsSeed()
    }

    if (body.criteria) {
      db.bsc_settings.criteria = body.criteria
    }
    if (body.bonus_tiers) {
      db.bsc_settings.bonus_tiers = body.bonus_tiers
    }
    if (body.threshold_rules) {
      db.bsc_settings.threshold_rules = body.threshold_rules
    }
    if (body.position_multipliers) {
      db.bsc_settings.position_multipliers = body.position_multipliers
    }
    if (body.deduction_policy) {
      db.bsc_settings.deduction_policy = {
        ...db.bsc_settings.deduction_policy,
        ...body.deduction_policy,
      }
    }
    if (body.safety_settings) {
      db.bsc_settings.safety_settings = {
        ...db.bsc_settings.safety_settings,
        ...body.safety_settings,
      }
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình BSC vào máy chủ thành công',
      settings: db.bsc_settings,
    })
  } catch (error) {
    console.error('[API /api/bsc/settings POST] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi lưu cài đặt BSC vào máy chủ' },
      { status: 500 }
    )
  }
}
