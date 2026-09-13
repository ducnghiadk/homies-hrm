'use client'

import React from 'react'
import type { KpiPeerReviewPolicy } from '@/lib/kpi/types'
import {
  AlertTriangle,
  Clock,
  Info,
  Lock,
  Percent,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

export interface KPIPeerReviewSettingsPanelProps {
  policy: KpiPeerReviewPolicy
  runtimeMode: 'local_demo' | 'supabase_secure'
  onChange(policy: KpiPeerReviewPolicy): void
  disabled?: boolean
}

export function KPIPeerReviewSettingsPanel({
  policy,
  runtimeMode,
  onChange,
  disabled = false,
}: KPIPeerReviewSettingsPanelProps) {
  const isLocalDemo = runtimeMode === 'local_demo'

  const handleUpdate = <K extends keyof KpiPeerReviewPolicy>(
    key: K,
    value: KpiPeerReviewPolicy[K]
  ) => {
    if (disabled) return
    onChange({
      ...policy,
      [key]: value,
    })
  }

  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-xs space-y-5">
      {/* HEADER & STATUS BADGE */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
              <span>Cấu hình Đánh Giá Đồng Nghiệp (Peer Review)</span>
              <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                Ẩn danh chuẩn F&B
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Thu thập góc nhìn khách quan từ đồng nghiệp làm chung ca, bảo vệ ẩn danh tuyệt đối.
            </p>
          </div>
        </div>

        {/* RUNTIME MODE BADGE */}
        {isLocalDemo ? (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
            <AlertTriangle size={14} className="shrink-0 text-amber-600" />
            <span className="font-medium">Chế độ mô phỏng (Demo Local)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
            <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
            <span className="font-medium">Supabase RLS Bảo Mật</span>
          </div>
        )}
      </div>

      {/* DEMO WARNING BANNER */}
      {isLocalDemo && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Lưu ý môi trường thử nghiệm:</p>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Dữ liệu demo: giao diện mô phỏng ẩn danh, chưa dùng để vận hành thật cho tới khi Supabase/RLS được bật.
            </p>
          </div>
        </div>
      )}

      {/* FORM FIELDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* TRỌNG SỐ (WEIGHT PERCENT) */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
              <Percent size={13} className="text-[#2F6FA8]" />
              <span>Trọng số trong KPI</span>
            </label>
            <span className="font-mono text-xs font-bold text-[#2F6FA8]">
              {policy.weight_percent}% (Tối đa 15%)
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={15}
            step={1}
            disabled={disabled || !policy.enabled}
            value={policy.weight_percent}
            onChange={(e) => handleUpdate('weight_percent', Number(e.target.value))}
            className="w-full accent-[#2F6FA8] cursor-pointer disabled:opacity-40"
          />
          <p className="text-[11px] text-gray-500">
            Khuyến nghị Homies: 10% để giữ trọng tâm vào vận hành và kỹ năng chuyên môn.
          </p>
        </div>

        {/* SỐ LƯỢNG NGƯỜI ĐÁNH GIÁ (FIXED 2) */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 space-y-1.5">
          <label className="text-xs font-bold text-[#001D3D] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users size={13} className="text-[#2F6FA8]" />
              <span>Số người đánh giá</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
              <Lock size={10} /> Cố định
            </span>
          </label>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-1.5">
            <span className="text-xs font-bold text-gray-800">2 Đồng nghiệp</span>
            <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Chuẩn ẩn danh
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            Cố định 2 người để bảo đảm mẫu ẩn danh và công thức gộp nhận xét trung tính.
          </p>
        </div>

        {/* SỐ CA LÀM CHUNG TỐI THIỂU */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 space-y-1.5">
          <label className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#2F6FA8]" />
            <span>Ca làm chung tối thiểu</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={30}
              disabled={disabled || !policy.enabled}
              value={policy.min_shared_shifts}
              onChange={(e) => handleUpdate('min_shared_shifts', Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#001D3D] focus:border-[#2F6FA8] focus:outline-hidden disabled:opacity-40"
            />
            <span className="text-xs text-gray-600 font-medium">ca làm trong tháng</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Chỉ những bạn có từ {policy.min_shared_shifts} ca làm chung trở lên mới đủ điều kiện góp ý.
          </p>
        </div>

        {/* THỜI GIAN QUẢN LÝ DUYỆT / CHỌN */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 space-y-1.5">
          <label className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
            <Clock size={13} className="text-[#2F6FA8]" />
            <span>Thời gian Quản lý duyệt</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={12}
              max={72}
              step={6}
              disabled={disabled || !policy.enabled}
              value={policy.manager_selection_hours}
              onChange={(e) => handleUpdate('manager_selection_hours', Math.max(12, Number(e.target.value)))}
              className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#001D3D] focus:border-[#2F6FA8] focus:outline-hidden disabled:opacity-40"
            />
            <span className="text-xs text-gray-600 font-medium">giờ (Hết hạn sẽ tự động chọn)</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Nếu quản lý không chọn, hệ thống tự động gán top 2 người có nhiều ca làm chung nhất.
          </p>
        </div>

        {/* THỜI HẠN NỘP PHIẾU CỦA ĐỒNG NGHIỆP */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 space-y-1.5">
          <label className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
            <Clock size={13} className="text-[#2F6FA8]" />
            <span>Thời hạn nộp phiếu góp ý</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={24}
              max={120}
              step={12}
              disabled={disabled || !policy.enabled}
              value={policy.reviewer_deadline_hours}
              onChange={(e) => handleUpdate('reviewer_deadline_hours', Math.max(24, Number(e.target.value)))}
              className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#001D3D] focus:border-[#2F6FA8] focus:outline-hidden disabled:opacity-40"
            />
            <span className="text-xs text-gray-600 font-medium">giờ từ khi phân công</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Quá hạn nộp phiếu, hệ thống sẽ kích hoạt người dự phòng hoặc tự động chuyển trọng số.
          </p>
        </div>

        {/* PHƯƠNG ÁN DỰ PHÒNG KHI THIẾU MẪU */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 space-y-1.5">
          <label className="text-xs font-bold text-[#001D3D] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#2F6FA8]" />
              <span>Xử lý khi thiếu mẫu</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
              <Lock size={10} /> Tự động
            </span>
          </label>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
            Chuyển trọng số sang <span className="font-bold text-[#001D3D]">Người chấm chính</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Nếu có dưới 2 phiếu hợp lệ, {policy.weight_percent}% trọng số sẽ tự động chuyển cho Trưởng ca/Quản lý.
          </p>
        </div>
      </div>
    </div>
  )
}
