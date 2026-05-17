'use client'

interface TrendIndicatorProps {
  value: number // +5, -3, 0
  showValue?: boolean
  size?: 'sm' | 'md'
}

export default function TrendIndicator({ value, showValue = true, size = 'sm' }: TrendIndicatorProps) {
  const isUp = value > 0
  const isDown = value < 0
  const color = isUp ? '#10b981' : isDown ? '#ef4444' : '#9ca3af'
  const fontSize = size === 'sm' ? 10 : 12
  const iconSize = size === 'sm' ? 12 : 16

  return (
    <span className="inline-flex items-center gap-0.5 animate-fade-in" style={{ color }}>
      {isUp && <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none"><path d="M8 3L13 9H3L8 3Z" fill={color} className="animate-bounce-subtle" /></svg>}
      {isDown && <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none"><path d="M8 13L3 7H13L8 13Z" fill={color} /></svg>}
      {!isUp && !isDown && <span style={{ fontSize }}>→</span>}
      {showValue && <span style={{ fontSize, fontWeight: 700 }}>{value > 0 ? `+${value}` : value}</span>}
    </span>
  )
}
