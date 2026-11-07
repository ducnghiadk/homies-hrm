import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerContract } from '@/lib/server/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const employeeId = searchParams.get('employee_id')
    const status = searchParams.get('status')

    const db = await getServerDb()
    let list = db.contracts || []

    if (storeId) {
      list = list.filter((c) => c.storeId === storeId)
    }

    if (employeeId) {
      list = list.filter((c) => c.employeeId === employeeId)
    }

    if (status && status !== 'all') {
      list = list.filter((c) => c.status === status)
    }

    return NextResponse.json({
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
    if (!db.contracts) {
      db.contracts = []
    }

    // Xử lý nếu gửi mảng hợp đồng (sync hoặc import)
    if (Array.isArray(body)) {
      let savedCount = 0
      for (const item of body) {
        if (!item || typeof item !== 'object' || !item.id) continue
        const index = db.contracts.findIndex((c) => c.id === item.id)
        if (index === -1) {
          db.contracts.unshift(item as ServerContract)
        } else {
          db.contracts[index] = { ...db.contracts[index], ...(item as ServerContract) }
        }
        savedCount++
      }
      await saveServerDb(db)
      return NextResponse.json({
        success: true,
        message: `Đã lưu ${savedCount} hợp đồng`,
        count: savedCount,
        data: db.contracts,
      })
    }

    // Xử lý gửi 1 hợp đồng
    const contract = body as ServerContract
    if (!contract || !contract.id) {
      return NextResponse.json({ success: false, error: 'Dữ liệu hợp đồng không hợp lệ (thiếu ID)' }, { status: 400 })
    }

    const index = db.contracts.findIndex((c) => c.id === contract.id)
    if (index === -1) {
      db.contracts.unshift(contract)
    } else {
      db.contracts[index] = { ...db.contracts[index], ...contract }
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      data: contract,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
