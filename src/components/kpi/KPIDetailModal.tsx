'use client'

import React, { useEffect } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  Calendar,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react'
import type { KPIEvaluation, ViolationRecord } from '@/lib/kpi-types'
import { getViolationsByEmployee } from '@/lib/mock-data-kpi'

export interface EmployeeKPIItem {
  employee_id: string
  name: string
  code: string
  position: string
  level: string
  store_name: string
  self_score: number
  manager_score: number
  final_score: number
  grade_code: 'excellent' | 'good' | 'fair' | 'average' | 'poor'
  status: 'draft' | 'self_submitted' | 'under_review' | 'published' | 'appealed' | 'finalized'
  attendance_score: number
  attitude_score: number
  competence_score: number
  violation_penalty: number
  note?: string
}

interface KPIDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: EmployeeKPIItem | null
  items: EmployeeKPIItem[]
  onSelectEmployee: (employeeId: string) => void
  period: string
}

export default function KPIDetailModal({
  isOpen,
  onClose,
  item,
  items,
  onSelectEmployee,
  period,
}: KPIDetailModalProps) {
  const currentIndex = item ? items.findIndex(i => i.employee_id === item.employee_id) : -1
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1

  const handlePrev = () => {
    if (hasPrev) {
      onSelectEmployee(items[currentIndex - 1].employee_id)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onSelectEmployee(items[currentIndex + 1].employee_id)
    }
  }

  // Keyboard navigation support (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!isOpen || !item) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, item, items, hasPrev, hasNext, currentIndex])

  if (!isOpen || !item) return null

  const violations: ViolationRecord[] = getViolationsByEmployee(item.employee_id, period)

  // Grade badge styling helper
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
        return { label: 'Chờ Quản lý review', class: 'bg-blue-50 text-[#2F6FA8] border-blue-200' }
      case 'under_review':
        return { label: 'Đang xem xét', class: 'bg-amber-50 text-amber-800 border-amber-200' }
      case 'appealed':
        return { label: 'Đang khiếu nại', class: 'bg-purple-50 text-purple-700 border-purple-200' }
      default:
        return { label: 'Bản nháp', class: 'bg-gray-50 text-gray-700 border-gray-200' }
    }
  }

  const gradeInfo = getGradeBadge(item.grade_code)
  const statusInfo = getStatusBadge(item.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span>Bóc Tách Chi Tiết KPI</span>
            <span>•</span>
            <span className="text-[#2F6FA8] font-bold">Tháng {period.slice(5)}/{period.slice(0, 4)}</span>
            <span>•</span>
            <span className="font-mono tabular-nums text-gray-600">NV {currentIndex + 1}/{items.length}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Nhân viên trước (Phím ←)"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Nhân viên sau (Phím →)"
            >
              <ChevronRight size={16} />
            </button>
            <div className="h-4 w-px bg-gray-200 mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              title="Đóng (Escape)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* KHỐI 1: HERO HEADER */}
          <div className="bg-linear-to-r from-blue-50/70 via-indigo-50/40 to-white p-4 sm:p-5 rounded-2xl border border-blue-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#2F6FA8] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {item.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-[#001D3D]">{item.name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 text-[11px] font-mono font-bold">
                    {item.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100/70 text-[#2F6FA8] text-[11px] font-bold">
                    Bậc {item.level}
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-medium mt-0.5 flex items-center gap-2">
                  <span>{item.position}</span>
                  <span>•</span>
                  <span className="text-gray-500">{item.store_name}</span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-blue-100/60 pt-3 sm:pt-0">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono tabular-nums text-[#001D3D]">
                  {item.final_score.toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-gray-500 font-mono">/ 100 đ</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${gradeInfo.class}`}>
                  {gradeInfo.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.class}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* KHỐI 2: 4 BƯỚC TOÁN HỌC CẤU THÀNH ĐIỂM */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-[#2F6FA8]" />
                4 Bước Cấu Thành Điểm KPI (Minh Bạch 100%)
              </h3>
              <span className="text-[11px] text-gray-500">Trọng số chuẩn hóa theo bậc {item.level}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* Bước 1 */}
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Bước 1: Chuyên Cần</div>
                  <div className="text-xs font-bold text-gray-800 mt-1">Tỷ lệ đi làm &amp; Đúng giờ</div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-baseline justify-between">
                  <span className="text-[11px] text-gray-500">Trọng số 25%</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-[#2F6FA8]">
                    {item.attendance_score.toFixed(1)} đ
                  </span>
                </div>
              </div>

              {/* Bước 2 */}
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Bước 2: Thái Độ</div>
                  <div className="text-xs font-bold text-gray-800 mt-1">Tác phong, teamwork</div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-baseline justify-between">
                  <span className="text-[11px] text-gray-500">Trọng số 25%</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                    {item.attitude_score.toFixed(1)} đ
                  </span>
                </div>
              </div>

              {/* Bước 3 */}
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Bước 3: Năng Lực</div>
                  <div className="text-xs font-bold text-gray-800 mt-1">Pha chế &amp; Xử lý ca</div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-baseline justify-between">
                  <span className="text-[11px] text-gray-500">Trọng số 25%</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-indigo-700">
                    {item.competence_score.toFixed(1)} đ
                  </span>
                </div>
              </div>

              {/* Bước 4 */}
              <div className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Bước 4: Khấu Trừ</div>
                  <div className="text-xs font-bold text-gray-800 mt-1">Lỗi vi phạm &amp; Phạt</div>
                </div>
                <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-baseline justify-between">
                  <span className="text-[11px] text-rose-700 font-medium">
                    {violations.length} lỗi ghi nhận
                  </span>
                  <span className="text-sm font-bold font-mono tabular-nums text-rose-700">
                    -{item.violation_penalty} đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 3: DANH SÁCH LỖI KỶ LUẬT & VI PHẠM TRONG KỲ */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-rose-600" />
                Sự Cố &amp; Nhật Ký Vi Phạm Trong Tháng ({violations.length})
              </h3>
              <span className="text-[11px] text-gray-500">5 trường thông tin chi tiết</span>
            </div>

            {violations.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-800">Không có lỗi vi phạm nào trong kỳ</div>
                  <div className="text-[11px] text-emerald-600">Nhân viên hoàn thành xuất sắc kỷ luật và quy chuẩn phục vụ.</div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-3">Tên Lỗi &amp; Nhóm</th>
                      <th className="py-2.5 px-2 text-center">Trừ Điểm</th>
                      <th className="py-2.5 px-3">Hành Vi Thực Tế</th>
                      <th className="py-2.5 px-3">Thời Gian</th>
                      <th className="py-2.5 px-3 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {violations.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-2.5 px-3 font-semibold text-gray-800">
                          {v.violation_type_id}
                          <div className="text-[10px] font-normal text-gray-500">{v.log_mode === 'realtime' ? 'Thời gian thực' : 'Tổng kết'}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold tabular-nums text-rose-700">
                          -{v.penalty_points} đ
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 max-w-xs">{v.description}</td>
                        <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                          {v.occurred_at.slice(0, 10)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'finalized'
                              ? 'bg-gray-100 text-gray-700'
                              : v.status === 'appealed'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* GHI CHÚ ĐIỀU HÀNH */}
          {item.note && (
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700">
              <div className="font-bold text-gray-800 mb-0.5 flex items-center gap-1.5">
                <FileText size={13} className="text-[#2F6FA8]" />
                Nhận xét từ Quản lý trực tiếp:
              </div>
              <p className="text-gray-600">{item.note}</p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-[11px] text-gray-500">
            Dùng phím <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono font-bold">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono font-bold">→</kbd> để chuyển nhanh giữa các nhân sự.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 font-bold text-xs transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
