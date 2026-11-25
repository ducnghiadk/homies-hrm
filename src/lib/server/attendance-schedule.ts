// ============================================================================
// Đối soát chấm công với lịch: tìm ca theo LỊCH ĐÃ CHỐT trước, lịch rảnh sau,
// và kiểm tra có mặt tại quán (Wi-Fi quán / mã QR + bán kính GPS) khi chấm công.
// ============================================================================

import { calculateDistance, getShiftTimeRange, type ServerDatabaseSchema, type ServerStore } from '@/lib/server/db'
import { verifyQrPayload } from '@/lib/security/token-signer'
import { pickShiftForTime, type ShiftCandidate } from '@/lib/attendance/operation-settings'
import { decideCheckinPath, getStoreCheckinConfig } from '@/lib/attendance/checkin-method'

/** Danh sách ca của nhân viên trong ngày: lịch đã chốt (published) + lịch rảnh còn hiệu lực. */
export function getShiftCandidates(db: ServerDatabaseSchema, employeeId: string, date: string): ShiftCandidate[] {
  const out: ShiftCandidate[] = []
  for (const s of db.official_schedules || []) {
    if (s.employee_id !== employeeId || s.date !== date || s.status !== 'published') continue
    const r = getShiftTimeRange(s.shift_id, db.shift_templates)
    out.push({ shift_id: s.shift_id, startMin: r.startMin, endMin: r.endMin, source: 'official' })
  }
  for (const s of db.shifts || []) {
    if (s.employee_id !== employeeId || s.date !== date || s.status === 'REJECTED') continue
    if (out.some((c) => c.shift_id === s.shift_id)) continue
    const r = getShiftTimeRange(s.shift_id, db.shift_templates)
    out.push({ shift_id: s.shift_id, startMin: r.startMin, endMin: r.endMin, source: 'availability' })
  }
  return out
}

/** Chọn ca để đối soát khi vào ca; bỏ qua những ca đã chấm công trong ngày. */
export function resolveShiftForCheckin(
  db: ServerDatabaseSchema,
  employeeId: string,
  date: string,
  nowMin: number
): ShiftCandidate | null {
  const done = (db.attendance || [])
    .filter((a) => a.employee_id === employeeId && a.date === date && a.shift_id)
    .map((a) => a.shift_id as string)
  return pickShiftForTime(getShiftCandidates(db, employeeId, date), nowMin, done)
}

/**
 * Kiểm tra nhân viên có mặt tại quán theo cách chấm công của chi nhánh:
 * Wi-Fi quán (IP công cộng nằm trong danh sách) và/hoặc mã QR (động có chữ ký hoặc PIN quán),
 * sau đó kiểm tra GPS trong bán kính nếu chi nhánh bật.
 */
export function verifyStorePresence(
  store: ServerStore,
  qrCode: unknown,
  latitude: unknown,
  longitude: unknown,
  nowMs: number = Date.now(),
  clientIp: string = ''
): { ok: true; distance: number | null; method: 'wifi' | 'qr' } | { ok: false; error: string; distance?: number } {
  const config = getStoreCheckinConfig(store)
  const hasQr = typeof qrCode === 'string' && qrCode.length > 0
  const decision = decideCheckinPath(config, clientIp, hasQr)
  if (decision.path === 'error') return { ok: false, error: decision.error }

  if (decision.path === 'qr') {
    const code = qrCode as string
    if (code.startsWith('HOMIES_DYN_')) {
      const match = /^HOMIES_DYN_(.+)_([0-9a-f]{64})$/.exec(code)
      if (!match) return { ok: false, error: 'Mã QR không đúng định dạng an toàn của hệ thống.' }
      let decoded = ''
      try {
        decoded = Buffer.from(match[1], 'base64url').toString('utf-8')
      } catch {
        return { ok: false, error: 'Mã QR không đúng định dạng an toàn của hệ thống.' }
      }
      if (!verifyQrPayload(decoded, match[2])) {
        return { ok: false, error: 'Mã QR không hợp lệ hoặc đã bị can thiệp chữ ký bảo mật.' }
      }
      const [tokenStoreId, tokenTs] = decoded.split(':')
      if (tokenStoreId && tokenStoreId !== store.id) {
        return { ok: false, error: 'Mã QR không thuộc cơ sở này. Vui lòng quét đúng mã của quán.' }
      }
      if (nowMs - Number(tokenTs) > 60_000) {
        return { ok: false, error: 'Mã QR đã hết hạn (60 giây). Vui lòng quét mã mới tại quầy bar.' }
      }
    } else if (!store.pin_code || code !== store.pin_code) {
      return { ok: false, error: 'Mã QR không khớp với cơ sở bạn đang chấm công.' }
    }
  }

  if (!config.require_gps) return { ok: true, distance: null, method: decision.path }

  const lat = Number(latitude)
  const lng = Number(longitude)
  if (latitude == null || longitude == null || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return { ok: false, error: 'Không lấy được vị trí GPS. Vui lòng bật định vị để chấm công.' }
  }
  const distance = Math.round(calculateDistance(lat, lng, store.latitude, store.longitude))
  const allowed = store.checkin_radius_meters || 100
  if (distance > allowed) {
    return {
      ok: false,
      distance,
      error: `Vị trí chấm công không hợp lệ: bạn đang cách ${store.name} ${distance}m (cho phép tối đa ${allowed}m).`,
    }
  }
  return { ok: true, distance, method: decision.path }
}
