'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Coffee, ArrowLeft } from 'lucide-react'

export default function VerifyPage() {
  const router = useRouter()
  const { loginAsRole } = useAuthStore()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(60)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newOtp = pasted.split('')
      setOtp(newOtp)
      handleVerify(pasted)
    }
  }

  const handleVerify = (code: string) => {
    setIsVerifying(true)
    // Demo: any 6-digit code → login as employee
    setTimeout(() => {
      if (code === '111111') {
        loginAsRole('ceo')
      } else if (code === '222222') {
        loginAsRole('store_manager')
      } else {
        loginAsRole('employee')
      }
      router.push('/')
    }, 800)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--background)' }}>

      <div className="w-full max-w-sm">
        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium mb-6"
          style={{ color: 'var(--primary)' }}>
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'var(--primary-50)' }}>
            <Coffee size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Nhập mã OTP
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Mã xác thực đã gửi đến số điện thoại của bạn
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex gap-2 justify-center mb-4 animate-slide-up" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="text-center text-2xl font-bold rounded-xl transition-all"
              style={{
                width: '48px', height: '56px',
                border: digit ? '2px solid var(--primary)' : '2px solid var(--gray-200)',
                background: digit ? 'var(--primary-50)' : 'var(--surface)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm mb-4" style={{ color: 'var(--error)' }}>{error}</p>
        )}

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Đang xác thực...</span>
          </div>
        )}

        {/* Resend */}
        <div className="text-center mt-6">
          {countdown > 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Gửi lại mã sau <span className="font-bold" style={{ color: 'var(--primary)' }}>{countdown}s</span>
            </p>
          ) : (
            <button className="text-sm font-semibold" style={{ color: 'var(--primary)' }}
              onClick={() => { setCountdown(60); setOtp(['','','','','','']) }}>
              Gửi lại mã OTP
            </button>
          )}
        </div>

        {/* Demo hint */}
        <div className="mt-8 p-3 rounded-xl text-center" style={{ background: 'var(--primary-50)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--primary-700)' }}>
            💡 Demo: nhập 111111 → CEO, 222222 → Quản lý, bất kỳ → Nhân viên
          </p>
        </div>
      </div>
    </div>
  )
}
