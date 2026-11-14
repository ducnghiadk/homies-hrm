import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, type ServerNotification } from '@/lib/server/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const db = await getServerDb()
    const list: ServerNotification[] = db.notifications || []

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
  try {
    const body = await req.json()
    const action = body.action || 'mark_all_read'
    const db = await getServerDb()
    if (!db.notifications) db.notifications = []

    if (action === 'mark_read' && body.id) {
      const idx = db.notifications.findIndex(n => n.id === body.id)
      if (idx >= 0) {
        db.notifications[idx].is_read = true
        await saveServerDb(db)
      }
    } else if (action === 'mark_all_read') {
      db.notifications.forEach(n => {
        n.is_read = true
      })
      await saveServerDb(db)
    }

    return NextResponse.json({
      success: true,
      unread_count: db.notifications.filter(n => !n.is_read).length,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi xử lý' },
      { status: 500 }
    )
  }
}

