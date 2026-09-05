interface SkeletonCardProps {
  variant?: 'stat' | 'list-item' | 'card' | 'banner'
  className?: string
}

export function SkeletonCard({
  variant = 'card',
  className = '',
}: SkeletonCardProps) {
  if (variant === 'stat') {
    return (
      <div
        className={`
          flex items-center gap-3 p-3
          bg-white rounded-xl border border-gray-100
          ${className}
        `}
      >
        <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-12 skeleton rounded" />
          <div className="h-3 w-16 skeleton rounded" />
        </div>
      </div>
    )
  }

  if (variant === 'list-item') {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 ${className}`}>
        <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-3 w-24 skeleton rounded" />
        </div>
        <div className="h-4 w-4 skeleton rounded flex-shrink-0" />
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className={`
          w-full p-4 rounded-xl
          bg-vanilla-50 border border-gray-100
          flex items-center gap-3
          ${className}
        `}
      >
        <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 w-40 skeleton rounded" />
        </div>
        <div className="h-4 w-12 skeleton rounded flex-shrink-0" />
      </div>
    )
  }

  // Default: card
  return (
    <div
      className={`
        p-4 bg-white rounded-xl border border-gray-100 space-y-3
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 skeleton rounded" />
          <div className="h-3 w-1/2 skeleton rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full skeleton rounded" />
        <div className="h-3 w-5/6 skeleton rounded" />
      </div>
    </div>
  )
}

export function SkeletonList({
  count = 3,
  variant = 'list-item' as const,
  className = '',
  gap = 'gap-0',
}: {
  count?: number
  variant?: 'stat' | 'list-item' | 'card' | 'banner'
  className?: string
  gap?: string
}) {
  return (
    <div className={`${gap} ${className}`} aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  )
}
