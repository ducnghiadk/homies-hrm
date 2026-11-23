import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/server/auth-helper'

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser(req)
  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
      },
      {
        status: 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  }

  return NextResponse.json(
    {
      success: true,
      authenticated: true,
      user: {
        id: auth.userId,
        role: auth.role,
        email: auth.email,
        store_id: auth.employee?.store_id || '',
      },
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}

