'use client'

import { useState } from 'react'
import { CalendarDays, Calculator, Clock, Settings, Target, TrendingUp, Zap } from 'lucide-react'

interface WelcomeScreenProps {
  onSelectTab: (tab: string) => void
  onDismiss: (dontShowAgain: boolean) => void
}

const CARDS = [
  {
    key: 'quick',
    icon: Zap,
    title: 'Tinh nhanh',
    description: 'Uoc tinh nhanh quan can bao nhieu nguoi moi ca.',
    time: '2 phut',
    audience: 'Hop khi chi can so nhanh de chot buoc dau.',
    style: 'from-amber-500 to-orange-500',
  },
  {
    key: 'staffing',
    icon: Settings,
    title: 'Thiet lap van hanh',
    description: 'Chot dinh bien, gio cao diem, mua vu va nguong chi phi.',
    time: '3-5 phut',
    audience: 'Hop khi moi setup hoac muon ra soat lai quy tac.',
    style: 'from-slate-600 to-slate-700',
  },
  {
    key: 'schedule',
    icon: CalendarDays,
    title: 'Tao lich tuan',
    description: 'Di thang vao khu lich tuan de tao lich va doc canh bao.',
    time: '5 phut',
    audience: 'Hop khi da co bo quy tac va muon chot lich ngay.',
    style: 'from-primary-500 to-cyan-500',
  },
  {
    key: 'optimize',
    icon: Calculator,
    title: 'So sanh phuong an',
    description: 'Xem phuong an tiet kiem, can bang va uu tien chat luong.',
    time: '10 phut',
    audience: 'Hop khi can quyet dinh giua chi phi va do on dinh.',
    style: 'from-emerald-500 to-green-500',
  },
]

export default function WelcomeScreen({ onSelectTab, onDismiss }: WelcomeScreenProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleSelect = (tabKey: string) => {
    onDismiss(dontShowAgain)
    onSelectTab(tabKey)
  }

  return (
    <div className="flex min-h-[72vh] items-center justify-center animate-in fade-in duration-500">
      <div className="w-full max-w-5xl px-4">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-lg md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-50 text-primary-600">
                <Target size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Workspace staffing cho quan ly chi nhanh
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-500 md:text-base">
                Man hinh nay giup ban di dung thu tu: setup quy tac, hieu nhu cau nhan su, tao lich tuan
                va nhin lai chi phi. Neu dang gap, bat dau bang tinh nhanh. Neu da co so lieu, vao thang lich tuan.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Clock size={14} />
                    Luc nao nen dung
                  </div>
                  <p className="mt-2 text-sm text-gray-700">Khi can chot nguoi cho ca, soat chi phi va canh bao truoc khi xep lich.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <TrendingUp size={14} />
                    Gia tri lon nhat
                  </div>
                  <p className="mt-2 text-sm text-gray-700">Thay ro vi sao he thong de xuat nhu vay, khong chi xem ra ket qua.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <CalendarDays size={14} />
                    Buoc ket tiep
                  </div>
                  <p className="mt-2 text-sm text-gray-700">Sau khi setup xong, chuyen sang tao lich tuan va chot van hanh ngay tren cung mot man.</p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm font-medium text-gray-400">Bat dau nhanh</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="grid gap-3">
                {CARDS.map((card) => (
                  <button
                    key={card.key}
                    onClick={() => handleSelect(card.key)}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                  >
                    <div className={`bg-gradient-to-r ${card.style} p-4 text-white`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-white/15 p-3">
                            <card.icon size={22} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold">{card.title}</h3>
                            <p className="mt-1 text-sm text-white/85">{card.description}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{card.time}</span>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-sm text-gray-600">{card.audience}</p>
                      <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary-600">
                        Mo luong nay
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  id="welcome-dismiss"
                  checked={dontShowAgain}
                  onChange={(event) => setDontShowAgain(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/50"
                />
                <label htmlFor="welcome-dismiss" className="cursor-pointer select-none text-sm text-gray-400">
                  Khong hien lai man nay
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
