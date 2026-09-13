'use client'

import React from 'react'
import type { KpiProgramPurpose } from '@/lib/kpi/types'
import {
  TrendingUp,
  DollarSign,
  UserCheck,
  BarChart3,
  GraduationCap,
  Store,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react'

export type KPIProgramPurposeStepProps = {
  primaryPurpose?: KpiProgramPurpose
  secondaryPurposes: KpiProgramPurpose[]
  onChange(primary: KpiProgramPurpose, secondary: KpiProgramPurpose[]): void
  onQuickStart(): void
  onContinue(): void
}

type PurposeOption = {
  key: KpiProgramPurpose
  title: string
  subtitle: string
  badge?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const PURPOSE_OPTIONS: PurposeOption[] = [
  {
    key: 'promotion',
    title: 'Xét lên bậc / Thăng chức',
    subtitle: 'Đánh giá tháng và theo dõi đủ điều kiện để đưa nhân viên vào danh sách sẵn sàng tăng bậc.',
    badge: 'Phổ biến nhất',
    icon: TrendingUp,
  },
  {
    key: 'monthly_bonus',
    title: 'Thưởng KPI hằng tháng',
    subtitle: 'Đo lường hiệu suất thực tế hằng tháng làm căn cứ chia thưởng doanh số và chuyên cần.',
    icon: DollarSign,
  },
  {
    key: 'probation',
    title: 'Đánh giá hết thử việc',
    subtitle: 'Theo dõi 1-2 tháng đầu tiên để quyết định chuyển sang hợp đồng nhân viên chính thức.',
    icon: UserCheck,
  },
  {
    key: 'capability_review',
    title: 'Review năng lực định kỳ',
    subtitle: 'Đánh giá chuyên môn, thái độ và kỹ năng định kỳ 6 tháng hoặc 1 năm.',
    icon: BarChart3,
  },
  {
    key: 'training',
    title: 'Tìm nhu cầu đào tạo',
    subtitle: 'Phát hiện các kỹ năng nhân viên còn yếu để lên kế hoạch đào tạo bổ trợ phù hợp.',
    icon: GraduationCap,
  },
  {
    key: 'store_operations',
    title: 'Cải thiện vận hành cửa hàng',
    subtitle: 'Tập trung vào tốc độ ra món, vệ sinh quầy và khảo sát sức khỏe vận hành toàn cửa hàng.',
    icon: Store,
  },
]

export function KPIProgramPurposeStep({
  primaryPurpose,
  secondaryPurposes,
  onChange,
  onQuickStart,
  onContinue,
}: KPIProgramPurposeStepProps) {
  // Khi chọn Mục tiêu chính
  const handleSelectPrimary = (key: KpiProgramPurpose) => {
    const nextSecondary = secondaryPurposes.filter((p) => p !== key)
    onChange(key, nextSecondary)
  }

  // Khi toggle Mục tiêu đi kèm
  const handleToggleSecondary = (key: KpiProgramPurpose) => {
    if (key === primaryPurpose) return
    const isChecked = secondaryPurposes.includes(key)
    const nextSecondary = isChecked
      ? secondaryPurposes.filter((p) => p !== key)
      : [...secondaryPurposes, key]

    if (primaryPurpose) {
      onChange(primaryPurpose, nextSecondary)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Giới Thiệu & Quick Start */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/80 via-white to-amber-50/50 p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[#2F6FA8]/10 px-2.5 py-0.5 text-xs font-bold text-[#2F6FA8]">
            <Sparkles size={13} />
            <span>Thiết lập chuẩn ngành F&amp;B</span>
          </div>
          <h2 className="text-base font-bold text-[#001D3D] sm:text-lg">
            Bạn muốn dùng chương trình KPI này để giải quyết việc gì?
          </h2>
          <p className="text-xs text-gray-600">
            Chọn 1 mục tiêu chính và có thể chọn thêm các mục tiêu kết hợp. Homies sẽ tự chuẩn bị sẵn tiêu chí và điều kiện phù hợp.
          </p>
        </div>

        <button
          type="button"
          onClick={onQuickStart}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#001D3D] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1D3E61] cursor-pointer"
        >
          <Sparkles size={14} className="text-amber-400" />
          <span>Dùng Nhanh Bộ Chuẩn Homies</span>
        </button>
      </div>

      {/* KHỐI 1: CHỌN MỤC TIÊU CHÍNH (Radio Group) */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Bước 1.1: Chọn 1 Mục Tiêu Chính (Bắt Buộc)
        </legend>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PURPOSE_OPTIONS.map((opt) => {
            const isSelected = primaryPurpose === opt.key
            const Icon = opt.icon

            return (
              <label
                key={opt.key}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#2F6FA8] bg-white shadow-xs ring-2 ring-[#2F6FA8]/20'
                    : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-2xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                        isSelected ? 'bg-[#2F6FA8] text-white' : 'bg-blue-50 text-[#2F6FA8]'
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {opt.badge && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                          {opt.badge}
                        </span>
                      )}
                      <input
                        type="radio"
                        name="primary_purpose"
                        value={opt.key}
                        checked={isSelected}
                        onChange={() => handleSelectPrimary(opt.key)}
                        className="h-4 w-4 accent-[#2F6FA8]"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-sm font-bold ${isSelected ? 'text-[#001D3D]' : 'text-gray-900'}`}>
                      {opt.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {opt.subtitle}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#2F6FA8]">
                    <Check size={13} strokeWidth={3} />
                    <span>Mục tiêu chính đang chọn</span>
                  </div>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* KHỐI 2: CHỌN MỤC TIÊU KẾT HỢP (Secondary Checkboxes) */}
      {primaryPurpose && (
        <fieldset className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Bước 1.2: Chọn Thêm Mục Tiêu Kết Hợp (Tùy Chọn)
          </legend>
          <p className="text-xs text-gray-500">
            Hệ thống sẽ giữ tiêu chí của mục tiêu chính làm trọng tâm và bổ sung thêm các chỉ số phụ để phục vụ mục tiêu đi kèm.
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 pt-1">
            {PURPOSE_OPTIONS.filter((opt) => opt.key !== primaryPurpose).map((opt) => {
              const isChecked = secondaryPurposes.includes(opt.key)
              const Icon = opt.icon

              return (
                <label
                  key={opt.key}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                    isChecked
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSecondary(opt.key)}
                    className="mt-0.5 h-4 w-4 rounded accent-[#2F6FA8]"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} className={isChecked ? 'text-[#2F6FA8]' : 'text-gray-500'} />
                      <span className={`text-xs font-bold ${isChecked ? 'text-[#001D3D]' : 'text-gray-700'}`}>
                        {opt.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      {opt.subtitle}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {/* THANH ĐIỀU HƯỚNG BƯỚC TIẾP THEO */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={!primaryPurpose}
          onClick={onContinue}
          className="flex min-h-[40px] items-center gap-2 rounded-xl bg-[#2F6FA8] px-6 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1D3E61] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Tiếp Tục: Chọn Lộ Trình</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
