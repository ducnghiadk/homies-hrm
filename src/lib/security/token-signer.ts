import crypto from 'crypto'

export const AUTH_SIGNATURE_SECRET = process.env.AUTH_SECRET || 'homies_auth_secret_signature_key_2026'

/**
 * Tạo chữ ký số HMAC-SHA256 cho cặp (vai trò, userId) để chống sửa cookie trên trình duyệt
 */
export function signRole(role: string, userId: string): string {
  return crypto
    .createHmac('sha256', AUTH_SIGNATURE_SECRET)
    .update(`${userId}:${role}`)
    .digest('hex')
    .substring(0, 16)
}

/**
 * Kiểm tra tính hợp lệ của chữ ký số
 */
export function verifyRoleSignature(role: string, userId: string, signature: string): boolean {
  if (!role || !userId || !signature) return false
  const expected = signRole(role, userId)
  return signature === expected
}

/**
 * Mã hóa mật khẩu một chiều bằng PBKDF2 (SHA-256) với muối (salt) ngẫu nhiên
 */
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
  // Mật khẩu văn bản truyền thống (legacy fallback)
  return password === storedHash
}

