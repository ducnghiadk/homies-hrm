'use client';

import React from 'react';

interface ConditionChipProps {
  label: string;
  met: boolean;
  progress?: number;  // 0-100
  compact?: boolean;
  className?: string;
}

export default function ConditionChip({ label, met, progress, compact = false, className = '' }: ConditionChipProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: compact ? '3px 8px' : '5px 12px',
    borderRadius: 20,
    fontSize: compact ? 11 : 12,
    fontWeight: 500,
    background: met ? 'var(--color-success-light, #e8f5e9)' : 'var(--color-bg-secondary, #f5f5f5)',
    color: met ? 'var(--color-success, #4caf50)' : 'var(--color-text-secondary, #888)',
    border: `1px solid ${met ? 'var(--color-success, #4caf50)' : 'var(--color-border, #e0e0e0)'}`,
    transition: 'all 0.2s',
  };

  return (
    <span className={`condition-chip ${className}`} style={baseStyle}>
      <span>{met ? '✅' : '⬜'}</span>
      <span>{label}</span>
      {progress !== undefined && !met && (
        <span style={{ fontSize: 10, opacity: 0.8 }}>({Math.round(progress)}%)</span>
      )}
    </span>
  );
}
