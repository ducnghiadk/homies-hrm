'use client';

import React from 'react';

interface ProgressRingProps {
  value: number;         // 0-100
  size?: number;         // px
  strokeWidth?: number;  // px
  color?: string;
  bgColor?: string;
  label?: string;
  showValue?: boolean;
  icon?: string;
  className?: string;
}

export default function ProgressRing({
  value, size = 80, strokeWidth = 6,
  color = 'var(--color-primary, #2196F3)',
  bgColor = 'var(--color-border, #e0e0e0)',
  label, showValue = true, icon, className = '',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={`progress-ring-wrapper ${className}`} style={{ width: size, height: size, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {icon && <span style={{ fontSize: size * 0.2 }}>{icon}</span>}
        {showValue && <span style={{ fontSize: size * 0.2, fontWeight: 700, color: 'var(--color-text, #222)' }}>{Math.round(value)}%</span>}
        {label && <span style={{ fontSize: Math.max(9, size * 0.12), color: 'var(--color-text-secondary, #888)', maxWidth: size * 0.7, textAlign: 'center', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
      </div>
    </div>
  );
}
