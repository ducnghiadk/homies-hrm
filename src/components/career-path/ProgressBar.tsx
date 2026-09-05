'use client';

import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  height?: number; // px
  color?: string; // tailwind bg color or hex
  bgColor?: string;
  label?: string;
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  height = 7,
  color = 'bg-[#2F6FA8]',
  bgColor = 'bg-gray-100',
  label,
  showValue = true,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  const isHexOrRgb = color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl');
  const isBgHexOrRgb = bgColor.startsWith('#') || bgColor.startsWith('rgb') || bgColor.startsWith('hsl');

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          {label && <span className="font-medium text-gray-600">{label}</span>}
          {showValue && (
            <span className="font-mono font-bold tabular-nums text-gray-800">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full ${!isBgHexOrRgb ? bgColor : ''}`}
        style={{
          height,
          backgroundColor: isBgHexOrRgb ? bgColor : undefined,
        }}
      >
        <div
          className={`h-full rounded-full ${animated ? 'transition-all duration-500 ease-out' : ''} ${
            !isHexOrRgb ? color : ''
          }`}
          style={{
            width: `${pct}%`,
            backgroundColor: isHexOrRgb ? color : undefined,
          }}
        />
      </div>
    </div>
  );
}
