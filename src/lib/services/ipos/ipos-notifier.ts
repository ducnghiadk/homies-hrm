import { getServerDb, saveServerDb, type ServerNotification } from '@/lib/server/db'

export interface IposSyncAlertPayload {
  attendanceCount: number
  employeesCount?: number
  shiftsCount?: number
  period?: string
  storeName?: string
  triggerType?: 'auto' | 'manual'
}

export interface IposSyncAlertResult {
  inAppCreated: boolean
  telegramSent: boolean
  zaloSent: boolean
  errors?: string[]
}

/**
 * Gửi thông báo đa kênh khi Homies HRM nhận/gom được dữ liệu từ iPOS HRM
 * Kênh 1: Quả chuông trên web (In-App notification)
 * Kênh 2: Telegram Bot / Zalo Webhook gửi thẳng về điện thoại
 */
export async function sendIposSyncAlert(payload: IposSyncAlertPayload): Promise<IposSyncAlertResult> {
  const result: IposSyncAlertResult = {
    inAppCreated: false,
    telegramSent: false,
    zaloSent: false,
    errors: [],
  }

  try {
    const db = await getServerDb()
    const now = new Date()
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const storeLabel = payload.storeName && payload.storeName !== 'ALL'
      ? (payload.storeName === 'store-001' ? 'Hồ Bá Phấn' : payload.storeName === 'store-002' ? 'Đường 429' : payload.storeName)
      : 'Tất cả chi nhánh (Hồ Bá Phấn & Đường 429)'

    const title = 'Đồng bộ iPOS HRM thành công'
    const message = `Vừa ghi nhận ${payload.attendanceCount} lượt chấm công từ App iPOS (${storeLabel}) lúc ${timeStr}.`

    // ─────────────────────────────────────────────────────────────
    // 1. KÊNH 1: QUẢ CHUÔNG TRÊN WEB (IN-APP NOTIFICATION)
    // ─────────────────────────────────────────────────────────────
    if (!db.notifications) {
      db.notifications = []
    }

    const newNotif: ServerNotification = {
      id: `notif-ipos-${Date.now()}`,
      title,
      message,
      type: 'ipos_sync',
      created_at: now.toISOString(),
      is_read: false,
      target_role: 'manager_and_above',
      metadata: {
        attendance_count: payload.attendanceCount,
        employees_count: payload.employeesCount || 0,
        shifts_count: payload.shiftsCount || 0,
        store_label: storeLabel,
        trigger_type: payload.triggerType || 'auto',
      },
    }

    // Giữ tối đa 50 thông báo gần nhất
    db.notifications.unshift(newNotif)
    if (db.notifications.length > 50) {
      db.notifications = db.notifications.slice(0, 50)
    }

    await saveServerDb(db)
    result.inAppCreated = true

    // ─────────────────────────────────────────────────────────────
    // 2. KÊNH 2: TELEGRAM BOT (GỬI THẲNG VỀ NHÓM / ĐIỆN THOẠI)
    // ─────────────────────────────────────────────────────────────
    const notifConfig = db.ipos_integration?.notification_config
    const telegramToken = (notifConfig?.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || '').trim()
    const telegramChatId = (notifConfig?.telegram_chat_id || process.env.TELEGRAM_CHAT_ID || '').trim()

    if (telegramToken && telegramChatId) {
      const tgText = [
        `🔔 <b>[Homies HRM] Đồng bộ dữ liệu iPOS thành công!</b>`,
        `⏰ <b>Thời gian:</b> ${timeStr} ngày ${dateStr}`,
        `📍 <b>Cơ sở:</b> ${storeLabel}`,
        `📊 <b>Dữ liệu đã thu thập:</b>`,
        `• Chấm công (App điện thoại): <b>${payload.attendanceCount}</b> lượt`,
        payload.employeesCount ? `• Hồ sơ nhân viên: <b>${payload.employeesCount}</b> người` : null,
        payload.shiftsCount ? `• Lịch phân ca: <b>${payload.shiftsCount}</b> ca` : null,
        `💾 <i>Dữ liệu đã được lưu trữ vĩnh viễn vào hệ thống Homies HRM.</i>`,
      ].filter(Boolean).join('\n')

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: tgText,
            parse_mode: 'HTML',
          }),
          signal: AbortSignal.timeout(6000),
        })

        if (tgRes.ok) {
          result.telegramSent = true
        } else {
          const errBody = await tgRes.text()
          result.errors?.push(`Telegram HTTP ${tgRes.status}: ${errBody}`)
        }
      } catch (tgErr) {
        result.errors?.push(tgErr instanceof Error ? tgErr.message : 'Lỗi gửi Telegram')
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. KÊNH 3: ZALO WEBHOOK (NẾU CÓ CẤU HÌNH)
    // ─────────────────────────────────────────────────────────────
    const zaloWebhookUrl = (notifConfig?.zalo_webhook_url || process.env.ZALO_WEBHOOK_URL || '').trim()
    if (zaloWebhookUrl) {
      try {
        const zaloRes = await fetch(zaloWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ipos_sync_success',
            title,
            message,
            attendance_count: payload.attendanceCount,
            store: storeLabel,
            time: now.toISOString(),
          }),
          signal: AbortSignal.timeout(6000),
        })
        if (zaloRes.ok) {
          result.zaloSent = true
        }
      } catch (zErr) {
        result.errors?.push(zErr instanceof Error ? zErr.message : 'Lỗi gửi Zalo Webhook')
      }
    }

  } catch (err) {
    console.warn('[iPOS Notifier] Lỗi phát thông báo:', err)
    result.errors?.push(err instanceof Error ? err.message : 'Lỗi hệ thống')
  }

  return result
}

