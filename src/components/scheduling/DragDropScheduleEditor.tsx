'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Check, X } from 'lucide-react'

import type {
  ScheduleResult, ScheduleShift, StaffAttribute, HourlyTrafficPattern, SchedulingConstraint
} from '@/lib/mock-data-smart-schedule'

import { ScheduleHistory } from '@/lib/scheduling/schedule-history'
import { getStaffingByHour, recalculateCost, formatHour, parseHour } from '@/lib/scheduling/shift-calculator'
import { validateSchedule } from '@/lib/scheduling/drag-drop-validation'
import type { ValidationResult } from '@/lib/scheduling/drag-drop-validation'

import EditorToolbar from './drag-drop/EditorToolbar'
import DaySelector from './drag-drop/DaySelector'
import TimelineGrid from './drag-drop/TimelineGrid'
import WarningPanel from './drag-drop/WarningPanel'
import ChangesSummary from './drag-drop/ChangesSummary'
import ShiftEditModal from './drag-drop/ShiftEditModal'
import DragDropTutorial from './drag-drop/DragDropTutorial'
import { useOnboarding } from '@/hooks/useOnboarding'

interface DragDropScheduleEditorProps {
  schedule: ScheduleResult
  staffList: StaffAttribute[]
  trafficPattern: HourlyTrafficPattern[]
  constraints: SchedulingConstraint[]
  onConfirm: (updatedResult: ScheduleResult) => void
  onCancel: () => void
}

