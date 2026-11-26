import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth-helper'
import { getServerDb, saveServerDb, type ServerNotification } from '@/lib/server/db'
import { isNotificationForUser } from '@/lib/server/career-notify'

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const db = await getServerDb()
    // Chỉ trả thông báo chung và thông báo gửi đúng người / đúng vai trò.
    const list: ServerNotification[] = (db.notifications || []).filter((n) => isNotificationForUser(n, gate.user.userId, gate.user.role))

    return NextResponse.json({
      success: true,
      count: list.length,
      unread_count: list.filter(n => !n.is_read).length,
      data: list.slice(0, limit),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  try {
    const body = await req.json()
    const action = body.action || 'mark_all_read'
    const db = await getServerDb()
    if (!db.notifications) db.notifications = []

    if (action === 'mark_read' && body.id) {
      const idx = db.notifications.findIndex(n => n.id === body.id && isNotificationForUser(n, gate.user.userId, gate.user.role))
      if (idx >= 0) {
        db.notifications[idx].is_read = true
        await saveServerDb(db)
      }
    } else if (action === 'mark_all_read') {
      db.notifications.forEach(n => {
        if (isNotificationForUser(n, gate.user.userId, gate.user.role)) n.is_read = true
      })
      await saveServerDb(db)
    }

    return NextResponse.json({
      success: true,
      unread_count: db.notifications.filter(n => !n.is_read && isNotificationForUser(n, gate.user.userId, gate.user.role)).length,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi xử lý' },
      { status: 500 }
    )
  }
}

