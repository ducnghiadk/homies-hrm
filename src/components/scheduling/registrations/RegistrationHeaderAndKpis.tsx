'use client'

import React from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Store,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Users,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react'
import { mockStores } from '@/lib/mock-data'
import type { CoverageRateResult } from '@/lib/services/scheduling/shift-registration-service'

export interface RegistrationHeaderAndKpisProps {
  selectedStoreId: string
  onSelectStoreId: (storeId: string) => void
  selectedWeek: string
  onSelectWeek: (week: string) => void
  thisMonStr: string
  nextMonStr: string
  prevMonStr: string
  isSyncing: boolean
  onRefresh: () => void
  onApproveAll: () => void
  pendingTotal: number
  coverageData: CoverageRateResult
  totalRegistrations: number
  approvedTotal: number
  riskCount: number
  emptyCount: number
  fullCount: number
  filterStatus: 'ALL' | 'RISK' | 'PENDING' | 'APPROVED'
  onSelectFilterStatus: (status: 'ALL' | 'RISK' | 'PENDING' | 'APPROVED') => void
}

export default function RegistrationHeaderAndKpis({
  selectedStoreId,
  onSelectStoreId,
  selectedWeek,
  onSelectWeek,
  thisMonStr,
  nextMonStr,
  prevMonStr,
  isSyncing,
  onRefresh,
  onApproveAll,
  pendingTotal,
  coverageData,
  totalRegistrations,
  approvedTotal,
  riskCount,
  emptyCount,
  fullCount,
  filterStatus,
  onSelectFilterStatus,
}: RegistrationHeaderAndKpisProps) {
  const currentStore = mockStores.find(s => s.id === selectedStoreId) || mockStores[0]

  return (
    <div className="w-full space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          TẦNG 1: EXECUTIVE COMMAND HEADER (Sticky Top)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs w-full sticky top-0 z-30">
        <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Cột trái: Breadcrumb + Tiêu đề + Badges */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Link href="/schedule" className="hover:text-[#2F6FA8] transition flex items-center gap-1">
                <CalendarDays size={12} />
                <span>Lịch làm việc</span>
              </Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="text-[#2F6FA8] font-bold">Duyệt Đăng Ký Ca Tuần</span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight flex items-center gap-2">
                Duyệt Đăng Ký Ca &amp; Ma Trận Thời Gian Rảnh
              </h1>

              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  iPOS Live Data
                </span>

                {pendingTotal > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    {pendingTotal} ca chờ duyệt
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                    Đã duyệt hoàn tất
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Bộ chọn Chi nhánh + Bộ chọn Tuần + Nút hành động */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Chi nhánh */}
            <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200/80">
              <Store size={13} className="text-[#2F6FA8] ml-2 mr-1" />
              <div className="flex items-center gap-1">
                {mockStores
                  .filter(store => store.is_active !== false)
                  .map(store => {
                    const isActive = selectedStoreId === store.id
                    const shortName = store.name.replace('Homies Milk Tea - ', '')
                    return (
                      <button
                        key={store.id}
                        onClick={() => onSelectStoreId(store.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white text-[#001D3D] shadow-xs font-bold border border-gray-100'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {shortName}
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Bộ chọn Tuần */}
            <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200/80">
              <button
                onClick={() => onSelectWeek(prevMonStr)}
                className="p-1 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-white transition"
                title="Tuần trước"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => onSelectWeek(thisMonStr)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  selectedWeek === thisMonStr
                    ? 'bg-white text-[#2F6FA8] font-bold shadow-xs border border-gray-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tuần này
              </button>
              <button
                onClick={() => onSelectWeek(nextMonStr)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  selectedWeek === nextMonStr
                    ? 'bg-[#2F6FA8] text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tuần tới ⭐
              </button>
              <span className="px-2 text-[11px] font-mono font-bold text-gray-500 border-l border-gray-200">
                {selectedWeek}
              </span>
            </div>

            {/* Nút Làm mới iPOS */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="p-2 min-h-[36px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition cursor-pointer disabled:opacity-50"
              title="Đồng bộ trực tiếp ca đăng ký từ iPOS Cloud"
            >
              <RefreshCw size={14} className={`text-[#2F6FA8] ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Xem Bảng Lịch */}
            <Link
              href="/schedule"
              className="px-3 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <span>Xem Bảng Lịch</span>
              <ArrowRight size={13} className="text-gray-400" />
            </Link>

            {/* Duyệt & Điền nhanh */}
            <button
              onClick={onApproveAll}
              className="px-3.5 py-1.5 min-h-[36px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-98"
              title="Tự động chấp thuận toàn bộ ca đăng ký hợp lệ và chuyển vào Bảng Xếp Lịch"
            >
              <Sparkles size={14} className="text-emerald-200" />
              <span>Chốt &amp; Điền vào Xếp Ca</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TẦNG 2: DẢI 4 THẺ CHỈ SỐ VĨ MÔ (Macro KPI Cards)
         ───────────────────────────────────────────────────────────── */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tỷ lệ nộp lịch */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-[#2F6FA8]" />
                Độ Phủ Đăng Ký
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                  coverageData.ratePercent >= 70
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {coverageData.ratePercent}%
              </span>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#001D3D] tabular-nums">
                  {coverageData.submittedCount}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  / {coverageData.totalEmployees} nhân sự chi nhánh
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#2F6FA8] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, coverageData.ratePercent)}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
              <span>Còn thiếu: <strong className="text-rose-600 font-mono font-bold">{coverageData.missingEmployees.length} bạn</strong></span>
              <span className="text-[10px] text-gray-400">Không tính CEO</span>
            </div>
          </div>

          {/* Card 2: Tổng ca đăng ký */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-[#2F6FA8]" />
                Tổng Ca Đăng Ký
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                iPOS Live
              </span>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#001D3D] tabular-nums">
                  {totalRegistrations}
                </span>
                <span className="text-xs font-medium text-gray-500">ca rảnh trong tuần</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Bình quân{' '}
                <strong className="font-mono text-gray-700">
                  {coverageData.submittedCount > 0 ? (totalRegistrations / coverageData.submittedCount).toFixed(1) : 0} ca
                </strong>
                /bạn đã gửi
              </p>
            </div>

            <div className="text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
              <span>Chờ duyệt: <strong className="text-amber-700 font-mono font-bold">{pendingTotal}</strong></span>
              <span>Đã duyệt: <strong className="text-emerald-700 font-mono font-bold">{approvedTotal}</strong></span>
            </div>
          </div>

          {/* Card 3: Cảnh báo phủ ca */}
          <div
            onClick={() => onSelectFilterStatus(filterStatus === 'RISK' ? 'ALL' : 'RISK')}
            className={`rounded-2xl p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition ${
              filterStatus === 'RISK'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300'
                : 'bg-white border-gray-100 hover:border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                Cảnh Báo Ca Thiếu
              </span>
              {emptyCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Lủng {emptyCount} ca
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  An toàn
                </span>
              )}
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
                  {riskCount + emptyCount}
                </span>
                <span className="text-xs font-medium text-gray-500">ca cần chú ý</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {emptyCount > 0 && <span className="text-rose-600 font-bold">{emptyCount} lủng (0 bạn) • </span>}
                <span className="text-amber-700 font-bold">{riskCount} ca mỏng (1 bạn)</span>
              </p>
            </div>

            <div className="text-[11px] text-[#2F6FA8] font-bold flex items-center justify-between pt-2 border-t border-gray-100">
              <span>{filterStatus === 'RISK' ? '● Đang lọc ca thiếu' : 'Bấm để lọc ca thiếu'}</span>
              <ChevronRight size={12} />
            </div>
          </div>

          {/* Card 4: Ca đạt chuẩn */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Độ Phủ Đạt Chuẩn
              </span>
              <div className="group relative">
                <HelpCircle size={13} className="text-gray-400 cursor-pointer" />
                <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-[#001D3D] text-white text-[10px] rounded-lg shadow-lg z-50">
                  Chuẩn định mức F&amp;B: Mỗi ca cần tối thiểu 2 nhân sự rảnh (&ge; 2 bạn) để mở ca an toàn.
                </div>
              </div>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                  {fullCount}
                </span>
                <span className="text-xs font-medium text-gray-500">/ 21 khung ca tuần</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((fullCount / 21) * 100)}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
              <span>Tỷ lệ an toàn: <strong className="text-emerald-700 font-mono font-bold">{Math.round((fullCount / 21) * 100)}%</strong></span>
              <span className="text-gray-400">7 ngày x 3 ca</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

