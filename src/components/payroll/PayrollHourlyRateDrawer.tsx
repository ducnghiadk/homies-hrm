'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  DollarSign,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  Calendar,
  User,
  Store,
} from 'lucide-react'
import { formatVND } from '@/lib/mock-data-p4'

export interface HourlyRateDrawerTarget {
  employeeId: string
  employeeCode: string
  employeeName: string
  position: string
  storeName: string
  period: string
  currentHourlyRate: number
  totalHours: number
  isPartTime: boolean
}

interface PayrollHourlyRateDrawerProps {
  isOpen: boolean
  onClose: () => void
  target: HourlyRateDrawerTarget | null
  onSuccess?: (newRate: number, applyPermanently: boolean) => void
}

export default function PayrollHourlyRateDrawer({
  isOpen,
  onClose,
  target,
  onSuccess,
}: PayrollHourlyRateDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const [newRate, setNewRate] = useState<number>(20000)
  const [scope, setScope] = useState<'month_only' | 'permanent'>('permanent')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (target) {
      setNewRate(target.currentHourlyRate || 20000)
      setErrorMsg(null)
      setSuccessMsg(null)
    }
  }, [target])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen || !target) return null

  const currentEarned = Math.round((target.totalHours || 0) * (target.currentHourlyRate || 0))
  const newEarned = Math.round((target.totalHours || 0) * (newRate || 0))
  const diff = newEarned - currentEarned

  const handleSave = async () => {
    if (!newRate || newRate <= 0) {
      setErrorMsg('Vui lòng nhập đơn giá lương giờ hợp lệ')
      return
    }

    setIsSaving(true)
    setErrorMsg(null)

    try {
      if (scope === 'permanent') {
        // Lưu vĩnh viễn vào hồ sơ nhân viên qua PUT /api/employees
        const res = await fetch('/api/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: target.employeeId,
            hourly_rate: newRate,
            base_salary: target.isPartTime ? 0 : newRate,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData?.error || 'Không thể cập nhật hồ sơ nhân sự')
        }
      }

      setSuccessMsg('Đã cập nhật đơn giá lương thành công!')
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(newRate, scope === 'permanent')
        }
        onClose()
      }, 700)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật'
      setErrorMsg(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200">
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#1D3E61] to-[#2F6FA8] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
                <DollarSign size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Điều chỉnh đơn giá lương
                </h2>
                <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                  <User size={13} className="opacity-80" />
                  <span>{target.employeeName} ({target.employeeCode})</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/50">
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Thông tin nhân viên & Cơ sở */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Chức vụ</span>
                <span className="font-semibold text-gray-900">{target.position || 'Nhân viên'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Cơ sở vận hành</span>
                <span className="font-semibold text-gray-900">{target.storeName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Kỳ lương áp dụng</span>
                <span className="font-semibold text-[#2F6FA8]">{target.period}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tổng giờ công chuẩn</span>
                <span className="font-mono font-bold text-gray-900">{target.totalHours} giờ</span>
              </div>
            </div>

            {/* Nhập đơn giá mới */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs space-y-3">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                Đơn giá lương theo giờ (VNĐ/h)
              </label>

              <div className="relative">
                <input
                  type="number"
                  step={1000}
                  min={10000}
                  max={500000}
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full pl-3 pr-16 py-2.5 rounded-xl border border-gray-300 font-mono text-base font-bold text-[#1D3E61] focus:ring-2 focus:ring-[#2F6FA8] focus:border-transparent outline-none transition"
                  placeholder="20000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  VNĐ/h
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {[20000, 22000, 25000, 28000, 30000].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setNewRate(rate)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer ${
                      newRate === rate
                        ? 'bg-[#2F6FA8] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {rate.toLocaleString('vi-VN')}đ
                  </button>
                ))}
              </div>
            </div>

            {/* Phạm vi áp dụng */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Phạm vi áp dụng
              </h3>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 cursor-pointer transition">
                  <input
                    type="radio"
                    name="rate_scope"
                    value="permanent"
                    checked={scope === 'permanent'}
                    onChange={() => setScope('permanent')}
                    className="mt-0.5 text-[#2F6FA8] focus:ring-[#2F6FA8]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900 block">
                      Lưu vĩnh viễn vào hồ sơ nhân viên
                    </span>
                    <span className="text-gray-500 text-[11px] block mt-0.5">
                      Đơn giá mới sẽ trở thành mức lương chuẩn của nhân sự cho mọi kỳ lương tiếp theo.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 cursor-pointer transition">
                  <input
                    type="radio"
                    name="rate_scope"
                    value="month_only"
                    checked={scope === 'month_only'}
                    onChange={() => setScope('month_only')}
                    className="mt-0.5 text-[#2F6FA8] focus:ring-[#2F6FA8]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900 block">
                      Chỉ áp dụng kỳ {target.period}
                    </span>
                    <span className="text-gray-500 text-[11px] block mt-0.5">
                      Chỉ điều chỉnh phiếu lương tháng này, không làm thay đổi đơn giá gốc trong hồ sơ.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* REALTIME PREVIEW TÍNH TOÁN */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-4 border border-blue-200/80 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-200/60 text-[#1D3E61]">
                <Calculator size={16} />
                <h4 className="font-bold uppercase tracking-wider text-[11px]">
                  Bản xem trước tính toán (Realtime)
                </h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Lương cơ bản hiện tại:</span>
                  <span className="font-mono font-medium">{formatVND(currentEarned)}</span>
                </div>

                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>Lương cơ bản mới:</span>
                  <span className="font-mono text-[#2F6FA8] text-sm">
                    {formatVND(newEarned)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 text-[11px]">
                  <span className="text-gray-600">Chênh lệch điều chỉnh:</span>
                  <span
                    className={`font-mono font-bold ${
                      diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-700' : 'text-gray-500'
                    }`}
                  >
                    {diff > 0 ? `+${formatVND(diff)}` : diff < 0 ? `-${formatVND(Math.abs(diff))}` : '0 đ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#2F6FA8] hover:bg-[#1D3E61] shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
