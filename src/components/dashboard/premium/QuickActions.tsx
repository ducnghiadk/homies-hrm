'use client';

import Link from 'next/link';

interface QuickAction { id: string; icon: string; label: string; href: string; badge?: number; color?: string; }
interface Props { actions: QuickAction[]; }

export function QuickActions({ actions }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(a => (
        <Link key={a.id} href={a.href} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group">
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${a.color || 'from-primary-50 to-primary-100'} group-hover:scale-110 transition-transform`}>
              {a.icon}
            </div>
            {a.badge && a.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {a.badge > 9 ? '9+' : a.badge}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-600 text-center font-medium">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
