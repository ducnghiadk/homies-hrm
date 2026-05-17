'use client';

import { ReactNode } from 'react';

interface Props {
  user: { name: string; avatar?: string; role: string; subtitle?: string };
  gradient?: string;
  rightContent?: ReactNode;
}

function getGreetingText(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function getRoleIcon(role: string): string {
  if (['admin', 'ceo', 'hr_admin'].includes(role)) return '👑';
  if (['manager', 'store_manager', 'area_manager'].includes(role)) return '👔';
  return '☕';
}

export function GradientHeader({ user, gradient, rightContent }: Props) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${gradient || 'from-purple-600 via-purple-500 to-indigo-600'}`}>
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl" />

      <div className="relative px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
                <span className="text-2xl">{getRoleIcon(user.role)}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">{getGreetingText()}, {user.name.split(' ').pop()}!</h1>
              <p className="text-white/80 text-sm flex items-center gap-2">
                <span>{getRoleIcon(user.role)}</span>
                <span>{user.role === 'ceo' ? 'CEO' : user.role === 'store_manager' ? 'Quản lý' : user.role === 'employee' ? 'Nhân viên' : user.role}</span>
                {user.subtitle && (
                  <><span className="w-1 h-1 bg-white/50 rounded-full" /><span>{user.subtitle}</span></>
                )}
              </p>
            </div>
          </div>
          {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
        </div>
      </div>
    </div>
  );
}
