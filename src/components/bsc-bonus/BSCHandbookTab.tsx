'use client'

import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Target,
  AlertTriangle,
  Award,
  TrendingUp,
  ShieldCheck,
  Building2,
  Calendar,
  ArrowRight,
} from 'lucide-react'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'
import { calculateStoreBSC } from '@/lib/bsc-engine'
import type {
  BSCRevenueTarget,
  BSCCriteriaInfo,
  BSCBonusTier,
  BSCPositionMultiplier,
  BSCStoreResult,
} from '@/lib/bsc-types'

interface BSCHandbookTabProps {
  storeId: string
  period: string
  onGoToSettlement?: () => void
}

export default function BSCHandbookTab({ storeId, period, onGoToSettlement }: BSCHandbookTabProps) {
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<BSCRevenueTarget | null>(null)
  const [criteriaList, setCriteriaList] = useState<BSCCriteriaInfo[]>([])
  const [bonusTiers, setBonusTiers] = useState<BSCBonusTier[]>([])
  const [positionMultipliers, setPositionMultipliers] = useState<BSCPositionMultiplier[]>([])
  const [storeResult, setStoreResult] = useState<BSCStoreResult | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadRealConfiguration() {
      setLoading(true)
      try {
        const [
          targets,
          criteria,
          tiers,
          multipliers,
        ] = await Promise.all([
          bscAdapter.getRevenueTargets(storeId, period),
          bscAdapter.getCriteriaCatalog(),
          bscAdapter.getBonusTiers(),
          bscAdapter.getPositionMultipliers(),
        ])

        if (isMounted) {
          const foundTarget = targets.find(t => t.store_id === storeId && t.period === period) || targets[0] || null
          setTarget(foundTarget)
          setCriteriaList(criteria)
          setBonusTiers(tiers)
          setPositionMultipliers(multipliers)

          const result = calculateStoreBSC(storeId, period, targets)
          setStoreResult(result)
        }
      } catch (err) {
        console.error('[BSCHandbookTab] Lỗi nạp cấu hình hệ thống:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadRealConfiguration()
    return () => { isMounted = false }
  }, [storeId, period])

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  if (loading) {
    return (
      <div className="p-10 text-center text-xs font-bold text-gray-500 animate-pulse">
        Đang nạp thể lệ &amp; công thức tính thưởng BSC...
      </div>
    )
  }

  const profitDaily = target?.profit_threshold_daily || 6500000
  const daysInMonth = target?.days_in_month || 31
  const profitMonthly = profitDaily * daysInMonth
  const minHours = target?.min_hours_threshold || 110

  const revCriteria = criteriaList.find(c => c.key === 'revenue')
  const wasteCriteria = criteriaList.find(c => c.key === 'waste')
  const opCriteria = criteriaList.find(c => c.key === 'operation')
  const custCriteria = criteriaList.find(c => c.key === 'customer')

  const actualMonthly = target?.actual_revenue_monthly || 0
  const isUnlocked = storeResult?.revenue_target.is_unlocked ?? (actualMonthly / daysInMonth >= profitDaily)
  const storeBonusPool = storeResult?.store_bonus_pool || 0
  const baseBonusPool = storeResult?.base_bonus_pool || Math.round(actualMonthly * 0.01)

  return (
    <div className="space-y-4 animate-fade-in w-full text-gray-800 font-['Inter']">
      {/* ── HEADER TINH GỌN (LEAN TOP BAR) ── */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[#001D3D]">
                Thể Lệ &amp; Cách Tính Thưởng BSC
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 flex items-center gap-1">
                <Building2 size={12} /> {target?.store_name || storeId}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2F6FA8] border border-blue-200 flex items-center gap-1">
                <Calendar size={12} /> Kỳ: {period}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              3 chốt chặn mở quỹ • Công thức tính quỹ quán • Bảng chia thưởng nhân viên theo giờ &amp; cấp bậc
            </p>
          </div>
        </div>

        {onGoToSettlement && (
          <button
            type="button"
            onClick={onGoToSettlement}
            className="px-4 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#235887] text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs self-start sm:self-auto flex-shrink-0"
          >
            <span>Vào Form Quyết Toán Tháng</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* ── KHỐI 1: 3 CHỐT CHẶN MỞ QUỸ THƯỞNG ── */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-[#001D3D]">
              3 Chốt Chặn Mở Quỹ Thưởng (Điều Kiện Bắt Buộc)
            </h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
            Đạt đủ 3 chốt mới kích hoạt quỹ thưởng
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Chốt 1: Doanh thu */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-[#2F6FA8] transition space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[#2F6FA8]" /> Doanh Thu Hòa Vốn
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                Chốt 1
              </span>
            </div>
            <div className="text-base font-black text-emerald-700 font-mono">
              ≥ {formatVnd(profitDaily)}/ngày
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">
              Tương đương <strong>{formatVnd(profitMonthly)}/tháng</strong> ({daysInMonth} ngày).
              <span className="text-rose-600 block mt-0.5 font-medium">Dưới mốc ➔ Quỹ thưởng = 0đ.</span>
            </p>
          </div>

          {/* Chốt 2: Hao hụt NVL */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-[#2F6FA8] transition space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Target size={14} className="text-amber-600" /> Hao Hụt &amp; Trọng Số
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Chốt 2
              </span>
            </div>
            <div className="text-base font-black text-amber-700 font-mono">
              ≤ {wasteCriteria?.score_5 || 2.0}%
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">
              Doanh thu chiếm <strong>{(revCriteria?.weight || 0.4) * 100}%</strong>, Hao hụt chiếm <strong>{(wasteCriteria?.weight || 0.2) * 100}%</strong> tổng điểm BSC toàn quán.
            </p>
          </div>

          {/* Chốt 3: Vận hành & ATTP */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-[#2F6FA8] transition space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-600" /> Vận Hành &amp; Khách Hàng
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                Chốt 3
              </span>
            </div>
            <div className="text-base font-black text-[#2F6FA8] font-mono">
              ≤ {opCriteria?.score_5 || 4} lỗi điểm
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">
              Vận hành <strong>{(opCriteria?.weight || 0.25) * 100}%</strong>, Khách hàng <strong>{(custCriteria?.weight || 0.15) * 100}%</strong>.
              <span className="text-rose-600 block mt-0.5 font-medium">Lỗi dị vật/ATTP ➔ Khóa 0đ Vận Hành.</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── KHỐI 2: CÔNG THỨC QUỸ QUÁN & BẢNG 5 BẬC ĐIỂM BSC ── */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#2F6FA8] font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-bold text-[#001D3D]">
              Công Thức Tính Quỹ Thưởng Quán &amp; Bảng Quy Đổi Điểm
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#2F6FA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Quỹ Thưởng = (1% × Doanh Thu Thuần) × Hệ Số BSC
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {bonusTiers.map(tier => (
            <div
              key={tier.id}
              className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between"
            >
              <div>
                <span className="font-bold text-gray-800 text-[11px] block truncate">{tier.label}</span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {tier.min_score.toFixed(1)}đ - {tier.max_score.toFixed(1)}đ
                </span>
              </div>
              <div className="text-base font-black text-[#2F6FA8] font-mono mt-1">
                {tier.bonus_percent}% <span className="text-[10px] font-normal text-gray-500">(x{(tier.bonus_percent / 100).toFixed(1)})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KHỐI 3: CÁCH CHIA THƯỞNG CHO TỪNG NHÂN VIÊN ── */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="text-sm font-bold text-[#001D3D]">
              Công Thức Chia Tiền Nhân Viên (Theo Giờ Công &amp; Cấp Bậc)
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Điểm Chia = Giờ Làm (≥110h) × Hệ Số Vị Trí × Hệ Số Lỗi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Cột 1: Hệ số cấp bậc */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-2.5 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Award size={13} className="text-amber-600" /> Hệ Số Chức Vụ / Vị Trí
              </span>
              <span className="text-[10px] text-gray-400 font-normal">Quy chuẩn Homies</span>
            </div>
            <div className="divide-y divide-gray-100">
              {positionMultipliers.length > 0 ? (
                positionMultipliers.map(pos => (
                  <div key={pos.role_key} className="flex justify-between items-center px-3 py-2">
                    <span className="font-semibold text-gray-800">{pos.role_title}</span>
                    <span className="font-black font-mono text-[#2F6FA8] bg-blue-50 px-2 py-0.5 rounded text-xs">
                      x{pos.multiplier}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="font-semibold text-gray-800">Quản lý cửa hàng (Store Manager)</span>
                    <span className="font-black font-mono text-[#2F6FA8] bg-blue-50 px-2 py-0.5 rounded text-xs">x1.5</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="font-semibold text-gray-800">Trưởng ca (Shift Leader)</span>
                    <span className="font-black font-mono text-[#2F6FA8] bg-blue-50 px-2 py-0.5 rounded text-xs">x1.2</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="font-semibold text-gray-800">Chính thức (Full-time)</span>
                    <span className="font-black font-mono text-[#2F6FA8] bg-blue-50 px-2 py-0.5 rounded text-xs">x1.0</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="font-semibold text-gray-800">Bán thời gian (Part-time) / Thử việc</span>
                    <span className="font-black font-mono text-[#2F6FA8] bg-blue-50 px-2 py-0.5 rounded text-xs">x0.8</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cột 2: Bậc trừ lỗi kỷ luật */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-2.5 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-rose-600" /> Bậc Trừ Điểm Lỗi Kỷ Luật
              </span>
              <span className="text-[10px] text-gray-400 font-normal">Hệ số cá nhân</span>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-emerald-700 font-semibold">0 - 1 điểm lỗi (Xuất sắc)</span>
                <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">100% (x1.0)</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-gray-800">2 - 3 điểm lỗi (Nhẹ)</span>
                <span className="font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">80% (x0.8)</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-amber-800">4 - 5 điểm lỗi (Trung bình)</span>
                <span className="font-bold font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs">50% (x0.5)</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-rose-700 font-semibold">≥ 6 lỗi hoặc Lỗi nghiêm trọng</span>
                <span className="font-bold font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs">0% (Khóa)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-[11px] text-gray-500">
          <span>• <strong>Điều kiện cần:</strong> Đạt tối thiểu <strong>{minHours}h</strong> làm việc trong tháng (dưới {minHours}h không xét thưởng).</span>
          <span>• <strong>Tiền nhận:</strong> Quỹ Thưởng Quán × (% Điểm Cá Nhân ÷ Tổng Điểm Quán).</span>
        </div>
      </div>

      {/* ── KHỐI 4: TÓM TẮT THỰC TẾ & NÚT TIẾP TỤC SANG FORM NHẬP ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/80 border border-blue-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">Tình hình tháng {period} ({target?.store_name || storeId}):</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isUnlocked ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              {isUnlocked ? '● Đã Đạt Mốc Mở Quỹ' : '○ Chưa Đạt Mốc Mở Quỹ'}
            </span>
          </div>
          <div className="text-xs text-gray-600 flex items-center gap-3 flex-wrap font-mono">
            <span>Doanh thu: <strong className="text-gray-900">{formatVnd(actualMonthly)}</strong></span>
            <span>•</span>
            <span>Hệ số quán: <strong className="text-[#2F6FA8]">{storeResult?.bsc_coefficient ?? 1.0}</strong></span>
            <span>•</span>
            <span>Quỹ thưởng tạm tính: <strong className="text-emerald-700">{formatVnd(storeBonusPool || baseBonusPool)}</strong></span>
          </div>
        </div>

        {onGoToSettlement && (
          <button
            type="button"
            onClick={onGoToSettlement}
            className="px-5 py-2.5 rounded-xl bg-[#2F6FA8] hover:bg-[#235887] text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs self-start sm:self-auto flex-shrink-0"
          >
            <span>Bắt Đầu Nhập Quyết Toán Tháng</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
