'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

export interface QuickAction {
  id: string;
  icon: ReactNode;
  label: string;
  href: string;
  badge?: number;
  color?: string;
}

interface Props {
  actions: QuickAction[];
}

export function QuickActions({ actions }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-['Inter']">
      {actions.map(a => (
        <Link
          key={a.id}
          href={a.href}
          className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:border-[#2F6FA8]/40 hover:shadow-md transition-all group min-h-[44px] no-underline"
        >
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-[#2F6FA8] group-hover:scale-110 transition-transform ${
                a.color || ''
              }`}
            >
              {a.icon}
            </div>
            {a.badge && a.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D9381E] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs font-mono">
                {a.badge > 9 ? '9+' : a.badge}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-700 text-center font-bold">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
