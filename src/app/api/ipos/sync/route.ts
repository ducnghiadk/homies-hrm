import { NextRequest, NextResponse } from 'next/server'
import { normalizeIposData, type IposRawPayload } from '@/lib/services/ipos/ipos-normalizer'
import { safeEqualString } from '@/lib/security/token-signer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ready',
      server: 'Homies HRM iPOS Bridge Sync Server',
      version: '1.0.0',
      time: new Date().toISOString(),
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  )
}

// Tiện ích Chrome phải gửi kèm mã đồng bộ IPOS_SYNC_KEY. Chưa cài mã thì từ chối toàn bộ.
function isSyncKeyValid(req: NextRequest): boolean {
  const expected = process.env.IPOS_SYNC_KEY
  if (!expected || expected.length < 16) return false
  const header = req.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  return Boolean(provided) && safeEqualString(provided, expected)
}

export async function POST(req: NextRequest) {
  if (!isSyncKeyValid(req)) {
    return NextResponse.json(
      { success: false, message: 'Mã đồng bộ không hợp lệ. Vui lòng nhập đúng Mã đồng bộ trong tiện ích Homies iPOS Bridge.' },
      { status: 401, headers: corsHeaders }
    )
  }
  try {
    const body = (await req.json()) as IposRawPayload

    if (!body || !body.module) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dữ liệu không hợp lệ: thiếu trường module',
        },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await normalizeIposData(body)

    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error('[iPOS Sync API Error]:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi nội bộ khi đồng bộ dữ liệu iPOS',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
