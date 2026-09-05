'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BSCTeamBonusSummary } from '@/lib/bsc-types'
import {
  Users,
  AlertCircle,
  CheckCircle2,
  Search,
  FileSearch,
  Download,
  HelpCircle,
  X,
  Trophy,
  Lock,
  Sliders,
} from 'lucide-react'

interface BSCTeamTableProps {
  summary: BSCTeamBonusSummary
  selectedEmployeeId?: string
  onSelectEmployee?: (empId: string) => void
  onOpenDetailModal?: (empId: string) => void
}

export default function BSCTeamTable({
  summary,
  selectedEmployeeId,
  onSelectEmployee,
  onOpenDetailModal,
}: BSCTeamTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'eligible' | 'locked'>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'bonus_desc' | 'bonus_asc' | 'hours_desc' | 'error_desc' | 'name_asc'>('bonus_desc')

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  // Cấp bậc duy nhất cho bộ lọc dropdown
  const uniqueLevels = Array.from(new Set(summary.individual_results.map(r => r.level_label))).filter(Boolean)

  // Tìm mức thưởng cao nhất để gắn huy hiệu Top 1
  const maxBonus = Math.max(...summary.individual_results.map(r => r.bonus_amount), 0)

  // Màu huy hiệu cấp bậc
  const getRankBadgeClass = (label: string) => {
    const lower = label.toLowerCase()
    if (lower.includes('trưởng') || lower.includes('leader') || lower.includes('quản lý')) {
      return 'bg-primary-50 text-[#2F6FA8] border border-primary-200/80'
    }
    if (lower.includes('chính') || lower.includes('full') || lower.includes('bậc 2') || lower.includes('bậc 3')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
    }
    return 'bg-amber-50 text-amber-800 border border-amber-200/80'
  }

  // Xuất file CSV / Excel nhanh
  const handleExportCsv = () => {
    const headers = [
      'Mã NV',
      'Tên nhân viên',
      'Cấp bậc',
      'Hệ số bậc',
      'Giờ làm (h)',
      'Lỗi cá nhân',
      'Hệ số lỗi',
      'Điểm chia',
      'Tỷ lệ %',
      'Thưởng BSC (VNĐ)',
      'Trạng thái',
      'Lý do khóa thưởng',
    ]
    const rows = filteredResults.map(emp => [
      emp.employee_id,
      `"${emp.employee_name}"`,
      emp.level_label,
      emp.rank_coefficient,
      emp.work_hours,
      emp.personal_error_count,
      emp.personal_coefficient,
      emp.personal_share_points,
      `${emp.share_percentage}%`,
      emp.bonus_amount,
      emp.bonus_amount > 0 ? 'Đủ điều kiện' : 'Khóa thưởng',
      `"${emp.lock_reason || ''}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Bang_Thuong_BSC_${summary.store_name || 'Homies'}_${summary.period || 'KyNay'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Lọc và Sắp xếp danh sách
  const filteredResults = summary.individual_results
    .filter(emp => {
      // Tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchName = emp.employee_name.toLowerCase().includes(term)
        const matchId = emp.employee_id.toLowerCase().includes(term)
        if (!matchName && !matchId) return false
      }

      // Lọc trạng thái
      if (statusFilter === 'eligible' && emp.bonus_amount <= 0) return false
      if (statusFilter === 'locked' && emp.bonus_amount > 0) return false

      // Lọc cấp bậc
      if (levelFilter !== 'all' && emp.level_label !== levelFilter) return false

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'bonus_desc':
          return b.bonus_amount - a.bonus_amount
        case 'bonus_asc':
          return a.bonus_amount - b.bonus_amount
        case 'hours_desc':
          return b.work_hours - a.work_hours
        case 'error_desc':
          return b.personal_error_count - a.personal_error_count
        case 'name_asc':
          return a.employee_name.localeCompare(b.employee_name)
        default:
          return 0
      }
    })

  return (
    <div className="card p-5 sm:p-6 space-y-4 rounded-2xl border border-gray-100 shadow-xs bg-white">
      {/* ── HEADER BẢNG ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#001D3D] tracking-tight flex items-center gap-2">
              <span>Bảng Ma Trận Phân Chia Quỹ Thưởng Toàn Đội</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Hiện có <strong className="text-emerald-700 font-mono font-bold">{summary.eligible_employee_count}</strong>/{summary.total_employee_count} nhân sự đủ điều kiện nhận thưởng (Tổng điểm: <strong className="text-[#2F6FA8] font-mono font-bold">{summary.total_team_share_points} điểm</strong>).
            </p>
          </div>
        </div>

        {/* Nút Cài Đặt + Xuất Excel + Đếm số lượng */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => router.push('/settings/bsc?tab=roles')}
            className="px-3 py-2 min-h-[40px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Cài đặt hệ số cấp bậc nhân sự"
          >
            <Sliders size={13} className="text-[#2F6FA8]" />
            <span>Cài Đặt Cấp Bậc ↗</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 min-h-[40px] rounded-xl bg-primary-50 hover:bg-primary-100 text-[#2F6FA8] border border-primary-200/60 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
            title="Tải bảng thưởng dạng file Excel/CSV"
          >
            <Download size={14} />
            <span>Xuất Excel</span>
          </button>
          <div className="text-xs font-semibold text-gray-600 bg-vanilla-50 px-3.5 py-2 min-h-[40px] rounded-xl border border-vanilla-200/80 flex items-center">
            Hiển thị: <strong className="text-gray-900 font-mono tabular-nums ml-1">{filteredResults.length}/{summary.individual_results.length}</strong>
          </div>
        </div>
      </div>

      {/* Dải thông báo nhẹ nhàng khi tổng thưởng đang bằng 0 */}
      {summary.total_distributed_bonus_amount === 0 && (
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-3 text-xs text-blue-900 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-[#2F6FA8] shrink-0" />
            <span>
              Quỹ thưởng đang khóa (0 đ). Số tiền thưởng sẽ tự động phân bổ theo giờ làm &amp; hệ số cấp bậc ngay khi doanh thu đạt mốc hòa vốn.
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/settings/bsc?tab=roles')}
            className="text-xs font-bold text-[#2F6FA8] hover:underline cursor-pointer ml-auto"
          >
            Xem bảng hệ số chức vụ ➔
          </button>
        </div>
      )}

      {/* ── TOOLBAR: Tìm kiếm & Bộ lọc ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-1">
        {/* Search Input */}
        <div className="lg:col-span-4 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm tên hoặc mã nhân sự..."
            className="w-full pl-9 pr-8 py-2 min-h-[44px] rounded-xl text-xs font-medium border border-gray-200 bg-gray-50/70 focus:bg-white focus:border-[#2F6FA8] focus:outline-none transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Status */}
        <div className="lg:col-span-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | 'eligible' | 'locked')}
            className="w-full px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold border border-gray-200 bg-gray-50/70 text-gray-800 focus:bg-white focus:border-[#2F6FA8] focus:outline-none transition cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="eligible">Đủ điều kiện thưởng (Bonus &gt; 0)</option>
            <option value="locked">Bị khóa thưởng (0 đ)</option>
          </select>
        </div>

        {/* Filter Level */}
        <div className="lg:col-span-2">
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="w-full px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold border border-gray-200 bg-gray-50/70 text-gray-800 focus:bg-white focus:border-[#2F6FA8] focus:outline-none transition cursor-pointer"
          >
            <option value="all">Tất cả cấp bậc</option>
            {uniqueLevels.map(lvl => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="lg:col-span-3">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'bonus_desc' | 'bonus_asc' | 'hours_desc' | 'error_desc' | 'name_asc')}
            className="w-full px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold border border-gray-200 bg-gray-50/70 text-gray-800 focus:bg-white focus:border-[#2F6FA8] focus:outline-none transition cursor-pointer"
          >
            <option value="bonus_desc">Sắp xếp: Thưởng cao nhất</option>
            <option value="bonus_asc">Sắp xếp: Thưởng thấp nhất</option>
            <option value="hours_desc">Sắp xếp: Giờ làm nhiều nhất</option>
            <option value="error_desc">Sắp xếp: Lỗi kỷ luật nhiều nhất</option>
            <option value="name_asc">Sắp xếp: Tên A-Z</option>
          </select>
        </div>
      </div>

      {/* ── DESKTOP TABLE VIEW (Bảng Ma Trận Đầy Đủ) ── */}
      <div className="hidden sm:block overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full text-xs text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-vanilla-50/90 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="p-3 rounded-l-xl">Nhân viên</th>
              <th className="p-3 text-center">Cấp bậc</th>
              
              <th className="p-3 text-center">
                <div className="inline-flex items-center justify-center gap-1">
                  <span>Giờ làm (≥110h)</span>
                  <div className="group relative cursor-help">
                    <HelpCircle size={12} className="text-gray-400 hover:text-[#2F6FA8]" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 w-44 p-2 bg-[#001D3D] text-white text-[11px] font-normal normal-case rounded-xl shadow-lg pointer-events-none text-center">
                      Tối thiểu 110 giờ/tháng để đủ điều kiện chia quỹ thưởng.
                    </div>
                  </div>
                </div>
              </th>

              <th className="p-3 text-center">
                <div className="inline-flex items-center justify-center gap-1">
                  <span>Lỗi cá nhân</span>
                  <div className="group relative cursor-help">
                    <HelpCircle size={12} className="text-gray-400 hover:text-[#2F6FA8]" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 w-44 p-2 bg-[#001D3D] text-white text-[11px] font-normal normal-case rounded-xl shadow-lg pointer-events-none text-center">
                      Tổng điểm phạt lỗi trong tháng. 0 lỗi nhận 100% thưởng.
                    </div>
                  </div>
                </div>
              </th>

              <th className="p-3 text-center">
                <div className="inline-flex items-center justify-center gap-1">
                  <span>Hệ số lỗi</span>
                  <div className="group relative cursor-help">
                    <HelpCircle size={12} className="text-gray-400 hover:text-[#2F6FA8]" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 w-44 p-2 bg-[#001D3D] text-white text-[11px] font-normal normal-case rounded-xl shadow-lg pointer-events-none text-center">
                      Hệ số giảm trừ thưởng dựa trên mức độ vi phạm quy chế.
                    </div>
                  </div>
                </div>
              </th>

              <th className="p-3 text-center">
                <div className="inline-flex items-center justify-center gap-1">
                  <span>Điểm chia</span>
                  <div className="group relative cursor-help">
                    <HelpCircle size={12} className="text-gray-400 hover:text-[#2F6FA8]" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 w-48 p-2 bg-[#001D3D] text-white text-[11px] font-normal normal-case rounded-xl shadow-lg pointer-events-none text-center">
                      Điểm = (Hệ số bậc) × (Hệ số lỗi) × (Giờ làm).
                    </div>
                  </div>
                </div>
              </th>

              <th className="p-3 text-center">
                <div className="inline-flex items-center justify-center gap-1">
                  <span>% Quỹ</span>
                  <div className="group relative cursor-help">
                    <HelpCircle size={12} className="text-gray-400 hover:text-[#2F6FA8]" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 w-44 p-2 bg-[#001D3D] text-white text-[11px] font-normal normal-case rounded-xl shadow-lg pointer-events-none text-center">
                      Tỷ lệ % nhận thưởng trên tổng điểm quỹ cả quán.
                    </div>
                  </div>
                </div>
              </th>

              <th className="p-3 text-right">Thưởng BSC</th>
              <th className="p-3 rounded-r-xl text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredResults.map(emp => {
              const isEligible = emp.bonus_amount > 0
              const isSelected = selectedEmployeeId === emp.employee_id
              const isTop1 = isEligible && emp.bonus_amount === maxBonus && maxBonus > 0

              return (
                <tr
                  key={emp.employee_id}
                  onClick={() => {
                    onSelectEmployee?.(emp.employee_id)
                    onOpenDetailModal?.(emp.employee_id)
                  }}
                  className={`transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-50/70 border-l-4 border-[#2F6FA8] font-medium'
                      : 'hover:bg-primary-50/30'
                  }`}
                >
                  <td className="p-3 font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      {isEligible ? (
                        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
                      )}
                      <span>{emp.employee_name}</span>
                      {isTop1 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                          <Trophy size={11} className="text-amber-600" />
                          Top 1
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${getRankBadgeClass(emp.level_label)}`}>
                      {emp.level_label} ({emp.rank_coefficient})
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono tabular-nums">
                    <span className={emp.is_eligible_hours ? 'font-bold text-gray-800' : 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md'}>
                      {emp.work_hours}h
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono tabular-nums">
                    {emp.personal_error_count > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px]">
                        {emp.personal_error_count} điểm
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        0 lỗi
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center font-mono tabular-nums font-bold">
                    <span className={emp.personal_coefficient === 1 ? 'text-emerald-600' : emp.personal_coefficient > 0 ? 'text-amber-600' : 'text-rose-500'}>
                      {emp.personal_coefficient}
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono tabular-nums font-bold text-[#2F6FA8]">
                    {emp.personal_share_points}
                  </td>

                  <td className="p-3 text-center font-mono tabular-nums text-gray-600 font-semibold">
                    {emp.share_percentage}%
                  </td>

                  <td className="p-3 text-right font-mono tabular-nums">
                    {isEligible ? (
                      <span className="text-emerald-700 text-sm font-extrabold">{formatVnd(emp.bonus_amount)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px] bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                        <Lock size={11} />
                        {emp.lock_reason || '0 đ (Bị khóa)'}
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectEmployee?.(emp.employee_id)
                        onOpenDetailModal?.(emp.employee_id)
                      }}
                      className="px-3 py-1.5 min-h-[38px] rounded-xl bg-gray-100 hover:bg-[#2F6FA8] hover:text-white text-gray-700 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <FileSearch size={13} />
                      <span>Chi tiết</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARD VIEW (Dạng Thẻ Tiện Lợi Trên Điện Thoại) ── */}
      <div className="sm:hidden space-y-2.5">
        {filteredResults.map(emp => {
          const isEligible = emp.bonus_amount > 0
          const isSelected = selectedEmployeeId === emp.employee_id
          const isTop1 = isEligible && emp.bonus_amount === maxBonus && maxBonus > 0

          return (
            <div
              key={emp.employee_id}
              onClick={() => {
                onSelectEmployee?.(emp.employee_id)
                onOpenDetailModal?.(emp.employee_id)
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                isSelected
                  ? 'bg-primary-50/80 border-[#2F6FA8] shadow-xs'
                  : 'bg-gray-50/60 border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isEligible ? (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
                  )}
                  <span className="text-xs font-bold text-gray-900">{emp.employee_name}</span>
                  {isTop1 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                      <Trophy size={10} /> Top 1
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRankBadgeClass(emp.level_label)}`}>
                    {emp.level_label}
                  </span>
                </div>
                <div className="font-mono tabular-nums text-right">
                  {isEligible ? (
                    <span className="text-xs font-extrabold text-emerald-700">{formatVnd(emp.bonus_amount)}</span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      0 đ
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-[10px] text-gray-500 font-mono tabular-nums text-center">
                <div className="bg-white p-1.5 rounded-xl border border-gray-100">
                  <div className="text-[9px] text-gray-400">Giờ làm</div>
                  <div className={`font-bold ${emp.is_eligible_hours ? 'text-gray-800' : 'text-rose-600'}`}>{emp.work_hours}h</div>
                </div>
                <div className="bg-white p-1.5 rounded-xl border border-gray-100">
                  <div className="text-[9px] text-gray-400">Hệ số lỗi</div>
                  <div className="font-bold text-gray-800">{emp.personal_coefficient}</div>
                </div>
                <div className="bg-white p-1.5 rounded-xl border border-gray-100">
                  <div className="text-[9px] text-gray-400">Điểm chia</div>
                  <div className="font-bold text-[#2F6FA8]">{emp.personal_share_points}</div>
                </div>
                <div className="bg-white p-1.5 rounded-xl border border-gray-100">
                  <div className="text-[9px] text-gray-400">% Quỹ</div>
                  <div className="font-bold text-gray-800">{emp.share_percentage}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-gray-500">
                  {!isEligible && emp.lock_reason && (
                    <span className="text-rose-600 font-medium inline-flex items-center gap-1">
                      <Lock size={10} />
                      {emp.lock_reason}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectEmployee?.(emp.employee_id)
                    onOpenDetailModal?.(emp.employee_id)
                  }}
                  className="px-3 py-1.5 min-h-[36px] rounded-xl bg-white hover:bg-[#2F6FA8] hover:text-white border border-gray-200 text-gray-700 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                >
                  <FileSearch size={13} />
                  <span>Bóc tách công thức</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── FOOTER LEAN SUMMARY BAR (1 DÒNG TÓM TẮT ĐỘI NGŨ) ── */}
      <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2 font-medium">
        <div className="flex items-center gap-3 flex-wrap">
          <span>
            Đội ngũ: <strong className="text-gray-900 font-bold">{summary.total_employee_count} nhân sự</strong>
          </span>
          <span className="text-gray-300">•</span>
          <span>
            Đủ điều kiện nhận thưởng: <strong className="text-emerald-700 font-bold">{summary.eligible_employee_count} / {summary.total_employee_count} người</strong>
          </span>
          <span className="text-gray-300">•</span>
          <span>
            Tổng giờ làm việc: <strong className="text-gray-900 font-bold font-mono tabular-nums">{summary.total_team_hours}h</strong>
          </span>
        </div>
        <div className="text-right font-mono text-gray-600">
          Tổng điểm chia toàn đội: <strong className="text-[#2F6FA8] font-bold">{summary.total_team_share_points.toFixed(1)} điểm</strong>
        </div>
      </div>
    </div>
  )
}
