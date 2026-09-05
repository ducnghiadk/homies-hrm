'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import type { EmployeeKPIItem } from './KPIDetailModal'

interface KPITeamTableProps {
  items: EmployeeKPIItem[]
  onSelectEmployee: (employeeId: string) => void
  onOpenReviewModal?: (employeeId: string) => void
}

type FilterTab = 'all' | 'published' | 'pending_review' | 'need_attention' | 'promotion'

export default function KPITeamTable({
  items,
  onSelectEmployee,
  onOpenReviewModal,
}: KPITeamTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'name' | 'level'>('score_desc')

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.store_name.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchSearch) return false

      // Level filter
      if (selectedLevel !== 'all' && item.level !== selectedLevel) return false

      // Tab filter
      if (filterTab === 'published') {
        return item.status === 'published' || item.status === 'finalized'
      }
      if (filterTab === 'pending_review') {
        return item.status === 'self_submitted' || item.status === 'under_review' || item.status === 'draft'
      }
      if (filterTab === 'need_attention') {
        return item.final_score < 75 || item.violation_penalty > 0
      }
      if (filterTab === 'promotion') {
        return item.final_score >= 85
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'score_desc') return b.final_score - a.final_score
      if (sortBy === 'score_asc') return a.final_score - b.final_score
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'level') return b.level.localeCompare(a.level)
      return 0
    })
  }, [items, searchTerm, filterTab, selectedLevel, sortBy])

  // Aggregate stats
  const totalCount = items.length
  const evaluatedCount = items.filter(i => ['published', 'finalized'].includes(i.status)).length
  const avgScore = items.length
    ? (items.reduce((acc, i) => acc + i.final_score, 0) / items.length).toFixed(1)
    : '0'
  const qualifiedCount = items.filter(i => i.final_score >= 70).length

  // Grade badge helper
  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'excellent':
        return { label: 'Xuất sắc', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'good':
        return { label: 'Tốt', class: 'bg-blue-50 text-[#2F6FA8] border-blue-200' }
      case 'fair':
        return { label: 'Khá', class: 'bg-amber-50 text-amber-800 border-amber-200' }
      case 'average':
        return { label: 'Trung bình', class: 'bg-orange-50 text-orange-700 border-orange-200' }
      default:
        return { label: 'Cần cải thiện', class: 'bg-rose-50 text-rose-700 border-rose-200' }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'finalized':
        return { label: 'Đã hoàn tất', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'self_submitted':
        return { label: 'Chờ review', class: 'bg-blue-50 text-[#2F6FA8] border-blue-200' }
      case 'under_review':
        return { label: 'Đang chấm', class: 'bg-amber-50 text-amber-800 border-amber-200' }
      case 'appealed':
        return { label: 'Khiếu nại', class: 'bg-purple-50 text-purple-700 border-purple-200' }
      default:
        return { label: 'Chưa chấm', class: 'bg-gray-100 text-gray-700 border-gray-200' }
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden w-full flex flex-col">
      {/* Header controls & Filters */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm nhân viên theo tên, mã NV, vị trí..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] transition"
            />
          </div>

          {/* Level selector & Sorter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
              <Filter size={13} className="text-gray-400" />
              <span>Bậc:</span>
            </div>
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 outline-none hover:border-gray-300 transition"
            >
              <option value="all">Tất cả bậc</option>
              <option value="L0">Bậc L0 (Thử việc)</option>
              <option value="L1">Bậc L1 (Nhân viên mới)</option>
              <option value="L2">Bậc L2 (Chính thức)</option>
              <option value="L3">Bậc L3 (Senior/Chính)</option>
              <option value="L4">Bậc L4 (Ca trưởng/QL)</option>
              <option value="L5">Bậc L5 (Quản lý chuỗi)</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'score_desc' | 'score_asc' | 'name' | 'level')}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 outline-none hover:border-gray-300 transition"
            >
              <option value="score_desc">Điểm: Cao ➡️ Thấp</option>
              <option value="score_asc">Điểm: Thấp ➡️ Cao</option>
              <option value="name">Tên nhân viên (A-Z)</option>
              <option value="level">Cấp bậc (L5 ➡️ L0)</option>
            </select>
          </div>
        </div>

        {/* Filter Tab Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
              filterTab === 'all'
                ? 'bg-[#2F6FA8] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
            }`}
          >
            Tất cả ({items.length})
          </button>
          <button
            onClick={() => setFilterTab('published')}
            className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
              filterTab === 'published'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80'
            }`}
          >
            <CheckCircle2 size={13} />
            Đã hoàn tất ({items.filter(i => ['published', 'finalized'].includes(i.status)).length})
          </button>
          <button
            onClick={() => setFilterTab('pending_review')}
            className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
              filterTab === 'pending_review'
                ? 'bg-[#2F6FA8] text-white shadow-2xs'
                : 'bg-blue-50 text-[#2F6FA8] hover:bg-blue-100/80'
            }`}
          >
            <Clock size={13} />
            Chờ Quản lý review ({items.filter(i => ['self_submitted', 'under_review'].includes(i.status)).length})
          </button>
          <button
            onClick={() => setFilterTab('need_attention')}
            className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
              filterTab === 'need_attention'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100/80'
            }`}
          >
            <ShieldAlert size={13} />
            Cần theo dõi / Vi phạm ({items.filter(i => i.final_score < 75 || i.violation_penalty > 0).length})
          </button>
          <button
            onClick={() => setFilterTab('promotion')}
            className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
              filterTab === 'promotion'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100/80'
            }`}
          >
            <Sparkles size={13} />
            Top đạt chuẩn ({items.filter(i => i.final_score >= 85).length})
          </button>
        </div>
      </div>

      {/* Table content */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100">
              <th className="py-3 px-4 text-[#001D3D]">Nhân Viên</th>
              <th className="py-3 px-3 text-center">Bậc</th>
              <th className="py-3 px-3 text-center">Tự Chấm</th>
              <th className="py-3 px-3 text-center">Quản Lý</th>
              <th className="py-3 px-4 text-center">Điểm KPI</th>
              <th className="py-3 px-3 text-center">Xếp Loại</th>
              <th className="py-3 px-3 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center mb-2">
                      <Search size={24} />
                    </div>
                    <div className="text-sm font-bold text-[#001D3D]">Không tìm thấy nhân sự phù hợp</div>
                    <p className="text-xs text-gray-500 mt-0.5">Thử đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map(emp => {
                const gradeBadge = getGradeBadge(emp.grade_code)
                const statusBadge = getStatusBadge(emp.status)
                const isNeedReview = emp.status === 'self_submitted'

                return (
                  <tr
                    key={emp.employee_id}
                    onClick={() => onSelectEmployee(emp.employee_id)}
                    className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                  >
                    {/* Cột 1: Nhân viên */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2F6FA8] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#2F6FA8] group-hover:text-white transition">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-[#2F6FA8] transition">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                            <span className="font-mono">{emp.code}</span>
                            <span>•</span>
                            <span>{emp.position}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Bậc */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 font-bold text-gray-700 text-[11px] font-mono">
                        {emp.level}
                      </span>
                    </td>

                    {/* Cột 3: Tự chấm */}
                    <td className="py-3 px-3 text-center font-mono font-bold tabular-nums text-gray-600">
                      {emp.self_score > 0 ? `${emp.self_score} đ` : '—'}
                    </td>

                    {/* Cột 4: Quản lý */}
                    <td className="py-3 px-3 text-center font-mono font-bold tabular-nums text-gray-600">
                      {emp.manager_score > 0 ? `${emp.manager_score} đ` : '—'}
                    </td>

                    {/* Cột 5: Điểm KPI Tổng Hợp */}
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-bold tabular-nums text-sm ${
                        emp.final_score >= 85
                          ? 'text-emerald-700'
                          : emp.final_score >= 70
                          ? 'text-[#2F6FA8]'
                          : 'text-rose-700'
                      }`}>
                        {emp.final_score.toFixed(1)} đ
                      </span>
                    </td>

                    {/* Cột 6: Xếp loại */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${gradeBadge.class}`}>
                        {gradeBadge.label}
                      </span>
                    </td>

                    {/* Cột 7: Trạng thái */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Cột 8: Thao tác */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {isNeedReview && onOpenReviewModal && (
                          <button
                            onClick={() => onOpenReviewModal(emp.employee_id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition"
                          >
                            Chấm điểm
                          </button>
                        )}
                        <button
                          onClick={() => onSelectEmployee(emp.employee_id)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#2F6FA8] hover:text-white text-gray-700 font-bold text-[11px] transition flex items-center gap-1"
                        >
                          <span>Bóc tách</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table footer summary */}
      <div className="p-3.5 border-t border-gray-100 bg-gray-50/70 text-xs text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap font-medium">
          <span>Đội ngũ: <b className="font-mono text-[#001D3D]">{totalCount}</b> người</span>
          <span>•</span>
          <span>Đã đánh giá: <b className="font-mono text-emerald-700">{evaluatedCount}/{totalCount}</b></span>
          <span>•</span>
          <span>Điểm trung bình: <b className="font-mono text-[#2F6FA8]">{avgScore} đ</b></span>
          <span>•</span>
          <span>Đạt chuẩn (≥70đ): <b className="font-mono text-emerald-700">{qualifiedCount}</b> NV</span>
        </div>

        <div className="text-[11px] text-gray-400 font-medium">
          Click vào bất kỳ dòng nào để xem chi tiết 4 khối
        </div>
      </div>
    </div>
  )
}
