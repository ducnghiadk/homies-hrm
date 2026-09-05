'use client'

import React from 'react'
import type {
  KpiProgramValidationIssue,
  KpiSetVersion,
} from '@/lib/kpi/types'
import type { KpiValidationIssue } from '@/lib/kpi/configuration-service'
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  SlidersHorizontal,
  Save,
  Send,
  Sparkles,
  Users,
  Check,
} from 'lucide-react'

export type KPIProgramReviewStepProps = {
  version: KpiSetVersion
  positionNames: string[]
  storeCount: number
  programIssues: KpiProgramValidationIssue[]
  kpiIssues: KpiValidationIssue[]
  isPublished?: boolean
  onBack(): void
  onSaveDraft(): void
  onPublish(mode: 'now' | 'scheduled'): void
  onOpenAdvanced(): void
}

const PURPOSE_LABELS: Record<string, string> = {
  promotion: 'Xét lên bậc / Thăng chức',
  monthly_bonus: 'Thưởng KPI hằng tháng',
  probation: 'Đánh giá hết thử việc',
  capability_review: 'Review năng lực định kỳ',
  training: 'Tìm nhu cầu đào tạo',
  store_operations: 'Cải thiện vận hành cửa hàng',
}

const SOURCE_LABELS: Record<string, string> = {
  operations: 'Nhật ký vận hành (POS/Chấm công)',
  shift_leader: 'Trưởng ca đánh giá',
  peer: '2 Đồng nghiệp ẩn danh (≤15%)',
  self: 'Nhân viên tự đánh giá',
  store_manager: 'Quản lý cửa hàng xác nhận',
  area_manager: 'Quản lý vùng xác nhận',
  store_360: 'Khảo sát 360 cửa hàng',
  skill_test: 'Bài thi tay nghề',
  trial_role: 'Thử vai thực tế',
}

