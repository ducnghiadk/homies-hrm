'use client'

import { useEffect, useRef, useReducer, useCallback } from 'react'

type FormatType = 'currency' | 'number' | 'hours' | 'percent'

interface NumberCounterProps {
  value: number
  previousValue?: number
  format?: FormatType
  duration?: number
  showDiff?: boolean
  className?: string
}

function formatValue(val: number, fmt: FormatType): string {
  switch (fmt) {
    case 'currency':
      if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} triệu`
      if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}k`
      return val.toLocaleString('vi-VN') + '₫'
    case 'hours':
      return `${val.toFixed(0)}h`
    case 'percent':
      return `${val.toFixed(0)}%`
    default:
      return val.toLocaleString('vi-VN')
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

interface CounterState { displayValue: number; done: boolean }
type CounterAction =
  | { type: 'TICK'; value: number }
  | { type: 'DONE'; value: number }
  | { type: 'SET_IMMEDIATE'; value: number }

function counterReducer(_state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'TICK': return { displayValue: action.value, done: false }
    case 'DONE': return { displayValue: action.value, done: true }
    case 'SET_IMMEDIATE': return { displayValue: action.value, done: true }
  }
}

export default function NumberCounter({
  value,
  previousValue,
  format = 'number',
  duration = 800,
  showDiff = false,
  className = '',
}: NumberCounterProps) {
  const [state, dispatch] = useReducer(counterReducer, { displayValue: 0, done: false })
  const rafRef = useRef<number>(0)

  const animate = useCallback(() => {
    const start = performance.now()
    const from = 0
    const to = value

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      const current = from + (to - from) * eased

      if (progress < 1) {
        dispatch({ type: 'TICK', value: current })
        rafRef.current = requestAnimationFrame(tick)
      } else {
        dispatch({ type: 'DONE', value: to })
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [value, duration])

  useEffect(() => {
    // Respect reduced motion
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      dispatch({ type: 'SET_IMMEDIATE', value })
      return
    }
    animate()
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate, value])

  const diff = previousValue !== undefined ? value - previousValue : null
  const diffPercent = previousValue && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : null

  return (
    <div className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span
        className="font-bold tabular-nums"
        style={{ animation: state.done ? 'count-pop 300ms ease-out' : undefined }}
      >
        {formatValue(Math.round(state.displayValue), format)}
      </span>

      {showDiff && diff !== null && state.done && (
        <span className={`text-xs font-medium ${
          diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-gray-400'
        }`}>
          {diff > 0 ? '↑' : diff < 0 ? '↓' : '→'}
          {format === 'currency'
            ? formatValue(Math.abs(diff), 'currency')
            : Math.abs(diff).toLocaleString('vi-VN')
          }
          {diffPercent !== null && (
            <span className="text-xs ml-0.5">
              ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(0)}%)
            </span>
          )}
        </span>
      )}

      <style>{`
        @keyframes count-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
