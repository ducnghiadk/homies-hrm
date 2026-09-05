'use client';

import React from 'react';
import { Star, Lock, Clock, CheckCircle2 } from 'lucide-react';
import { CareerIcon } from '@/lib/career-path-icon-helper';

interface SkillHexagonProps {
  icon: string;
  name: string;
  status: 'locked' | 'in_progress' | 'unlocked';
  category: 'basic' | 'advanced' | 'management';
  size?: number;
  onClick?: () => void;
  endorsementCount?: number;
  className?: string;
}

const categoryTheme = {
  basic: {
    borderActive: 'border-emerald-500 bg-emerald-50/50 text-emerald-700',
    borderLocked: 'border-gray-200 bg-gray-50 text-gray-400',
    borderProgress: 'border-amber-400 bg-amber-50/40 text-amber-700',
    accent: 'bg-emerald-500',
    starColor: 'text-amber-500',
  },
  advanced: {
    borderActive: 'border-amber-500 bg-amber-50/50 text-amber-800',
    borderLocked: 'border-gray-200 bg-gray-50 text-gray-400',
    borderProgress: 'border-amber-400 bg-amber-50/40 text-amber-700',
    accent: 'bg-amber-500',
    starColor: 'text-amber-500',
  },
  management: {
    borderActive: 'border-[#2F6FA8] bg-blue-50/50 text-[#2F6FA8]',
    borderLocked: 'border-gray-200 bg-gray-50 text-gray-400',
    borderProgress: 'border-amber-400 bg-amber-50/40 text-amber-700',
    accent: 'bg-[#2F6FA8]',
    starColor: 'text-amber-500',
  },
};

export default function SkillHexagon({
  icon,
  name,
  status,
  category,
  size = 76,
  onClick,
  endorsementCount,
  className = '',
}: SkillHexagonProps) {
  const theme = categoryTheme[category] || categoryTheme.basic;
  const isLocked = status === 'locked';
  const isUnlocked = status === 'unlocked';
  const isInProgress = status === 'in_progress';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group flex flex-col items-center gap-1.5 transition-all duration-200 select-none ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      } ${className}`}
      style={{ width: size + 16 }}
    >
      {/* Hexagon shape container */}
      <div
        className={`relative flex items-center justify-center transition-all duration-200 ${
          isUnlocked
            ? 'shadow-xs group-hover:shadow-md'
            : isInProgress
            ? 'shadow-xs animate-pulse-subtle'
            : 'opacity-70 group-hover:opacity-100'
        }`}
        style={{
          width: size,
          height: size,
          clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          backgroundColor: isUnlocked
            ? category === 'management'
              ? '#2F6FA8'
              : category === 'advanced'
              ? '#D97706'
              : '#1E9E57'
            : isInProgress
            ? '#F59E0B'
            : '#E5E7EB',
        }}
      >
        {/* Hexagon inner surface */}
        <div
          className={`flex items-center justify-center relative transition-colors ${
            isUnlocked
              ? 'bg-white text-gray-900 group-hover:bg-blue-50/30'
              : isInProgress
              ? 'bg-white text-amber-900'
              : 'bg-gray-100 text-gray-400'
          }`}
          style={{
            width: size - 4,
            height: size - 4,
            clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          }}
        >
          {isLocked ? (
            <Lock size={size * 0.32} className="text-gray-400" />
          ) : (
            <CareerIcon
              icon={icon}
              size={size * 0.36}
              className={
                isUnlocked
                  ? category === 'management'
                    ? 'text-[#2F6FA8]'
                    : category === 'advanced'
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                  : 'text-amber-600'
              }
            />
          )}

          {/* In-progress pulsing dot */}
          {isInProgress && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </div>
      </div>

      {/* Label */}
      <span
        className={`text-xs font-semibold text-center tracking-tight truncate max-w-full leading-tight ${
          isLocked
            ? 'text-gray-400 group-hover:text-gray-600'
            : 'text-[#001D3D] group-hover:text-[#2F6FA8]'
        }`}
      >
        {name}
      </span>

      {/* Endorsement badge or status */}
      {endorsementCount !== undefined && endorsementCount > 0 && isUnlocked && (
        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-full shadow-2xs">
          <Star size={10} className="fill-amber-400 text-amber-400" />
          <span>{endorsementCount}</span>
        </span>
      )}

      {isInProgress && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
          Đang học
        </span>
      )}

      {isLocked && (
        <span className="text-[10px] font-medium text-gray-400">Chưa mở</span>
      )}
    </div>
  );
}
