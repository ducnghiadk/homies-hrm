'use client'

import React from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  FileSpreadsheet,
  CheckCheck,
  Settings,
  Building2,
  BellRing,
} from 'lucide-react'
import type { Store } from '@/lib/mock-data'

interface ApprovalExecutiveHeaderProps {
  totalPendingCount: number
  selectedStoreId: string
  setSelectedStoreId: (id: string) => void
  stores: (Store | undefined)[]
  selectedCount: number
  onBulkApprove: () => void
  onExportExcel: () => void
}

export default function ApprovalExecutiveHeader({
  totalPendingCount,
  selectedStoreId,
  setSelectedStoreId,
  stores,
  selectedCount,
  onBulkApprove,
  onExportExcel,
}: ApprovalExecutiveHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs w-full sticky top-0 z-30 font-['Inter']">
      <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* CỘT TRÁI: Breadcrumb + Tiêu đề + Badge trạng thái */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>HRM Homies</span>
            <ChevronRight size={12} className="text-gray-400" />
            <span>Vận Hành Cửa Hàng</span>
            <ChevronRight size={12} className="text-gray-400" />
            <span className="text-[#2F6FA8] font-bold">Trung Tâm Phê Duyệt</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight flex items-center gap-2">
              <BellRing size={20} className="text-[#2F6FA8]" />
              Trung Tâm Phê Duyệt &amp; Yêu Cầu Nhân Sự
            </h1>

            {totalPendingCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {totalPendingCount} Đơn Đang Chờ Duyệt
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Đã Hoàn Tất Toàn Bộ
              </span>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Bộ lọc chi nhánh + Nút xuất Excel + Phím duyệt hàng loạt + Cài đặt */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Chọn chi nhánh */}
          <div className="relative">
            <select
              value={selectedStoreId}
              onChange={e => setSelectedStoreId(e.target.value)}
              className="pl-8 pr-3 py-2 min-h-[38px] rounded-xl border border-gray-200 bg-gray-50/80 text-xs font-bold text-gray-800 outline-none shadow-2xs focus:border-[#2F6FA8] focus:bg-white transition cursor-pointer"
            >
              <option value="all">Tất cả chi nhánh</option>
              {stores.map(s => s && (
                <option key={s.id} value={s.id}>
                  {s.name.replace('Homies Milk Tea - ', '')}
                </option>
              ))}
            </select>
            <Building2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Nút Xuất Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            className="px-3 py-2 min-h-[38px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-[#2F6FA8]" />
            <span>Xuất Excel</span>
          </button>

          {/* Nút Duyệt Hàng Loạt nếu có tick chọn */}
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onBulkApprove}
              className="px-3.5 py-2 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer animate-fade-in"
            >
              <CheckCheck size={16} />
              <span>Duyệt Nhanh ({selectedCount}) Đơn</span>
            </button>
          )}

          {/* Nút Cài đặt phân quyền & quy trình duyệt */}
          <Link
            href="/settings/master-data?tab=workflows"
            className="px-3 py-2 min-h-[38px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-[#001D3D] text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
            title="Cài đặt quy trình phê duyệt (1 cấp / 2 cấp)"
          >
            <Settings size={15} className="text-gray-500" />
            <span className="hidden sm:inline">Cài Đặt Quy Trình</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
