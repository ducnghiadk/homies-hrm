'use client'

import { useEffect, useState } from 'react'

interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  onComplete?: () => void
}

const sizes = { sm: 24, md: 40, lg: 64 }

export default function SuccessCheckmark({
  size = 'md',
  color = '#48C079',
  onComplete,
}: SuccessCheckmarkProps) {
  const [animate, setAnimate] = useState(false)
  const px = sizes[size]

  useEffect(() => {
    // Trigger animation on mount
    const t1 = requestAnimationFrame(() => setAnimate(true))
    const t2 = setTimeout(() => onComplete?.(), 600)
    return () => { cancelAnimationFrame(t1); clearTimeout(t2) }
  }, [onComplete])

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 52 52"
      className="block"
      aria-label="Thành công"
      role="img"
    >
      {/* Circle */}
      <circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray="151"
        strokeDashoffset={animate ? 0 : 151}
        style={{
          transition: 'stroke-dashoffset 400ms ease-out',
        }}
      />

      {/* Checkmark */}
      <path
        d="M14 27l7 7 16-16"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="48"
        strokeDashoffset={animate ? 0 : 48}
        style={{
          transition: 'stroke-dashoffset 300ms ease-out 250ms',
        }}
      />
    </svg>
  )
}
