'use client'

import React from 'react'
import type {
  KpiEvaluationSourcePolicy,
  KpiPeerReviewPolicy,
  KpiProgramPurpose,
  KpiReviewSource,
} from '@/lib/kpi/types'
import { KPIPeerReviewSettingsPanel } from './KPIPeerReviewSettingsPanel'
import {
  FileText,
  ShieldCheck,
  Users,
  User,
  Store,
  Building2,
  Compass,
  GraduationCap,
  Award,
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
} from 'lucide-react'

export type KPIProgramSourcesStepProps = {
  policy: KpiEvaluationSourcePolicy
  peerReviewPolicy?: KpiPeerReviewPolicy
  runtimeMode?: 'local_demo' | 'supabase_secure'
  purpose: KpiProgramPurpose
  audience: 'employee' | 'manager'
  onChange(policy: KpiEvaluationSourcePolicy): void
  onPeerReviewPolicyChange?(policy: KpiPeerReviewPolicy): void
  onBack(): void
  onContinue(): void
}

type SourceOption = {
  key: KpiReviewSource
  title: string
  subtitle: string
  badge?: string
  audienceScope?: 'employee_only' | 'manager_only'
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    key: 'operations',
    title: 'Nhật ký vận hành & Dữ liệu tự động',
    subtitle: 'Lấy từ dữ liệu chấm công, thời gian ra món trên máy POS và vi phạm biên bản thực tế.',
    badge: 'Nguồn chính',
    icon: FileText,
  },
  {
    key: 'shift_leader',
    title: 'Trưởng ca đánh giá trong ca',
    subtitle: 'Quan sát tác phong, thái độ hỗ trợ đồng đội và việc thực hiện checklist công việc hằng ngày.',
    audienceScope: 'employee_only',
    icon: ShieldCheck,
  },
  {
    key: 'peer',
    title: '2 Đồng nghiệp cùng ca góp ý ẩn danh',
    subtitle: 'Cấu hình trước nguồn góp ý dự kiến, tối đa 15% tổng điểm. Việc phân người và thu thập thật sẽ có ở Giai đoạn 2.',
    badge: 'Cấu hình GĐ2',
    audienceScope: 'employee_only',
    icon: Users,
  },
  {
    key: 'self',
    title: 'Nhân viên tự đánh giá',
    subtitle: 'Tạo cơ hội cho nhân viên tự nhìn nhận kết quả trước buổi trao đổi định kỳ với quản lý.',
    icon: User,
  },
  {
    key: 'store_manager',
    title: 'Quản lý cửa hàng xác nhận cuối tháng',
    subtitle: 'Đối chiếu kết quả tổng thể, lắng nghe nguyện vọng và đưa ra định hướng phát triển cho nhân viên.',
    icon: Store,
  },
  {
    key: 'area_manager',
    title: 'Quản lý khu vực (Area Manager) xác nhận',
    subtitle: 'Đảm bảo tính công bằng và tiêu chuẩn đồng bộ giữa các cửa hàng trong chuỗi.',
    audienceScope: 'manager_only',
    icon: Building2,
  },
  {
    key: 'store_360',
    title: 'Khảo sát 360 toàn cửa hàng (Theo quý)',
    subtitle: 'Cấu hình trước khảo sát sức khỏe vận hành toàn cửa hàng; chu kỳ khảo sát thật sẽ có ở Giai đoạn 3.',
    badge: 'Giai đoạn 3',
    icon: Compass,
  },
  {
    key: 'skill_test',
    title: 'Bài kiểm tra tay nghề / Nghiệp vụ',
    subtitle: 'Đánh giá kiến thức công thức pha chế, quy trình vệ sinh và an toàn thực phẩm.',
    icon: GraduationCap,
  },
  {
    key: 'trial_role',
    title: 'Giai đoạn thử vai thực tế',
    subtitle: 'Đánh giá khả năng đảm nhiệm vai trò ở cấp bậc tiếp theo trong 2 - 4 tuần trước khi bổ nhiệm.',
    icon: Award,
  },
]

