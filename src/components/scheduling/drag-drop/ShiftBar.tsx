'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { ScheduleShift } from '@/lib/mock-data-smart-schedule'

export type ShiftValidationStatus = 'normal' | 'modified' | 'warning' | 'error'

interface ShiftBarProps {
  shift: ScheduleShift
  gridStartHour: number  // 7
  gridEndHour: number    // 23
  validationStatus: ShiftValidationStatus
  isSelected: boolean
  onSelect: (shiftId: string) => void
  onDragMove: (shiftId: string, newStartHour: number, newEndHour: number) => void
  onDragSwap: (shiftId: string, deltaY: number) => void
  onResize: (shiftId: string, newEndHour: number) => void
  onDoubleClick: (shiftId: string) => void
}

const STYLE_MAP: Record<ShiftValidationStatus, { bg: string; border: string; ring: string }> = {
  normal:   { bg: 'bg-blue-500',   border: 'border-blue-600',   ring: 'ring-blue-300' },
  modified: { bg: 'bg-emerald-500', border: 'border-emerald-600', ring: 'ring-emerald-300' },
  warning:  { bg: 'bg-yellow-500', border: 'border-yellow-600', ring: 'ring-yellow-300' },
  error:    { bg: 'bg-red-500',    border: 'border-red-600',    ring: 'ring-red-300' },
}

