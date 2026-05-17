import type { ScheduleShift } from '@/lib/mock-data-smart-schedule'

// --- Types ---

export interface HistoryState {
  past: ScheduleShift[][]
  present: ScheduleShift[]
  future: ScheduleShift[][]
  original: ScheduleShift[]
}

const MAX_HISTORY = 50

// --- Schedule History (Undo/Redo Stack) ---

export class ScheduleHistory {
  private state: HistoryState

  constructor(initialShifts: ScheduleShift[]) {
    const clone = JSON.parse(JSON.stringify(initialShifts))
    this.state = {
      past: [],
      present: clone,
      future: [],
      original: JSON.parse(JSON.stringify(initialShifts)),
    }
  }

  get current(): ScheduleShift[] {
    return this.state.present
  }

  get canUndo(): boolean {
    return this.state.past.length > 0
  }

  get canRedo(): boolean {
    return this.state.future.length > 0
  }

  get changeCount(): number {
    return this.state.past.length
  }

  /** Push new state, clearing redo stack */
  push(newShifts: ScheduleShift[]): ScheduleShift[] {
    const past = [...this.state.past, this.state.present]
    // Trim oldest if exceeding max
    if (past.length > MAX_HISTORY) {
      past.shift()
    }
    this.state = {
      ...this.state,
      past,
      present: JSON.parse(JSON.stringify(newShifts)),
      future: [], // Clear redo on new action
    }
    return this.state.present
  }

  /** Undo: move present → future, pop past → present */
  undo(): ScheduleShift[] | null {
    if (!this.canUndo) return null
    const past = [...this.state.past]
    const previous = past.pop()!
    this.state = {
      ...this.state,
      past,
      present: previous,
      future: [this.state.present, ...this.state.future],
    }
    return this.state.present
  }

  /** Redo: move present → past, shift future → present */
  redo(): ScheduleShift[] | null {
    if (!this.canRedo) return null
    const future = [...this.state.future]
    const next = future.shift()!
    this.state = {
      ...this.state,
      past: [...this.state.past, this.state.present],
      present: next,
      future,
    }
    return this.state.present
  }

  /** Reset to original state, pushing current to past */
  reset(): ScheduleShift[] {
    if (this.changeCount === 0) return this.state.present
    this.state = {
      past: [...this.state.past, this.state.present],
      present: JSON.parse(JSON.stringify(this.state.original)),
      future: [],
      original: this.state.original,
    }
    return this.state.present
  }

  /** Get the original (unmodified) shifts */
  getOriginal(): ScheduleShift[] {
    return this.state.original
  }

  /** Check if a specific shift was modified vs original */
  isShiftModified(shiftId: string): boolean {
    const orig = this.state.original.find(s => s.id === shiftId)
    const curr = this.state.present.find(s => s.id === shiftId)
    if (!orig && curr) return true  // New shift
    if (orig && !curr) return true  // Deleted shift
    if (!orig || !curr) return false
    return (
      orig.startTime !== curr.startTime ||
      orig.endTime !== curr.endTime ||
      orig.employeeId !== curr.employeeId ||
      orig.position !== curr.position ||
      orig.breakMinutes !== curr.breakMinutes
    )
  }
}
