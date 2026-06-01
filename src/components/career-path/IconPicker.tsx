'use client';

import React, { useState } from 'react';

const ICON_LIST = [
  '☕', '💰', '🔓', '🔒', '📦', '✅', '🧹', '🤝', '🔧', '📝', '📱', '🛵',
  '🎓', '📅', '📊', '👥', '💵', '🏪', '⭐', '🎖️', '🏆', '⚡', '🎉',
  '🌱', '💎', '🔥', '👔', '🎯', '📌', '🚀', '💡', '🎪', '🧊', '🍵',
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

export default function IconPicker({ value, onChange, className = '' }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`icon-picker ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: 44, height: 44, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--color-border, #e0e0e0)', borderRadius: 10, background: 'var(--color-bg, #fff)',
          cursor: 'pointer', transition: 'border-color 0.2s',
        }}
        aria-label="Chọn icon"
      >
        {value || '📌'}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 50, left: 0, zIndex: 1000,
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
            padding: 8, borderRadius: 12, background: 'var(--color-bg, #fff)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid var(--color-border, #e0e0e0)',
            maxHeight: 200, overflowY: 'auto',
          }}>
            {ICON_LIST.map(icon => (
              <button
                key={icon} type="button"
                onClick={() => { onChange(icon); setOpen(false); }}
                style={{
                  width: 36, height: 36, fontSize: 18, border: 'none', borderRadius: 8,
                  background: value === icon ? 'var(--color-primary-light, #e3f2fd)' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
