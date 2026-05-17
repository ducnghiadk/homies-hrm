'use client';

import React from 'react';

interface ProgressBarProps {
  value: number;         // 0-100
  height?: number;       // px
  color?: string;
  bgColor?: string;
  label?: string;
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  value, height = 8,
  color = 'var(--color-primary, #2196F3)',
  bgColor = 'var(--color-border, #e0e0e0)',
  label, showValue = true, animated = true, className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={`progress-bar-wrapper ${className}`}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
          {label && <span style={{ color: 'var(--color-text-secondary, #888)' }}>{label}</span>}
          {showValue && <span style={{ fontWeight: 600, color: 'var(--color-text, #222)' }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div style={{ width: '100%', height, borderRadius: height / 2, background: bgColor, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: height / 2, background: color,
          transition: animated ? 'width 0.5s ease' : 'none',
        }} />
      </div>
    </div>
  );
}
