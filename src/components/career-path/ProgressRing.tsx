'use client';

import React from 'react';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number; // px
  strokeWidth?: number; // px
  color?: string;
  bgColor?: string;
  label?: string;
  showValue?: boolean;
  icon?: React.ReactNode;
  className?: string;
  textColor?: string;
}

export default function ProgressRing({
  value,
  size = 72,
  strokeWidth = 6,
  color = '#2F6FA8',
  bgColor = 'rgba(0, 29, 61, 0.08)',
  label,
  showValue = true,
  icon,
  className = '',
  textColor,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {icon && <div className="mb-0.5">{icon}</div>}
        {showValue && (
          <span
            className={`font-mono font-bold tabular-nums leading-none tracking-tight ${
              textColor || 'text-[#001D3D]'
            }`}
            style={{ fontSize: Math.max(11, size * 0.22) }}
          >
            {Math.round(clampedValue)}%
          </span>
        )}
        {label && (
          <span
            className="text-[10px] text-gray-500 font-medium truncate max-w-[80%] text-center mt-0.5"
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