export default function DragDropScheduleEditor({
  schedule, staffList, trafficPattern, constraints,
  onConfirm, onCancel
}: DragDropScheduleEditorProps) {

  // --- State ---
  const historyRef = useRef(new ScheduleHistory(schedule.shifts))
  const recoveryKeyRef = useRef<string | null>(null)
  const originalShifts = useMemo(
    () => JSON.parse(JSON.stringify(schedule.shifts)) as ScheduleShift[],
    [schedule.shifts],
  )
  const [shifts, setShifts] = useState<ScheduleShift[]>(() => JSON.parse(JSON.stringify(schedule.shifts)))
  const [selectedDate, setSelectedDate] = useState<Date>(parseISO(schedule.weekStart))
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
  const [editingShift, setEditingShift] = useState<ScheduleShift | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [changeCount, setChangeCount] = useState(0)
  const [dragOverEmpId, setDragOverEmpId] = useState<string | null>(null)
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null)
  const [restoredDraftAt, setRestoredDraftAt] = useState<string | null>(null)
  const onboarding = useOnboarding()
  const [showTutorial, setShowTutorial] = useState(() => onboarding.shouldShowTooltip('dragDropIntro'))

  const weekStart = parseISO(schedule.weekStart)
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const dayOfWeek = selectedDate.getDay()
  const draftStorageKey = useMemo(
    () => `homies_schedule_editor_draft:${schedule.weekStart}:${schedule.id}`,
    [schedule.id, schedule.weekStart]
  )

  // --- Derived (memoized) ---
  const dayShifts = useMemo(
    () => shifts.filter(s => s.date === selectedDateStr),
    [shifts, selectedDateStr]
  )

  const validation: ValidationResult = useMemo(
    () => validateSchedule(shifts, staffList, trafficPattern, constraints),
    [shifts, staffList, trafficPattern, constraints]
  )

  const staffing = useMemo(
    () => getStaffingByHour(shifts, selectedDateStr, trafficPattern, dayOfWeek),
    [shifts, selectedDateStr, trafficPattern, dayOfWeek]
  )

  const modifiedShiftIds = useMemo(() => {
    const set = new Set<string>()
    shifts.forEach(s => {
      const orig = originalShifts.find(o => o.id === s.id)
      if (!orig) { set.add(s.id); return }
      if (orig.startTime !== s.startTime || orig.endTime !== s.endTime ||
          orig.employeeId !== s.employeeId || orig.position !== s.position ||
          orig.breakMinutes !== s.breakMinutes) {
        set.add(s.id)
      }
    })
    return set
  }, [shifts, originalShifts])

  const warningShiftIds = useMemo(() => {
    const set = new Set<string>()
    validation.warnings.forEach(w => w.affectedShiftIds.forEach(id => set.add(id)))
    return set
  }, [validation])

  const errorShiftIds = useMemo(() => {
    const set = new Set<string>()
    validation.errors.forEach(e => e.affectedShiftIds.forEach(id => set.add(id)))
    return set
  }, [validation])

  const hasUnsavedChanges = useMemo(() => {
    if (shifts.length !== originalShifts.length) return true
    return modifiedShiftIds.size > 0
  }, [modifiedShiftIds.size, originalShifts.length, shifts.length])

  // --- Sync history state ---
  const syncHistoryFlags = useCallback(() => {
    const h = historyRef.current
    setCanUndo(h.canUndo)
    setCanRedo(h.canRedo)
    setChangeCount(h.changeCount)
  }, [])

  const commitShifts = useCallback((newShifts: ScheduleShift[]) => {
    const result = historyRef.current.push(newShifts)
    setShifts(result)
    syncHistoryFlags()
  }, [syncHistoryFlags])

  // --- Undo / Redo / Reset ---
  const handleUndo = useCallback(() => {
    const result = historyRef.current.undo()
    if (result) { setShifts(result); syncHistoryFlags() }
  }, [syncHistoryFlags])

  const handleRedo = useCallback(() => {
    const result = historyRef.current.redo()
    if (result) { setShifts(result); syncHistoryFlags() }
  }, [syncHistoryFlags])

  const handleReset = useCallback(() => {
    if (!confirm('Reset tất cả thay đổi về lịch gốc?')) return
    const result = historyRef.current.reset()
    setShifts(result)
    syncHistoryFlags()
  }, [syncHistoryFlags])

  // --- Drag handlers ---
  const handleDragMove = useCallback((shiftId: string, newStart: number, newEnd: number) => {
    const updated = shifts.map(s => {
      if (s.id !== shiftId) return s
      return {
        ...s,
        startTime: formatHour(newStart),
        endTime: formatHour(newEnd),
      }
    })
    commitShifts(updated)
  }, [shifts, commitShifts])

  const handleDragSwap = useCallback((shiftId: string, deltaY: number) => {
    const shift = shifts.find(s => s.id === shiftId)
    if (!shift) return

    // Determine direction
    const currentIdx = staffList.findIndex(s => s.employeeId === shift.employeeId)
    const direction = deltaY > 0 ? 1 : -1
    const targetIdx = currentIdx + direction
    if (targetIdx < 0 || targetIdx >= staffList.length) return

    const targetEmployee = staffList[targetIdx]
    setDragOverEmpId(targetEmployee.employeeId)

    // Check if overlap exists
    const targetShifts = shifts.filter(
      s => s.employeeId === targetEmployee.employeeId && s.date === shift.date && s.id !== shiftId
    )
    const startH = parseHour(shift.startTime)
    const endH = parseHour(shift.endTime)
    const hasOverlap = targetShifts.some(s => {
      const sStart = parseHour(s.startTime)
      const sEnd = parseHour(s.endTime)
      return startH < sEnd && endH > sStart
    })
    if (hasOverlap) return

    const updated = shifts.map(s => {
      if (s.id !== shiftId) return s
      return {
        ...s,
        employeeId: targetEmployee.employeeId,
        employeeName: targetEmployee.name,
      }
    })
    commitShifts(updated)
    setTimeout(() => setDragOverEmpId(null), 300)
  }, [shifts, staffList, commitShifts])

  const handleResize = useCallback((shiftId: string, newEnd: number) => {
    const updated = shifts.map(s => {
      if (s.id !== shiftId) return s
      return { ...s, endTime: formatHour(newEnd) }
    })
    commitShifts(updated)
  }, [shifts, commitShifts])

  // --- Modal handlers ---
  const handleDoubleClick = useCallback((shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId)
    if (shift) setEditingShift(shift)
  }, [shifts])

  const handleModalSave = useCallback((updated: ScheduleShift) => {
    const newShifts = shifts.map(s => s.id === updated.id ? updated : s)
    commitShifts(newShifts)
    setEditingShift(null)
  }, [shifts, commitShifts])

  const handleModalDelete = useCallback((shiftId: string) => {
    const newShifts = shifts.filter(s => s.id !== shiftId)
    commitShifts(newShifts)
    setEditingShift(null)
    setSelectedShiftId(null)
  }, [shifts, commitShifts])

  // --- Apply auto-fix ---
  const handleApplyFix = useCallback((fixedShifts: ScheduleShift[]) => {
    commitShifts(fixedShifts)
  }, [commitShifts])

  // --- Confirm ---
  const handleConfirm = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(draftStorageKey)
    }
    setRestoredDraftAt(null)
    setLastAutoSavedAt(null)
    const newCost = recalculateCost(shifts, staffList)
    const updatedResult: ScheduleResult = {
      ...schedule,
      shifts,
      stats: {
        ...schedule.stats,
        totalShifts: shifts.length,
        totalHours: newCost.totalHours,
        totalCost: newCost.totalCost,
        ftHours: newCost.byEmployee
          .filter(e => staffList.find(s => s.employeeId === e.employeeId)?.type === 'fulltime')
          .reduce((a, e) => a + e.hours, 0),
        ptHours: newCost.byEmployee
          .filter(e => staffList.find(s => s.employeeId === e.employeeId)?.type === 'parttime')
          .reduce((a, e) => a + e.hours, 0),
      },
      warnings: validation.errors.map(e => ({
        id: e.id,
        type: e.type === 'understaffed' ? 'understaffed' as const : e.type === 'overtime' ? 'overtime' as const : e.type === 'clopening' ? 'clopening' as const : 'compliance' as const,
        severity: e.severity === 'error' ? 'error' as const : 'warning' as const,
        message: e.message,
        suggestion: e.suggestion,
      })),
      costBreakdown: newCost,
    }
    onConfirm(updatedResult)
  }, [draftStorageKey, shifts, staffList, schedule, validation, onConfirm])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (recoveryKeyRef.current === draftStorageKey) return
    recoveryKeyRef.current = draftStorageKey

    try {
      const rawDraft = localStorage.getItem(draftStorageKey)
      if (!rawDraft) return

      const parsed = JSON.parse(rawDraft) as {
        shifts?: ScheduleShift[]
        savedAt?: string
      }

      if (!Array.isArray(parsed.shifts) || parsed.shifts.length === 0) {
        localStorage.removeItem(draftStorageKey)
        return
      }

      if (JSON.stringify(parsed.shifts) === JSON.stringify(originalShifts)) {
        localStorage.removeItem(draftStorageKey)
        return
      }

      const restore = confirm('Có bản nháp chưa xác nhận cho lịch này. Bạn muốn khôi phục để làm tiếp không?')
      if (!restore) return

      historyRef.current = new ScheduleHistory(originalShifts)
      const restored = historyRef.current.push(parsed.shifts)
      setShifts(restored)
      setLastAutoSavedAt(parsed.savedAt || null)
      setRestoredDraftAt(parsed.savedAt || new Date().toISOString())
      syncHistoryFlags()
    } catch {
      localStorage.removeItem(draftStorageKey)
    }
  }, [draftStorageKey, originalShifts, syncHistoryFlags])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!hasUnsavedChanges) {
      localStorage.removeItem(draftStorageKey)
      return
    }

    const timer = window.setTimeout(() => {
      const savedAt = new Date().toISOString()
      localStorage.setItem(draftStorageKey, JSON.stringify({
        shifts,
        savedAt,
      }))
      setLastAutoSavedAt(savedAt)
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [draftStorageKey, hasUnsavedChanges, shifts])

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); handleUndo()
      }
      // Ctrl+Shift+Z / Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault(); handleRedo()
      }
      // Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShiftId && !editingShift) {
        e.preventDefault(); handleModalDelete(selectedShiftId)
      }
      // Escape
      if (e.key === 'Escape') {
        if (editingShift) { setEditingShift(null) }
        else { setSelectedShiftId(null) }
      }
      // Arrow keys (move shift ±1h or swap employee)
      if (selectedShiftId && !editingShift) {
        const shift = shifts.find(s => s.id === selectedShiftId)
        if (!shift) return
        const startH = parseHour(shift.startTime)
        const endH = parseHour(shift.endTime)

        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          if (startH > 7) handleDragMove(selectedShiftId, startH - 1, endH - 1)
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          if (endH < 23) handleDragMove(selectedShiftId, startH + 1, endH + 1)
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault(); handleDragSwap(selectedShiftId, -60)
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault(); handleDragSwap(selectedShiftId, 60)
        }
        if (e.key === 'Enter') {
          e.preventDefault(); handleDoubleClick(selectedShiftId)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo, handleModalDelete, selectedShiftId, editingShift, shifts, handleDragMove, handleDragSwap, handleDoubleClick])

  // --- Render ---
  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Tutorial overlay */}
      {showTutorial && (
        <DragDropTutorial
          onClose={() => setShowTutorial(false)}
          onDismissPermanent={() => {
            onboarding.markTooltipViewed('dragDropIntro')
            setShowTutorial(false)
          }}
        />
      )}

      {/* Top bar: Cancel / Confirm */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} /> Hủy điều chỉnh
        </button>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-vanilla-50 flex items-center gap-1.5"
          >
            <X size={16} /> Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
          >
            <Check size={16} /> Xác nhận thay đổi
          </button>
        </div>
      </div>

      <div className={`rounded-xl border px-4 py-3 text-xs ${
        hasUnsavedChanges
          ? 'border-warning-200 bg-warning-50 text-warning-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold">
            {hasUnsavedChanges ? 'Bản nháp đang được tự lưu sau 1.5 giây.' : 'Không có thay đổi chưa xác nhận.'}
          </span>
          <span>
            {lastAutoSavedAt
              ? `Đã tự lưu lúc ${format(parseISO(lastAutoSavedAt), 'HH:mm:ss dd/MM')}`
              : 'Chưa có bản nháp tạm thời'}
          </span>
        </div>
        {restoredDraftAt && hasUnsavedChanges && (
          <div className="mt-1 text-[11px] font-medium">
            Đã khôi phục bản nháp lưu lúc {format(parseISO(restoredDraftAt), 'HH:mm:ss dd/MM')}.
          </div>
        )}
      </div>

      {/* Toolbar */}
      <EditorToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        changeCount={changeCount}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
      />

      {/* Day Selector */}
      <DaySelector
        weekStart={weekStart}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Main Grid */}
      <TimelineGrid
        employees={staffList}
        shifts={dayShifts}
        staffing={staffing}
        modifiedShiftIds={modifiedShiftIds}
        warningShiftIds={warningShiftIds}
        errorShiftIds={errorShiftIds}
        selectedShiftId={selectedShiftId}
        dragOverEmployeeId={dragOverEmpId}
        onSelectShift={setSelectedShiftId}
        onDragMove={handleDragMove}
        onDragSwap={handleDragSwap}
        onResize={handleResize}
        onDoubleClick={handleDoubleClick}
      />

      {/* Bottom panels (side by side on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WarningPanel
          validation={validation}
          onApplyFix={handleApplyFix}
        />
        <ChangesSummary
          originalShifts={originalShifts}
          currentShifts={shifts}
        />
      </div>

      {/* Shift Edit Modal */}
      {editingShift && (
        <ShiftEditModal
          shift={editingShift}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onClose={() => setEditingShift(null)}
        />
      )}
    </div>
  )
}
