export const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const

export function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getWeekStart(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
  const day = monday.getDay()
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
  return formatDateKey(monday)
}

export function plusDays(base: string, amount: number) {
  const date = parseDateKey(base)
  date.setDate(date.getDate() + amount)
  return formatDateKey(date)
}

export function isValidDateString(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = parseDateKey(value)
  return !Number.isNaN(date.getTime()) && formatDateKey(date) === value
}

export function getWeekStartForDate(value: string) {
  return getWeekStart(parseDateKey(value))
}

export function resolveSchedulesQuery(searchParams: URLSearchParams) {
  const explicitWeekStart = searchParams.get('weekStart')
  const selectedDate = searchParams.get('selectedDate')
  const legacyDate = searchParams.get('date')
  const storeId = searchParams.get('storeId')
  const normalizedExplicitWeekStart = isValidDateString(explicitWeekStart) ? explicitWeekStart : null
  const fallbackDate = selectedDate || legacyDate
  const normalizedSelectedDate = isValidDateString(fallbackDate) ? fallbackDate : null
  const normalizedWeekStart = normalizedExplicitWeekStart
    ? getWeekStartForDate(normalizedExplicitWeekStart)
    : (normalizedSelectedDate ? getWeekStartForDate(normalizedSelectedDate) : null)

  const canonicalParams = new URLSearchParams()
  if (normalizedWeekStart) canonicalParams.set('weekStart', normalizedWeekStart)
  if (normalizedSelectedDate) canonicalParams.set('selectedDate', normalizedSelectedDate)
  if (storeId) canonicalParams.set('storeId', storeId)

  return {
    weekStart: normalizedWeekStart,
    selectedDate: normalizedSelectedDate,
    storeId,
    canonicalSearch: canonicalParams.toString(),
  }
}

export function getWeekDates(weekStart: string) {
  return Array.from({ length: 7 }, (_, index) => plusDays(weekStart, index))
}
