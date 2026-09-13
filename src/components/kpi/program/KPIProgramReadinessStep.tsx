'use client'

import React from 'react'
import type { KpiPromotionRule } from '@/lib/kpi/types'
import {
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'

export type KPIProgramReadinessStepProps = {
  rule: KpiPromotionRule
  positionNames: { from: string; to: string }
  onChange(rule: KpiPromotionRule): void
  onUseRecommended(): void
  onBack(): void
  onContinue(): void
}

export function KPIProgramReadinessStep({
  rule,
  positionNames,
  onChange,
  onUseRecommended,
  onBack,
  onContinue,
}: KPIProgramReadinessStepProps) {
  // Câu tóm tắt điều kiện sống
  const summarySentence = React.useMemo(() => {
    const from = positionNames.from || 'Nhân viên'
    const to = positionNames.to || 'Cấp tiếp theo'
    const monthsText =
      rule.score_mode === 'consecutive'
        ? `${rule.required_months} tháng liên tiếp`
        : `${rule.required_months}/${rule.rolling_window_months || rule.required_months} tháng gần nhất`

    const testText = rule.test_min_score ? `, đạt bài kiểm tra tay nghề ≥${rule.test_min_score}%` : ''
    const trialText = rule.trial_shift_count
      ? `, hoàn thành ${rule.trial_shift_count} ca thử vai`
      : rule.trial_week_count
      ? `, hoàn thành ${rule.trial_week_count} tuần thử vai`
      : ''
    const surveyText = rule.requires_store_360 ? ', có khảo sát 360 cửa hàng đạt chuẩn' : ''

    return `${from} được đưa vào danh sách sẵn sàng xét lên ${to} khi đạt điểm đánh giá từ ${rule.min_score}/5 trong ${monthsText}, hoàn thành tối thiểu ${rule.min_shifts} ca (${rule.min_hours} giờ/tháng)${testText}${trialText}${surveyText} và không có vi phạm kỷ luật nghiêm trọng.`
  }, [rule, positionNames])

  return (
    <div className="space-y-6">
      {/* Header Hướng Dẫn */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-[#2F6FA8]/10 px-2.5 py-0.5 text-xs font-bold text-[#2F6FA8]">
          <Award size={13} />
          <span>Bước 4 / 5</span>
        </div>
        <h2 className="text-base font-bold text-[#001D3D] sm:text-lg">
          Khi nào nhân viên được xem là đủ điều kiện sẵn sàng tăng bậc?
        </h2>
        <p className="text-xs text-gray-500">
          Thiết lập các tiêu chuẩn định lượng rõ ràng để hệ thống tự động lọc danh sách nhân sự tiềm năng.
        </p>
      </div>

      {/* CÂU TÓM TẮT SỐNG (LIVE SUMMARY SENTENCE) */}
      <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/70 via-white to-amber-50/40 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2F6FA8] uppercase tracking-wider">
            <Sparkles size={15} />
            <span>Quy Chuẩn Xét Tăng Bậc Tự Động</span>
          </div>
          <button
            type="button"
            onClick={onUseRecommended}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-[#2F6FA8] shadow-2xs transition-all hover:bg-blue-50 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Dùng Mức Gợi Ý Chuẩn Homies</span>
          </button>
        </div>

        <p className="text-sm font-bold text-[#001D3D] leading-relaxed bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
          &ldquo;{summarySentence}&rdquo;
        </p>
      </div>

      {/* CÁC CONTROL CẤU HÌNH ĐƠN GIẢN */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Khối 1: Thời gian & Điểm số */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#2F6FA8]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              1. Tiêu Chuẩn Thời Gian &amp; Điểm Đánh Giá
            </h3>
          </div>

          <div className="space-y-3">
            {/* Phương thức xét */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">Phương thức tính tháng:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...rule, score_mode: 'consecutive' })}
                  className={`rounded-xl border py-2 text-xs font-bold transition-all cursor-pointer ${
                    rule.score_mode === 'consecutive'
                      ? 'border-[#2F6FA8] bg-[#2F6FA8] text-white shadow-2xs'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'
                  }`}
                >
                  Tháng liên tiếp
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...rule,
                      score_mode: 'rolling',
                      rolling_window_months: rule.rolling_window_months || rule.required_months + 1,
                    })
                  }
                  className={`rounded-xl border py-2 text-xs font-bold transition-all cursor-pointer ${
                    rule.score_mode === 'rolling'
                      ? 'border-[#2F6FA8] bg-[#2F6FA8] text-white shadow-2xs'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'
                  }`}
                >
                  Tích luỹ gần nhất
                </button>
              </div>
            </div>

            {/* Số tháng đạt chuẩn */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Số tháng cần đạt:</span>
                <span className="font-mono text-sm text-[#2F6FA8] font-bold">{rule.required_months} tháng</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={rule.required_months}
                onChange={(e) => onChange({ ...rule, required_months: Number(e.target.value) })}
                className="w-full accent-[#2F6FA8] cursor-pointer"
              />
            </div>

            {/* Nếu là Rolling -> chọn window */}
            {rule.score_mode === 'rolling' && (
              <div className="space-y-1 pt-1 border-t border-gray-100">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Khoảng thời gian xét:</span>
                  <span className="font-mono text-sm text-purple-700 font-bold">
                    Trong {rule.rolling_window_months || rule.required_months} tháng gần nhất
                  </span>
                </div>
                <input
                  type="range"
                  min={rule.required_months}
                  max={rule.required_months + 6}
                  step={1}
                  value={rule.rolling_window_months || rule.required_months}
                  onChange={(e) => onChange({ ...rule, rolling_window_months: Number(e.target.value) })}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            )}

            {/* Điểm tối thiểu */}
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Điểm đánh giá tối thiểu:</span>
                <span className="font-mono text-sm text-emerald-700 font-bold">≥ {rule.min_score} / 5.0</span>
              </div>
              <input
                type="range"
                min={3.0}
                max={4.8}
                step={0.1}
                value={rule.min_score}
                onChange={(e) => onChange({ ...rule, min_score: Number(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-gray-400">Khuyên dùng: 4.0 (Đạt loại Làm tốt trở lên).</p>
            </div>
          </div>
        </div>

        {/* Khối 2: Khối lượng công việc & Thử vai */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#2F6FA8]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              2. Khối Lượng Công Việc &amp; Thử Thách
            </h3>
          </div>

          <div className="space-y-3">
            {/* Số ca và số giờ tối thiểu */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Số ca tối thiểu / tháng:</label>
                <input
                  type="number"
                  min={1}
                  max={35}
                  value={rule.min_shifts}
                  onChange={(e) => onChange({ ...rule, min_shifts: Math.max(1, Number(e.target.value)) })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2 text-xs font-mono font-bold text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Số giờ tối thiểu / tháng:</label>
                <input
                  type="number"
                  min={10}
                  max={250}
                  value={rule.min_hours}
                  onChange={(e) => onChange({ ...rule, min_hours: Math.max(10, Number(e.target.value)) })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2 text-xs font-mono font-bold text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:bg-white"
                />
              </div>
            </div>

            {/* Bài kiểm tra tay nghề */}
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Điểm bài kiểm tra nghiệp vụ:</span>
                <span className="font-mono text-sm text-[#2F6FA8] font-bold">
                  {rule.test_min_score ? `≥ ${rule.test_min_score}%` : 'Không bắt buộc'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(rule.test_min_score)}
                  onChange={(e) => onChange({ ...rule, test_min_score: e.target.checked ? 80 : undefined })}
                  className="h-4 w-4 rounded accent-[#2F6FA8]"
                />
                <span className="text-xs text-gray-600">Yêu cầu hoàn thành bài thi tay nghề (Chuẩn 80%)</span>
              </div>
            </div>

            {/* Thử vai */}
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700">Thử vai đảm nhiệm cấp mới:</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(rule.trial_shift_count || rule.trial_week_count)}
                  onChange={(e) =>
                    onChange({
                      ...rule,
                      trial_shift_count: e.target.checked ? 4 : undefined,
                      trial_week_count: undefined,
                    })
                  }
                  className="h-4 w-4 rounded accent-[#2F6FA8]"
                />
                <span className="text-xs text-gray-600">Yêu cầu 4 ca thử vai trước khi bổ nhiệm chính thức</span>
              </div>
            </div>

            {/* Khảo sát 360 */}
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700">Khảo sát văn hóa cửa hàng:</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rule.requires_store_360}
                  onChange={(e) => onChange({ ...rule, requires_store_360: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#2F6FA8]"
                />
                <span className="text-xs text-gray-600">Yêu cầu cửa hàng không có báo động đỏ từ khảo sát 360</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI ĐIỀU KIỆN CHẶN TỰ ĐỘNG */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <AlertTriangle size={15} className="text-amber-700" />
          <span>7 Trường hợp chặn tăng bậc tự động (Blocking Incidents):</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Nhân viên có biên bản vi phạm về <strong>Gian lận tiền bạc, Không an toàn thực phẩm, Bao che sai phạm, Thất thoát tiền két, Hành vi thô lỗ với khách, Trả đũa đồng nghiệp hoặc Kỷ luật nặng</strong> sẽ tự động bị chặn xét tăng bậc trong vòng 3 - 6 tháng.
        </p>
      </div>

      {/* THANH ĐIỀU HƯỚNG BƯỚC */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[40px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-xs transition-all hover:bg-gray-50 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Quay Lại: Cách Đánh Giá</span>
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="flex min-h-[40px] items-center gap-2 rounded-xl bg-[#2F6FA8] px-6 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1D3E61] cursor-pointer"
        >
          <span>Tiếp Tục: Xem Trước &amp; Áp Dụng</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
