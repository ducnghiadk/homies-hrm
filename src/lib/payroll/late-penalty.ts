// ============================================================================
// Tính tiền phạt đi trễ theo cài đặt (nhiều chế độ). File thuần, kiểm thử bằng node --test.
// ============================================================================

export type LatePenaltyMode = 'none' | 'fixed' | 'tiered' | 'per_minute'

export interface LatePenaltySettings {
  mode: LatePenaltyMode | string
  /** Số lần đi trễ đầu tiên trong tháng được miễn phạt. */
  graceOccurrences: number
  fixedAmount: number
  tier1MaxMinutes: number
  tier1Amount: number
  tier2MaxMinutes: number
  tier2Amount: number
  tier3Amount: number
  /** Bậc 3: trừ 50% tiền ca thay vì số tiền cố định. */
  tier3HalfShiftDeduction?: boolean
  /** Chế độ theo phút: hệ số nhân với đơn giá 1 phút (1 = trừ đúng tiền những phút trễ). */
  perMinuteMultiplier?: number
  /** Chế độ theo phút: mức trừ tối đa cho 1 lần (0 = không giới hạn). */
  perMinuteMaxPerOccurrence?: number
  /**
   * Chế độ theo phút với nhân viên bán thời gian: mặc định KHÔNG trừ thêm,
   * vì những phút đến trễ đã không được tính giờ công (tránh phạt 2 lần).
   */
  perMinuteApplyToPartTime?: boolean
}

export interface LateOccurrence {
  date: string
  minutes: number
}

export interface LatePenaltyResult {
  date: string
  minutes: number
  penalty: number
  isExempt: boolean
  tierLabel: string
}

function fmtK(amount: number): string {
  if (amount <= 0) return '0đ'
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`
}

/**
 * @param hourlyRate Đơn giá 1 giờ của nhân viên (part-time: đơn giá giờ; full-time: lương / công chuẩn / giờ chuẩn).
 * @param shiftHours Số giờ 1 ca (dùng cho bậc 3 "trừ 50% tiền ca").
 */
export function computeLatePenalties(
  occurrences: LateOccurrence[],
  s: LatePenaltySettings,
  opts: { hourlyRate: number; shiftHours: number; isPartTime: boolean }
): { total: number; items: LatePenaltyResult[] } {
  const sorted = [...occurrences].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const grace = Math.max(0, Math.floor(Number(s.graceOccurrences) || 0))
  const hourlyRate = Math.max(0, Number(opts.hourlyRate) || 0)
  const items: LatePenaltyResult[] = []
  let total = 0

  sorted.forEach((occ, idx) => {
    const minutes = Math.max(0, Math.round(occ.minutes || 0))
    const n = idx + 1
    if (s.mode === 'none') {
      items.push({ date: occ.date, minutes, penalty: 0, isExempt: true, tierLabel: 'Không phạt tiền' })
      return
    }
    if (n <= grace) {
      items.push({ date: occ.date, minutes, penalty: 0, isExempt: true, tierLabel: `Miễn phạt (${n}/${grace})` })
      return
    }

    let penalty = 0
    let tierLabel = ''
    if (s.mode === 'tiered') {
      if (minutes <= s.tier1MaxMinutes) {
        penalty = s.tier1Amount
        tierLabel = `Bậc 1 (≤${s.tier1MaxMinutes} phút - ${fmtK(penalty)})`
      } else if (minutes <= s.tier2MaxMinutes) {
        penalty = s.tier2Amount
        tierLabel = `Bậc 2 (${s.tier1MaxMinutes + 1}-${s.tier2MaxMinutes} phút - ${fmtK(penalty)})`
      } else if (s.tier3HalfShiftDeduction) {
        penalty = Math.round(opts.shiftHours * hourlyRate * 0.5)
        tierLabel = `Bậc 3 (>${s.tier2MaxMinutes} phút - trừ 50% tiền ca, ${fmtK(penalty)})`
      } else {
        penalty = s.tier3Amount
        tierLabel = `Bậc 3 (>${s.tier2MaxMinutes} phút - ${fmtK(penalty)})`
      }
    } else if (s.mode === 'per_minute') {
      if (opts.isPartTime && !s.perMinuteApplyToPartTime) {
        penalty = 0
        tierLabel = 'Bán thời gian: phút trễ đã không được tính công'
      } else {
        const mult = Number(s.perMinuteMultiplier) > 0 ? Number(s.perMinuteMultiplier) : 1
        penalty = Math.round((minutes * hourlyRate * mult) / 60)
        const cap = Number(s.perMinuteMaxPerOccurrence) || 0
        if (cap > 0 && penalty > cap) penalty = cap
        tierLabel = `Trừ theo phút (${minutes} phút × ${mult} - ${fmtK(penalty)})`
      }
    } else {
      penalty = s.fixedAmount
      tierLabel = `Phạt cố định (${fmtK(penalty)})`
    }

    penalty = Math.max(0, Math.round(penalty || 0))
    total += penalty
    items.push({ date: occ.date, minutes, penalty, isExempt: false, tierLabel })
  })

  return { total, items }
}
