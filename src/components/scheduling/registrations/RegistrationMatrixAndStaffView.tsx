'use client'

import React, { useState } from 'react'
import {
  Layers,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Filter,
  Phone,
  MessageSquare,
  Sparkles,
  UserCheck,
  UserX,
  Calendar,
  X,
  ExternalLink,
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
  onApproveCell: (date: string, shiftId: string) => void
  onOpenZaloModal: () => void
  onApproveStaffAll: (staffId: string) => void
}

export default function RegistrationMatrixAndStaffView({
  selectedStoreId,
  selectedWeek,
  heatmapCells,
  staffOverview,
  coverageData,
  filterStatus,
  onSelectFilterStatus,
  onSelectCell,
  onApproveCell,
  onOpenZaloModal,
  onApproveStaffAll,
}: RegistrationMatrixAndStaffViewProps) {
  // Tab chính: 'MATRIX' (Theo Ca 7x3) hoặc 'STAFF' (Theo Nhân Viên)
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'STAFF'>('MATRIX')
  const [highlightEmployeeId, setHighlightEmployeeId] = useState<string | null>(null)

  // Danh sách 3 ca chuẩn Homies F&B
  const shiftsConfig = [
    { id: 'shift-001', name: 'Ca Sáng', time: '08:30 - 12:00', duration: '3.5h' },
    { id: 'shift-002', name: 'Ca Trưa', time: '12:00 - 17:00', duration: '5.0h' },
    { id: 'shift-003', name: 'Ca Tối', time: '17:00 - 22:00', duration: '5.0h' },
  ]

  // Danh sách 7 ngày trong tuần từ heatmapCells
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

  // Lọc heatmapCells theo filterStatus
  const filteredCells = React.useMemo(() => {
    if (filterStatus === 'ALL') return heatmapCells
    if (filterStatus === 'RISK') return heatmapCells.filter(c => c.status === 'RISK' || c.status === 'EMPTY')
    if (filterStatus === 'PENDING') return heatmapCells.filter(c => c.pendingCount > 0)
    if (filterStatus === 'APPROVED') return heatmapCells.filter(c => c.approvedCount > 0)
    return heatmapCells
  }, [heatmapCells, filterStatus])

  // Số lượng ca cần bù / ca mỏng
  const thinShiftCount = React.useMemo(() => {
    return heatmapCells.filter(c => c.status === 'RISK' || c.status === 'EMPTY').length
  }, [heatmapCells])

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* ─────────────────────────────────────────────────────────────
          CỘT TRÁI (8 / 12 CỘT): MA TRẬN 7X3 HOẶC BẢNG THEO NHÂN VIÊN
         ───────────────────────────────────────────────────────────── */}
      <div className="xl:col-span-8 space-y-4">
        {/* Navigation Tabs Bar + Quick Filter Chips */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Tab Switcher */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('MATRIX')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'MATRIX'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'STAFF'
                  ? 'bg-white text-[#2F6FA8] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={14} className={activeTab === 'STAFF' ? 'text-[#2F6FA8]' : 'text-gray-500'} />
              <span>Theo Từng Nhân Viên</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-[#2F6FA8] font-bold">
                {staffOverview.length}
              </span>
            </button>
          </div>

          {/* Quick Filter Status Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-medium text-gray-400 mr-1 flex items-center gap-1">
              <Filter size={11} /> Lọc:
            </span>

            <button
              type="button"
              onClick={() => onSelectFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                filterStatus === 'ALL'
                  ? 'bg-[#001D3D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>

            <button
              type="button"
              onClick={() => onSelectFilterStatus('RISK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                filterStatus === 'RISK'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <AlertTriangle size={12} />
              <span>Ca mỏng / Cần bù ({thinShiftCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectFilterStatus('PENDING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                filterStatus === 'PENDING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              Chờ duyệt
            </button>

            <button
              type="button"
              onClick={() => onSelectFilterStatus('APPROVED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                filterStatus === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              Đã duyệt
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            TAB 1: MA TRẬN NHIỆT ĐỘ PHỦ CA 7 NGÀY X 3 CA
           ───────────────────────────────────────────────────────── */}
        {activeTab === 'MATRIX' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {/* Header thông tin ma trận */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-gray-50/60 to-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2F6FA8]" />
                <h3 className="text-sm font-bold text-[#001D3D]">
                  Ma Trận Phủ Ca Tuần ({uniqueDates.length} ngày x 3 ca)
                </h3>
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  — Bấm vào ô bất kỳ để xem chi tiết hoặc duyệt từng bạn
                </span>
              </div>

              {/* Legend trạng thái ca */}
              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-700">Đủ ca (≥2 bạn)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-gray-700">Ca mỏng (1 bạn)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-gray-700">Trống (0 bạn)</span>
                </div>
              </div>
            </div>

            {/* Bảng ma trận 7x3 cuộn ngang khi màn hình nhỏ */}
            <div className="overflow-x-auto p-4">
              <table className="w-full border-collapse min-w-[760px]">
                <thead>
                  <tr>
                    <th className="w-28 p-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/80 rounded-l-xl">
                      Khung Ca
                    </th>
                    {uniqueDates.map(d => (
                      <th
                        key={d.date}
                        className="p-2.5 text-center text-xs font-bold text-[#001D3D] bg-gray-50/80 first:rounded-l-none last:rounded-r-xl"
                      >
                        <div className="font-bold">{d.dayOfWeek}</div>
                        <div className="text-[11px] font-mono text-gray-500 font-normal">{d.formattedDate}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shiftsConfig.map(shift => {
                    return (
                      <tr key={shift.id} className="hover:bg-gray-50/30 transition">
                        {/* Cột tiêu đề Khung Ca */}
                        <td className="p-2.5 align-top">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-[#001D3D] block">{shift.name}</span>
                            <span className="text-[10px] font-mono text-gray-500 block">{shift.time}</span>
                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                              {shift.duration}
                            </span>
                          </div>
                        </td>

                        {/* 7 ô tương ứng 7 ngày */}
                        {uniqueDates.map(d => {
                          const cell = heatmapCells.find(c => c.date === d.date && c.shiftId === shift.id)
                          if (!cell) {
                            return (
                              <td key={d.date} className="p-1.5 text-center text-gray-300 text-xs">
                                —
                              </td>
                            )
                          }

                          // Kiểm tra xem ô có khớp với bộ lọc không
                          const isDimmed =
                            (filterStatus === 'RISK' && cell.status === 'FULL') ||
                            (filterStatus === 'PENDING' && cell.pendingCount === 0) ||
                            (filterStatus === 'APPROVED' && cell.approvedCount === 0)

                          // Highlight nếu nhân viên đang được chọn có đăng ký ô này
                          const isHighlighted =
                            highlightEmployeeId &&
                            cell.registeredEmployees.some(e => e.id === highlightEmployeeId)

                          return (
                            <td key={d.date} className="p-1.5 align-top">
                              <div
                                onClick={() => onSelectCell(cell)}
                                className={`group relative p-2 rounded-xl transition-all border text-left cursor-pointer min-h-[96px] flex flex-col justify-between ${
                                  isDimmed ? 'opacity-30' : ''
                                } ${
                                  isHighlighted ? 'ring-2 ring-[#2F6FA8] ring-offset-1' : ''
                                } ${
                                  cell.status === 'FULL'
                                    ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/80 hover:border-emerald-400 hover:shadow-xs'
                                    : cell.status === 'RISK'
                                    ? 'bg-amber-50/60 hover:bg-amber-50 border-amber-200/90 hover:border-amber-400 hover:shadow-xs'
                                    : 'bg-rose-50/50 hover:bg-rose-50 border-rose-200/80 hover:border-rose-400 hover:shadow-xs'
                                }`}
                              >
                                {/* Header ô: Số lượng + Tình trạng */}
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        cell.status === 'FULL'
                                          ? 'bg-emerald-500'
                                          : cell.status === 'RISK'
                                          ? 'bg-amber-500'
                                          : 'bg-rose-500'
                                      }`}
                                    />
                                    <span
                                      className={`text-xs font-bold font-mono tabular-nums ${
                                        cell.status === 'FULL'
                                          ? 'text-emerald-800'
                                          : cell.status === 'RISK'
                                          ? 'text-amber-800'
                                          : 'text-rose-700'
                                      }`}
                                    >
                                      {cell.count} bạn
                                    </span>
                                  </div>

                                  {/* Tiến độ duyệt: approved/total */}
                                  {cell.count > 0 && (
                                    <span
                                      className={`text-[10px] font-mono px-1 py-0.2 rounded font-medium ${
                                        cell.approvedCount === cell.count
                                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                                          : 'bg-white/80 text-gray-600'
                                      }`}
                                    >
                                      {cell.approvedCount}/{cell.count}
                                    </span>
                                  )}
                                </div>

                                {/* Danh sách nhân viên trong ô */}
                                <div className="space-y-1 my-auto">
                                  {cell.count === 0 ? (
                                    <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                                      <AlertCircle size={11} /> Cần gọi bù
                                    </div>
                                  ) : (
                                    cell.registeredEmployees.slice(0, 3).map(emp => {
                                      const isEmpHighlighted = emp.id === highlightEmployeeId
                                      return (
                                        <div
                                          key={emp.registrationId}
                                          className={`text-[11px] px-1.5 py-0.5 rounded flex items-center justify-between gap-1 transition ${
                                            isEmpHighlighted
                                              ? 'bg-[#2F6FA8] text-white font-bold'
                                              : emp.status === 'APPROVED'
                                              ? 'bg-white/90 text-gray-800 border border-emerald-200'
                                              : 'bg-white/80 text-gray-700'
                                          }`}
                                        >
                                          <span className="truncate max-w-[70px] font-medium" title={emp.name}>
                                            {emp.name.split(' ').slice(-2).join(' ')}
                                          </span>
                                          {emp.status === 'APPROVED' ? (
                                            <Check size={10} className="text-emerald-600 shrink-0" />
                                          ) : (
                                            <Clock size={10} className="text-amber-500 shrink-0" />
                                          )}
                                        </div>
                                      )
                                    })
                                  )}

                                  {cell.count > 3 && (
                                    <span className="text-[10px] text-gray-500 font-medium pl-1">
                                      +{cell.count - 3} bạn nữa...
                                    </span>
                                  )}
                                </div>

                                {/* Nút thao tác nhanh khi hover */}
                                <div className="pt-1.5 mt-1 border-t border-black/5 flex items-center justify-between">
                                  <span className="text-[10px] text-gray-500 group-hover:text-[#2F6FA8] font-medium flex items-center gap-0.5">
                                    <Eye size={10} /> Chi tiết
                                  </span>

                                  {cell.pendingCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation()
                                        onApproveCell(cell.date, cell.shiftId)
                                      }}
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs flex items-center gap-0.5"
                                      title="Duyệt tất cả bạn trong ca này"
                                    >
                                      <Check size={9} /> Duyệt ô
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 2: BẢNG TỔNG HỢP THEO TỪNG NHÂN VIÊN
           ───────────────────────────────────────────────────────── */}
        {activeTab === 'STAFF' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-gray-50/60 to-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2F6FA8]" />
                <h3 className="text-sm font-bold text-[#001D3D]">
                  Danh Sách Nhân Viên Đăng Ký ({staffOverview.length} nhân sự)
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Đã nộp: <strong className="text-emerald-700">{coverageData.submittedCount}</strong> / Chưa nộp:{' '}
                <strong className="text-rose-700">{coverageData.totalEmployees - coverageData.submittedCount}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="p-3 text-left text-xs font-bold text-gray-600">Nhân Viên</th>
                    <th className="p-3 text-left text-xs font-bold text-gray-600">Chức Vụ</th>
                    <th className="p-3 text-center text-xs font-bold text-gray-600">Trạng Thái</th>
                    <th className="p-3 text-center text-xs font-bold text-gray-600">Tổng Ca</th>
                    <th className="p-3 text-center text-xs font-bold text-gray-600">Giờ Dự Kiến</th>
                    <th className="p-3 text-center text-xs font-bold text-gray-600">Tiến Độ Duyệt</th>
                    <th className="p-3 text-right text-xs font-bold text-gray-600">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {staffOverview.map(staff => {
                    const isSelected = highlightEmployeeId === staff.id

                    return (
                      <tr
                        key={staff.id}
                        className={`hover:bg-gray-50/60 transition ${
                          isSelected ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* Tên nhân viên + Mã */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#2F6FA8]/10 text-[#2F6FA8] font-bold flex items-center justify-center text-xs font-mono">
                              {staff.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold text-[#001D3D]">{staff.name}</div>
                              <div className="text-[11px] font-mono text-gray-400">
                                {staff.code || 'Chưa có mã'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Chức vụ */}
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                            {staff.positionName}
                          </span>
                        </td>

                        {/* Trạng thái nộp */}
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

                        {/* Tổng ca */}
                        <td className="p-3 text-center font-mono font-bold text-[#001D3D]">
                          {staff.registeredCount > 0 ? `${staff.registeredCount} ca` : '—'}
                        </td>

                        {/* Tổng giờ dự kiến */}
                        <td className="p-3 text-center font-mono text-gray-700">
                          {staff.totalHours > 0 ? `${staff.totalHours}h` : '—'}
                        </td>

                        {/* Tiến độ duyệt */}
                        <td className="p-3 text-center">
                          {staff.registeredCount > 0 ? (
                            <div className="inline-flex items-center gap-1 font-mono text-xs">
                              <span className="font-bold text-emerald-700">{staff.approvedCount}</span>
                              <span className="text-gray-400">/</span>
                              <span className="text-gray-600">{staff.registeredCount}</span>
                              {staff.pendingCount > 0 && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                  {staff.pendingCount} chờ
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {staff.hasSubmitted && (
                              <button
                                type="button"
                                onClick={() => {
                                  setHighlightEmployeeId(staff.id)
                                  setActiveTab('MATRIX')
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                              >
                                Xem trên ma trận
                              </button>
                            )}

                            {staff.pendingCount > 0 && (
                              <button
                                type="button"
                                onClick={() => onApproveStaffAll(staff.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
                              >
                                Duyệt hết ({staff.pendingCount})
                              </button>
                            )}

                            {!staff.hasSubmitted && (
                              <button
                                type="button"
                                onClick={onOpenZaloModal}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
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

      {/* ─────────────────────────────────────────────────────────────
          CỘT PHẢI (4 / 12 CỘT): THEO DÕI ĐÃ NỘP & CHƯA NỘP LỊCH
         ───────────────────────────────────────────────────────────── */}
      <div className="xl:col-span-4 space-y-4">
        {/* Card 1: Danh sách nhân sự CHƯA nộp lịch (Cần hành động ngay) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-sm font-bold text-[#001D3D]">
                Chưa Nộp Lịch Tuần Tới ({coverageData.missingEmployees.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={onOpenZaloModal}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#2F6FA8] hover:bg-blue-100 transition border border-blue-200/80 flex items-center gap-1 shadow-2xs"
            >
              <MessageSquare size={12} />
              <span>Nhắc Zalo cả đội</span>
            </button>
          </div>

          {coverageData.missingEmployees.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <div className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                <CheckCircle2 size={14} /> Hoàn hảo! 100% nhân sự đã nộp lịch
              </div>
              <p className="text-[11px] text-emerald-600">
                Tất cả các bạn đã đăng ký khung giờ rảnh đầy đủ cho tuần này.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {coverageData.missingEmployees.map(emp => (
                <div
                  key={emp.id}
                  className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50/60 transition flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-900 truncate">{emp.name}</span>
                      {emp.code && (
                        <span className="text-[10px] font-mono text-gray-400">({emp.code})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span>{emp.positionName || 'Nhân viên F&B'}</span>
                      {emp.phone && (
                        <span className="text-gray-400 font-mono flex items-center gap-0.5">
                          <Phone size={10} /> {emp.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenZaloModal}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white text-rose-700 hover:bg-rose-100 border border-rose-200 transition shrink-0"
                  >
                    Nhắc
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Danh sách nhân sự ĐÃ nộp lịch rảnh (Xếp theo số ca nộp) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-[#001D3D]">
                Đã Nộp Lịch Rảnh ({coverageData.submittedEmployees.length})
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-medium">Bấm để lọc ca</span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {coverageData.submittedEmployees.map(emp => {
              const isSelected = highlightEmployeeId === emp.id

              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    if (isSelected) {
                      setHighlightEmployeeId(null)
                    } else {
                      setHighlightEmployeeId(emp.id)
                      setActiveTab('MATRIX')
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#2F6FA8] bg-blue-50/80 shadow-xs'
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                        isSelected ? 'bg-[#2F6FA8] text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {emp.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{emp.name}</div>
                      <div className="text-[10px] font-mono text-gray-400">
                        {emp.code || 'Mã NV'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold font-mono text-[#001D3D] px-2 py-0.5 rounded-full bg-gray-100">
                      {emp.shiftCount || 0} ca
                    </span>

                    {isSelected && (
                      <span className="text-[10px] font-bold text-[#2F6FA8] bg-blue-100 px-1.5 py-0.5 rounded">
                        Đang chọn
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {highlightEmployeeId && (
            <button
              type="button"
              onClick={() => setHighlightEmployeeId(null)}
              className="w-full py-1.5 text-center text-xs font-bold text-gray-500 hover:text-gray-800 transition"
            >
              Hủy chọn / Hiện tất cả nhân viên
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

