// ═══════════════════════════════════════════════════════════════════════════════
// Auto-import Helpers - Faster coding
// Phase DE-5: Utility functions for rapid development
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string, locale = 'vi-VN'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTime(date: Date | string, locale = 'vi-VN'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(date: Date | string, locale = 'vi-VN'): string {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`
}

export function formatRelativeTime(date: Date | string, locale = 'vi-VN'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return formatDate(d, locale)
}

export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(start)

  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  )
}

export function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return getDateRange(firstDay, lastDay)
}

// ─────────────────────────────────────────────────────────────────────────────
// STRING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

export function camelToKebab(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function maskEmail(email: string): string {
  const [username, domain] = email.split('@')
  if (!domain) return email
  const maskedUsername = username.slice(0, 2) + '***'
  return `${maskedUsername}@${domain}`
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-2)
}

export function highlightSearch(text: string, query: string): string {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = 'VND',
  locale = 'vi-VN'
): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatPercentage(
  value: number,
  total: number,
  decimals = 1
): string {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(decimals)}%`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest
}

// ─────────────────────────────────────────────────────────────────────────────
// ARRAY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(
  array: T[],
  keyFn: (item: T) => number | string,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a)
    const bVal = keyFn(b)
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function pluck<T, K extends keyof T>(array: T[], key: K): T[K][] {
  return array.map((item) => item[key])
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  if (!obj || typeof obj !== 'object') return result
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key]
    }
  })
  return result
}

export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result as Omit<T, K>
}

// ─────────────────────────────────────────────────────────────────────────────
// OBJECT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0
}

export function merge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  return Object.assign(target, ...sources)
}

export function mapValues<T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U
): Record<keyof T, U> {
  const result = {} as Record<keyof T, U>
  Object.keys(obj).forEach((key) => {
    result[key as keyof T] = fn(obj[key as keyof T], key as keyof T)
  })
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  return /^0[0-9]{9}$/.test(phone)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidDate(date: string): boolean {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function scrollToTop(smooth = true): void {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
}

export function scrollToElement(elementId: string, offset = 0): void {
  const element = document.getElementById(elementId)
  if (element) {
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

export function clearStorage(prefixes: string[] = ['hrm-', 'hrm_', 'homies_', 'kpi-', 'offline_']): void {
  if (typeof window === 'undefined') return
  Object.keys(localStorage).forEach((key) => {
    if (prefixes.some(prefix => key.startsWith(prefix))) {
      localStorage.removeItem(key)
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c) // Distance in meters
}

export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon)
  return distance <= radiusMeters
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export function hexToRgba(hex: string, alpha = 1): string {
  const r = parseInt(hex.replace('#', '').substring(0, 2), 16)
  const g = parseInt(hex.replace('#', '').substring(2, 4), 16)
  const b = parseInt(hex.replace('#', '').substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function generateColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 70%, 50%)`
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`
}

export function generateColorPalette(baseColor: string, count = 5): string[] {
  // Simple palette generation based on hue shift
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  // Extract hue from base color (simplified)
  const baseHue = Math.floor(Math.random() * 360)
  const baseSat = 70
  const baseLight = 50

  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i * 360) / count) % 360
    colors.push(hslToHex(hue, baseSat, baseLight))
  }
  return colors
}

export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const helperExports = {
  // Date
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  getDateRange,
  isToday,
  isSameDay,
  getMonthDays,
  // String
  slugify,
  capitalize,
  truncate,
  camelToKebab,
  kebabToCamel,
  maskEmail,
  maskPhone,
  highlightSearch,
  // Number
  formatCurrency,
  formatNumber,
  formatPercentage,
  clamp,
  randomInt,
  roundToNearest,
  // Array
  groupBy,
  sortBy,
  uniq,
  chunk,
  pluck,
  pick,
  omit,
  // Object
  deepClone,
  isEmpty,
  merge,
  mapValues,
  // Validation
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidDate,
  // DOM
  scrollToTop,
  scrollToElement,
  copyToClipboard,
  downloadFile,
  // Storage
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  // Location
  calculateDistance,
  isWithinRadius,
  // Color
  getContrastColor,
  hexToRgba,
  generateColor,
  // Generators
  generateId,
  generateColorPalette,
  generateInitials,
}

export default helperExports
