'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, DEMO_ACCOUNTS, getDashboardPath } from '@/store/auth-store'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react'

function getSafeRedirectPath(redirect: string | null, fallbackPath: string) {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return fallbackPath
  }

  return redirect
}

export default function LoginPage() {
  const router = useRouter()
  const { login, loginAsDemo, isAuthenticated, user, isLoading, hasHydrated, rememberMe, setRememberMe } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const redirectParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('redirect')
    : null
  const redirectPath = getSafeRedirectPath(
    redirectParam,
    user ? getDashboardPath(user.role) : '/'
  )

  // Already logged in → redirect to dashboard
  useEffect(() => {
    if (hasHydrated && isAuthenticated && user) {
      router.replace(redirectPath)
    }
  }, [hasHydrated, isAuthenticated, redirectPath, router, user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Set 3-second timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutRef.current = setTimeout(() => {
        reject(new Error('timeout'))
      }, 3000)
    })

    try {
      const result = await Promise.race([
        login(email, password),
        timeoutPromise,
      ])

      // Clear timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      if (result.success) {
        // Get updated user from store
        const currentUser = useAuthStore.getState().user
        if (currentUser) {
          router.push(getSafeRedirectPath(redirectParam, getDashboardPath(currentUser.role)))
        }
      } else {
        setError(result.error || 'Đăng nhập thất bại')
      }
    } catch (err: unknown) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (err instanceof Error && err.message === 'timeout') {
        setError('Lỗi kết nối, vui lòng thử lại')
      } else {
        setError('Đã có lỗi xảy ra')
      }
      useAuthStore.setState({ isLoading: false })
    }
  }

  const handleQuickLogin = (email: string) => {
    setError('')
    loginAsDemo(email)
    const currentUser = useAuthStore.getState().user
    if (currentUser) {
      router.push(getSafeRedirectPath(redirectParam, getDashboardPath(currentUser.role)))
    }
  }

  // Don't render form if already authenticated
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
           style={{ background: 'linear-gradient(160deg, #F5FDF4 0%, #E1EBF6 50%, #F1F6E7 100%)' }}>
        <div className="flex items-center gap-3 rounded-[20px] bg-white px-5 py-4 text-sm font-semibold text-gray-600 shadow-lg border border-gray-100">
          <Loader2 size={18} className="animate-spin text-primary-500" />
          Dang tai trang dang nhap...
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
           style={{ background: 'linear-gradient(160deg, #F5FDF4 0%, #E1EBF6 50%, #F1F6E7 100%)' }}>
        <div className="flex items-center gap-3 rounded-[20px] bg-white px-5 py-4 text-sm font-semibold text-gray-600 shadow-lg border border-gray-100">
          <Loader2 size={18} className="animate-spin text-primary-500" />
          Dang chuyen den man hinh chinh...
        </div>
      </div>
    )
  }

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

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2 uppercase tracking-wide text-gray-600">
                Email
              </label>
              <div className="relative group">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: email ? '#3971B8' : '#BDBDBD' }} />
                <input
                  type="email"
                  placeholder="name@company.com"
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
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2 uppercase tracking-wide text-gray-600">
                Mật khẩu
              </label>
              <div className="relative group">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: password ? '#3971B8' : '#BDBDBD' }} />
                <input
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
                  />
                  <div className="w-5 h-5 rounded-[6px] border-2 transition-all peer-checked:border-transparent peer-checked:bg-primary-600"
                       style={{ borderColor: rememberMe ? '#3971B8' : '#E0E0E0', backgroundColor: rememberMe ? '#3971B8' : 'transparent' }}>
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

              <button type="button" className="text-[14px] font-semibold transition-colors"
                      style={{ color: '#3971B8' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#2A5A8F' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#3971B8' }}>
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
              type="submit"
              disabled={isLoading}
              className="w-full py-[15px] rounded-[16px] text-white text-[16px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
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

          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} style={{ color: '#F6C85F' }} />
              <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#3971B8' }}>
                Chọn nhanh tài khoản demo
              </h3>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account.email)}
                  className="w-full flex items-center justify-between rounded-[16px] border px-4 py-3 text-left transition-all hover:translate-y-[-1px]"
                  style={{
                    borderColor: '#E8EEF5',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-[14px] flex items-center justify-center text-lg shrink-0"
                      style={{ background: '#EEF4FB' }}
                    >
                      {account.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: '#343B1B' }}>
                        {account.name}
                      </div>
                      <div className="text-xs truncate" style={{ color: '#757575' }}>
                        {account.position} • {account.email}
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-[11px] font-bold px-3 py-1 rounded-full shrink-0"
                    style={{ background: '#E6F0FA', color: '#3971B8' }}
                  >
                    Vào nhanh
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-8 text-gray-400">
          © 2026 Homies Milk Tea. Quản trị nhân sự chuỗi F&B
        </p>


      </div>
    </div>
  )
}
