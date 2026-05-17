'use client'

import { useState } from 'react'
import { Zap, CalendarDays, Calculator, Settings, Clock, Target } from 'lucide-react'

interface WelcomeScreenProps {
  onSelectTab: (tab: string) => void
  onDismiss: (dontShowAgain: boolean) => void
}

const CARDS = [
  {
    key: 'quick',
    icon: Zap,
    lucideIcon: Zap,
    title: 'TÍNH NHANH',
    description: 'Xem quán cần bao nhiêu nhân viên',
    time: 'Chỉ 2 phút',
    audience: 'Dành cho: Quán mới, muốn ước tính nhanh',
    color: 'from-amber-500 to-orange-500',
    bgHover: 'hover:border-amber-300 hover:bg-amber-50/50',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    key: 'schedule',
    icon: CalendarDays,
    lucideIcon: CalendarDays,
    title: 'XẾP LỊCH TUẦN',
    description: 'Tạo lịch làm việc cho tuần tới',
    time: 'Khoảng 5 phút',
    audience: 'Dành cho: Đã có nhân viên, cần lịch',
    color: 'from-blue-500 to-indigo-500',
    bgHover: 'hover:border-blue-300 hover:bg-blue-50/50',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    key: 'optimize',
    icon: Calculator,
    lucideIcon: Calculator,
    title: 'PHÂN TÍCH CHI TIẾT',
    description: 'So sánh các phương án tối ưu chi phí',
    time: 'Khoảng 10 phút',
    audience: 'Dành cho: Muốn so sánh & tối ưu',
    color: 'from-emerald-500 to-teal-500',
    bgHover: 'hover:border-emerald-300 hover:bg-emerald-50/50',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    key: 'staffing',
    icon: Settings,
    lucideIcon: Settings,
    title: 'CÀI ĐẶT TRƯỚC',
    description: 'Thiết lập định biên, mức lương, giờ cao điểm...',
    time: '',
    audience: 'Dành cho: Setup ban đầu',
    color: 'from-gray-500 to-gray-600',
    bgHover: 'hover:border-gray-300 hover:bg-gray-50/50',
    iconBg: 'bg-gray-100 text-gray-600',
  },
]

export default function WelcomeScreen({ onSelectTab, onDismiss }: WelcomeScreenProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleSelect = (tabKey: string) => {
    onDismiss(dontShowAgain)
    onSelectTab(tabKey)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-in fade-in duration-500">
      <div className="max-w-3xl w-full px-4">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
            <Target size={32} className="text-primary-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Chào mừng đến với Quản lý nhân sự!
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base max-w-md mx-auto">
            Hệ thống sẽ giúp bạn tính toán và xếp lịch làm việc một cách thông minh nhất
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm font-medium text-gray-400">Bạn muốn bắt đầu với việc gì?</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Cards Grid: 2x2 desktop, 1 column mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CARDS.map((card, i) => (
            <button
              key={card.key}
              onClick={() => handleSelect(card.key)}
              className={`
                group text-left bg-white border-2 border-gray-100 rounded-2xl p-5 md:p-6
                transition-all duration-300 ${card.bgHover}
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
                hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                animate-in fade-in slide-in-from-bottom-4
              `}
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              tabIndex={0}
              role="option"
              aria-selected={false}
              aria-label={`${card.title}: ${card.description}`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-3
                group-hover:scale-110 transition-transform`}>
                <card.icon size={24} />
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-gray-900 mb-1">{card.title}</h3>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-3">{card.description}</p>

              {/* Time & Audience */}
              <div className="space-y-1">
                {card.time && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={12} />
                    {card.time}
                  </div>
                )}
                <div className="text-xs text-gray-400 italic">{card.audience}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Don't show again */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <input
            type="checkbox"
            id="welcome-dismiss"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/50"
          />
          <label htmlFor="welcome-dismiss" className="text-sm text-gray-400 select-none cursor-pointer">
            Không hiện lại màn hình này
          </label>
        </div>
      </div>
    </div>
  )
}
