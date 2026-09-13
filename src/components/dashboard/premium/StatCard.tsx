'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  value: string | number;
  label: string;
  icon?: ReactNode;
  trend?: { direction: 'up' | 'down' | 'neutral'; value: string };
  href?: string;
  highlight?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatCard({ value, label, icon, trend, href, highlight = false, size = 'md' }: Props) {
  const sz = { sm: { v: 'text-xl', l: 'text-xs' }, md: { v: 'text-2xl', l: 'text-sm' }, lg: { v: 'text-3xl', l: 'text-base' } };
  const tColors: Record<string, string> = { up: 'text-emerald-600 bg-emerald-50', down: 'text-error-600 bg-error-50', neutral: 'text-gray-600 bg-vanilla-50' };
  const tIcons: Record<string, string> = { up: '↑', down: '↓', neutral: '→' };

  const content = (
    <div className={`rounded-2xl p-4 transition-all duration-300 ${highlight ? 'bg-gradient-to-br from-primary-700 to-primary-500 text-white shadow-lg shadow-primary-600/30' : 'bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md'}`}>
      <div className="flex items-start justify-between mb-2">
        {icon && <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${highlight ? 'bg-white/20' : 'bg-primary-50'}`}>{icon}</div>}
        {trend && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${highlight ? 'bg-white/20 text-white' : tColors[trend.direction]}`}>
            <span>{tIcons[trend.direction]}</span><span>{trend.value}</span>
          </div>
        )}
      </div>
      <p className={`font-bold ${sz[size].v} ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`${sz[size].l} mt-1 ${highlight ? 'text-white/80' : 'text-gray-500'}`}>{label}</p>
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}
