// Điền nhanh bản nháp từ lịch rảnh: mỗi ca chỉ lấy đủ số người cần,
// ưu tiên người đang có ít giờ trong tuần; người còn lại vào danh sách dự bị.

export interface AvailabilityCandidate {
  key: string
  employee_id: string
  date: string
  shift_id: string
  hours: number
}

export interface FillInput<T extends AvailabilityCandidate> {
  candidates: T[]
  /** Số người tối đa mỗi ca (theo mã ca). Không có thì không giới hạn. */
  capacityByShift: Record<string, number | undefined>
  /** Số người đã có sẵn trong bản nháp theo `ngày|mã ca`. */
  existingCountBySlot: Record<string, number>
  /** Số giờ đã xếp sẵn trong tuần theo nhân viên. */
  existingHoursByEmployee: Record<string, number>
}

export interface FillResult<T extends AvailabilityCandidate> {
  selected: T[]
  reserve: T[]
}

export function slotKey(date: string, shiftId: string): string {
  return `${date.slice(0, 10)}|${shiftId}`
}

export function pickFromAvailability<T extends AvailabilityCandidate>(input: FillInput<T>): FillResult<T> {
  const hours: Record<string, number> = { ...input.existingHoursByEmployee }
  const slotCount: Record<string, number> = { ...input.existingCountBySlot }
  const selected: T[] = []
  const reserve: T[] = []

  // Gom theo ca, xử lý theo thứ tự ngày để chia đều giờ trong tuần
  const bySlot = new Map<string, T[]>()
  for (const c of input.candidates) {
    const k = slotKey(c.date, c.shift_id)
    const list = bySlot.get(k) || []
    list.push(c)
    bySlot.set(k, list)
  }
  const slots = [...bySlot.keys()].sort()

  for (const k of slots) {
    const list = bySlot.get(k)!
    const shiftId = k.split('|')[1]
    const cap = input.capacityByShift[shiftId]
    // Ưu tiên người ít giờ hơn; bằng nhau thì theo mã để kết quả ổn định
    const ordered = [...list].sort((a, b) => {
      const diff = (hours[a.employee_id] || 0) - (hours[b.employee_id] || 0)
      return diff !== 0 ? diff : a.employee_id.localeCompare(b.employee_id)
    })
    for (const c of ordered) {
      const current = slotCount[k] || 0
      if (typeof cap === 'number' && cap > 0 && current >= cap) {
        reserve.push(c)
        continue
      }
      selected.push(c)
      slotCount[k] = current + 1
      hours[c.employee_id] = (hours[c.employee_id] || 0) + (c.hours || 0)
    }
  }

  return { selected, reserve }
}
