'use client';

import Image from 'next/image'
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
  // Lấy chữ cái đầu của từ cuối cùng trong tên để làm avatar chữ
  const nameParts = user.name.trim().split(' ');
  const lastName = nameParts[nameParts.length - 1];
  const initialLetter = lastName ? lastName.charAt(0).toUpperCase() : 'H';

  return (
    <div className={`relative overflow-hidden rounded-2xl md:rounded-[24px] bg-gradient-to-r ${gradient || 'from-[#2F6FA8] to-[#001D3D]'} shadow-[0_4px_20px_rgba(0,29,61,0.15)]`}>
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl" />

      <div className="relative px-5 py-6 md:px-7 md:py-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
                {user.avatar ? (
                  <Image src={user.avatar} className="h-full w-full object-cover" alt={user.name} width={56} height={56} />
                ) : (
                  <span className="text-xl font-bold text-white font-['Poppins']">{initialLetter}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold leading-snug">{getGreetingText()}, {lastName}!</h1>
              <p className="text-white/80 text-sm flex items-center gap-2 mt-0.5">
                <span>{getRoleIcon(user.role)}</span>
                <span className="font-medium">
                  {user.role === 'ceo' 
                    ? 'CEO' 
                    : user.role === 'store_manager' 
                    ? 'Quản lý cửa hàng' 
                    : user.role === 'area_manager'
                    ? 'Quản lý khu vực'
                    : user.role === 'hr_admin'
                    ? 'HR Admin'
                    : user.role === 'shift_leader'
                    ? 'Tổ trưởng ca'
                    : 'Nhân viên'}
                </span>
                {user.subtitle && (
                  <><span className="w-1.5 h-1.5 bg-white/40 rounded-full" /><span>{user.subtitle}</span></>
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
