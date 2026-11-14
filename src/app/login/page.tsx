'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, syncAuthCookie } from '@/store/auth-store'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle, PhoneCall } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, logout, user, isLoading, hasHydrated, rememberMe, setRememberMe } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [error, setError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // ─── BƯỚC 1: Fallback auth store nhanh (tối đa 200ms) không làm nghẽn giao diện ─────
  useEffect(() => {
    // Fallback: nếu Zustand persist chưa kịp rehydrate sau 200ms → ép true để mở khóa
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().hasHydrated) {
        useAuthStore.setState({ hasHydrated: true })
      }
    }, 200)
    return () => clearTimeout(timer)
  }, []) // ← [] Chạy 1 lần khi component mount

  // ─── BƯỚC 2: Nếu đã đăng nhập → redirect ─────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const searchParams = new URLSearchParams(window.location.search)
    const denied = searchParams.get('denied')

    // Nếu máy chủ từ chối phiên / quyền truy cập: hủy phiên cũ và hiển thị thông báo
    if (denied) {
      logout()
      if (denied === 'signature_invalid') {
        setError('Phiên làm việc hoặc chữ ký vai trò không hợp lệ. Vui lòng đăng nhập lại.')
      } else {
        setError('Bạn chưa có quyền truy cập trang này. Vui lòng đăng nhập bằng tài khoản quản lý.')
      }
      return
    }

    if (hasHydrated && !isLoading && user) {
      // Đảm bảo đồng bộ đầy đủ cookie xác thực trước khi chuyển hướng
      syncAuthCookie(user)
      const redirectParam = searchParams.get('redirect')
      const target =
        redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
          ? redirectParam
          : '/'
      window.location.replace(target)
    }
  }, [hasHydrated, isLoading, user, logout])

  // ─── HANDLER ĐĂNG NHẬP ───────────────────────────────────────────────────
  const handleLogin = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (isLoading) return

    setError('')

    // Đọc thẳng từ ref để không bị phụ thuộc controlled-state khi autofill
    const finalEmail = (emailRef.current?.value ?? email).trim()
    const finalPassword = (passwordRef.current?.value ?? password).trim()

    if (!finalEmail) { setError('Vui lòng nhập Email hoặc Số điện thoại'); return }
    if (!finalPassword) { setError('Vui lòng nhập mật khẩu'); return }

    try {
      const result = await login(finalEmail, finalPassword)
      if (result.success) {
        const searchParams = new URLSearchParams(window.location.search)
        const redirectParam = searchParams.get('redirect')
        const target =
          redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
            ? redirectParam
            : '/'
        window.location.replace(target)
      } else {
        setError(result.error || 'Đăng nhập thất bại')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
      useAuthStore.setState({ isLoading: false })
    }
  }


  // ─── ĐÃ ĐĂNG NHẬP: hiển thị trạng thái redirect ─────────────────────────
  if (hasHydrated && !isLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
           style={{ background: 'linear-gradient(160deg, #F5FDF4 0%, #E1EBF6 50%, #F1F6E7 100%)' }}>
        <div className="flex flex-col items-center gap-3 rounded-[20px] bg-white px-6 py-5 text-sm font-semibold text-gray-700 shadow-lg border border-gray-100 max-w-sm text-center">
          <div className="flex items-center gap-2 text-gray-800">
            <Loader2 size={18} className="animate-spin text-primary-500" />
            <span>Đang chuyển đến màn hình chính...</span>
          </div>
          <p className="text-xs text-gray-400 font-normal">Đang đăng nhập với: <span className="font-semibold text-gray-600">{user.full_name}</span></p>
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 w-full justify-center">
            <button
              type="button"
              onClick={() => {
                syncAuthCookie(user)
                const searchParams = new URLSearchParams(window.location.search)
                const redirectParam = searchParams.get('redirect')
                const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/'
                window.location.replace(target)
              }}
              className="text-xs text-primary-600 hover:text-primary-700 underline font-medium cursor-pointer"
            >
              Vào ngay
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs text-red-500 hover:text-red-600 underline font-medium cursor-pointer"
            >
              Đổi tài khoản khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── FORM ĐĂNG NHẬP ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
         style={{ background: 'linear-gradient(160deg, #F5FDF4 0%, #E1EBF6 50%, #F1F6E7 100%)' }}>

      {/* Decorative Elements */}
      <div className="absolute top-[-60px] right-[-40px] w-[200px] h-[200px] rounded-full opacity-30"
           style={{ background: 'radial-gradient(circle, #C8D69B 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-40px] left-[-30px] w-[180px] h-[180px] rounded-full opacity-20"
           style={{ background: 'radial-gradient(circle, #B8D0EA 0%, transparent 70%)' }} />

      <div className="w-full max-w-[400px] z-10" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>

        {/* ===== LOGO ===== */}
        <div className="text-center mb-10 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Homies Milk Tea Logo"
            width={160}
            height={80}
            className="h-20 w-auto object-contain mb-4"
            priority
          />
          <h1 className="text-[26px] font-black tracking-tight mb-1"
              style={{ color: '#343B1B', fontFamily: 'Poppins, system-ui, sans-serif' }}>
            HOMIES MILK TEA
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-700 bg-primary-50 px-3 py-0.5 rounded-full border border-primary-100/30">
            Quản trị nhân sự thông minh
          </p>
        </div>

        {/* ===== FORM CARD ===== */}
        <div className="bg-white rounded-[24px] p-7 shadow-xl border border-gray-100"
             style={{ boxShadow: '0 20px 50px rgba(52, 59, 27, 0.08)' }}>

          <h2 className="text-[22px] font-bold mb-6"
              style={{ color: '#343B1B', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Đăng nhập
          </h2>

          {/* onSubmit bắt Enter key; onClick bắt click chuột */}
          <form onSubmit={handleLogin} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold mb-2 uppercase tracking-wide text-gray-600">
                Email hoặc Số điện thoại
              </label>
              <div className="relative group">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: email ? '#3971B8' : '#BDBDBD' }} />
                <input
                  ref={emailRef}
                  id="login-email"
                  data-testid="login-email"
                  type="text"
                  placeholder="Email thật (Gmail) hoặc Số điện thoại"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  className="w-full pl-12 pr-4 py-[14px] rounded-[14px] border outline-none transition-all text-[15px]"
                  style={{
                    borderColor: error && !email ? '#E57373' : '#EEEEEE',
                    backgroundColor: '#FAFAFA',
                    color: '#343B1B',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3971B8'
                    e.target.style.backgroundColor = '#FFFFFF'
                    e.target.style.boxShadow = '0 0 0 4px rgba(57,113,184,0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EEEEEE'
                    e.target.style.backgroundColor = '#FAFAFA'
                    e.target.style.boxShadow = 'none'
                  }}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold mb-2 uppercase tracking-wide text-gray-600">
                Mật khẩu
              </label>
              <div className="relative group">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: password ? '#3971B8' : '#BDBDBD' }} />
                <input
                  ref={passwordRef}
                  id="login-password"
                  data-testid="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="w-full pl-12 pr-12 py-[14px] rounded-[14px] border outline-none transition-all text-[15px]"
                  style={{
                    borderColor: error && !password ? '#E57373' : '#EEEEEE',
                    backgroundColor: '#FAFAFA',
                    color: '#343B1B',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3971B8'
                    e.target.style.backgroundColor = '#FFFFFF'
                    e.target.style.boxShadow = '0 0 0 4px rgba(57,113,184,0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EEEEEE'
                    e.target.style.backgroundColor = '#FAFAFA'
                    e.target.style.boxShadow = 'none'
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors text-gray-400"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#3971B8' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#BDBDBD' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                    suppressHydrationWarning
                  />
                  <div className="w-5 h-5 rounded-[6px] border-2 transition-all peer-checked:border-transparent peer-checked:bg-primary-600"
                       style={{ borderColor: rememberMe ? '#3971B8' : '#E0E0E0', backgroundColor: rememberMe ? '#3971B8' : 'transparent' }}
                       suppressHydrationWarning>
                    {rememberMe && (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[14px] font-medium" style={{ color: '#616161' }}>
                  Ghi nhớ đăng nhập
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[14px] font-semibold transition-colors cursor-pointer"
                style={{ color: '#3971B8' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#2A5A8F' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#3971B8' }}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-[14px] text-[14px] font-medium"
                   style={{ backgroundColor: '#FFEBEE', color: '#E57373', animation: 'fadeIn 0.3s ease-out' }}>
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              id="login-submit-btn"
              data-testid="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-[15px] rounded-[16px] text-white text-[16px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 cursor-pointer"
              style={{
                background: isLoading
                  ? '#6B9AD0'
                  : 'linear-gradient(135deg, #3971B8 0%, #2A5A8F 100%)',
                boxShadow: isLoading ? 'none' : '0 4px 14px rgba(57, 113, 184, 0.35)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-8 text-gray-400">
          © 2026 Homies Milk Tea. Quản trị nhân sự chuỗi F&B
        </p>

      </div>
      {/* Modal Popup: Quên mật khẩu */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center mx-auto">
              <PhoneCall size={24} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#001D3D]">Cấp Lại Mật Khẩu</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Vui lòng liên hệ Quản lý cơ sở hoặc Hotline <strong className="text-[#2F6FA8] font-mono font-bold">0919.246.273</strong> để được cấp lại mật khẩu trong 1 phút.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="tel:0919246273"
                className="w-full py-2.5 rounded-xl bg-[#2F6FA8] text-white text-xs font-bold hover:bg-[#1D3E61] transition flex items-center justify-center gap-2 shadow-xs"
              >
                <PhoneCall size={14} />
                <span>Gọi Hotline: 0919.246.273</span>
              </a>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
