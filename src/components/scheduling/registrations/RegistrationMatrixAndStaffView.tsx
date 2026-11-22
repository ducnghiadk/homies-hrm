'use client'

import React, { useState } from 'react'
import {
  Layers,
  Users,
  CheckCircle2,
  Filter,
  Phone,
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  X,
} from 'lucide-react'
import type {
  HeatmapCell,
  CoverageRateResult,
  StaffRegistrationSummary,
} from '@/lib/services/scheduling/shift-registration-service'

interface RegistrationMatrixAndStaffViewProps {
  selectedStoreId: string
  selectedWeek: string
  heatmapCells: HeatmapCell[]
  staffOverview: StaffRegistrationSummary[]
  coverageData: CoverageRateResult
  filterStatus: 'ALL' | 'RISK' | 'PENDING' | 'APPROVED'
  onSelectFilterStatus: (status: 'ALL' | 'RISK' | 'PENDING' | 'APPROVED') => void
  onSelectCell: (cell: HeatmapCell) => void
  onApproveCell?: (date: string, shiftId: string) => void
  onOpenZaloModal: () => void
  onApproveStaffAll?: (staffId: string) => void
}

function formatShortStaffName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return fullName.trim()
  return parts.slice(-2).join(' ')
}

export default function RegistrationMatrixAndStaffView({
  heatmapCells,
  staffOverview,
  coverageData,
  filterStatus,
  onSelectFilterStatus,
  onSelectCell,
  onOpenZaloModal,
}: RegistrationMatrixAndStaffViewProps) {
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'STAFF'>('MATRIX')
  const [highlightEmployeeId, setHighlightEmployeeId] = useState<string | null>(null)

  const shiftsConfig = [
    { id: 'shift-001', name: 'Ca Sáng', time: '08:30 - 12:00', duration: '3.5h' },
    { id: 'shift-002', name: 'Ca Trưa', time: '12:00 - 17:00', duration: '5.0h' },
    { id: 'shift-003', name: 'Ca Tối', time: '17:00 - 22:00', duration: '5.0h' },
  ]

  const uniqueDates = React.useMemo(() => {
    const datesMap = new Map<string, string>()
    heatmapCells.forEach(c => {
      if (!datesMap.has(c.date)) {
        datesMap.set(c.date, c.dayOfWeek)
      }
    })
    return Array.from(datesMap.entries()).map(([date, dayOfWeek]) => ({
      date,
      dayOfWeek,
      formattedDate: date.slice(8, 10) + '/' + date.slice(5, 7),
    }))
  }, [heatmapCells])

  const thinShiftCount = React.useMemo(
    () => heatmapCells.filter(c => c.count < 2).length,
    [heatmapCells]
  )

  const fullCellCount = React.useMemo(
    () => heatmapCells.filter(c => c.count >= 2).length,
    [heatmapCells]
  )

  const missingEmployees = coverageData.missingEmployees
  const submittedEmployees = coverageData.submittedEmployees
  const activeHighlightedStaff = submittedEmployees.find(e => e.id === highlightEmployeeId)

  return (
    <div className="w-full space-y-3.5">
      {/* ─────────────────────────────────────────────────────────────
          DẢI A: NHẮC NHANH CHƯA NỘP LỊCH (Kiểu 1 — Tự ẩn khi đủ 100%)
         ───────────────────────────────────────────────────────────── */}
      {missingEmployees.length > 0 && (
        <div className="bg-rose-50/75 border border-rose-200/80 rounded-2xl px-4 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 shrink-0">
              <AlertCircle size={15} className="text-rose-600" />
              <span>
                Chưa nộp lịch (
                <span className="font-mono tabular-nums">{missingEmployees.length}</span>):
              </span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {missingEmployees.slice(0, 6).map(emp => (
                <span
                  key={emp.id}
                  className="bg-white border border-rose-200/70 text-gray-800 px-2 py-0.5 rounded-lg text-xs font-medium"
                  title={emp.positionName || 'Nhân viên F&B'}
                >
                  {emp.name}
                </span>
              ))}
              {missingEmployees.length > 6 && (
                <span className="text-xs font-semibold text-rose-700 font-mono tabular-nums px-1">
                  +{missingEmployees.length - 6} bạn khác
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('STAFF')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-rose-100/60 text-gray-700 border border-rose-200/80 transition cursor-pointer"
            >
              Xem danh sách
            </button>
            <button
              type="button"
              onClick={onOpenZaloModal}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-[#2F6FA8] hover:bg-[#1D3E61] text-white transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <MessageSquare size={12} />
              <span>Nhắc Zalo cả đội</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DẢI B: THANH ĐIỀU KHIỂN THỐNG NHẤT FULL-WIDTH + THẺ SOI LỊCH
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Chuyển Tab Chính */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('MATRIX')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'MATRIX'
                  ? 'bg-white text-[#2F6FA8] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Layers size={14} className={activeTab === 'MATRIX' ? 'text-[#2F6FA8]' : 'text-gray-500'} />
              <span>Theo Khung Ca (7 Ngày x 3 Ca)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('STAFF')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'STAFF'
                  ? 'bg-white text-[#2F6FA8] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Users size={14} className={activeTab === 'STAFF' ? 'text-[#2F6FA8]' : 'text-gray-500'} />
              <span>Theo Từng Nhân Viên</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-[#2F6FA8] font-bold font-mono tabular-nums">
                {staffOverview.length}
              </span>
            </button>
          </div>

          {/* Bộ Lọc Nhanh Theo Trạng Thái */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-medium text-gray-400 mr-1 flex items-center gap-1 shrink-0">
              <Filter size={11} /> Lọc:
            </span>

            <button
              type="button"
              onClick={() => onSelectFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${filterStatus === 'ALL'
                  ? 'bg-[#001D3D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Tất cả
            </button>

            <button
              type="button"
              onClick={() => onSelectFilterStatus('RISK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0 font-mono tabular-nums ${filterStatus === 'RISK'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/70'
                }`}
            >
              <AlertTriangle size={12} />
              <span className="font-sans">Cần bù ({thinShiftCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectFilterStatus('APPROVED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 font-mono tabular-nums ${filterStatus === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
                }`}
            >
              Đủ người ({fullCellCount})
            </button>
          </div>
        </div>

        {/* Hàng Soi Nhanh Nhân Sự Đã Nộp (Kiểu 1) */}
        {activeTab === 'MATRIX' && submittedEmployees.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-500 shrink-0">
              Soi lịch đã nộp (
              <span className="font-mono tabular-nums">{submittedEmployees.length}</span>):
            </span>

            {submittedEmployees.map(emp => {
              const isSelected = highlightEmployeeId === emp.id
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setHighlightEmployeeId(isSelected ? null : emp.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${isSelected
                      ? 'bg-[#2F6FA8] text-white border-[#2F6FA8] shadow-xs font-semibold'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#2F6FA8]/50 hover:text-[#001D3D]'
                    }`}
                  title={`Bấm để tô sáng các ca của ${emp.name}`}
                >
                  <span>{emp.name}</span>
                  <span
                    className={`font-mono tabular-nums text-[11px] font-bold ${isSelected ? 'text-blue-100' : 'text-[#2F6FA8]'
                      }`}
                  >
                    {emp.shiftCount || 0} ca
                  </span>
                </button>
              )
            })}

            {activeHighlightedStaff && (
              <button
                type="button"
                onClick={() => setHighlightEmployeeId(null)}
                className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 transition cursor-pointer"
              >
                <X size={12} />
                <span>Bỏ chọn</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: MA TRẬN PHỦ CA 7 NGÀY X 3 CA FULL-WIDTH (4 TRẠNG THÁI RÕ)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'MATRIX' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-gray-50/60 to-white">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-[#2F6FA8]" />
              <h3 id="registration-matrix-title" className="text-sm font-bold text-[#001D3D]">
                Ma Trận Phủ Ca Tuần ({uniqueDates.length} ngày x 3 ca)
              </h3>
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                — Bấm vào ô bất kỳ để xem chi tiết nhân sự rảnh khung giờ này
              </span>
            </div>

            {/* Chú thích 3 sắc thái rõ ràng */}
            <div className="flex items-center gap-3.5 text-xs font-medium flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-gray-700">Trống (0 bạn)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-gray-700">Ca mỏng (1 bạn)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-gray-700">Đủ người rảnh (&ge;2 bạn)</span>
              </div>
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="registration-matrix-title"
            className="overflow-x-auto p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6FA8]/40"
          >
            <table className="w-full border-separate border-spacing-0 min-w-[920px] table-fixed">
              <thead>
                <tr>
                  <th className="w-[116px] sticky left-0 z-20 bg-gray-50 p-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-l-xl border-b border-gray-100">
                    Khung Ca
                  </th>
                  {uniqueDates.map(d => (
                    <th
                      key={d.date}
                      className="p-2.5 text-center text-xs font-bold text-[#001D3D] bg-gray-50 last:rounded-r-xl border-b border-gray-100"
                    >
                      <div className="font-bold">{d.dayOfWeek}</div>
                      <div className="text-[11px] font-mono tabular-nums text-gray-500 font-normal">
                        {d.formattedDate}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shiftsConfig.map(shift => (
                  <tr key={shift.id} className="hover:bg-gray-50/25 transition">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white align-top p-2.5 border-b border-gray-100 text-left font-normal"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#001D3D] block">{shift.name}</span>
                        <span className="text-[10px] font-mono tabular-nums text-gray-500 block">
                          {shift.time}
                        </span>
                        <span className="inline-block text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                          {shift.duration}
                        </span>
                      </div>
                    </th>

                    {uniqueDates.map(d => {
                      const cell = heatmapCells.find(
                        c => c.date === d.date && c.shiftId === shift.id
                      )
                      if (!cell) {
                        return (
                          <td
                            key={d.date}
                            className="p-1.5 text-center text-gray-300 text-xs border-b border-gray-100"
                          >
                            —
                          </td>
                        )
                      }

                      const isEmpty = cell.count === 0
                      const isThin = cell.count === 1
                      const isEnough = cell.count >= 2

                      const isFilterDimmed =
                        (filterStatus === 'RISK' && cell.count >= 2) ||
                        (filterStatus === 'APPROVED' && cell.count < 2)

                      const hasHighlightedEmployee =
                        Boolean(highlightEmployeeId) &&
                        cell.registeredEmployees.some(e => e.id === highlightEmployeeId)
                      const isStaffDimmed = Boolean(highlightEmployeeId) && !hasHighlightedEmployee

                      const cellSurfaceClass = isEmpty
                        ? 'bg-rose-50/85 hover:bg-rose-50 border-rose-200 hover:border-rose-400'
                        : isThin
                          ? 'bg-amber-50/65 hover:bg-amber-50 border-amber-200 hover:border-amber-400'
                          : 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-400'

                      return (
                        <td key={d.date} className="p-1.5 align-top border-b border-gray-100">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectCell(cell)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onSelectCell(cell)
                              }
                            }}
                            aria-label={`${shift.name} ${d.dayOfWeek} ${d.formattedDate}: ${cell.count} bạn rảnh`}
                            className={`group relative rounded-xl p-2.5 border transition-all text-left cursor-pointer min-h-[116px] flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6FA8] ${isFilterDimmed || isStaffDimmed ? 'opacity-30' : ''
                              } ${hasHighlightedEmployee ? 'ring-2 ring-[#2F6FA8] ring-offset-1' : ''
                              } ${cellSurfaceClass}`}
                          >
                            {/* Header ô: Số lượng người rảnh + Nhãn mức phủ */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isEnough ? (
                                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                ) : (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${isEmpty ? 'bg-rose-500' : 'bg-amber-500'}`}
                                  />
                                )}
                                <span
                                  className={`text-xs font-bold font-mono tabular-nums ${isEmpty
                                      ? 'text-rose-700'
                                      : isThin
                                        ? 'text-amber-800'
                                        : 'text-emerald-800'
                                    }`}
                                >
                                  {cell.count} bạn
                                </span>
                              </div>

                              {isEmpty ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                                  Trống
                                </span>
                              ) : isThin ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                  Mỏng
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                  Đủ rảnh
                                </span>
                              )}
                            </div>

                            {/* Thân ô: Dòng nhân sự rảnh, phẳng thoáng mắt */}
                            <div className="space-y-1 flex-1">
                              {isEmpty ? (
                                <div className="h-full min-h-[44px] flex items-center justify-center gap-1 text-xs font-semibold text-rose-700">
                                  <AlertCircle size={12} />
                                  <span>Cần gọi bù</span>
                                </div>
                              ) : (
                                cell.registeredEmployees.slice(0, 4).map(emp => {
                                  const isEmpHighlighted = emp.id === highlightEmployeeId
                                  return (
                                    <div
                                      key={emp.registrationId}
                                      title={emp.name}
                                      className={`flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded-md text-xs transition ${isEmpHighlighted
                                          ? 'bg-[#2F6FA8] text-white font-semibold'
                                          : 'text-gray-800'
                                        }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${isEmpHighlighted
                                              ? 'bg-white'
                                              : isThin
                                                ? 'bg-amber-400'
                                                : 'bg-emerald-500'
                                            }`}
                                        />
                                        <span className="truncate font-medium">
                                          {formatShortStaffName(emp.name)}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })
                              )}

                              {cell.count > 4 && (
                                <div className="text-[11px] text-gray-500 font-medium pl-1.5 pt-0.5 font-mono tabular-nums">
                                  +{cell.count - 4} bạn khác
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: BẢNG TỔNG HỢP THEO TỪNG NHÂN VIÊN FULL-WIDTH
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'STAFF' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-gray-50/60 to-white">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2F6FA8]" />
              <h3 className="text-sm font-bold text-[#001D3D]">
                Danh Sách Nhân Viên Đăng Ký ({staffOverview.length} nhân sự)
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-medium font-mono tabular-nums">
              Đã nộp: <strong className="text-emerald-700">{coverageData.submittedCount}</strong> / Chưa nộp:{' '}
              <strong className="text-rose-700">
                {coverageData.totalEmployees - coverageData.submittedCount}
              </strong>
            </span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Danh sách nhân viên đăng ký ca"
            className="overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6FA8]/40"
          >
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="p-3 text-left text-xs font-bold text-gray-600">Nhân Viên</th>
                  <th className="p-3 text-left text-xs font-bold text-gray-600">Chức Vụ</th>
                  <th className="p-3 text-center text-xs font-bold text-gray-600">Trạng Thái</th>
                  <th className="p-3 text-center text-xs font-bold text-gray-600">Số Ca Rảnh</th>
                  <th className="p-3 text-center text-xs font-bold text-gray-600">Tổng Giờ Rảnh</th>
                  <th className="p-3 text-right text-xs font-bold text-gray-600">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {staffOverview.map(staff => {
                  const isSelected = highlightEmployeeId === staff.id

                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-gray-50/60 transition ${isSelected ? 'bg-blue-50/40' : ''
                        }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#2F6FA8]/10 text-[#2F6FA8] font-bold flex items-center justify-center text-xs font-mono shrink-0">
                            {staff.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-[#001D3D]">{staff.name}</div>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
                              <span>{staff.code || 'Chưa có mã'}</span>
                              {staff.phone && (
                                <span className="inline-flex items-center gap-0.5 text-gray-500">
                                  <Phone size={10} />
                                  {staff.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                          {staff.positionName}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {staff.hasSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Đã nộp lịch
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle size={11} /> Chưa nộp
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center font-mono tabular-nums font-bold text-[#001D3D]">
                        {staff.registeredCount > 0 ? `${staff.registeredCount} ca` : '—'}
                      </td>

                      <td className="p-3 text-center font-mono tabular-nums text-gray-700">
                        {staff.totalHours > 0 ? `${staff.totalHours}h` : '—'}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {staff.hasSubmitted && (
                            <button
                              type="button"
                              onClick={() => {
                                setHighlightEmployeeId(staff.id)
                                setActiveTab('MATRIX')
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                            >
                              Xem trên ma trận
                            </button>
                          )}

                          {!staff.hasSubmitted && (
                            <button
                              type="button"
                              onClick={onOpenZaloModal}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                            >
                              Nhắc Zalo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
