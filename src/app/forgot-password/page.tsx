'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, PhoneCall, CheckCircle2, ShieldAlert, KeyRound, Clock } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError('Vui lòng nhập Email hoặc Số điện thoại của bạn')
      return
    }

    setError('')
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FFF8E8' }}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EBF3FA] flex items-center justify-center text-[#2F6FA8] mb-3">
            <KeyRound size={28} />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Cấp Lại Mật Khẩu</h1>
          <p className="text-xs text-gray-500 mt-1">Hệ thống Quản trị Nội bộ Homies Milk Tea</p>
        </div>

        {/* Hướng dẫn nhanh Hotline 1 phút */}
        <div className="bg-[#FFF4E5] border border-amber-200/80 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <PhoneCall size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 leading-snug">
                Hỗ trợ cấp lại nhanh trong 1 phút
              </p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Nhân viên vui lòng liên hệ trực tiếp Quản lý cơ sở hoặc gọi Hotline Ban Quản trị:
              </p>
              <a
                href="tel:0919246273"
                className="inline-flex items-center gap-1.5 text-sm font-black text-[#2F6FA8] hover:underline mt-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs"
              >
                <PhoneCall size={14} />
                <span>0919.246.273</span>
                <span className="text-[11px] font-normal text-gray-400">(Hotline Admin)</span>
              </a>
            </div>
          </div>
        </div>

        {isSubmitted ? (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Yêu cầu đã được tiếp nhận!</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Yêu cầu cấp lại mật khẩu cho <b>{identifier}</b> đã được gửi đến Admin. Bạn có thể gọi Hotline <b>0919.246.273</b> để nhận mật khẩu đăng nhập ngay.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#2F6FA8] hover:bg-[#1D3E61] transition-colors shadow-xs"
            >
              Quay lại màn hình Đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-gray-700 mb-1.5">
                Email hoặc Số điện thoại của bạn
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Ví dụ: duy@bobahouse.vn hoặc 0943749525"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2F6FA8] focus:ring-1 focus:ring-[#2F6FA8] transition-all text-gray-800"
              />
              {error && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <ShieldAlert size={12} /> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#2F6FA8] hover:bg-[#1D3E61] transition-all shadow-xs cursor-pointer active:scale-[0.99]"
            >
              Gửi yêu cầu cấp lại mật khẩu
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Quay lại trang Đăng nhập</span>
              </Link>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <Clock size={12} />
          <span>Thời gian phản hồi hỗ trợ: 08:00 - 23:00 hàng ngày</span>
        </div>
      </div>
    </div>
  )
}
