'use client'

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high'
  size?: 'sm' | 'md'
}

export default function RiskBadge({ level, size = 'sm' }: RiskBadgeProps) {
  const config = {
    low: { label: 'Thấp', bg: '#dcfce7', color: '#166534', icon: '🟢' },
    medium: { label: 'Trung bình', bg: '#fef9c3', color: '#854d0e', icon: '🟡' },
    high: { label: 'Cao', bg: '#fef2f2', color: '#991b1b', icon: '🔴' },
  }
  const c = config[level]
  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'

  return (
    <span className={`inline-flex items-center gap-1 ${px} rounded-full font-bold`}
      style={{ background: c.bg, color: c.color }}>
      {c.icon} {c.label}
    </span>
  )
}