export default function ShiftBar({
  shift, gridStartHour, gridEndHour, validationStatus,
  isSelected, onSelect, onDragMove, onDragSwap, onResize, onDoubleClick
}: ShiftBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [ghostLeft, setGhostLeft] = useState<number | null>(null)
  const [ghostWidth, setGhostWidth] = useState<number | null>(null)

  const startHour = parseInt(shift.startTime.split(':')[0], 10)
  const endHour = parseInt(shift.endTime.split(':')[0], 10)
  const totalHours = gridEndHour - gridStartHour
  const leftPercent = ((startHour - gridStartHour) / totalHours) * 100
  const widthPercent = ((endHour - startHour) / totalHours) * 100

  const dragStartRef = useRef<{ x: number; y: number; origStart: number; origEnd: number } | null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const style = STYLE_MAP[validationStatus]

  // --- Mouse Handlers: Move ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if near right edge (resize zone = last 20%)
    const rect = barRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = e.clientX - rect.left
    const isResizeZone = relX > rect.width * 0.8

    if (isResizeZone) {
      // Start resize
      setIsResizing(true)
      dragStartRef.current = { x: e.clientX, y: e.clientY, origStart: startHour, origEnd: endHour }
    } else {
      // Start move
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX, y: e.clientY, origStart: startHour, origEnd: endHour }
    }

    onSelect(shift.id)
    e.preventDefault()
    e.stopPropagation()
  }, [startHour, endHour, shift.id, onSelect])

  // --- Touch Handlers ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartRef.current = { x: touch.clientX, y: touch.clientY, origStart: startHour, origEnd: endHour }
    
    longPressRef.current = setTimeout(() => {
      setIsDragging(true)
    }, 500) // Long press = 500ms
  }, [startHour, endHour])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStartRef.current) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - dragStartRef.current.x)
    const dy = Math.abs(touch.clientY - dragStartRef.current.y)
    
    // Cancel long press if finger moves too much
    if (!isDragging && (dx > 10 || dy > 10)) {
      if (longPressRef.current) clearTimeout(longPressRef.current)
    }
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    if (longPressRef.current) clearTimeout(longPressRef.current)
    setIsDragging(false)
    setIsResizing(false)
    dragStartRef.current = null
  }, [])

  // Global mouse move/up (while dragging)
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleGlobalMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !barRef.current) return
      const parent = barRef.current.parentElement
      if (!parent) return
      const parentRect = parent.getBoundingClientRect()
      const hourWidth = parentRect.width / totalHours

      if (isResizing) {
        // Resize: change end hour
        const newEndHourRaw = gridStartHour + (e.clientX - parentRect.left) / hourWidth
        const newEndHour = Math.max(dragStartRef.current.origStart + 1, Math.min(gridEndHour, Math.round(newEndHourRaw)))
        setGhostWidth(((newEndHour - startHour) / totalHours) * 100)
        // Will commit on mouseup
      } else if (isDragging) {
        // Move: change start hour + detect Y swap
        const dx = e.clientX - dragStartRef.current.x
        const deltaHours = Math.round(dx / hourWidth)
        const newStart = Math.max(gridStartHour, Math.min(gridEndHour - (endHour - startHour), dragStartRef.current.origStart + deltaHours))
        setGhostLeft(((newStart - gridStartHour) / totalHours) * 100)

        // Y-axis swap detection
        const dy = e.clientY - dragStartRef.current.y
        if (Math.abs(dy) > 50) {
          onDragSwap(shift.id, dy)
        }
      }
    }

    const handleGlobalUp = (e: MouseEvent) => {
      if (!dragStartRef.current || !barRef.current) return
      const parent = barRef.current.parentElement
      if (!parent) return
      const parentRect = parent.getBoundingClientRect()
      const hourWidth = parentRect.width / totalHours

      if (isResizing) {
        const newEndHourRaw = gridStartHour + (e.clientX - parentRect.left) / hourWidth
        const newEndHour = Math.max(dragStartRef.current.origStart + 1, Math.min(gridEndHour, Math.round(newEndHourRaw)))
        if (newEndHour !== endHour) {
          onResize(shift.id, newEndHour)
        }
      } else if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x
        const deltaHours = Math.round(dx / hourWidth)
        if (deltaHours !== 0) {
          const duration = endHour - startHour
          const newStart = Math.max(gridStartHour, Math.min(gridEndHour - duration, dragStartRef.current.origStart + deltaHours))
          const newEnd = newStart + duration
          onDragMove(shift.id, newStart, newEnd)
        }
      }

      setIsDragging(false)
      setIsResizing(false)
      setGhostLeft(null)
      setGhostWidth(null)
      dragStartRef.current = null
    }

    document.addEventListener('mousemove', handleGlobalMove)
    document.addEventListener('mouseup', handleGlobalUp)
    return () => {
      document.removeEventListener('mousemove', handleGlobalMove)
      document.removeEventListener('mouseup', handleGlobalUp)
    }
  }, [isDragging, isResizing, startHour, endHour, totalHours, gridStartHour, gridEndHour, shift.id, onDragMove, onDragSwap, onResize])

  // Double-click handler
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDoubleClick(shift.id)
  }, [shift.id, onDoubleClick])

  return (
    <>
      {/* Ghost preview while dragging */}
      {(ghostLeft !== null || ghostWidth !== null) && (
        <div
          className="absolute top-0.5 h-[calc(100%-4px)] border-2 border-dashed border-blue-400 bg-blue-100/30 rounded-lg pointer-events-none z-10"
          style={{
            left: `${ghostLeft ?? leftPercent}%`,
            width: `${ghostWidth ?? widthPercent}%`,
          }}
        />
      )}

      {/* Actual shift bar */}
      <div
        ref={barRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          absolute top-0.5 h-[calc(100%-4px)] rounded-lg border
          flex items-center justify-center
          select-none transition-shadow
          ${style.bg} ${style.border} text-white text-xs font-bold
          ${isDragging ? 'opacity-60 shadow-xl cursor-grabbing z-20 scale-[1.02]' : ''}
          ${isResizing ? 'opacity-80 z-20' : ''}
          ${isSelected && !isDragging ? `ring-2 ${style.ring} ring-offset-1` : ''}
          ${!isDragging && !isResizing ? 'cursor-grab hover:brightness-110' : ''}
        `}
        style={{
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          minWidth: '30px',
          touchAction: 'none',
        }}
        title={`${shift.employeeName}: ${shift.startTime} - ${shift.endTime}`}
      >
        <span className="truncate px-1">
          {shift.startTime}–{shift.endTime}
        </span>

        {/* Resize handle (right edge) */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[20%] min-w-[8px] cursor-ew-resize
            hover:bg-white/20 rounded-r-lg transition-colors"
        />
      </div>
    </>
  )
}
