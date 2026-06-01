'use client';

import React from 'react';

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

const categoryColors = {
  basic: { main: '#8BC34A', light: '#e8f5e9', dark: '#558B2F' },
  advanced: { main: '#FF9800', light: '#fff3e0', dark: '#E65100' },
  management: { main: '#9C27B0', light: '#f3e5f5', dark: '#6A1B9A' },
};

export default function SkillHexagon({
  icon, name, status, category, size = 72,
  onClick, endorsementCount, className = '',
}: SkillHexagonProps) {
  const cat = categoryColors[category] || categoryColors.basic;
  const isLocked = status === 'locked';
  const isUnlocked = status === 'unlocked';
  const isInProgress = status === 'in_progress';

  const borderColor = isUnlocked ? cat.main : isInProgress ? cat.light : '#ddd';
  const bgColor = isUnlocked ? cat.light : isInProgress ? '#fafafa' : '#f0f0f0';
  const opacity = isLocked ? 0.5 : 1;

  return (
    <div
      className={`skill-hexagon ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s',
        opacity, width: size + 10,
      }}
    >
      {/* Hexagon shape using CSS clip-path */}
      <div style={{
        width: size, height: size, position: 'relative',
        clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
        background: borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: size - 4, height: size - 4,
          clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.35, position: 'relative',
        }}>
          {isLocked ? '🔒' : icon}
          {isInProgress && (
            <div style={{
              position: 'absolute', bottom: size * 0.12, right: size * 0.12,
              width: 8, height: 8, borderRadius: '50%', background: '#ff9800',
              border: '2px solid white',
            }} />
          )}
        </div>
      </div>
      {/* Label */}
      <span style={{
        fontSize: Math.max(9, size * 0.13), fontWeight: 500, textAlign: 'center',
        color: isLocked ? 'var(--color-text-secondary, #888)' : 'var(--color-text, #222)',
        maxWidth: size + 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}>{name}</span>
      {/* Endorsement badge */}
      {endorsementCount !== undefined && endorsementCount > 0 && isUnlocked && (
        <span style={{
          fontSize: 10, display: 'flex', alignItems: 'center', gap: 2,
          color: cat.dark, fontWeight: 600,
        }}>
          ⭐ {endorsementCount}
        </span>
      )}
      {/* Status badge */}
      {isInProgress && (
        <span style={{
          fontSize: 9, padding: '1px 6px', borderRadius: 8,
          background: '#fff3e0', color: '#e65100', fontWeight: 500,
        }}>
          Đang học
        </span>
      )}
    </div>
  );
}