export function KPIProgramSourcesStep({
  policy,
  peerReviewPolicy,
  runtimeMode = 'local_demo',
  purpose,
  audience,
  onChange,
  onPeerReviewPolicyChange,
  onBack,
  onContinue,
}: KPIProgramSourcesStepProps) {
  const enabledSources = policy.enabled_sources || []

  // Lọc các nguồn phù hợp với audience (nhân viên hay cấp quản lý)
  const visibleOptions = SOURCE_OPTIONS.filter((opt) => {
    if (audience === 'manager' && opt.audienceScope === 'employee_only') return false
    if (audience === 'employee' && opt.audienceScope === 'manager_only') return false
    return true
  })

  // Xử lý bật/tắt từng nguồn đánh giá
  const handleToggleSource = (sourceKey: KpiReviewSource) => {
    const isCurrentlyEnabled = enabledSources.includes(sourceKey)
    let nextSources: KpiReviewSource[]

    if (isCurrentlyEnabled) {
      if (enabledSources.length <= 1) return
      nextSources = enabledSources.filter((s) => s !== sourceKey)
    } else {
      nextSources = [...enabledSources, sourceKey]
    }

    const hasPeer = nextSources.includes('peer')

    onChange({
      ...policy,
      enabled_sources: nextSources,
      peer_reviewer_count: hasPeer ? 2 : 0,
      peer_weight_cap: hasPeer ? 15 : 0,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Hướng Dẫn */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-[#2F6FA8]/10 px-2.5 py-0.5 text-xs font-bold text-[#2F6FA8]">
          <Compass size={13} />
          <span>Bước 3 / 5</span>
        </div>
        <h2 className="text-base font-bold text-[#001D3D] sm:text-lg">
          Chương trình sẽ thu thập dữ liệu đánh giá từ những nguồn nào?
        </h2>
        <p className="text-xs text-gray-500">
          Homies kết hợp giữa số liệu vận hành tự động và nhận xét khách quan từ nhiều phía để bảo đảm tính công bằng.
        </p>
      </div>

      {/* DANH SÁCH CÁC NGUỒN ĐÁNH GIÁ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleOptions.map((opt) => {
          const isEnabled = enabledSources.includes(opt.key)
          const Icon = opt.icon

          return (
            <label
              key={opt.key}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition-all cursor-pointer ${
                isEnabled
                  ? 'border-[#2F6FA8] bg-white shadow-xs ring-2 ring-[#2F6FA8]/15'
                  : 'border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-300'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      isEnabled ? 'bg-[#2F6FA8] text-white' : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {opt.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          opt.key === 'peer'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : opt.key === 'store_360'
                            ? 'bg-gray-100 text-gray-600 border border-gray-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleSource(opt.key)}
                      className="h-4 w-4 rounded accent-[#2F6FA8]"
                    />
                  </div>
                </div>

                <div>
                  <h3 className={`text-xs font-bold ${isEnabled ? 'text-[#001D3D]' : 'text-gray-700'}`}>
                    {opt.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                    {opt.subtitle}
                  </p>
                </div>
              </div>

              {isEnabled && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <Check size={13} strokeWidth={3} />
                  <span>Đã chọn cho chương trình</span>
                </div>
              )}
            </label>
          )
        })}
      </div>

      {/* PANEL CẤU HÌNH PEER REVIEW CHO NHÂN VIÊN */}
      {audience === 'employee' && enabledSources.includes('peer') && peerReviewPolicy && onPeerReviewPolicyChange && (
        <KPIPeerReviewSettingsPanel
          policy={peerReviewPolicy}
          runtimeMode={runtimeMode}
          onChange={onPeerReviewPolicyChange}
        />
      )}

      {/* GHI CHÚ BẢO MẬT & TÍNH CÔNG BẰNG */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-gray-700 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-[#2F6FA8]">
          <Info size={15} />
          <span>
            {purpose === 'promotion'
              ? 'Lưu ý cho chương trình xét thăng tiến:'
              : 'Nguyên tắc bảo vệ tính công bằng tại Homies:'}
          </span>
        </div>
        <ul className="list-disc list-inside text-[11px] text-gray-600 space-y-1 pl-1">
          <li><strong>Góp ý đồng nghiệp ẩn danh:</strong> Giai đoạn này chỉ lưu cấu hình 2 người và mức tối đa 15%; việc chọn người, bảo vệ danh tính và thu thập góp ý sẽ triển khai ở Giai đoạn 2.</li>
          <li><strong>Dữ liệu đối chiếu:</strong> Mọi điểm số con người đều có đối chiếu với số giờ làm, số ca và biên bản vi phạm từ hệ thống.</li>
        </ul>
      </div>

      {/* THANH ĐIỀU HƯỚNG BƯỚC */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[40px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-xs transition-all hover:bg-gray-50 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Quay Lại: Lộ Trình</span>
        </button>

        <button
          type="button"
          disabled={enabledSources.length === 0}
          onClick={onContinue}
          className="flex min-h-[40px] items-center gap-2 rounded-xl bg-[#2F6FA8] px-6 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1D3E61] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Tiếp Tục: Điều Kiện Đạt</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
