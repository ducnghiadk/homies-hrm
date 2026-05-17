'use client';

import { ReactNode, CSSProperties } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'gradient' | 'highlight' | 'danger';
  padding?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

export function GlassCard({ children, className = '', href, onClick, variant = 'default', padding = 'md', style }: Props) {
  const base = 'rounded-2xl transition-all duration-300';
  const variants: Record<string, string> = {
    default: 'bg-white border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/10',
    gradient: 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200/50',
    highlight: 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200',
    danger: 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200',
  };
  const pads: Record<string, string> = { sm: 'p-3', md: 'p-4', lg: 'p-6' };
  const cls = `${base} ${variants[variant]} ${pads[padding]} ${className}`;

  if (href) return <Link href={href} className={`block ${cls}`} style={style}>{children}</Link>;
  if (onClick) return <button onClick={onClick} className={`w-full text-left ${cls}`} style={style}>{children}</button>;
  return <div className={cls} style={style}>{children}</div>;
}
