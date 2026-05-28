'use client'

import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  name: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy' | 'away'
  className?: string
}

const sizeStyles = {
  sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2 h-2' },
  md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-2.5 h-2.5' },
  lg: { container: 'w-12 h-12', text: 'text-base', status: 'w-3 h-3' },
  xl: { container: 'w-16 h-16', text: 'text-xl', status: 'w-3.5 h-3.5' },
}

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-gray-400',
  busy: 'bg-error-500',
  away: 'bg-warning-500',
}

/* ── Avatar color palette — deterministic per name ── */
const AVATAR_COLORS = [
  { bg: 'bg-primary-100',    text: 'text-primary-700'    },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-violet-100',  text: 'text-violet-700'  },
  { bg: 'bg-warning-100',   text: 'text-warning-700'   },
  { bg: 'bg-rose-100',    text: 'text-rose-700'    },
  { bg: 'bg-cyan-100',    text: 'text-cyan-700'    },
  { bg: 'bg-warning-100',  text: 'text-warning-700'  },
  { bg: 'bg-pink-100',    text: 'text-pink-700'    },
] as const

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function Avatar({
  src,
  name,
  alt,
  size = 'md',
  status,
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const styles = sizeStyles[size]
  const initials = getInitials(name)
  const showImage = src && !imgError
  const color = getAvatarColor(name)

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || name}
          className={`${styles.container} rounded-full object-cover bg-gray-100 ring-2 ring-white`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`
            ${styles.container} ${styles.text}
            rounded-full
            flex items-center justify-center
            ${color.bg} ${color.text}
            font-bold ring-2 ring-white
            animate-fade-in
          `}
          aria-label={name}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${styles.status}
            ${statusColors[status]}
            rounded-full
            ring-2 ring-white
          `}
          aria-label={`Trạng thái: ${status}`}
        />
      )}
    </div>
  )
}
