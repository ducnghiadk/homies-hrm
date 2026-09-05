'use client'

import React from 'react'
import {
  Calendar, Search, Store, SlidersHorizontal, PlusCircle, MinusCircle, Download
} from 'lucide-react'
import type { Store as StoreType } from '@/lib/mock-data'

interface PayrollHeaderControlsProps {
  selectedPeriod: string
  setSelectedPeriod: (period: string) => void
  mockPayrollPeriods: { id: string; period: string }[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedStoreId: string
  setSelectedStoreId: (storeId: string) => void
  availableStores: StoreType[]
  columnVisibility: Record<string, { label: string; visible: boolean; category: string }>
  setShowColumnConfigModal: (show: boolean) => void
  onOpenBonusModal: () => void
  onOpenDeductionModal: () => void
  onExportExcel: () => void
}

export function PayrollHeaderControls({
  selectedPeriod,
  setSelectedPeriod,
  mockPayrollPeriods,
  searchQuery,
  setSearchQuery,
  selectedStoreId,
  setSelectedStoreId,
  availableStores,
  columnVisibility,
  setShowColumnConfigModal,
  onOpenBonusModal,
  onOpenDeductionModal,
  onExportExcel,
}: PayrollHeaderControlsProps) {
  const visibleColCount = Object.values(columnVisibility).filter(c => c.visible).length

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Period & Store Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Calendar size={16} className="text-sky-600 shrink-0" />
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              {mockPayrollPeriods.map(p => (
                <option key={p.id} value={p.period}>
                  Kỳ lương Tháng {p.period.split('-')[1]}/{p.period.split('-')[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Store size={16} className="text-emerald-600 shrink-0" />
            <select
              value={selectedStoreId}
              onChange={e => setSelectedStoreId(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả chi nhánh</option>
              {availableStores.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2 justify-between xl:justify-end">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên/mã NV..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={() => setShowColumnConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            <span>Cột ({visibleColCount}/29)</span>
          </button>

          <button
            onClick={onOpenBonusModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <PlusCircle size={14} />
            <span>+ Phiếu thưởng</span>
          </button>

          <button
            onClick={onOpenDeductionModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <MinusCircle size={14} />
            <span>- Phiếu phạt</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-700 text-white hover:bg-sky-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Download size={14} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>
    </div>
  )
}
