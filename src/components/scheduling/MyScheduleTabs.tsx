'use client';

import Link from 'next/link';

type Props = { active: 'published' | 'availability'; className?: string };

const TABS = [
  { key: 'published', href: '/my-schedule', label: 'Lịch đã chốt' },
  { key: 'availability', href: '/shifts/register', label: 'Đăng ký lịch rảnh' },
] as const;

/** Hai tab dùng chung cho nhân viên: xem lịch đã chốt và nộp lịch rảnh. */
export function MyScheduleTabs({ active, className = '' }: Props) {
  return (
    <nav aria-label="Lịch làm của tôi" className={`flex rounded-xl bg-white p-1 shadow-xs ring-1 ring-gray-200/80 ${className}`}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
              isActive ? 'bg-[#2F6FA8] text-white' : 'text-gray-600 hover:text-[#2F6FA8]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