export function KPIProgramReviewStep({
  version,
  positionNames,
  storeCount,
  programIssues,
  kpiIssues,
  isPublished = false,
  onBack,
  onSaveDraft,
  onPublish,
  onOpenAdvanced,
}: KPIProgramReviewStepProps) {
  const allIssues = [...programIssues, ...kpiIssues]
  const hasErrors = allIssues.length > 0

  const primaryLabel = version.primary_purpose ? PURPOSE_LABELS[version.primary_purpose] || version.primary_purpose : 'Chưa chọn'
  const secondaryLabels = (version.secondary_purposes || []).map((p) => PURPOSE_LABELS[p] || p)
  const enabledSourceLabels = (version.source_policy?.enabled_sources || []).map((s) => SOURCE_LABELS[s] || s)

  return (
    <div className="space-y-6">
      {/* Header Hướng Dẫn */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={13} />
            <span>Bước 5 / 5 — Hoàn tất thiết lập</span>
          </div>
          <h2 className="text-base font-bold text-[#001D3D] sm:text-lg">
            Kiểm tra tổng quan chương trình trước khi áp dụng
          </h2>
          <p className="text-xs text-gray-500">
            Xem lại 4 trụ cột chương trình, đối chiếu mô phỏng nhân viên mẫu và công bố chính sách.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdvanced}
          disabled={isPublished}
          title={isPublished ? 'Nhân bản chương trình để chỉnh sửa cấu hình' : undefined}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs transition-all hover:bg-white hover:border-[#2F6FA8] cursor-pointer"
        >
          <SlidersHorizontal size={14} className="text-[#2F6FA8]" />
          <span>Tùy Chỉnh Nâng Cao (Tiêu Chí / Trọng Số)</span>
        </button>
      </div>

      {/* DANH SÁCH LỖI NẾU CÓ (VALIDATION ISSUES) */}
      {hasErrors && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
            <AlertCircle size={16} />
            <span>Cần khắc phục các điểm sau trước khi công bố chương trình:</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-700 space-y-1 pl-1 font-medium">
            {allIssues.map((iss, i) => (
              <li key={i}>{iss.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* BỐ CỤC 4 TRỤ CỘT TỔNG KẾT */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Trụ cột 1: Mục tiêu chương trình */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">1. Mục Tiêu Chương Trình</span>
          <div className="text-sm font-bold text-[#001D3D] flex items-center gap-1.5">
            <Sparkles size={15} className="text-[#2F6FA8]" />
            <span>{primaryLabel}</span>
          </div>
          {secondaryLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {secondaryLabels.map((lbl, i) => (
                <span key={i} className="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                  + {lbl}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Trụ cột 2: Đối tượng & Phạm vi */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">2. Đối Tượng &amp; Phạm Vi</span>
          <div className="text-xs text-gray-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Chức danh áp dụng:</span>
              <strong className="text-[#001D3D]">{positionNames.join(', ') || 'Chưa gán'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phạm vi cửa hàng:</span>
              <strong className="text-[#001D3D]">{version.store_ids === 'all' ? `Toàn chuỗi (${storeCount} quán)` : `${(version.store_ids || []).length} quán đã chọn`}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ngày bắt đầu hiệu lực:</span>
              <strong className="font-mono text-[#001D3D]">{version.effective_from ? version.effective_from.slice(0, 10) : 'Ngay lập tức'}</strong>
            </div>
          </div>
        </div>

        {/* Trụ cột 3: Nguồn đánh giá */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">3. Nguồn Thu Thập Dữ Liệu</span>
          <div className="flex flex-wrap gap-1.5">
            {enabledSourceLabels.map((lbl, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-100 px-2 py-1 text-[11px] font-medium text-[#2F6FA8]">
                <Check size={11} strokeWidth={3} />
                <span>{lbl}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Trụ cột 4: Quy chuẩn xét tăng bậc */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">4. Tiêu Chuẩn Xét Tăng Bậc</span>
          {version.promotion_rule ? (
            <div className="text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Điểm tối thiểu:</span>
                <strong className="font-mono text-emerald-700 font-bold">≥ {version.promotion_rule.min_score} / 5.0</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian đạt chuẩn:</span>
                <strong className="text-[#001D3D]">
                  {version.promotion_rule.required_months} tháng {version.promotion_rule.score_mode === 'consecutive' ? 'liên tiếp' : `(trong ${version.promotion_rule.rolling_window_months || version.promotion_rule.required_months} tháng)`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Khối lượng tối thiểu:</span>
                <strong className="text-[#001D3D]">{version.promotion_rule.min_shifts} ca ({version.promotion_rule.min_hours}h/tháng)</strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Chưa cấu hình điều kiện tăng bậc.</p>
          )}
        </div>
      </div>

      {/* KHỐI MÔ PHỎNG HỒ SƠ NHÂN VIÊN MẪU */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#2F6FA8]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Mô Phỏng Trạng Thái Nhân Viên Mẫu
            </h3>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#2F6FA8] border border-blue-200">
            Ví dụ minh họa
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Nhân viên 1: Sẵn sàng */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Huỳnh Lê Kiều Linh</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                Sẵn sàng được xét
              </span>
            </div>
            <div className="text-[11px] text-gray-600 space-y-1">
              <div>Điểm 3 tháng: <strong className="font-mono text-emerald-700">4.2 - 4.5 - 4.4</strong></div>
              <div>Số ca: <strong className="font-mono">22 ca/tháng</strong> (Đạt)</div>
              <div>Vi phạm: <strong className="text-emerald-700">Không có</strong></div>
            </div>
          </div>

          {/* Nhân viên 2: Sắp đủ */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Phạm Nguyễn Đông Duy</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                Sắp đủ điều kiện (2/3)
              </span>
            </div>
            <div className="text-[11px] text-gray-600 space-y-1">
              <div>Điểm 2 tháng: <strong className="font-mono text-[#2F6FA8]">4.1 - 4.3</strong></div>
              <div>Cần thêm: <strong className="text-amber-800">1 tháng ≥4.0</strong></div>
              <div>Vi phạm: <strong className="text-emerald-700">Không có</strong></div>
            </div>
          </div>

          {/* Nhân viên 3: Bị chặn */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Nguyễn Thanh Thiện</span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-300">
                Chưa đủ điều kiện
              </span>
            </div>
            <div className="text-[11px] text-gray-600 space-y-1">
              <div>Điểm tháng gần nhất: <strong className="font-mono text-rose-600">3.2 / 5.0</strong></div>
              <div>Tình trạng: <strong className="text-rose-700">Chưa đủ điểm chuẩn</strong></div>
              <div>Lỗi vi phạm: <strong className="text-gray-600">01 lỗi đi trễ</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG BƯỚC & NÚT PHÁT HÀNH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isPublished}
          className="flex w-full sm:w-auto min-h-[40px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-xs transition-all hover:bg-gray-50 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Quay Lại: Điều Kiện Đạt</span>
        </button>

        {isPublished ? (
          <div className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-xs font-bold text-emerald-800 sm:w-auto">
            <CheckCircle2 size={14} />
            Chương trình này đang được áp dụng và chỉ có thể xem
          </div>
        ) : (
        <div className="flex w-full sm:w-auto items-center gap-2.5">
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex flex-1 sm:flex-initial min-h-[40px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-xs transition-all hover:bg-gray-50 cursor-pointer"
          >
            <Save size={14} />
            <span>Lưu Bản Nháp</span>
          </button>

          <button
            type="button"
            disabled={hasErrors}
            onClick={() => onPublish('now')}
            className="flex flex-1 sm:flex-initial min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#2F6FA8] px-6 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1D3E61] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send size={14} />
            <span>Áp Dụng &amp; Phát Hành Chương Trình</span>
          </button>
        </div>
        )}
      </div>
    </div>
  )
}
