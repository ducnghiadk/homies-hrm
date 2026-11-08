'use client'

import React, { useEffect, useCallback, useState } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  ShieldCheck,
  AlertTriangle,
  Calculator,
  User,
  FileText,
  QrCode,
  Copy,
  Check,
} from 'lucide-react'
import type { BSCIndividualResult, BSCEmployeePersonalData } from '@/lib/bsc-types'

const BANK_BIN_BY_NAME: Record<string, string> = {
  techcombank: '970407',
  vietcombank: '970436',
  vietinbank: '970415',
  bidv: '970418',
  agribank: '970405',
  mb: '970422',
  'mb bank': '970422',
  acb: '970416',
  vpbank: '970432',
  tpbank: '970423',
  sacombank: '970403',
  hdbank: '970437',
  vib: '970441',
  shb: '970443',
  ocb: '970448',
  msb: '970426',
}

function resolveBankBin(bankName?: string): string {
  if (!bankName) return '970436'
  const cleanBankName = String(bankName || '').trim()
  if (!cleanBankName) return '970436'
  if (/^\d{6}$/.test(cleanBankName)) return cleanBankName
  const normalizedName = cleanBankName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const matchedAlias = Object.keys(BANK_BIN_BY_NAME).find(alias => normalizedName.includes(alias))
  return matchedAlias ? BANK_BIN_BY_NAME[matchedAlias] : '970436'
}

interface BSCIndividualDetailModalProps {
  isOpen: boolean
  onClose: () => void
  resultsList: BSCIndividualResult[]
  currentEmployeeId: string
  onSelectEmployee: (empId: string) => void
  empDataList?: BSCEmployeePersonalData[]
  personalErrors?: BSCEmployeePersonalData['errors']
}

