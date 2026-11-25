// ============================================================================
// Thuế thu nhập cá nhân (TNCN) — hàm thuần, dùng chung cho trình duyệt và máy chủ.
// Mọi mức giảm trừ, biểu thuế và tỷ lệ khấu trừ đều lấy từ Cài đặt lương,
// không viết cứng trong công thức.
// ============================================================================

export interface PitBracket {
  /** Mức thu nhập tính thuế tối đa của bậc (VNĐ/tháng). null = bậc cuối, không giới hạn. */
  upTo: number | null
  /** Thuế suất của bậc, ví dụ 0.05 = 5%. */
  rate: number
}

export interface PitSettings {
  personalDeduction: number
  dependentDeduction: number
  brackets: PitBracket[]
  /** Khấu trừ cố định cho lao động bán thời gian / hợp đồng dưới 3 tháng. */
  partTimeFlatTaxEnabled: boolean
  partTimeFlatTaxRate: number
  /** Chỉ khấu trừ khi tổng thu nhập trả trong tháng từ mức này trở lên. */
  partTimeFlatTaxThreshold: number
}

/**
 * Giá trị mặc định khi chủ quán chưa cài. Kế toán cần đối chiếu văn bản hiện hành
 * và chỉnh lại trong Cài đặt lương nếu khác.
 * - Giảm trừ 15,5 triệu / người phụ thuộc 6,2 triệu: Nghị quyết 110/2025/UBTVQH15 (từ kỳ tính thuế 2026).
 * - Biểu lũy tiến 5 bậc: Luật Thuế TNCN sửa đổi 2025.
 * - Khấu trừ 10% với thu nhập từ 2 triệu/lần cho lao động không ký HĐ hoặc HĐ dưới 3 tháng.
 */
export const DEFAULT_PIT_BRACKETS: PitBracket[] = [
  { upTo: 10_000_000, rate: 0.05 },
  { upTo: 30_000_000, rate: 0.1 },
  { upTo: 60_000_000, rate: 0.2 },
  { upTo: 100_000_000, rate: 0.3 },
  { upTo: null, rate: 0.35 },
]

export const DEFAULT_PIT_SETTINGS: PitSettings = {
  personalDeduction: 15_500_000,
  dependentDeduction: 6_200_000,
  brackets: DEFAULT_PIT_BRACKETS,
  partTimeFlatTaxEnabled: true,
  partTimeFlatTaxRate: 0.1,
  partTimeFlatTaxThreshold: 2_000_000,
}

function toNonNegative(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

/** Chuẩn hóa biểu thuế: sắp tăng dần, bỏ dòng hỏng, đảm bảo có bậc cuối không giới hạn. */
export function normalizePitBrackets(input: unknown): PitBracket[] {
  if (!Array.isArray(input) || input.length === 0) return DEFAULT_PIT_BRACKETS
  const rows: PitBracket[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as { upTo?: unknown; rate?: unknown }
    const rate = Number(r.rate)
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) continue
    const upTo = r.upTo === null || r.upTo === undefined || r.upTo === '' ? null : Number(r.upTo)
    if (upTo !== null && (!Number.isFinite(upTo) || upTo <= 0)) continue
    rows.push({ upTo, rate })
  }
  if (rows.length === 0) return DEFAULT_PIT_BRACKETS
  const limited = rows.filter((r) => r.upTo !== null).sort((a, b) => (a.upTo as number) - (b.upTo as number))
  const open = rows.find((r) => r.upTo === null)
  const lastRate = open ? open.rate : limited[limited.length - 1].rate
  return [...limited, { upTo: null, rate: lastRate }]
}

export function normalizePitSettings(input?: Partial<PitSettings> | null): PitSettings {
  const src = input || {}
  return {
    personalDeduction: toNonNegative(src.personalDeduction, DEFAULT_PIT_SETTINGS.personalDeduction),
    dependentDeduction: toNonNegative(src.dependentDeduction, DEFAULT_PIT_SETTINGS.dependentDeduction),
    brackets: normalizePitBrackets(src.brackets),
    partTimeFlatTaxEnabled:
      typeof src.partTimeFlatTaxEnabled === 'boolean' ? src.partTimeFlatTaxEnabled : DEFAULT_PIT_SETTINGS.partTimeFlatTaxEnabled,
    partTimeFlatTaxRate: Math.min(1, toNonNegative(src.partTimeFlatTaxRate, DEFAULT_PIT_SETTINGS.partTimeFlatTaxRate)),
    partTimeFlatTaxThreshold: toNonNegative(src.partTimeFlatTaxThreshold, DEFAULT_PIT_SETTINGS.partTimeFlatTaxThreshold),
  }
}

/** Thuế theo biểu lũy tiến từng phần trên thu nhập tính thuế (đã trừ giảm trừ gia cảnh). */
export function calculateProgressivePit(assessableIncome: number, brackets: PitBracket[]): number {
  if (!(assessableIncome > 0)) return 0
  const rows = normalizePitBrackets(brackets)
  let tax = 0
  let lower = 0
  for (const row of rows) {
    const upper = row.upTo ?? Infinity
    if (assessableIncome <= lower) break
    const slice = Math.min(assessableIncome, upper) - lower
    if (slice > 0) tax += slice * row.rate
    lower = upper
  }
  return Math.round(tax)
}

/**
 * Thuế TNCN tháng.
 * @param taxableIncome thu nhập chịu thuế (đã trừ bảo hiểm và các khoản miễn thuế)
 * @param grossPaid tổng thu nhập trả trong tháng, dùng để xét ngưỡng khấu trừ 10%
 */
export function calculatePit(params: {
  taxableIncome: number
  dependents?: number
  isPartTime?: boolean
  grossPaid?: number
  settings?: Partial<PitSettings> | null
}): { tax: number; method: 'progressive' | 'flat' | 'none' } {
  const settings = normalizePitSettings(params.settings)
  const taxable = Math.max(0, params.taxableIncome || 0)

  if (params.isPartTime && settings.partTimeFlatTaxEnabled) {
    const gross = params.grossPaid ?? taxable
    if (gross < settings.partTimeFlatTaxThreshold || taxable <= 0) return { tax: 0, method: 'none' }
    return { tax: Math.round(taxable * settings.partTimeFlatTaxRate), method: 'flat' }
  }

  const dependents = Math.max(0, Math.floor(params.dependents || 0))
  const assessable = taxable - settings.personalDeduction - dependents * settings.dependentDeduction
  const tax = calculateProgressivePit(assessable, settings.brackets)
  return { tax, method: tax > 0 ? 'progressive' : 'none' }
}

/**
 * Phần tiền tăng ca được miễn thuế: phần trả cao hơn so với giờ làm bình thường.
 * Ví dụ hệ số 1.5 thì 1/3 tiền tăng ca được miễn, 2/3 còn lại vẫn chịu thuế.
 */
export function calculateOvertimeTaxExemption(overtimeAmount: number, overtimeHours: number, normalHourlyRate: number): number {
  if (!(overtimeAmount > 0) || !(overtimeHours > 0) || !(normalHourlyRate > 0)) return 0
  const normalEquivalent = overtimeHours * normalHourlyRate
  return Math.max(0, Math.round(overtimeAmount - normalEquivalent))
}
