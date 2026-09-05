'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { X, Image as ImageIcon } from 'lucide-react'
import { formatVND } from '@/lib/mock-data-p4'

export interface PayrollPaymentBankAccount {
  bankCode?: string
  bankName: string
  accountNumber: string
  accountName: string
}

interface PayrollPaymentModalProps {
  modalTargetEmp: Record<string, unknown>
  periodLabel: string
  bankAccount?: PayrollPaymentBankAccount | null
  payAmount: number
  setPayAmount: (amount: number) => void
  payMethod: string
  setPayMethod: (method: string) => void
  payNote: string
  setPayNote: (note: string) => void
  paymentProofUrl: string | null
  setPaymentProofUrl: (proofUrl: string | null) => void
  onClose: () => void
  onConfirmPay: () => void | Promise<void>
}

export function PayrollPaymentModal({
  modalTargetEmp,
  periodLabel,
  bankAccount,
  payAmount,
  setPayAmount,
  payMethod,
  setPayMethod,
  payNote,
  setPayNote,
  paymentProofUrl,
  setPaymentProofUrl,
  onClose,
  onConfirmPay,
}: PayrollPaymentModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const amount = Number.isFinite(payAmount) ? payAmount : 0
  const hasBankDetails = Boolean(bankAccount?.bankName && bankAccount.accountNumber && bankAccount.accountName)
  const canConfirm = amount > 0 && (payMethod !== 'Ngân hàng' || hasBankDetails)

  const handleProofFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setPaymentProofUrl(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleConfirm = async () => {
    if (!canConfirm || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onConfirmPay()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            Thanh toán lương
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-primary-50 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[82vh] overflow-y-auto text-xs">
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-900 leading-relaxed">
              Số tiền cần thanh toán cho <strong>{String(modalTargetEmp.name || 'Nhân viên')}</strong> kỳ lương{' '}
              <strong>{periodLabel}</strong> là{' '}
              <strong className="text-sky-700 font-extrabold">{formatVND(amount)}</strong>
              <div className="text-[11px] text-sky-600 mt-1">
                Hệ thống sẽ chỉ gửi thông báo tới những nhân viên có quyền xem lương cá nhân
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Số tiền thanh toán kỳ này <span className="text-rose-500">*</span>
              </label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-sky-500">
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="flex-1 p-2.5 text-gray-900 font-bold text-sm focus:outline-none"
                />
                <span className="bg-vanilla-50 text-gray-500 px-3 py-2.5 border-l border-gray-200 font-semibold flex items-center">
                  VNĐ
                </span>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Phương thức thanh toán <span className="text-rose-500">*</span>
              </label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-medium focus:border-sky-500 focus:outline-none cursor-pointer"
              >
                <option value="Ngân hàng">Ngân hàng</option>
                <option value="Tiền mặt">Tiền mặt</option>
                <option value="Ví điện tử">Ví MoMo / ZaloPay</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Ghi chú chuyển khoản
              </label>
              <textarea
                rows={3}
                value={payNote}
                onChange={e => setPayNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 font-medium focus:border-sky-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Ảnh chứng từ thanh toán</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProofFileChange} className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-sky-400 flex flex-col items-center justify-center text-gray-400 hover:text-sky-600 transition-all cursor-pointer bg-vanilla-50/50"
              >
                <ImageIcon size={20} />
                <span className="text-[10px] mt-1">{paymentProofUrl ? 'Đã đính kèm' : 'Chọn ảnh'}</span>
              </div>
              {paymentProofUrl && (
                <button
                  type="button"
                  onClick={() => setPaymentProofUrl(null)}
                  className="mt-1 text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Xóa ảnh chứng từ
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span className="text-rose-600 font-black text-xl tracking-tighter">Viet</span>
              <span className="bg-sky-700 text-white font-extrabold px-2 py-0.5 rounded text-xs">QR</span>
            </div>

            {bankAccount?.bankCode && hasBankDetails ? (
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md my-2">
                <Image
                  unoptimized
                  src={`https://img.vietqr.io/image/${bankAccount.bankCode}-${bankAccount.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(payNote)}&accountName=${encodeURIComponent(bankAccount.accountName)}`}
                  alt="VietQR Payment Code"
                  width={208}
                  height={208}
                  className="w-52 h-52 object-contain"
                />
              </div>
            ) : (
              <div className="my-2 w-full max-w-xs rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                {hasBankDetails
                  ? 'Đã có thông tin tài khoản nhưng chưa có mã ngân hàng VietQR. Có thể chuyển khoản thủ công hoặc bổ sung mã VietQR.'
                  : 'Chưa có tài khoản ngân hàng nhận lương trong hồ sơ nhân viên. Hãy chọn Tiền mặt hoặc cập nhật thông tin tài khoản trước khi thanh toán qua ngân hàng.'}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-3 text-[11px] font-bold text-slate-700">
              <span className="text-sky-600 font-extrabold tracking-tight">napas 247</span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600 font-black tracking-tight">{bankAccount?.bankName || 'Chưa cấu hình ngân hàng'}</span>
            </div>

            <div className="mt-3 text-xs font-mono space-y-0.5">
              <div className="font-extrabold text-slate-900 uppercase tracking-wide">{bankAccount?.accountName || String(modalTargetEmp.name || 'Nhân viên')}</div>
              <div className="text-slate-500 font-bold">{bankAccount?.accountNumber || 'Chưa cấu hình số tài khoản'}</div>
              <div className="text-sky-700 font-extrabold text-sm pt-1">
                Số tiền: {formatVND(amount)}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-vanilla-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="btn bg-slate-500 hover:bg-slate-600 text-white text-xs py-2 px-5 rounded-xl border-0 font-semibold cursor-pointer"
          >
            Bỏ qua
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className="btn bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs py-2.5 px-6 rounded-xl border-0 font-bold cursor-pointer shadow-sm"
          >
            {isSubmitting ? 'Đang lưu...' : 'Xác nhận đã thanh toán'}
          </button>
        </div>
      </div>
    </div>
  )
}
