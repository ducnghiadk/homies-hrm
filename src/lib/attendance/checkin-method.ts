// ============================================================================
// Cách chấm công theo từng chi nhánh: Wi-Fi quán, mã QR, hoặc cả hai (dự phòng).
// File thuần (không phụ thuộc Next.js), kiểm thử bằng node --test.
// Lưu ý: trình duyệt không đọc được tên Wi-Fi, nên "Wi-Fi quán" được nhận biết
// bằng địa chỉ mạng (IP công cộng) mà điện thoại dùng khi bắt Wi-Fi của quán.
// ============================================================================

export type CheckinMethod = 'wifi_or_qr' | 'wifi' | 'qr'

export const CHECKIN_METHOD_OPTIONS: { value: CheckinMethod; label: string; hint: string }[] = [
  { value: 'wifi_or_qr', label: 'Wi-Fi quán hoặc mã QR', hint: 'Bắt Wi-Fi quán là chấm được; không có Wi-Fi thì quét mã QR.' },
  { value: 'wifi', label: 'Chỉ Wi-Fi quán', hint: 'Bắt buộc dùng Wi-Fi của quán, không nhận mã QR.' },
  { value: 'qr', label: 'Chỉ mã QR', hint: 'Bắt buộc quét mã QR tại quầy như trước.' },
]

export const DEFAULT_CHECKIN_METHOD: CheckinMethod = 'wifi_or_qr'
export const MAX_WIFI_IPS = 10

export function normalizeCheckinMethod(value: unknown): CheckinMethod {
  return value === 'wifi' || value === 'qr' || value === 'wifi_or_qr' ? value : DEFAULT_CHECKIN_METHOD
}

/** Chuẩn hóa IP: bỏ khoảng trắng, cổng, tiền tố IPv6 của IPv4 (::ffff:). Trả '' nếu không hợp lệ. */
export function normalizeIp(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  let ip = raw.trim().toLowerCase()
  if (!ip) return ''
  if (ip.startsWith('[')) ip = ip.slice(1, ip.indexOf(']') > 0 ? ip.indexOf(']') : undefined)
  if (ip.startsWith('::ffff:') && ip.includes('.')) ip = ip.slice(7)
  // IPv4 kèm cổng: 1.2.3.4:5678
  const v4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(ip)
  if (v4WithPort) ip = v4WithPort[1]
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) {
    return ip.split('.').every((p) => Number(p) <= 255) ? ip : ''
  }
  if (/^[0-9a-f:]+$/.test(ip) && ip.includes(':')) return ip
  return ''
}

/** Lấy IP người gửi từ header (Vercel/proxy đặt x-forwarded-for, phần tử đầu tiên là máy khách). */
export function extractClientIp(getHeader: (name: string) => string | null | undefined): string {
  const forwarded = getHeader('x-forwarded-for')
  if (forwarded) {
    const first = normalizeIp(forwarded.split(',')[0])
    if (first) return first
  }
  return normalizeIp(getHeader('x-real-ip') || '')
}

export function normalizeIpList(list: unknown): string[] {
  if (!Array.isArray(list)) return []
  const out: string[] = []
  for (const item of list) {
    const ip = normalizeIp(item)
    if (ip && !out.includes(ip)) out.push(ip)
  }
  return out.slice(0, MAX_WIFI_IPS)
}

export function isIpAllowed(clientIp: string, allowed: unknown): boolean {
  const ip = normalizeIp(clientIp)
  if (!ip) return false
  return normalizeIpList(allowed).includes(ip)
}

export interface StoreCheckinConfig {
  checkin_method: CheckinMethod
  wifi_public_ips: string[]
  /** Có kiểm tra thêm vị trí GPS trong bán kính không (mặc định có). */
  require_gps: boolean
}

export function getStoreCheckinConfig(store: {
  checkin_method?: unknown
  wifi_public_ips?: unknown
  require_gps?: unknown
}): StoreCheckinConfig {
  return {
    checkin_method: normalizeCheckinMethod(store.checkin_method),
    wifi_public_ips: normalizeIpList(store.wifi_public_ips),
    require_gps: store.require_gps !== false,
  }
}

/**
 * Quyết định bước "có mặt tại quán" (chưa tính GPS):
 * - 'wifi': điện thoại đang dùng Wi-Fi quán, không cần mã QR.
 * - 'qr': cần kiểm tra mã QR/PIN.
 * - lỗi: cách chấm công không cho phép.
 */
export function decideCheckinPath(
  config: StoreCheckinConfig,
  clientIp: string,
  hasQr: boolean
): { path: 'wifi' } | { path: 'qr' } | { path: 'error'; error: string } {
  const onShopWifi = config.checkin_method !== 'qr' && isIpAllowed(clientIp, config.wifi_public_ips)
  if (onShopWifi) return { path: 'wifi' }
  if (config.checkin_method === 'wifi') {
    if (config.wifi_public_ips.length === 0) {
      return { path: 'error', error: 'Quán chưa cài đặt Wi-Fi chấm công. Vui lòng báo quản lý vào Cài đặt > Chấm công Wi-Fi để lưu mạng của quán.' }
    }
    return { path: 'error', error: 'Bạn chưa kết nối Wi-Fi của quán. Vui lòng bắt Wi-Fi quán (tắt 4G) rồi chấm công lại.' }
  }
  if (!hasQr) {
    return {
      path: 'error',
      error: config.checkin_method === 'wifi_or_qr'
        ? 'Bạn chưa kết nối Wi-Fi của quán. Vui lòng bắt Wi-Fi quán hoặc quét mã QR tại quầy bar.'
        : 'Vui lòng quét mã QR tại quầy bar của quán để chấm công.',
    }
  }
  return { path: 'qr' }
}
