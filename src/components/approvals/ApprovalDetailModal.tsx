'use client'

import React, { useEffect, useState } from 'react'
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import {
  type ApprovalItem,
  APPROVAL_CATEGORIES,
} from '@/lib/mock-data/approvals'
import {
  getEmployeeById,
  getStoreById,
  getPositionById,
} from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

interface ApprovalDetailModalProps {
  item: ApprovalItem | null
  isOpen: boolean
  onClose: () => void
  onApprove: (id: string, notes?: string) => void
  onReject: (id: string, notes?: string) => void
  onNavigatePrev: () => void
  onNavigateNext: () => void
  hasPrev: boolean
  hasNext: boolean
  currentIndex: number
  totalCount: number
}

export default function ApprovalDetailModal({
  item,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
  currentIndex,
  totalCount,
}: ApprovalDetailModalProps) {
  // Reset reviewNotes when item changes
  const [reviewNotes, setReviewNotes] = useState(item?.review_notes || '')
  const [prevItemId, setPrevItemId] = useState(item?.id)

  if (item && item.id !== prevItemId) {
    setPrevItemId(item.id)
    setReviewNotes(item.review_notes || '')
  }

  // Lắng nghe phím tắt bàn phím: ← (Trước), → (Tiếp), Escape (Đóng)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigatePrev()
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigateNext()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasPrev, hasNext, onNavigatePrev, onNavigateNext, onClose])

  if (!isOpen || !item) return null

  const emp = getEmployeeById(item.employee_id)
  const store = getStoreById(item.store_id)
  const position = emp ? getPositionById(emp.position_id) : null
  const cat = APPROVAL_CATEGORIES[item.category]
  const swapEmp = item.swap_with_employee_id ? getEmployeeById(item.swap_with_employee_id) : null

  // Cấu hình cấp duyệt: 2 cấp vs 1 cấp theo Master Workflow
  const isTwoLevel = ['leave', 'salary_advance', 'kpi_review', 'new_employee'].includes(item.category)
  const level1Role = 'Quản lý Cửa hàng'
  const level2Role = item.category === 'salary_advance' 
    ? 'HR Admin / Kế toán' 
    : item.category === 'kpi_review' 
    ? 'CEO / Ban Giám Đốc' 
    : 'HR Admin'

  const priorityLabel = {
    high: 'Gấp — Cần xử lý ngay',
    medium: 'Bình thường',
    low: 'Ưu tiên thấp',
  }[item.priority]

  const priorityBadgeStyle = {
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    low: 'bg-gray-50 text-gray-700 border-gray-200',
  }[item.priority]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-['Inter'] animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 font-mono">
              Đơn {currentIndex + 1} / {totalCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onNavigatePrev}
                disabled={!hasPrev}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Đơn trước (Phím ←)"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={onNavigateNext}
                disabled={!hasNext}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Đơn tiếp theo (Phím →)"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${priorityBadgeStyle}`}>
              {priorityLabel}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-200/60 flex items-center justify-center text-gray-500 hover:text-gray-900 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-800">
          {/* HERO INFO NHÂN VIÊN */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100/80 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2F6FA8] text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                {emp?.full_name?.charAt(0) || 'N'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#001D3D]">{emp?.full_name || 'Nhân viên'}</h3>
                  <span className="text-[11px] font-mono text-gray-500 font-bold">({emp?.employee_code || item.employee_id})</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 font-medium mt-0.5">
                  <span>{position?.name || 'Nhân viên'}</span>
                  <span>•</span>
                  <span>{store?.name.replace('Homies Milk Tea - ', '') || 'Chi nhánh'}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Danh Mục</span>
              <span className="text-xs font-bold text-[#2F6FA8] bg-white px-2.5 py-1 rounded-lg border border-blue-200 mt-1 inline-block">
                {cat?.label}
              </span>
            </div>
          </div>

          {/* TIẾN TRÌNH QUY TRÌNH PHÊ DUYỆT (1 CẤP / 2 CẤP) */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h4 className="text-xs font-bold text-[#001D3D] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#2F6FA8]" />
                Tiến Trình Quy Trình Duyệt
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isTwoLevel ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-[#2F6FA8] border border-blue-200'
              }`}>
                {isTwoLevel ? 'Quy trình 2 Cấp Phê Duyệt' : 'Quy trình 1 Cấp Phê Duyệt'}
              </span>
            </div>

            <div className={`grid gap-3 ${isTwoLevel ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {/* BƯỚC 1: Quản lý cửa hàng */}
              <div className={`p-3 rounded-xl border transition-all ${
                item.status === 'approved'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : item.status === 'rejected'
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-amber-50/50 border-amber-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-white border flex items-center justify-center font-mono text-[10px] font-bold text-gray-700 shadow-2xs">
                      1
                    </span>
                    {level1Role}
                  </span>
                  {item.status === 'approved' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                      <Check size={11} /> Đã Duyệt
                    </span>
                  ) : item.status === 'rejected' ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-white px-1.5 py-0.2 rounded border border-rose-200 flex items-center gap-1">
                      <X size={11} /> Từ Chối
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-white px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-1">
                      <Clock size={11} /> Đang Chờ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {item.reviewed_by ? `Người duyệt: ${item.reviewed_by}` : 'Xem xét hồ sơ và lịch ca tại chi nhánh'}
                </p>
              </div>

              {/* BƯỚC 2: HR Admin / CEO (nếu có) */}
              {isTwoLevel && (
                <div className={`p-3 rounded-xl border transition-all ${
                  item.status === 'approved'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : item.status === 'rejected'
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-white border flex items-center justify-center font-mono text-[10px] font-bold text-gray-700 shadow-2xs">
                        2
                      </span>
                      {level2Role}
                    </span>
                    {item.status === 'approved' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                        <Check size={11} /> Hoàn Tất
                      </span>
                    ) : item.status === 'rejected' ? (
                      <span className="text-[10px] font-bold text-gray-500 bg-white px-1.5 py-0.2 rounded border border-gray-200">
                        Đã Dừng
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500 bg-white px-1.5 py-0.2 rounded border border-gray-200 flex items-center gap-1">
                        <Clock size={11} /> Sau Cấp 1
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Xác nhận hạn mức, tính lương và lưu hồ sơ hệ thống
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* KHỐI 1: NỘI DUNG CHI TIẾT YÊU CẦU */}
          <div className="p-4 rounded-2xl bg-white border border-gray-100 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold text-[#001D3D] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <FileText size={15} className="text-[#2F6FA8]" />
              Chi Tiết Yêu Cầu
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-gray-500 font-medium">Tiêu đề:</span>
                <p className="font-bold text-[#001D3D]">{item.title}</p>
              </div>

              {item.target_date && (
                <div className="space-y-0.5">
                  <span className="text-gray-500 font-medium">Ngày áp dụng:</span>
                  <p className="font-bold font-mono text-gray-900">{formatDate(item.target_date)}</p>
                </div>
              )}

              {item.shift_name && (
                <div className="space-y-0.5">
                  <span className="text-gray-500 font-medium">Ca làm việc liên quan:</span>
                  <p className="font-bold text-[#2F6FA8]">{item.shift_name}</p>
                </div>
              )}

              {swapEmp && (
                <div className="space-y-0.5">
                  <span className="text-gray-500 font-medium">Đổi ca cùng nhân viên:</span>
                  <p className="font-bold text-purple-900">{swapEmp.full_name} ({swapEmp.employee_code})</p>
                </div>
              )}

              {item.amount && (
                <div className="space-y-0.5">
                  <span className="text-gray-500 font-medium">Số tiền tạm ứng:</span>
                  <p className="font-bold font-mono text-emerald-700 text-sm">{item.amount.toLocaleString('vi-VN')} đ</p>
                </div>
              )}
            </div>

            {item.description && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Mô tả bổ sung:</span>
                <p className="text-gray-700 font-medium bg-gray-50 p-2.5 rounded-xl border border-gray-100">{item.description}</p>
              </div>
            )}
          </div>

          {/* KHỐI 2: LÝ DO THỰC TẾ & MINH CHỨNG */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-700" />
              Lý Do Đề Xuất Của Nhân Sự
            </h4>
            <p className="text-xs text-amber-900 font-medium leading-relaxed italic bg-white/80 p-3 rounded-xl border border-amber-200">
              &ldquo;{item.reason}&rdquo;
            </p>
          </div>

          {/* KHỐI 3: LỊCH SỬ CHUYÊN CẦN GẦN ĐÂY */}
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                Hồ Sơ Chuyên Cần Trong Tháng
              </h4>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                KPI 4.8 / 5.0
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block">Số Lần Nghỉ</span>
                <strong className="font-mono text-gray-900 text-sm">1 lần</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block">Đúng Giờ</span>
                <strong className="font-mono text-emerald-700 text-sm">98.2%</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block">Giờ Công</span>
                <strong className="font-mono text-blue-900 text-sm">126 giờ</strong>
              </div>
            </div>
          </div>

          {/* KHỐI 4: GHI CHÚ PHÊ DUYỆT */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800 text-xs">
              Ghi Chú Phê Duyệt / Lý Do Từ Chối (Tùy chọn):
            </label>
            <textarea
              rows={2}
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Nhập ghi chú phản hồi cho nhân sự hoặc lưu vết audit nội bộ..."
              className="w-full p-3 rounded-xl border border-gray-300 text-xs font-medium text-gray-900 outline-none focus:border-[#2F6FA8] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
            />
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[40px] rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold transition cursor-pointer"
          >
            Đóng Lại (Esc)
          </button>

          {item.status === 'pending' ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onReject(item.id, reviewNotes)
                  onClose()
                }}
                className="px-4 py-2.5 min-h-[40px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <X size={15} />
                <span>Từ Chối Đơn</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApprove(item.id, reviewNotes)
                  onClose()
                }}
                className="px-5 py-2.5 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Check size={16} />
                <span>Phê Duyệt Ngay</span>
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-gray-500">
              Đơn này đã được xử lý ({item.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
