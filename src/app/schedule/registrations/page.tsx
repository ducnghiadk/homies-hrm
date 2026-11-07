'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import {
  ShiftRegistrationService,
  type HeatmapCell,
  type CoverageRateResult,
} from '@/lib/services/scheduling/shift-registration-service'
import { mockStores } from '@/lib/mock-data'
import { getMondayOfDate, formatDateString } from '@/lib/mock-data-registration-weeks'
import {
  CalendarDays,
  Store,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Calendar,
  Layers,
  X,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'

export default function ShiftRegistrationsHeatmapPage() {

  // 1. Quản lý Tuần được chọn
  const today = useMemo(() => new Date(), [])
  const thisMon = useMemo(() => getMondayOfDate(today), [today])
  const nextMon = useMemo(() => {
    const d = new Date(thisMon)
    d.setDate(thisMon.getDate() + 7)
    return d
  }, [thisMon])

  const thisMonStr = useMemo(() => formatDateString(thisMon), [thisMon])
  const nextMonStr = useMemo(() => formatDateString(nextMon), [nextMon])

  // Mặc định chọn Tuần tới (đúng thực tế xếp lịch của Store Manager)
  const [selectedWeek, setSelectedWeek] = useState<string>(nextMonStr)
  // Mặc định chọn Store 429 hoặc HBP
  const [selectedStoreId, setSelectedStoreId] = useState<string>('store-002')

  // State tương tác UI
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null)
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false)
  const [copiedZalo, setCopiedZalo] = useState(false)
  const [approveNotice, setApproveNotice] = useState<{ count: number } | null>(null)
  const [dataVersion, setDataVersion] = useState(0)

  // Tự động đồng bộ ca đăng ký từ Database máy chủ
  useEffect(() => {
    if (selectedStoreId && selectedWeek) {
      ShiftRegistrationService.syncRegistrationsFromServer(selectedStoreId, selectedWeek).then(() => {
        setDataVersion(v => v + 1)
      })
    }
  }, [selectedStoreId, selectedWeek])

  // 2. Lấy dữ liệu Coverage & Heatmap
  const coverageData: CoverageRateResult = useMemo(() => {
    return ShiftRegistrationService.getCoverageRate(selectedStoreId, selectedWeek)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, selectedWeek, dataVersion])

  const heatmapCells: HeatmapCell[] = useMemo(() => {
    return ShiftRegistrationService.getHeatmapData(selectedStoreId, selectedWeek)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, selectedWeek, dataVersion])

  // Tổ chức ma trận theo 3 ca: Sáng, Chiều, Tối
  const matrixByShift = useMemo(() => {
    const shifts = [
      { id: 'shift-001', name: 'Ca Sáng', time: '08:30 - 12:00' },
      { id: 'shift-002', name: 'Ca Trưa', time: '12:00 - 17:00' },
      { id: 'shift-003', name: 'Ca Tối', time: '17:00 - 22:00' },
    ]

    return shifts.map(shift => {
      const rowCells = heatmapCells.filter(c => c.shiftId === shift.id)
      return {
        ...shift,
        cells: rowCells,
      }
    })
  }, [heatmapCells])

  // Thống kê tổng quan tình trạng tuần
  const stats = useMemo(() => {
    const totalCells = heatmapCells.length
    const emptyCount = heatmapCells.filter(c => c.status === 'EMPTY').length
    const riskCount = heatmapCells.filter(c => c.status === 'RISK').length
    const fullCount = heatmapCells.filter(c => c.status === 'FULL').length
    return { totalCells, emptyCount, riskCount, fullCount }
  }, [heatmapCells])

  // Chi nhánh đang chọn
  const currentStore = mockStores.find(s => s.id === selectedStoreId) || mockStores[0]

  // Chuỗi tin nhắn Zalo mẫu
  const zaloMessage = useMemo(() => {
    const missingNames = coverageData.missingEmployees.map(e => e.name).join(', ')
    return `📢 [HOMIES MILK TEA] NHẮC NỘP LỊCH RẢNH TUẦN TỚI (${selectedWeek})
Thân gửi các bạn: ${missingNames || 'Tất cả nhân viên'}
Hiện tại chi nhánh ${currentStore?.name || 'Homies Milk Tea'} đang chốt lịch làm việc cho tuần tới. Các bạn vui lòng vào app HRM tại mục "Lịch của tôi & Đăng ký ca" để đăng ký giờ rảnh trước 18:00 hôm nay nhé!
Cảm ơn các bạn nhiều! 🧋`
  }, [coverageData.missingEmployees, selectedWeek, currentStore])

  // Xử lý 1-chạm: Chấp thuận & Điền nhanh vào Bảng Xếp Ca
  const handleApproveAll = () => {
    const result = ShiftRegistrationService.approveAllPendingForWeek(selectedStoreId, selectedWeek)
    setDataVersion(v => v + 1)
    setApproveNotice({ count: result.approvedCount })
    if (result.approvedCount === 0) {
      alert('Tất cả các ca đăng ký của tuần này đã được chấp thuận hoặc chưa có đăng ký mới.')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(zaloMessage)
    setCopiedZalo(true)
    setTimeout(() => setCopiedZalo(false), 2000)
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[#FFF8E8]/40 pb-16">
        {/* Top Sticky Header */}
        <div className="bg-white border-b border-amber-100/80 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-800/70 font-medium mb-1">
                <Link href="/schedule" className="hover:underline flex items-center gap-1">
                  <CalendarDays size={13} /> Lịch làm việc
                </Link>
                <span>/</span>
                <span className="text-amber-900 font-semibold">Duyệt đăng ký & Bản đồ thời gian trống</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Duyệt Đăng Ký Ca & Bản Đồ Thời Gian Trống
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Radar Tuyển Ca
                </span>
              </h1>
            </div>

            {/* Nút thao tác chính: 1-Chạm Fill Bảng Xếp Lịch */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleApproveAll}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all hover:shadow cursor-pointer active:scale-98"
                title="Tự động chấp thuận và chuyển toàn bộ đăng ký vào Bảng Xếp Lịch chính thức"
              >
                <Sparkles size={16} className="text-amber-200 animate-pulse" />
                Chấp thuận & Điền nhanh vào Bảng Xếp Ca
              </button>

              <Link
                href="/schedule"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-medium text-xs sm:text-sm transition-colors"
              >
                Xem Bảng Lịch <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Thông báo kết quả Approve 1-chạm */}
        {approveNotice && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>
                  Đã tự động chấp thuận và điền <strong>{approveNotice.count}</strong> ca vào Bảng Xếp Lịch Tuần của{' '}
                  <strong>{currentStore.name}</strong>!
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/schedule"
                  className="font-bold underline hover:text-emerald-900 text-xs flex items-center gap-1"
                >
                  Kiểm tra ngay <ExternalLink size={12} />
                </Link>
                <button
                  onClick={() => setApproveNotice(null)}
                  className="p-1 text-emerald-600 hover:text-emerald-800 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
          {/* Bộ lọc: Chọn Tuần & Chọn Chi Nhánh */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Store size={15} className="text-amber-600" />
                <span>Chi nhánh:</span>
              </div>
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
                {mockStores.map(store => {
                  const isActive = selectedStoreId === store.id
                  return (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStoreId(store.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-amber-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {store.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Calendar size={15} className="text-amber-600" />
                <span>Kỳ xếp lịch:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedWeek(thisMonStr)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    selectedWeek === thisMonStr
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tuần hiện tại ({thisMonStr})
                </button>
                <button
                  onClick={() => setSelectedWeek(nextMonStr)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    selectedWeek === nextMonStr
                      ? 'bg-amber-500 border-amber-600 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tuần tới ({nextMonStr}) ⭐
                </button>
              </div>
            </div>
          </div>

          {/* Phần 1: Thống Kê Độ Phủ Ca (Staffing Coverage Rate) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Tỷ lệ nộp lịch */}
            <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users size={14} className="text-amber-600" />
                    Độ phủ đăng ký (Staffing Coverage Rate)
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      coverageData.ratePercent >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : coverageData.ratePercent >= 50
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {coverageData.ratePercent}%
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {coverageData.submittedCount}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    / {coverageData.totalEmployees} nhân sự đã nộp lịch rảnh
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      coverageData.ratePercent >= 80
                        ? 'bg-emerald-500'
                        : coverageData.ratePercent >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${coverageData.ratePercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Tuần bắt đầu: <strong className="font-mono text-slate-700">{selectedWeek}</strong></span>
                <span>{coverageData.missingEmployees.length} bạn chưa nộp</span>
              </div>
            </div>

            {/* Danh sách bạn CHƯA NỘP & Nút Nhắc Nhở Zalo */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Nhân sự chưa nộp lịch tuần tới ({coverageData.missingEmployees.length})
                    </h3>
                  </div>

                  {coverageData.missingEmployees.length > 0 && (
                    <button
                      onClick={() => setIsZaloModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <MessageCircle size={14} className="text-blue-600" />
                      Nhắc nộp lịch qua Zalo/App
                    </button>
                  )}
                </div>

                {coverageData.missingEmployees.length === 0 ? (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Tuyệt vời! 100% nhân sự chi nhánh đã hoàn tất gửi lịch rảnh cho tuần tới.</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {coverageData.missingEmployees.map(emp => (
                      <span
                        key={emp.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
                        title={`Mã NV: ${emp.code}${emp.phone ? ` • SĐT: ${emp.phone}` : ''}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {emp.name}
                        <span className="text-[10px] text-rose-500 font-mono">({emp.code})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Chú thích màu Radar Heatmap */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
                <span className="font-bold text-slate-600">Trạng thái ca:</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> 🟢 Đủ người (&ge; 2 bạn)
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                  <span className="w-3 h-3 rounded-full bg-amber-500" /> 🟡 Nguy cơ thiếu (1 bạn)
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold animate-pulse">
                  <span className="w-3 h-3 rounded-full bg-rose-500" /> 🔴 Lủng ca (0 bạn)
                </span>
              </div>
            </div>
          </div>

          {/* Phần 2: Ma Trận Nhiệt Thời Gian Rảnh (Availability Heatmap) */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-amber-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-amber-50/40 to-transparent">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-amber-600" />
                  Ma Trận Nhiệt Độ Phủ Ca Tuần (7 Ngày x 3 Ca)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm vào từng ô ca để xem danh sách nhân sự đã đăng ký rảnh
                </p>
              </div>

              {/* Badge tổng quan lủng ca */}
              <div className="flex items-center gap-2 text-xs">
                {stats.emptyCount > 0 ? (
                  <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold border border-rose-300 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-rose-600" />
                    Phát hiện {stats.emptyCount} ca lủng người!
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Không có ca nào bị lủng!
                  </span>
                )}
              </div>
            </div>

            {/* Grid Ma trận */}
            <div className="overflow-x-auto p-4 sm:p-6">
              <table className="w-full border-collapse min-w-[760px]">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-36 border-b border-slate-200">
                      Khung Ca
                    </th>
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map((day, idx) => {
                      const mondayDate = new Date(`${selectedWeek}T00:00:00`)
                      const cur = new Date(mondayDate)
                      cur.setDate(mondayDate.getDate() + idx)
                      const dateShort = `${cur.getDate()}/${cur.getMonth() + 1}`
                      return (
                        <th
                          key={day}
                          className="p-3 text-center text-xs font-bold text-slate-700 border-b border-slate-200 bg-slate-50/50"
                        >
                          <div className="text-slate-900 font-extrabold">{day}</div>
                          <div className="text-[11px] text-slate-400 font-mono font-normal">{dateShort}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrixByShift.map(shiftRow => (
                    <tr key={shiftRow.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-3 align-middle border-r border-slate-100">
                        <div className="font-bold text-slate-900 text-xs">{shiftRow.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Clock size={10} /> {shiftRow.time}
                        </div>
                      </td>

                      {shiftRow.cells.map(cell => {
                        const isFull = cell.status === 'FULL'
                        const isRisk = cell.status === 'RISK'
                        const isEmpty = cell.status === 'EMPTY'

                        return (
                          <td key={cell.date + cell.shiftId} className="p-2 align-middle">
                            <button
                              onClick={() => setSelectedCell(cell)}
                              className={`w-full p-2.5 rounded-xl border text-center transition-all cursor-pointer hover:shadow-xs active:scale-97 flex flex-col items-center justify-center gap-1 ${
                                isFull
                                  ? 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300 text-emerald-900'
                                  : isRisk
                                  ? 'bg-amber-50/90 border-amber-200 hover:border-amber-300 text-amber-900'
                                  : 'bg-rose-50/90 border-rose-300 hover:border-rose-400 text-rose-900 animate-pulse'
                              }`}
                            >
                              <div className="flex items-center gap-1 text-xs font-extrabold font-mono">
                                {isFull && <span className="text-emerald-600">🟢 {cell.count} bạn</span>}
                                {isRisk && <span className="text-amber-700">🟡 {cell.count} bạn</span>}
                                {isEmpty && <span className="text-rose-700 font-black">🔴 0 bạn</span>}
                              </div>

                              <div className="text-[10px] text-slate-500 truncate max-w-[90px]">
                                {cell.registeredEmployees.length > 0
                                  ? cell.registeredEmployees.map(e => e.name.split(' ').pop()).join(', ')
                                  : 'Cần gọi bù!'}
                              </div>
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Xem Danh Sách Đăng Ký Ô Ca */}
        {selectedCell && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-amber-100 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    {selectedCell.shiftName} ({selectedCell.timeRange})
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedCell.dateLabel}</h3>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Số bạn đã đăng ký:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                      selectedCell.count >= 2
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedCell.count === 1
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedCell.count} nhân sự
                  </span>
                </div>

                {selectedCell.registeredEmployees.length === 0 ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={15} /> Ca này chưa có ai đăng ký rảnh!
                    </p>
                    <p className="mt-1 text-rose-600">
                      Store Manager hãy chủ động điều động nhân sự Part-time hoặc gọi nhân viên chi nhánh khác bù ca.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedCell.registeredEmployees.map(emp => (
                      <div
                        key={emp.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {emp.code} • {emp.positionName}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Đã đăng ký
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedCell(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Soạn Tin Nhắn Zalo Nhắc Nộp Lịch */}
        {isZaloModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-amber-100 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Mẫu Tin Nhắn Nhắc Nộp Lịch Zalo</h3>
                    <p className="text-xs text-slate-500">Gửi cho nhóm Zalo quán Homies {currentStore.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsZaloModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Nội dung tin nhắn chuẩn F&B:</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-line font-sans leading-relaxed">
                  {zaloMessage}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Đã tag {coverageData.missingEmployees.length} bạn chưa nộp</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsZaloModalOpen(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    {copiedZalo ? (
                      <>
                        <Check size={14} /> Đã sao chép!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Sao chép tin nhắn
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
