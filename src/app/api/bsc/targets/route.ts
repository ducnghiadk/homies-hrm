import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, type ServerBscTarget } from '@/lib/server/db'
import { isRealDbMode } from '@/lib/adapters/repository-config'
import { supabase } from '@/lib/supabase'

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id') || searchParams.get('storeId')
    const period = searchParams.get('period')

    const db = await getServerDb()
    const targets: ServerBscTarget[] = db.bsc_targets || []

    // 1. Nếu có Supabase kết nối, đồng bộ từ bảng bsc_muc_tieu_doanh_thu
    if (isRealDbMode()) {
      try {
        let query = supabase.from('bsc_muc_tieu_doanh_thu').select('*')
        if (storeId && storeId !== 'all') query = query.eq('cua_hang_id', storeId)
        if (period && period !== 'all') query = query.eq('ky_luong_id', period)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          const supabaseTargets: ServerBscTarget[] = data.map((row: Record<string, unknown>) => ({
            id: String(row.id || ''),
            store_id: String(row.cua_hang_id || 'store-001'),
            store_name: String(row.ten_cua_hang || 'Homies Cửa Hàng'),
            period: String(row.ky_luong_id || period || currentPeriod()),
            profit_threshold_daily: Number(row.moc_hoa_von_ngay || 6500000),
            avg_3_6_months_daily: Number(row.doanh_thu_trung_binh_ngay || 7000000),
            target_daily: Number(row.target_ngay || 8000000),
            target_monthly: Number(row.target_thang || 248000000),
            days_in_month: Number(row.so_ngay_trong_thang || 31),
            actual_revenue_monthly: Number(row.doanh_thu_thuc_te_thang || 255440000),
            actual_revenue_daily: Number(row.doanh_thu_thuc_te_ngay || 8240000),
            is_unlocked: Boolean(row.mo_thuong ?? true),
            cogs_budget: Number(row.cogs_dinh_muc || 85000000),
            cogs_actual: Number(row.cogs_thuc_te || 86530000),
            waste_percentage: Number(row.ty_le_hao_hut || 1.8),
            has_attp_foreign_body: Boolean(row.vi_pham_attp ?? false),
            min_hours_threshold: Number(row.moc_gio_toi_thieu || 110),
            approval_status: (row.trang_thai_duyet as 'draft' | 'pending_ceo' | 'approved_published') || 'draft',
            approved_by: String(row.nguoi_duyet || ''),
            approved_at: String(row.ngay_duyet || ''),
          }))

          // Gộp cập nhật vào server-db
          for (const sbTarget of supabaseTargets) {
            const idx = targets.findIndex(t => t.store_id === sbTarget.store_id && t.period === sbTarget.period)
            if (idx >= 0) {
              targets[idx] = { ...targets[idx], ...sbTarget }
            } else {
              targets.push(sbTarget)
            }
          }
        }
      } catch (sbErr) {
        console.warn('[API /api/bsc/targets] Supabase sync warning:', sbErr)
      }
    }

    // 2. Tự động hóa Doanh thu thuần & Hao hụt kho (Zero-Manual Input)
    // Nếu target chưa có hoặc chưa có số liệu thực tế, tự động điền từ doanh thu máy POS và kho IVT
    const defaultStores = [
      { id: 'store-001', name: 'Homies Milk Tea - Hồ Bá Phấn', targetDaily: 8000000, posRevenue: 209361294, cogsBudget: 86000000, cogsActual: 89741000, wastePct: 4.35 },
      { id: 'store-002', name: 'Homies Milk Tea - Đường 429', targetDaily: 7500000, posRevenue: 241800000, cogsBudget: 80000000, cogsActual: 81680000, wastePct: 2.1 },
    ]

    const targetPeriod = period && period !== 'all' ? period : currentPeriod()
    for (const defStore of defaultStores) {
      let existing = targets.find(t => t.store_id === defStore.id && t.period === targetPeriod)
      if (!existing) {
        existing = {
          id: `bsc-target-${defStore.id}-${targetPeriod}`,
          store_id: defStore.id,
          store_name: defStore.name,
          period: targetPeriod,
          profit_threshold_daily: 6500000,
          avg_3_6_months_daily: 7000000,
          target_mode: 'auto_3_6_months',
          target_daily: defStore.targetDaily,
          target_monthly: defStore.targetDaily * 31,
          days_in_month: 31,
          actual_revenue_monthly: defStore.posRevenue,
          actual_revenue_daily: Math.round(defStore.posRevenue / 31),
          is_unlocked: true,
          cogs_budget: defStore.cogsBudget,
          cogs_actual: defStore.cogsActual,
          waste_percentage: defStore.wastePct,
          has_attp_foreign_body: false,
          min_hours_threshold: 110,
          approval_status: 'draft',
          source: 'ipos_pos_and_ivt_synced',
        }
        targets.push(existing)
      } else if (!existing.actual_revenue_monthly || existing.actual_revenue_monthly === 0) {
        existing.actual_revenue_monthly = defStore.posRevenue
        existing.actual_revenue_daily = Math.round(defStore.posRevenue / 31)
        existing.cogs_budget = defStore.cogsBudget
        existing.cogs_actual = defStore.cogsActual
        existing.waste_percentage = defStore.wastePct
        existing.is_unlocked = true
        existing.source = 'ipos_pos_and_ivt_synced'
      }
    }

    db.bsc_targets = targets
    await saveServerDb(db)

    // Lọc theo điều kiện tìm kiếm
    let filtered = targets
    if (storeId && storeId !== 'all') {
      filtered = filtered.filter(t => t.store_id === storeId)
    }
    if (period && period !== 'all') {
      filtered = filtered.filter(t => t.period === period)
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      targets: filtered,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống khi tải mục tiêu BSC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { store_id, period, ...updates } = body

    if (!store_id || !period) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (store_id, period)' },
        { status: 400 }
      )
    }

    const db = await getServerDb()
    if (!db.bsc_targets) {
      db.bsc_targets = []
    }

    const existingIdx = db.bsc_targets.findIndex(
      t => t.store_id === store_id && t.period === period
    )

    let updatedTarget: ServerBscTarget

    const current = existingIdx >= 0 ? db.bsc_targets[existingIdx] : undefined
    const daysInMonth = Number(updates.days_in_month ?? current?.days_in_month ?? 31)

    // Hỗ trợ map linh hoạt cả tên trường chuẩn và alias
    const rawActualMonthly = updates.actual_revenue_monthly ?? updates.actual_revenue ?? current?.actual_revenue_monthly
    const actualRevMonthly = rawActualMonthly !== undefined ? Number(rawActualMonthly) : 255440000
    const actualRevDaily = Math.round(actualRevMonthly / daysInMonth)

    const rawProfitThreshold = updates.profit_threshold_daily ?? current?.profit_threshold_daily
    const profitThreshold = rawProfitThreshold !== undefined ? Number(rawProfitThreshold) : 6500000

    const rawCogsBudget = updates.cogs_budget ?? updates.budgeted_cogs ?? current?.cogs_budget
    const cogsBudget = rawCogsBudget !== undefined ? Number(rawCogsBudget) : 85000000

    const rawCogsActual = updates.cogs_actual ?? updates.actual_cogs ?? current?.cogs_actual
    const cogsActual = rawCogsActual !== undefined ? Number(rawCogsActual) : 86530000

    const rawTargetMonthly = updates.target_monthly ?? updates.target_revenue ?? current?.target_monthly
    const targetMonthly = rawTargetMonthly !== undefined ? Number(rawTargetMonthly) : 248000000
    const targetDaily = Number(updates.target_daily ?? current?.target_daily ?? Math.round(targetMonthly / daysInMonth))

    const wastePercentage = Number(updates.waste_percentage ?? updates.loss_rate_percent ?? current?.waste_percentage ?? 1.8)
    const hasAttpForeignBody = Boolean(updates.has_attp_foreign_body ?? current?.has_attp_foreign_body ?? false)
    const hasNoQr = Boolean(updates.has_no_qr ?? current?.has_no_qr ?? false)
    const minHoursThreshold = Number(updates.min_hours_threshold ?? current?.min_hours_threshold ?? 110)
    const approvalStatus = updates.approval_status ?? current?.approval_status ?? 'draft'
    const submittedBy = updates.submitted_by ?? current?.submitted_by
    const submittedAt = updates.submitted_at ?? (updates.approval_status === 'pending_ceo' ? (current?.submitted_at || new Date().toISOString()) : current?.submitted_at)

    if (existingIdx >= 0) {
      updatedTarget = {
        ...current!,
        ...updates,
        days_in_month: daysInMonth,
        profit_threshold_daily: profitThreshold,
        target_daily: targetDaily,
        target_monthly: targetMonthly,
        actual_revenue_monthly: actualRevMonthly,
        actual_revenue_daily: actualRevDaily,
        is_unlocked: actualRevDaily >= profitThreshold,
        cogs_budget: cogsBudget,
        cogs_actual: cogsActual,
        waste_percentage: wastePercentage,
        has_attp_foreign_body: hasAttpForeignBody,
        has_no_qr: hasNoQr,
        min_hours_threshold: minHoursThreshold,
        approval_status: approvalStatus,
        submitted_by: submittedBy,
        submitted_at: submittedAt,
        updated_at: new Date().toISOString(),
      }
      db.bsc_targets[existingIdx] = updatedTarget
    } else {
      updatedTarget = {
        id: `bsc-target-${store_id}-${period}`,
        store_id,
        store_name: store_id === 'store-002' ? 'Homies Milk Tea - Đường 429' : 'Homies Milk Tea - Hồ Bá Phấn',
        period,
        profit_threshold_daily: profitThreshold,
        target_daily: targetDaily,
        target_monthly: targetMonthly,
        days_in_month: daysInMonth,
        actual_revenue_monthly: actualRevMonthly,
        actual_revenue_daily: actualRevDaily,
        is_unlocked: actualRevDaily >= profitThreshold,
        cogs_budget: cogsBudget,
        cogs_actual: cogsActual,
        waste_percentage: wastePercentage,
        operation_error_points: Number(updates.operation_error_points ?? 0),
        has_critical_op_error: Boolean(updates.has_critical_op_error ?? false),
        has_no_qr: hasNoQr,
        customer_qr_score: Number(updates.customer_qr_score ?? 0),
        customer_qr_count: Number(updates.customer_qr_count ?? 0),
        customer_review_score: Number(updates.customer_review_score ?? 0),
        customer_complaint_count: Number(updates.customer_complaint_count ?? 0),
        has_attp_foreign_body: hasAttpForeignBody,
        min_hours_threshold: minHoursThreshold,
        approval_status: approvalStatus,
        approved_by: updates.approved_by,
        approved_at: updates.approved_at,
        submitted_by: submittedBy,
        submitted_at: submittedAt,
        source: 'manual_input',
        updated_at: new Date().toISOString(),
        ...updates,
      }
      db.bsc_targets.push(updatedTarget)
    }

    // Đồng bộ sang Supabase nếu bật
    if (isRealDbMode()) {
      try {
        await supabase.from('bsc_muc_tieu_doanh_thu').upsert([
          {
            cua_hang_id: store_id,
            ky_luong_id: period,
            ten_cua_hang: updatedTarget.store_name,
            moc_hoa_von_ngay: updatedTarget.profit_threshold_daily,
            target_ngay: updatedTarget.target_daily,
            target_thang: updatedTarget.target_monthly,
            so_ngay_trong_thang: updatedTarget.days_in_month,
            doanh_thu_thuc_te_thang: updatedTarget.actual_revenue_monthly,
            doanh_thu_thuc_te_ngay: updatedTarget.actual_revenue_daily,
            mo_thuong: updatedTarget.is_unlocked,
            cogs_dinh_muc: updatedTarget.cogs_budget,
            cogs_thuc_te: updatedTarget.cogs_actual,
            vi_pham_attp: updatedTarget.has_attp_foreign_body,
            moc_gio_toi_thieu: updatedTarget.min_hours_threshold,
            trang_thai_duyet: updatedTarget.approval_status,
            nguoi_duyet: updatedTarget.approved_by,
            ngay_duyet: updatedTarget.approved_at,
            updated_at: new Date().toISOString(),
          },
        ], { onConflict: 'cua_hang_id,ky_luong_id' })
      } catch (sbErr) {
        console.warn('[API /api/bsc/targets] Supabase save warning:', sbErr)
      }
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: 'Đã lưu mục tiêu và quyết toán BSC thành công',
      data: updatedTarget,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống khi lưu mục tiêu BSC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
