'use client'

import { useState } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'

function getSafeRedirect(): string {
  if (typeof window === 'undefined') return '/'
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  return redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
}

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 401) {
        window.location.replace(`/login?redirect=${encodeURIComponent('/account/change-password')}`)
        return
      }
      if (!res.ok || !json.success) {
        setError(json.error || 'Không đổi được mật khẩu. Vui lòng thử lại.')
        return
      }
      setIsDone(true)
      setTimeout(() => window.location.replace(getSafeRedirect()), 1200)
    } catch {
      setError('Không kết nối được máy chủ. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6FA8]/40'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FFF8E8' }}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EBF3FA] flex items-center justify-center text-[#2F6FA8] mb-3">
            <KeyRound size={28} />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Đổi Mật Khẩu</h1>
          <p className="text-xs text-gray-500 mt-1">
            Bạn đang dùng mật khẩu mặc định. Vui lòng đặt mật khẩu mới trước khi tiếp tục.
          </p>
        </div>

        {isDone ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            <ShieldCheck size={20} />
            Đã đổi mật khẩu thành công. Đang chuyển trang...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu hiện tại</label>
              <input type="password" autoComplete="current-password" className={inputClass}
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu mới</label>
              <input type="password" autoComplete="new-password" className={inputClass}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <p className="text-[11px] text-gray-500 mt-1">Ít nhất 8 ký tự, gồm cả chữ và số.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
              <input type="password" autoComplete="new-password" className={inputClass}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
            <button type="submit" disabled={isSaving}
              className="w-full rounded-xl bg-[#2F6FA8] py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {isSaving ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