export default function BSCIndividualDetailModal({
  isOpen,
  onClose,
  resultsList,
  currentEmployeeId,
  onSelectEmployee,
  empDataList = [],
  personalErrors = [],
}: BSCIndividualDetailModalProps) {
  const [copiedField, setCopiedField] = useState<'stk' | 'amount' | null>(null)

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  const currentIndex = resultsList.findIndex(r => r.employee_id === currentEmployeeId)
  const currentResult = resultsList[currentIndex] || resultsList[0]

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < resultsList.length - 1

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onSelectEmployee(resultsList[currentIndex - 1].employee_id)
    }
  }, [hasPrev, currentIndex, resultsList, onSelectEmployee])

  const handleNext = useCallback(() => {
    if (hasNext) {
      onSelectEmployee(resultsList[currentIndex + 1].employee_id)
    }
  }, [hasNext, currentIndex, resultsList, onSelectEmployee])

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrev, handleNext, onClose])

  const handleCopy = (text: string, field: 'stk' | 'amount') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
      }).catch(() => {})
    }
  }

  if (!isOpen || !currentResult) return null

  // Get active personal errors for the current employee
  const currentEmpData = empDataList.find(e => e.employee_id === currentResult.employee_id)
  const activeErrors = currentEmpData?.errors || personalErrors || []

  const isEligible = currentResult.bonus_amount > 0

  const bankName = currentEmpData?.bank_name || 'Vietcombank'
  const accountNumber = currentEmpData?.bank_account_no || ''
  const accountName = currentEmpData?.bank_account_holder || currentResult.employee_name || ''
  const bankCode = resolveBankBin(bankName)
  const empNameUpper = (currentResult.employee_name || '').toUpperCase()
  const payNote = `HOMIES THUONG BSC T${currentResult.period || ''} CHO ${empNameUpper}`
  const qrUrl = accountNumber && currentResult.bonus_amount > 0
    ? `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${currentResult.bonus_amount}&addInfo=${encodeURIComponent(payNote)}&accountName=${encodeURIComponent(accountName)}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#001D3D] text-white flex items-center justify-center font-bold">
              <User size={20} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#001D3D]">
                  {currentResult.employee_name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                  {currentResult.level_label}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  ({currentIndex + 1}/{resultsList.length})
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Bóc tách chi tiết công thức tính thưởng BSC tháng {currentResult.period}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center transition cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Main Bonus Hero Card */}
          <div
            className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden"
            style={{
              background: isEligible
                ? 'linear-gradient(135deg, #001D3D 0%, #1a4971 50%, #2F6FA8 100%)'
                : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-white/70 font-bold flex items-center gap-1.5">
                  <Award size={14} className="text-amber-300" />
                  Thưởng BSC Thực Nhận
                </span>
                <h2 className="text-3xl font-black mt-1 text-white tracking-tight font-mono tabular-nums">
                  {formatVnd(currentResult.bonus_amount)}
                </h2>
              </div>

              <div className="text-right">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 backdrop-blur-md"
                  style={{
                    background: isEligible ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                    color: isEligible ? '#86efac' : '#fca5a5',
                    border: `1px solid ${isEligible ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  }}
                >
                  {isEligible ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}
                  {isEligible ? `Chiếm ${currentResult.share_percentage}% quỹ` : 'Không đủ điều kiện'}
                </span>
              </div>
            </div>

            {!isEligible && currentResult.lock_reason && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
                <span className="font-semibold">{currentResult.lock_reason}</span>
              </div>
            )}
          </div>

          {/* ── MÃ VIETQR THANH TOÁN THƯỞNG NHANH ── */}
          {isEligible && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Mã VietQR Thanh Toán Thưởng Nhanh
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Quét bằng ứng dụng ngân hàng bất kỳ để chuyển tiền thưởng ngay
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-extrabold bg-white/10 px-2.5 py-1 rounded-lg text-sky-300">
                  <span>napas 247</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/5 p-3.5 rounded-xl border border-white/10">
                {/* QR Image */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  {qrUrl ? (
                    <div className="bg-white p-2.5 rounded-xl shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrUrl}
                        alt="VietQR Thưởng BSC"
                        width={160}
                        height={160}
                        className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 rounded-xl bg-white/10 flex items-center justify-center text-xs text-gray-400 text-center p-2">
                      Chưa có STK ngân hàng
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400 mt-1.5 text-center">
                    Tự động điền đúng STK &amp; số tiền
                  </span>
                </div>

                {/* Bank & Payment Info */}
                <div className="sm:col-span-7 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Chủ tài khoản thụ hưởng:</span>
                    <span className="font-extrabold text-white text-sm uppercase tracking-wide">
                      {accountName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                    <div>
                      <span className="text-[10px] text-gray-400 block">{bankName}</span>
                      <span className="font-mono font-bold text-white text-sm">{accountNumber || 'Chưa cập nhật'}</span>
                    </div>
                    {accountNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopy(accountNumber, 'stk')}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-sky-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedField === 'stk' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>{copiedField === 'stk' ? 'Đã sao chép' : 'Sao chép'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                    <div>
                      <span className="text-[10px] text-emerald-300 block">Số tiền thưởng BSC:</span>
                      <span className="font-mono font-extrabold text-emerald-400 text-sm">
                        {formatVnd(currentResult.bonus_amount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(currentResult.bonus_amount), 'amount')}
                      className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedField === 'amount' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedField === 'amount' ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>

                  <div className="text-[10px] text-gray-400 bg-black/20 px-3 py-1.5 rounded-lg font-mono truncate" title={payNote}>
                    <span>Nội dung: </span>
                    <span className="text-gray-300">{payNote}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4 BƯỚC TOÁN HỌC MINH BẠCH */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#001D3D] uppercase tracking-wider flex items-center gap-1.5">
              <Calculator size={15} className="text-[#2F6FA8]" />
              <span>4 Bước Tính Toán Chi Tiết (Toán Học Minh Bạch)</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Bước 1: Giờ làm việc */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#2F6FA8] flex items-center justify-center font-black text-xs">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Giờ làm việc trong kỳ (Định mức ≥110h)</div>
                    <div className="text-[11px] text-gray-500">Điều kiện cần để được tham gia chia quỹ</div>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className={`font-black text-sm ${currentResult.is_eligible_hours ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {currentResult.work_hours}h
                  </div>
                  <div className="text-[10px] font-bold text-gray-500">
                    {currentResult.is_eligible_hours ? 'Đủ điều kiện' : 'Thiếu giờ (<110h)'}
                  </div>
                </div>
              </div>

              {/* Bước 2: Cấp bậc & Hệ số chức danh */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Cấp bậc chức danh ({currentResult.level_label})</div>
                    <div className="text-[11px] text-gray-500">Hệ số nhân theo năng lực & trách nhiệm</div>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="font-black text-sm text-[#001D3D]">x{currentResult.rank_coefficient}</div>
                  <div className="text-[10px] font-semibold text-gray-500">Hệ số bậc</div>
                </div>
              </div>

              {/* Bước 3: Lỗi cá nhân & Hệ số kỷ luật */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Kỷ luật & Lỗi cá nhân ({currentResult.personal_error_count} điểm)</div>
                    <div className="text-[11px] text-gray-500">Thang 0-1đ: x1.0 | 2-3đ: x0.8 | 4-5đ: x0.5 | ≥6đ: x0.0</div>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className={`font-black text-sm ${
                    currentResult.personal_coefficient === 1 ? 'text-emerald-600' : currentResult.personal_coefficient > 0 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    x{currentResult.personal_coefficient}
                  </div>
                  <div className="text-[10px] font-semibold text-gray-500">Hệ số kỷ luật</div>
                </div>
              </div>

              {/* Bước 4: Điểm chia & Tỷ trọng quỹ */}
              <div className="p-3.5 rounded-2xl bg-primary-50/60 border border-primary-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#2F6FA8] text-white flex items-center justify-center font-black text-xs">
                    4
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Điểm chia & Tỷ lệ phân bổ quỹ</div>
                    <div className="text-[11px] text-gray-600">
                      Điểm = {currentResult.rank_coefficient} × {currentResult.personal_coefficient} = <strong className="text-[#2F6FA8] font-mono">{currentResult.personal_share_points} điểm</strong>
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="font-black text-sm text-[#2F6FA8]">{currentResult.share_percentage}%</div>
                  <div className="text-[10px] font-semibold text-gray-500">Tỷ trọng quỹ</div>
                </div>
              </div>
            </div>
          </div>

          {/* DANH SÁCH LỖI KỶ LUẬT CHI TIẾT */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-[#001D3D] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText size={15} className="text-amber-600" />
                Sự Kiện &amp; Lỗi Cá Nhân Đã Ghi Nhận ({activeErrors.length})
              </span>
              {activeErrors.length > 0 && (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Tổng phạt: -{activeErrors.reduce((sum, e) => sum + e.points, 0)} điểm lỗi
                </span>
              )}
            </div>

            {activeErrors.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 border border-emerald-100">
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Không có vi phạm nào trong kỳ xét. Nhân sự giữ trọn vẹn hệ số 1.0!</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeErrors.map(err => (
                  <div key={err.id} className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/60 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-950 text-xs flex items-center gap-2">
                          <span>{err.group_name}</span>
                          {err.sub_error_name && (
                            <span className="text-amber-800 font-medium">• {err.sub_error_name}</span>
                          )}
                        </div>
                        <p className="text-amber-900 font-medium mt-0.5">{err.example}</p>
                      </div>
                      <span className="font-mono tabular-nums text-rose-600 font-bold px-2.5 py-1 rounded-lg bg-white border border-rose-200 flex-shrink-0">
                        -{err.points} điểm
                      </span>
                    </div>

                    <div className="pt-2 border-t border-amber-200/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-800 font-medium">
                      <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                        <AlertTriangle size={13} className="text-rose-600 flex-shrink-0" />
                        <span>{err.impact}</span>
                      </div>
                      <div className="text-gray-500 text-[10px]">
                        {err.occurred_at && <span>Thời gian: {err.occurred_at}</span>}
                        {err.verifier_name && <span> • Người duyệt: {err.verifier_name}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer (Next / Prev Navigation Buttons) */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 rounded-b-3xl flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!hasPrev}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
              hasPrev
                ? 'bg-white hover:bg-gray-100 text-gray-800 border-gray-200 shadow-2xs'
                : 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={16} /> Trước
          </button>

          <div className="text-xs text-gray-500 font-semibold font-mono tabular-nums">
            {currentIndex + 1} / {resultsList.length} nhân sự
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNext}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
              hasNext
                ? 'bg-[#001D3D] hover:bg-[#0a2e5c] text-white border-[#001D3D] shadow-xs'
                : 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
            }`}
          >
            Tiếp <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
