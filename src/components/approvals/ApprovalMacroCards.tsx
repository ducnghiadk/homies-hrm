'use client'

import React from 'react'
import {
  Clock,
  Calendar,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Users,
  ArrowRightLeft,
  FileCheck2,
} from 'lucide-react'
import type { ApprovalItem } from '@/lib/mock-data/approvals'

interface ApprovalMacroCardsProps {
  items: ApprovalItem[]
  onSelectCategoryFilter: (categoryKey: string) => void
  activeCategory: string
}

export default function ApprovalMacroCards({
  items,
  onSelectCategoryFilter,
  activeCategory,
}: ApprovalMacroCardsProps) {
  const pendingItems = items.filter(i => i.status === 'pending')
  const urgentCount = pendingItems.filter(i => i.priority === 'high').length

  // Nhóm 1: Nghỉ phép & Đổi ca
  const scheduleCount = pendingItems.filter(i => i.category === 'leave' || i.category === 'swap').length

  // Nhóm 2: Chấm công & Đi muộn / Về sớm
  const attendanceCount = pendingItems.filter(i => i.category === 'attendance_fix' || i.category === 'late_early').length

  // Nhóm 3: Tài chính & Onboarding
  const financialOnboardingCount = pendingItems.filter(
    i => i.category === 'salary_advance' || i.category === 'new_employee' || i.category === 'kpi_review'
  ).length

  const totalAdvanceAmount = pendingItems
    .filter(i => i.category === 'salary_advance' && i.amount)
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-['Inter']">
      {/* THẺ 1: TỔNG ĐƠN CHỜ XỬ LÝ */}
      <div
        onClick={() => onSelectCategoryFilter('all')}
        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
          activeCategory === 'all'
            ? 'bg-white border-[#2F6FA8] ring-2 ring-blue-100'
            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Tổng Đơn Chờ Xử Lý
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center border border-blue-100">
            <Clock size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#001D3D]">
            {pendingItems.length}
          </span>
          {urgentCount > 0 && (
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <AlertTriangle size={12} />
              {urgentCount} Đơn Gấp
            </span>
          )}
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Tỷ lệ hoàn tất tuần:</span>
          <strong className="text-emerald-700 font-mono font-bold">92.5%</strong>
        </div>
      </div>

      {/* THẺ 2: NGHỈ PHÉP & ĐỔI CA */}
      <div
        onClick={() => onSelectCategoryFilter('leave')}
        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
          activeCategory === 'leave' || activeCategory === 'swap'
            ? 'bg-white border-[#2F6FA8] ring-2 ring-blue-100'
            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Nghỉ Phép &amp; Đổi Ca
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Calendar size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-900">
            {scheduleCount}
          </span>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            Lịch Làm Việc
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Tác động định biên:</span>
          <strong className="text-[#001D3D] font-mono font-bold">~14 Giờ Ca</strong>
        </div>
      </div>

      {/* THẺ 3: CHẤM CÔNG & ĐI MUỘN */}
      <div
        onClick={() => onSelectCategoryFilter('attendance_fix')}
        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
          activeCategory === 'attendance_fix' || activeCategory === 'late_early'
            ? 'bg-white border-[#2F6FA8] ring-2 ring-blue-100'
            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Chấm Công &amp; Đi Muộn
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <FileCheck2 size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-purple-950">
            {attendanceCount}
          </span>
          <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
            Sửa &amp; Bổ Sung
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Giải trình WiFi / GPS:</span>
          <strong className="text-[#001D3D] font-mono font-bold">100% Có Minh Chứng</strong>
        </div>
      </div>

      {/* THẺ 4: TÀI CHÍNH & ONBOARDING */}
      <div
        onClick={() => onSelectCategoryFilter('salary_advance')}
        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
          activeCategory === 'salary_advance' || activeCategory === 'new_employee' || activeCategory === 'kpi_review'
            ? 'bg-white border-[#2F6FA8] ring-2 ring-blue-100'
            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Tài Chính &amp; Tuyển Dụng
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Wallet size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-900">
            {financialOnboardingCount}
          </span>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            {totalAdvanceAmount > 0 ? formatVnd(totalAdvanceAmount) : '2 Hồ Sơ Mới'}
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Hạn mức quỹ lương:</span>
          <strong className="text-emerald-700 font-mono font-bold">An Toàn (Trong Quỹ)</strong>
        </div>
      </div>
    </div>
  )
}
