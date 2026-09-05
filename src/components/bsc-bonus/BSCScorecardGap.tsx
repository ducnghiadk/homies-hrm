'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Compass,
  Award,
  TrendingUp,
  Package,
  Settings,
  Users,
  Target,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Sliders,
} from 'lucide-react'
import type { BSCStoreResult, BSCCriteriaScore } from '@/lib/bsc-types'

interface BSCScorecardGapProps {
  storeResult: BSCStoreResult
  storeName: string
}

export default function BSCScorecardGap({ storeResult, storeName }: BSCScorecardGapProps) {
  const router = useRouter()
  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  const currentScore = storeResult.total_bsc_score
  const target = storeResult.revenue_target

  // Tiers calculation
  const tiers = [
    { min: 4.5, max: 5.0, label: 'Mốc Xuất Sắc (5.0đ)', coefRate: 1.2, coefLabel: '120% Quỹ', desc: 'Thưởng 120% quỹ cơ bản' },
    { min: 4.0, max: 4.49, label: 'Mốc Đạt Chuẩn Tốt (4.0đ)', coefRate: 1.0, coefLabel: '100% Quỹ', desc: 'Thưởng 100% quỹ cơ bản' },
    { min: 3.5, max: 3.99, label: 'Mốc Đạt Yêu Cầu (3.5đ)', coefRate: 0.8, coefLabel: '80% Quỹ', desc: 'Thưởng 80% quỹ cơ bản' },
    { min: 3.0, max: 3.49, label: 'Mốc Cần Cải Thiện (3.0đ)', coefRate: 0.5, coefLabel: '50% Quỹ', desc: 'Thưởng 50% quỹ cơ bản' },
    { min: 0.0, max: 2.99, label: 'Dưới Chuẩn (<3.0đ)', coefRate: 0.0, coefLabel: '0% Quỹ', desc: 'Khóa thưởng' },
  ]

  const currentTierIndex = tiers.findIndex(t => currentScore >= t.min && currentScore <= t.max)
  const nextTier = currentTierIndex > 0 ? tiers[currentTierIndex - 1] : null
  const scoreGap = nextTier ? +(nextTier.min - currentScore).toFixed(2) : 0
  const nextEstimatedBonus = nextTier ? Math.round(storeResult.base_bonus_pool * nextTier.coefRate) : 0

  const getCriteriaIcon = (key: string) => {
    switch (key) {
      case 'revenue':
        return <TrendingUp size={18} className="text-[#2F6FA8]" />
      case 'waste':
        return <Package size={18} className="text-emerald-600" />
      case 'operation':
        return <Settings size={18} className="text-amber-600" />
      case 'customer':
        return <Users size={18} className="text-indigo-600" />
      default:
        return <Target size={18} className="text-[#2F6FA8]" />
    }
  }

  const getCriteriaSubtext = (key: string) => {
    switch (key) {
      case 'revenue':
        return 'Vượt mốc hòa vốn & đạt mục tiêu doanh thu tháng'
      case 'waste':
        return 'Kiểm soát hao hụt NVL xuất kho trong định mức (<3.0%)'
      case 'operation':
        return 'Không phát sinh sự cố nghiêm trọng, quầy kệ chuẩn 5S'
      case 'customer':
        return 'Điểm khảo sát QR và đánh giá tích cực từ khách hàng'
      default:
        return ''
    }
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-5">
      {/* ── TIÊU ĐỀ & TỔNG ĐIỂM CHUNG ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0">
            <Compass size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#001D3D] tracking-tight">
              Bảng Chấm Điểm 4 Tiêu Chí BSC — {storeName}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Đánh giá toàn diện 4 khía cạnh trọng số: Doanh thu (40%), Hao hụt (20%), Vận hành (25%), Khách hàng (15%)
            </p>
          </div>
        </div>

        {/* Cụm Action & Huy hiệu tổng điểm */}
        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => router.push('/settings/bsc?tab=criteria')}
            className="px-3 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Cài đặt 4 tiêu chí, trọng số & ngưỡng điểm"
          >
            <Sliders size={13} className="text-[#2F6FA8]" />
            <span>Cài Đặt Tiêu Chí ↗</span>
          </button>

          <div className="flex items-center gap-2 bg-emerald-50/80 px-3.5 py-1.5 min-h-[36px] rounded-xl border border-emerald-200/80 text-xs font-bold text-emerald-900">
            <Award size={16} className="text-emerald-600" />
            <span>Tổng Điểm BSC:</span>
            <strong className="text-[#001D3D] text-sm font-bold font-mono tabular-nums">{currentScore} / 5.0đ</strong>
            <span className="text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-bold font-mono">
              {storeResult.coefficient_label}
            </span>
          </div>
        </div>
      </div>

      {/* ── BẢNG MA TRẬN 4 TIÊU CHÍ TRỰC QUAN (TABLE DỄ HIỂU 100%) ── */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100">
              <th className="py-3 px-4 font-bold text-[#001D3D]">Tiêu Chí Đánh Giá</th>
              <th className="py-3 px-3 text-center">Tỷ Trọng</th>
              <th className="py-3 px-4">Kết Quả Thực Tế Tháng</th>
              <th className="py-3 px-3 text-center">Điểm Đạt (Thang 1-5)</th>
              <th className="py-3 px-4 text-right">Điểm Đóng Góp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {storeResult.criteria_scores.map((c: BSCCriteriaScore) => {
              const weightPct = Math.round(c.weight * 100)
              const isExcellent = c.converted_score >= 4
              const isFair = c.converted_score >= 3

              return (
                <tr key={c.key} className="hover:bg-gray-50/60 transition">
                  {/* Cột 1: Tên tiêu chí */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getCriteriaIcon(c.key)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <span>{c.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {getCriteriaSubtext(c.key)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Trọng số */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 font-bold text-xs font-mono tabular-nums">
                      {weightPct}%
                    </span>
                  </td>

                  {/* Cột 3: Kết quả thực tế */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#001D3D] text-xs font-mono tabular-nums">
                        {c.key === 'revenue' ? (
                          <span>{formatVnd(target.actual_revenue_monthly)}</span>
                        ) : (
                          <span>{c.raw_value_label}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {c.key === 'revenue' && (
                          <span className="text-emerald-600 font-semibold font-mono">
                            (Đạt {((target.actual_revenue_monthly / (target.target_monthly || 1)) * 100).toFixed(1)}% mục tiêu)
                          </span>
                        )}
                        {c.key === 'waste' && (
                          <span className="text-emerald-600 font-semibold">Định mức an toàn: &lt;3.0%</span>
                        )}
                        {c.key === 'operation' && (
                          <span className="text-gray-500">Mức quy đổi: 5-8đ lỗi = 4/5đ</span>
                        )}
                        {c.key === 'customer' && (
                          <span className="text-gray-500">QR khảo sát &amp; Review khách</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột 4: Điểm đạt (Thang 1-5) */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono tabular-nums ${
                        isExcellent
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isFair
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {c.converted_score} / 5 điểm
                      </span>
                      {/* Vạch nấc trực quan */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(step => (
                          <span
                            key={step}
                            className={`w-1.5 h-1.5 rounded-full ${
                              step <= c.converted_score
                                ? isExcellent ? 'bg-emerald-500' : isFair ? 'bg-amber-500' : 'bg-rose-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Cột 5: Điểm đóng góp */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-sm text-[#001D3D] tabular-nums">
                      +{c.weighted_score.toFixed(2)} đ
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      ({c.converted_score}đ × {weightPct}%)
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* ── FOOTER TỔNG KẾT BẢNG ── */}
          <tfoot>
            <tr className="bg-[#001D3D]/5 font-bold border-t-2 border-gray-200">
              <td className="py-3 px-4 text-xs text-[#001D3D]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[#2F6FA8]" />
                  <span>TỔNG KẾT ĐIỂM BSC TOÀN CỬA HÀNG</span>
                </div>
              </td>
              <td className="py-3 px-3 text-center text-xs font-mono font-bold text-gray-900">
                100%
              </td>
              <td className="py-3 px-4 text-xs text-gray-600 font-medium">
                Tất cả 4 tiêu chí đều đạt chuẩn
              </td>
              <td className="py-3 px-3 text-center">
                <span className="text-xs font-bold text-[#2F6FA8] font-mono tabular-nums">
                  Hệ số: {storeResult.coefficient_label}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="text-base font-bold text-[#2F6FA8] font-mono tabular-nums">
                  {currentScore.toFixed(2)} / 5.00 đ
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── GỢI Ý MỤC TIÊU PHẤN ĐẤU THÁNG KẾ TIẾP (DỄ HIỂU & TRUYỀN CẢM HỨNG) ── */}
      {nextTier && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-emerald-50/50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2F6FA8] text-white flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-[#001D3D]">
                Mục tiêu kỳ tiếp theo để nâng quỹ thưởng:
              </div>
              <p className="text-xs text-gray-600 font-medium mt-0.5">
                Cửa hàng chỉ cần tăng thêm <strong className="text-indigo-700 font-bold font-mono">+{scoreGap} điểm</strong> (đạt từ {nextTier.min}đ trở lên) là sẽ chạm <strong className="text-emerald-700 font-bold">{nextTier.label}</strong>!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-bold text-emerald-800 shadow-2xs font-mono tabular-nums">
            <ArrowUpRight size={14} className="text-emerald-600" />
            <span>Thưởng {nextTier.coefLabel} (~{formatVnd(nextEstimatedBonus)})</span>
          </div>
        </div>
      )}
    </div>
  )
}
