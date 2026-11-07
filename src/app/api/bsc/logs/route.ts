import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, type ServerBscLog } from '@/lib/server/db'
import { isRealDbMode } from '@/lib/adapters/repository-config'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id') || searchParams.get('storeId')
    const period = searchParams.get('period')
    const logType = searchParams.get('type') // 'operation' | 'personal' | 'all'

    const db = await getServerDb()
    let logs: ServerBscLog[] = db.bsc_logs || []

    // 1. Đồng bộ từ Supabase nếu có
    if (isRealDbMode()) {
      try {
        let query = supabase.from('bsc_loi_van_hanh').select('*')
        if (storeId && storeId !== 'all') query = query.eq('store_id', storeId)
        if (period && period !== 'all') query = query.eq('period', period)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          const supabaseLogs: ServerBscLog[] = data.map((row: Record<string, unknown>) => ({
            id: String(row.id || ''),
            event_id: String(row.event_id || row.id || ''),
            store_id: String(row.store_id || 'store-001'),
            period: String(row.period || period || '2026-08'),
            log_type: 'operation',
            group_key: String(row.group_key || 'lam_don'),
            group_name: String(row.group_name || 'Vận hành'),
            sub_error_id: row.sub_error_id ? String(row.sub_error_id) : undefined,
            sub_error_name: row.sub_error_name ? String(row.sub_error_name) : undefined,
            points: Number(row.points || 1),
            occurred_at: String(row.occurred_at || new Date().toISOString()),
            shift_name: row.shift_name ? String(row.shift_name) : undefined,
            order_code: row.order_code ? String(row.order_code) : undefined,
            evidence_type: row.evidence_type ? String(row.evidence_type) : undefined,
            evidence_url: row.evidence_url ? String(row.evidence_url) : undefined,
            evidence_note: row.evidence_note ? String(row.evidence_note) : undefined,
            verifier_name: row.verifier_name ? String(row.verifier_name) : undefined,
            approval_status: String(row.approval_status || 'confirmed'),
            created_at: String(row.created_at || new Date().toISOString()),
          }))

          for (const sbLog of supabaseLogs) {
            const idx = logs.findIndex(l => l.id === sbLog.id)
            if (idx >= 0) {
              logs[idx] = { ...logs[idx], ...sbLog }
            } else {
              logs.push(sbLog)
            }
          }
        }
      } catch (sbErr) {
        console.warn('[API /api/bsc/logs] Supabase sync warning:', sbErr)
      }
    }

    db.bsc_logs = logs
    await saveServerDb(db)

    let filtered = logs
    if (storeId && storeId !== 'all') {
      filtered = filtered.filter(l => l.store_id === storeId)
    }
    if (period && period !== 'all') {
      filtered = filtered.filter(l => l.period === period)
    }
    if (logType && logType !== 'all') {
      filtered = filtered.filter(l => l.log_type === logType)
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      logs: filtered,
      count: filtered.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống khi tải nhật ký BSC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id,
      event_id,
      store_id,
      period,
      log_type,
      event_category,
      group_key,
      group_name,
      sub_error_id,
      sub_error_name,
      employee_id,
      employee_name,
      points,
      occurred_at,
      shift_name,
      order_code,
      evidence_type,
      evidence_url,
      evidence_note,
      verifier_name,
      scope_reason,
      affects_op_score,
      affects_customer_score,
      affects_personal_multiplier,
      locks_personal_bonus,
      approval_status,
    } = body

    if (!store_id || !group_key) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (store_id, group_key)' },
        { status: 400 }
      )
    }

    const db = await getServerDb()
    if (!db.bsc_logs) db.bsc_logs = []

    const logId = id || `bsc-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newLog: ServerBscLog = {
      id: logId,
      event_id: event_id || `EVT-${Date.now().toString().slice(-6)}`,
      store_id,
      period: period || '2026-08',
      log_type: log_type || 'operation',
      event_category,
      group_key,
      group_name: group_name || 'Lỗi vận hành',
      sub_error_id,
      sub_error_name,
      employee_id,
      employee_name,
      points: Number(points || 1),
      occurred_at: occurred_at || new Date().toISOString(),
      shift_name,
      order_code,
      evidence_type,
      evidence_url,
      evidence_note,
      verifier_name,
      scope_reason,
      affects_op_score: affects_op_score ?? true,
      affects_customer_score: affects_customer_score ?? false,
      affects_personal_multiplier: affects_personal_multiplier ?? false,
      locks_personal_bonus: locks_personal_bonus ?? false,
      approval_status: approval_status || 'confirmed',
      created_at: new Date().toISOString(),
    }

    const existingIdx = db.bsc_logs.findIndex(l => l.id === logId)
    if (existingIdx >= 0) {
      db.bsc_logs[existingIdx] = newLog
    } else {
      db.bsc_logs.unshift(newLog)
    }

    // Ghi nhận lên Supabase nếu có
    if (isRealDbMode() && newLog.log_type === 'operation') {
      try {
        await supabase.from('bsc_loi_van_hanh').upsert([
          {
            id: newLog.id,
            event_id: newLog.event_id,
            store_id: newLog.store_id,
            period: newLog.period,
            shift_name: newLog.shift_name,
            group_key: newLog.group_key,
            group_name: newLog.group_name,
            sub_error_id: newLog.sub_error_id,
            sub_error_name: newLog.sub_error_name,
            points: newLog.points,
            occurred_at: newLog.occurred_at,
            order_code: newLog.order_code,
            evidence_type: newLog.evidence_type,
            evidence_note: newLog.evidence_note,
            verifier_name: newLog.verifier_name,
            scope_reason: newLog.scope_reason,
            approval_status: newLog.approval_status,
          },
        ])
      } catch (sbErr) {
        console.warn('[API /api/bsc/logs] Supabase insert warning:', sbErr)
      }
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: 'Đã ghi nhận nhật ký lỗi BSC lên máy chủ thành công',
      data: newLog,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống khi tạo nhật ký BSC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu id để xóa' }, { status: 400 })
    }

    const db = await getServerDb()
    if (!db.bsc_logs) db.bsc_logs = []

    db.bsc_logs = db.bsc_logs.filter(l => l.id !== id)

    if (isRealDbMode()) {
      try {
        await supabase.from('bsc_loi_van_hanh').delete().eq('id', id)
      } catch (sbErr) {
        console.warn('[API /api/bsc/logs] Supabase delete warning:', sbErr)
      }
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: 'Đã xóa sự cố BSC thành công',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống khi xóa nhật ký BSC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
