import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { runCareerReminders } from '@/lib/server/career-reminders'

/**
 * Lịch chạy hằng ngày (Vercel Cron) gửi nhắc việc đề xuất nâng bậc quá hạn.
 * Bắt buộc có biến môi trường CRON_SECRET; Vercel tự gửi kèm "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) {
    return NextResponse.json({ success: false, message: 'Chưa cài CRON_SECRET.' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, message: 'Không có quyền.' }, { status: 401 })
  }
  try {
    const db = await getServerDb()
    const sent = runCareerReminders(db)
    if (sent > 0) await saveServerDb(db)
    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('[API /api/career-path/reminders] Error:', error)
    return NextResponse.json({ success: false, message: 'Không chạy được nhắc việc.' }, { status: 500 })
  }
}
