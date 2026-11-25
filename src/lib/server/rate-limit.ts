/**
 * Giới hạn số lần thử đơn giản trong bộ nhớ (theo từng tiến trình máy chủ).
 * Trên serverless mỗi instance có bộ đếm riêng, vẫn đủ làm chậm dò mật khẩu/PIN hàng loạt.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) return false
  return bucket.count >= maxAttempts
}

export function recordFailedAttempt(key: string, windowMs: number): void {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
  } else {
    bucket.count += 1
  }
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k)
  }
}

export function clearAttempts(key: string): void {
  buckets.delete(key)
}

export function getClientIp(headers: Headers): string {
  return (headers.get('x-forwarded-for') || '').split(',')[0].trim() || headers.get('x-real-ip') || 'unknown'
}
