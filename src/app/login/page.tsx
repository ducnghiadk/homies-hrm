'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, getDashboardPath } from '@/store/auth-store'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, user, isLoading, rememberMe, setRememberMe } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Already logged in → redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getDashboardPath(user.role))
    }
  }, [isAuthenticated, user, router])

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
          router.push(getDashboardPath(currentUser.role))
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

  // Don't render form if already authenticated
  if (isAuthenticated && user) return null

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
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] mb-5 shadow-lg"
               style={{ background: 'linear-gradient(135deg, #3971B8, #2A5A8F)' }}>
            <span className="text-white text-[28px] font-bold tracking-tight"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>H</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight mb-1"
              style={{ color: '#343B1B', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            HOMIES
          </h1>
          <p className="text-[15px] font-medium" style={{ color: '#9E9E9E' }}>
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
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-8 text-gray-400">
          © 2026 HOMIES. Quản trị nhân sự chuỗi F&B
        </p>

        {/* Quick Login Hint (for demo) */}
        <div className="mt-6 p-4 rounded-[16px] border border-dashed text-center"
             style={{ borderColor: '#E4EDCF', backgroundColor: '#F8FAF3' }}>
          <p className="text-[12px] font-semibold mb-2" style={{ color: '#9AB86E' }}>🧪 Demo — Đăng nhập nhanh</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: 'CEO', email: 'tuan@bobahouse.vn' },
              { label: 'HR Admin', email: 'yen@bobahouse.vn' },
              { label: 'Store Mgr', email: 'lan@bobahouse.vn' },
              { label: 'Shift Lead', email: 'huong@bobahouse.vn' },
              { label: 'Nhân viên', email: 'binh@bobahouse.vn' },
            ].map(({ label, email: e }) => (
              <button
                key={e}
                type="button"
                onClick={() => { setEmail(e); setPassword('123456'); setError('') }}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all border"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#3971B8',
                  borderColor: '#E1EBF6',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = '#E1EBF6'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF'
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2 text-gray-400">Mật khẩu: 123456</p>
        </div>
      </div>
    </div>
  )
}
