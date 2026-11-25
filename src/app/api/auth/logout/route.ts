import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { clearAuthCookies } from '@/lib/server/auth-cookies'

/** Đăng xuất phía máy chủ: hủy phiên trong CSDL và xóa cookie (kể cả cookie httpOnly). */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('homies_session')?.value
    if (token) {
      const db = await getServerDb()
      if (db.sessions[token]) {
        delete db.sessions[token]
        await saveServerDb(db)
      }
    }
  } catch (error) {
    console.error('[auth/logout]', error)
  }
  const response = NextResponse.json({ success: true })
  clearAuthCookies(response)
  return response
}
