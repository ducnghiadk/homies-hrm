'use client'

interface PulseIndicatorProps {
  color?: 'red' | 'yellow' | 'green' | 'blue'
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const colorMap = {
  red:    { dot: 'bg-red-500',    ring: 'bg-red-400' },
  yellow: { dot: 'bg-amber-500',  ring: 'bg-amber-400' },
  green:  { dot: 'bg-green-500',  ring: 'bg-green-400' },
  blue:   { dot: 'bg-blue-500',   ring: 'bg-blue-400' },
}

const sizeMap = {
  sm: { dot: 'w-1.5 h-1.5', ring: 'w-1.5 h-1.5' },
  md: { dot: 'w-2 h-2',     ring: 'w-2 h-2' },
  lg: { dot: 'w-3 h-3',     ring: 'w-3 h-3' },
}

export default function PulseIndicator({
  color = 'red',
  size = 'md',
  label,
}: PulseIndicatorProps) {
  const c = colorMap[color]
  const s = sizeMap[size]

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-flex">
        {/* Pulsing ring */}
        <span className={`absolute inline-flex rounded-full ${s.ring} ${c.ring} opacity-75 animate-ping`} />
        {/* Solid dot */}
        <span className={`relative inline-flex rounded-full ${s.dot} ${c.dot}`} />
      </span>
      {label && (
        <span className="text-xs font-medium text-gray-600">{label}</span>
      )}
    </span>
  )
}
