import crypto from 'crypto'

const DEV_FALLBACK_SECRETS: Record<string, string> = {
  AUTH_SECRET: 'homies_dev_only_auth_secret_do_not_use_in_production',
  QR_SECRET: 'homies_dev_only_qr_secret_do_not_use_in_production',
}

/**
 * Đọc khóa bí mật từ biến môi trường.
 * - Production: bắt buộc phải cấu hình (>= 32 ký tự), thiếu thì báo lỗi thay vì dùng khóa mặc định công khai.
 * - Dev/test: dùng khóa dự phòng chỉ dành cho máy local.
 * Đọc lười (lazy) để `next build` không bị lỗi khi chưa có biến môi trường.
 */
export function getRequiredSecret(name: 'AUTH_SECRET' | 'QR_SECRET'): string {
  const value = (process.env[name] || '').trim()
  if (value.length >= 32) return value
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`[Security] Thiếu biến môi trường ${name} (tối thiểu 32 ký tự). Từ chối chạy với khóa mặc định.`)
  }
  return value || DEV_FALLBACK_SECRETS[name]
}

export function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Tạo chữ ký số HMAC-SHA256 cho cặp (vai trò, userId) để chống sửa cookie trên trình duyệt
 */
export function signRole(role: string, userId: string): string {
  return crypto
    .createHmac('sha256', getRequiredSecret('AUTH_SECRET'))
    .update(`role:${userId}:${role}`)
    .digest('hex')
}

/**
 * Kiểm tra tính hợp lệ của chữ ký số
 */
export function verifyRoleSignature(role: string, userId: string, signature: string): boolean {
  if (!role || !userId || !signature) return false
  return safeEqualString(signature, signRole(role, userId))
}

/**
 * Ký quyền truy cập theo mã PIN chi nhánh (dùng cho cổng ghi nhận sự cố công khai).
 */
export function signStorePinAccess(storeId: string, expiresAt: number): string {
  const payload = `${storeId}.${expiresAt}`
  const sig = crypto
    .createHmac('sha256', getRequiredSecret('AUTH_SECRET'))
    .update(`store-pin:${payload}`)
    .digest('hex')
  return `${payload}.${sig}`
}

export function verifyStorePinAccess(token?: string): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [storeId, expiresAtStr, sig] = parts
  const expiresAt = Number(expiresAtStr)
  if (!storeId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null
  const expected = signStorePinAccess(storeId, expiresAt).split('.')[2]
  return safeEqualString(sig, expected) ? storeId : null
}

/**
 * Mã hóa mật khẩu một chiều bằng PBKDF2 (SHA-256) với muối (salt) ngẫu nhiên
 */
/** Ký nội dung mã QR chấm công động (chữ ký HMAC đầy đủ, không cắt ngắn). */
export function signQrPayload(rawData: string): string {
  return crypto.createHmac('sha256', getRequiredSecret('QR_SECRET')).update(rawData).digest('hex')
}

export function verifyQrPayload(rawData: string, signature: string): boolean {
  return safeEqualString(signQrPayload(rawData), signature)
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex')
  return `pbkdf2:${salt}:${hash}`
}

/**
 * Đối soát mật khẩu an toàn, hỗ trợ tự động nhận diện cả mật khẩu đã mã hóa và mật khẩu cũ
 */
export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!password || !storedHash) return false
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':')
    if (parts.length !== 3) return false
    const [, salt, hash] = parts
    if (!salt || !hash) return false
    const checkHash = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex')
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'))
    } catch {
      return false
    }
  }
  // Mật khẩu văn bản cũ (chỉ còn trong dữ liệu chưa nâng cấp); so sánh an toàn thời gian
  return safeEqualString(password, storedHash)
}

/** Mật khẩu mặc định ban đầu, luôn bắt đổi ở lần đăng nhập đầu tiên. */
export const DEFAULT_INITIAL_PASSWORD = '123456'
