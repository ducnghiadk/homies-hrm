'use client'

import React from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Store,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  ArrowRight,
  Users,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
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
  onApproveAll?: () => void
  pendingTotal?: number
  coverageData: CoverageRateResult
  totalRegistrations: number
  approvedTotal?: number
  riskCount: number
  emptyCount: number
  fullCount: number
  filterStatus: 'ALL' | 'RISK' | 'PENDING' | 'APPROVED'
  onSelectFilterStatus: (status: 'ALL' | 'RISK' | 'PENDING' | 'APPROVED') => void
  dataSource?: 'ipos_cloud' | 'homies_native' | 'internal_db'
  stores?: Array<{ id: string; name: string; is_active?: boolean }>
  weekStatus?: 'draft' | 'published'
  scheduleHref?: string
}

function formatWeekRange(mondayYmd: string): string {
  const parts = mondayYmd.split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return mondayYmd
  const [y, m, d] = parts
  const start = new Date(y, m - 1, d)
  const end = new Date(y, m - 1, d + 6)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(start.getDate())}/${pad(start.getMonth() + 1)} – ${pad(end.getDate())}/${pad(end.getMonth() + 1)}`
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
  coverageData,
  totalRegistrations,
  riskCount,
  emptyCount,
  fullCount,
  filterStatus,
  onSelectFilterStatus,
  dataSource = 'ipos_cloud',
  stores,
  weekStatus = 'draft',
  scheduleHref,
}: RegistrationHeaderAndKpisProps) {
  const isHomiesNative = dataSource === 'homies_native'
  const isInternalDb = dataSource === 'internal_db'
  const isWeekPublished = weekStatus === 'published'
  const activeStores = (stores && stores.length > 0 ? stores : mockStores).filter(
    s => s.is_active !== false
  )

  const missingCount = coverageData.missingEmployees.length
  const avgPerStaff =
    coverageData.submittedCount > 0
      ? (totalRegistrations / coverageData.submittedCount).toFixed(1)
      : '0'
  const safePercent = Math.round((fullCount / 21) * 100)
  const attentionTotal = emptyCount + riskCount

  return (
    <div className="w-full space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          TẦNG 1: EXECUTIVE COMMAND HEADER (Sticky Top)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 shadow-2xs w-full sticky top-0 z-30">
        <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Cột trái: Breadcrumb + Tiêu đề gọn + 2 nhãn trạng thái */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Link href={scheduleHref || '/schedule'} className="hover:text-[#2F6FA8] transition flex items-center gap-1">
                <CalendarDays size={12} />
                <span>Lịch làm việc</span>
              </Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="text-[#2F6FA8] font-bold">Lịch Rảnh Tuần</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight">
                Lịch Rảnh Tuần
              </h1>

              {isHomiesNative ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#2F6FA8] border border-[#2F6FA8]/30 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FA8]" />
                  Homies Tự Vận Hành
                </span>
              ) : isInternalDb ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  Dữ Liệu Nội Bộ
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  iPOS Live
                </span>
              )}

              {isWeekPublished ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                  <Lock size={11} />
                  Đã chốt lịch chính thức
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-sky-50 text-[#2F6FA8] border border-sky-200 inline-flex items-center gap-1">
                  <Clock size={11} />
                  Chưa chốt lịch trên Homies
                </span>
              )}
            </div>
          </div>

          {/* Cột phải: Chi nhánh + Tuần + Làm mới + Điều hướng + Nút chính */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bộ chọn Chi nhánh */}
            <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200/80">
              <Store size={13} className="text-[#2F6FA8] ml-2 mr-1" />
              <div className="flex items-center gap-1">
                {activeStores.map(store => {
                  const isActive = selectedStoreId === store.id
                  const shortName = store.name.replace('Homies Milk Tea - ', '')
                  return (
                    <button
                      key={store.id}
                      type="button"
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
                type="button"
                onClick={() => onSelectWeek(prevMonStr)}
                className="p-1 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-white transition cursor-pointer"
                title="Tuần trước"
                aria-label="Tuần trước"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
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
                type="button"
                onClick={() => onSelectWeek(nextMonStr)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  selectedWeek === nextMonStr
                    ? 'bg-[#2F6FA8] text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tuần tới
              </button>
              <span className="px-2 text-[11px] font-mono tabular-nums font-semibold text-gray-600 border-l border-gray-200">
                {formatWeekRange(selectedWeek)}
              </span>
            </div>

            {/* Làm mới dữ liệu */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isSyncing}
              className="p-2 min-h-[36px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition cursor-pointer disabled:opacity-50"
              title="Làm mới dữ liệu đăng ký ca"
              aria-label="Làm mới dữ liệu đăng ký ca"
            >
              <RefreshCw size={14} className={`text-[#2F6FA8] ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Nút chính duy nhất: Mở Bảng Xếp Lịch đúng chi nhánh & tuần đang xem */}
            <Link
              href={scheduleHref || '/schedule'}
              className="px-4 py-1.5 min-h-[36px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition active:scale-98"
            >
              <span>Mở Bảng Xếp Lịch tuần này</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TẦNG 2: 4 THẺ CHỈ SỐ VĨ MÔ GỌN NHẸ (Click lọc nhanh)
         ───────────────────────────────────────────────────────────── */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Tiến Độ Nộp Lịch */}
          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-[#2F6FA8]" />
                Tiến Độ Nộp Lịch
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono tabular-nums ${
                  coverageData.ratePercent >= 70
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {coverageData.ratePercent}%
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-[#001D3D] tabular-nums">
                  {coverageData.submittedCount}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  / {coverageData.totalEmployees} nhân sự
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#2F6FA8] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, coverageData.ratePercent)}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
              {missingCount > 0 ? (
                <span>
                  Còn thiếu{' '}
                  <strong className="text-rose-600 font-mono font-bold tabular-nums">
                    {missingCount} bạn
                  </strong>
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">Đã nộp đủ 100%</span>
              )}
              <span className="text-[10px] text-gray-400">Không tính CEO</span>
            </div>
          </div>

          {/* Card 2: Tổng Khung Giờ Rảnh */}
          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 w-full">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#2F6FA8]" />
                Tổng Khung Giờ Rảnh
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-blue-50 text-[#2F6FA8] border border-blue-200/70">
                {coverageData.submittedCount} bạn nộp
              </span>
            </div>

            <div className="w-full">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-[#001D3D] tabular-nums">
                  {totalRegistrations}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  ca rảnh trong tuần
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                TB <strong className="font-mono font-bold tabular-nums text-gray-700">{avgPerStaff}</strong> ca/nhân sự
              </p>
            </div>

            <div className="w-full text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
              <span>Nguồn tham khảo xếp ca trên Homies</span>
              <Layers size={11} className="text-[#2F6FA8]" />
            </div>
          </div>

          {/* Card 3: Ca Cần Xử Lý Gấp (Click để lọc Ca thiếu) */}
          <button
            type="button"
            onClick={() => onSelectFilterStatus(filterStatus === 'RISK' ? 'ALL' : 'RISK')}
            className={`text-left rounded-2xl p-3.5 border shadow-xs flex flex-col justify-between gap-2 cursor-pointer transition ${
              filterStatus === 'RISK'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400'
                : emptyCount > 0
                ? 'bg-white border-rose-200/80 hover:border-rose-300'
                : 'bg-white border-gray-100 hover:border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 w-full">
              <span className="flex items-center gap-1.5">
                <AlertTriangle
                  size={14}
                  className={emptyCount > 0 ? 'text-rose-600' : 'text-amber-600'}
                />
                Ca Cần Xử Lý Gấp
              </span>
              {emptyCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-rose-50 text-rose-700 border border-rose-200">
                  Trống {emptyCount} ca
                </span>
              ) : riskCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-amber-50 text-amber-800 border border-amber-200">
                  Mỏng {riskCount} ca
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  An toàn
                </span>
              )}
            </div>

            <div className="w-full">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    emptyCount > 0
                      ? 'text-rose-700'
                      : riskCount > 0
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {attentionTotal}
                </span>
                <span className="text-xs font-medium text-gray-500">ca thiếu người</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-mono tabular-nums">
                <span className={emptyCount > 0 ? 'text-rose-600 font-bold' : ''}>
                  {emptyCount} trống
                </span>
                {' • '}
                <span className={riskCount > 0 ? 'text-amber-700 font-bold' : ''}>
                  {riskCount} mỏng
                </span>
              </p>
            </div>

            <div className="w-full text-[11px] text-[#2F6FA8] font-bold flex items-center justify-between pt-2 border-t border-gray-100">
              <span>{filterStatus === 'RISK' ? 'Đang lọc ca thiếu' : 'Lọc ca thiếu'}</span>
              <ChevronRight size={12} />
            </div>
          </button>

          {/* Card 4: Khung Ca An Toàn */}
          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Khung Ca An Toàn
              </span>
              <div className="group relative">
                <HelpCircle size={13} className="text-gray-400 cursor-pointer" />
                <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block w-52 p-2 bg-[#001D3D] text-white text-[10px] rounded-lg shadow-lg z-50 leading-relaxed">
                  Chuẩn F&amp;B: mỗi ca cần tối thiểu 2 nhân sự rảnh (&ge; 2 bạn) để mở ca an toàn.
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                  {fullCount}
                </span>
                <span className="text-xs font-medium text-gray-500">/ 21 khung ca</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, safePercent)}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
              <span>
                Đạt chuẩn{' '}
                <strong className="text-emerald-700 font-mono font-bold tabular-nums">
                  {safePercent}%
                </strong>
              </span>
              <span className="text-gray-400 font-mono">7 ngày x 3 ca</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
