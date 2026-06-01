'use client';

import React from 'react';

export interface TimelineItem {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
  color?: string;
}

interface TimelineViewProps {
  items: TimelineItem[];
  className?: string;
}

export default function TimelineView({ items, className = '' }: TimelineViewProps) {
  return (
    <div className={`timeline-view ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const dotColor = item.status === 'completed'
          ? (item.color || 'var(--color-success, #4caf50)')
          : item.status === 'current'
            ? 'var(--color-primary, #2196F3)'
            : 'var(--color-border, #e0e0e0)';

        return (
          <div key={item.id} style={{ display: 'flex', gap: 12, minHeight: 50 }}>
            {/* Timeline line + dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
              <div style={{
                width: item.status === 'current' ? 14 : 10,
                height: item.status === 'current' ? 14 : 10,
                borderRadius: '50%', background: dotColor, border: item.status === 'current' ? `3px solid ${dotColor}33` : 'none',
                boxShadow: item.status === 'current' ? `0 0 8px ${dotColor}40` : 'none',
                flexShrink: 0, transition: 'all 0.3s',
              }} />
              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: 20,
                  background: item.status === 'completed' ? 'var(--color-success, #4caf50)' : 'var(--color-border, #e0e0e0)',
                }} />
              )}
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{
                  fontSize: 13, fontWeight: item.status === 'current' ? 600 : 500,
                  color: item.status === 'upcoming' ? 'var(--color-text-secondary, #888)' : 'var(--color-text, #222)',
                }}>{item.title}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--color-text-secondary, #888)', marginTop: 2 }}>
                <span>{item.date}</span>
                {item.subtitle && <span>• {item.subtitle}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
