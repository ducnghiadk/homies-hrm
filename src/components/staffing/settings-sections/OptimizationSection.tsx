'use client'

import { ArrowRight, Calculator, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'

interface OptimizationSectionProps {
  lastResult?: {
    planName: string
    fulltime: number
    parttime: number
    totalCost: number
    date: string
  }
  onStartOptimization: () => void
  onViewDetail?: () => void
}

export function OptimizationSection({
  lastResult,
  onStartOptimization,
  onViewDetail,
}: OptimizationSectionProps) {
  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
          <Calculator size={20} />
        </div>
        <div>
          <h3 className="flex items-center gap-1.5 font-bold text-gray-800">
            <Sparkles size={16} className="text-primary-600" />
            So sanh phuong an
          </h3>
          <p className="text-xs text-gray-500">
            Dung phan nay de so phuong an tiet kiem, can bang va uu tien chat luong phuc vu.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-primary-100 bg-primary-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
          <ShieldAlert size={16} />
          He thong se giup tra loi 3 cau hoi
        </div>
        <div className="mt-2 space-y-1 text-sm text-primary-700/90">
          <p>1. Neu tiet kiem hon thi mat gi?</p>
          <p>2. Neu uu tien on dinh thi tang bao nhieu chi phi?</p>
          <p>3. Phuong an nao hop de chot lich tuan nay?</p>
        </div>
      </div>

      <button
        onClick={onStartOptimization}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
      >
        <Calculator size={14} />
        Bat dau phan tich chi tiet
        <ArrowRight size={16} />
      </button>

      {lastResult ? (
        <div className="rounded-2xl border border-gray-100 bg-vanilla-50 p-4">
          <div className="text-xs text-gray-500">Lan phan tich gan nhat: {lastResult.date}</div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Phuong an da chon</span>
              <span className="font-bold text-gray-800">{lastResult.planName}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Nhan su</span>
              <span className="font-medium text-gray-800">{lastResult.fulltime} FT + {lastResult.parttime} PT</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Chi phi</span>
              <span className="font-bold text-primary">{(lastResult.totalCost / 1000000).toFixed(1)} tr/thang</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {onViewDetail ? (
              <button
                onClick={onViewDetail}
                className="flex-1 rounded-lg py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                Xem lai chi tiet
              </button>
            ) : null}
            <button
              onClick={onStartOptimization}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-primary-50"
            >
              <RefreshCw size={12} />
              Phan tich lai
            </button>
          </div>
        </div>
      ) : (
        <div className="py-2 text-center">
          <p className="text-xs text-gray-400">
            Chua co phuong an nao duoc chot. Nen mo phan tich sau khi da setup dinh bien va gio cao diem.
          </p>
        </div>
      )}
    </div>
  )
}
