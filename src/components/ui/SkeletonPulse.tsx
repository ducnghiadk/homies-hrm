'use client'

interface SkeletonPulseProps {
  width?: string
  height?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'xl' | '2xl'
  className?: string
}

export default function SkeletonPulse({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className = '',
}: SkeletonPulseProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-${rounded} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

// Preset layouts
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonPulse width="40px" height="40px" rounded="xl" />
        <div className="flex-1 space-y-1.5">
          <SkeletonPulse width="60%" height="14px" />
          <SkeletonPulse width="40%" height="10px" />
        </div>
      </div>
      <SkeletonPulse height="60px" rounded="xl" />
      <div className="flex gap-2">
        <SkeletonPulse width="50%" height="32px" rounded="lg" />
        <SkeletonPulse width="50%" height="32px" rounded="lg" />
      </div>
    </div>
  )
}

const SKELETON_BAR_HEIGHTS = [65, 45, 80, 55, 90, 40, 70]

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <SkeletonPulse width="40%" height="16px" />
      <div className="flex items-end gap-2 h-40">
        {SKELETON_BAR_HEIGHTS.map((h, i) => (
          <SkeletonPulse
            key={i}
            width="100%"
            height={`${h}%`}
            rounded="sm"
          />
        ))}
      </div>
      <SkeletonPulse width="60%" height="10px" />
    </div>
  )
}
