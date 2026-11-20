'use client'

import React, { useState } from 'react'
import {
  X,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Users,
  Copy,
  Check,
  Calendar,
  Send,
  MessageSquare,
  Sparkles,
  Phone,
} from 'lucide-react'
import type { HeatmapCell, HeatmapEmployeeItem } from '@/lib/services/scheduling/shift-registration-service'

interface RegistrationCellDrawerProps {
  isOpen: boolean
  cell: HeatmapCell | null
  onClose: () => void
  onApproveOne: (registrationId: string) => void
  onRejectOne: (registrationId: string) => void
  onApproveCell: (date: string, shiftId: string) => void
}

interface ZaloReminderModalProps {
  isOpen: boolean
  onClose: () => void
  storeName: string
  weekStartDate: string
  missingStaff: Array<{ name: string; code?: string; role?: string; positionName?: string }>
}

export function RegistrationCellDrawer({
  isOpen,
  cell,
  onClose,
  onApproveOne,
  onRejectOne,
  onApproveCell,
}: RegistrationCellDrawerProps) {
  if (!isOpen || !cell) return null

  const isFull = cell.status === 'FULL'
  const isRisk = cell.status === 'RISK'
  const isEmpty = cell.status === 'EMPTY'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-gray-100 overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-[#001D3D] text-white flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Chi Tiết Phân Bổ Ca
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="text-xs text-white/80 font-mono">{cell.date}</span>
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{cell.dayOfWeek}</span> — <span>{cell.shiftName}</span>
            </h2>
            <p className="text-xs text-white/70 font-mono">{cell.timeRange}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Callout Banner */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/70">
          <div
            className={`p-3 rounded-xl border flex items-start gap-3 ${
              isFull
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isRisk
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {isFull ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : isRisk ? (
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            )}

            <div className="space-y-0.5 text-xs">
              <div className="font-bold">
                {isFull
                  ? `Đủ nhân sự trực ca (${cell.count} bạn đăng ký)`
                  : isRisk
                  ? `Cảnh báo ca mỏng (chỉ có 1 bạn đăng ký)`
                  : `Báo động: Ca trống không có ai đăng ký`}
              </div>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                {isFull
                  ? `Đã đạt tiêu chuẩn tối thiểu 2 nhân sự/ca (1 pha chế + 1 thu ngân) theo quy chuẩn Homies Milk Tea.`
                  : isRisk
                  ? `Khung giờ này có rủi ro quá tải khi khách đông. Cần liên hệ thêm 1 bạn làm ca hỗ trợ/tăng ca.`
                  : `Chi nhánh có nguy cơ không thể mở cửa trong khung giờ này. Cần điều động nhân sự gấp.`}
              </p>
            </div>
          </div>
        </div>

        {/* Drawer Body: Danh sách nhân viên trong ca */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium pb-1">
            <span>Danh sách đăng ký ({cell.registeredEmployees.length} nhân sự)</span>
            <span>
              Đã duyệt:{' '}
              <strong className="text-emerald-700">{cell.approvedCount}</strong> /{' '}
              <strong className="text-gray-700">{cell.count}</strong>
            </span>
          </div>

          {cell.registeredEmployees.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <div className="text-sm font-bold text-gray-700">Chưa có ai đăng ký ca này</div>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Bạn có thể thông báo trên nhóm Zalo chi nhánh để tìm nhân sự sẵn sàng làm bù ca này.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cell.registeredEmployees.map(emp => {
                const isApproved = emp.status === 'APPROVED'
                const isRejected = emp.status === 'REJECTED'
                const isPending = emp.status === 'PENDING'

                return (
                  <div
                    key={emp.registrationId}
                    className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-300 transition bg-white shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Cột trái: Tên & Thông tin nhân viên */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#2F6FA8]/10 text-[#2F6FA8] font-bold flex items-center justify-center text-xs font-mono shrink-0">
                          {emp.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#001D3D] truncate">{emp.name}</div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-gray-400">{emp.code || 'NV'}</span>
                            <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-medium text-[10px]">
                              {emp.positionName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trạng thái duyệt */}
                      <div className="shrink-0">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Đã duyệt
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={11} /> Chờ duyệt
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle size={11} /> Từ chối
                          </span>
                        )}
                      </div>
                    </div>

                    {emp.notes && (
                      <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg italic">
                        &ldquo;{emp.notes}&rdquo;
                      </p>
                    )}

                    {/* Hàng nút bấm duyệt hoặc từ chối từng người */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => onRejectOne(emp.registrationId)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => onApproveOne(emp.registrationId)}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-2xs flex items-center gap-1"
                          >
                            <Check size={12} /> Duyệt ca này
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => onRejectOne(emp.registrationId)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          Hủy duyệt ca này
                        </button>
                      )}

                      {isRejected && (
                        <button
                          type="button"
                          onClick={() => onApproveOne(emp.registrationId)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                        >
                          Duyệt lại ca này
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition"
          >
            Đóng lại
          </button>

          {cell.pendingCount > 0 && (
            <button
              type="button"
              onClick={() => {
                onApproveCell(cell.date, cell.shiftId)
                onClose()
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>Duyệt cả ca ({cell.pendingCount} bạn)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ZaloReminderModal({
  isOpen,
  onClose,
  storeName,
  weekStartDate,
  missingStaff,
}: ZaloReminderModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Mẫu thông báo chuẩn văn phong hành chính theo skill tao-tin-nhan-zalo
  const staffNamesList = missingStaff.map((s, idx) => `${idx + 1}. ${s.name} (${s.positionName || 'Nhân sự'})`).join('\n')

  const messageText = `[THÔNG BÁO] NHẮC ĐĂNG KÝ LỊCH LÀM VIỆC TUẦN ${weekStartDate}

Kính gửi: Các bạn nhân sự chi nhánh ${storeName}

Hiện tại hệ thống đã ghi nhận lịch làm việc tuần tới (${weekStartDate}). Tuy nhiên, chi nhánh vẫn còn ${missingStaff.length} bạn chưa gửi đăng ký ca rảnh:

${staffNamesList}

Hạn chót hoàn tất đăng ký: 17:00 Thứ 7 tuần này.
Các bạn vui lòng đăng nhập vào ứng dụng Homies HRM để hoàn thành đăng ký ca rảnh sớm, giúp Quản lý chốt lịch làm việc chính thức cho cả đội.

Xin cảm ơn sự hợp tác của các bạn!`

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-[#001D3D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Soạn Tin Nhắn Nhắc Zalo</h3>
              <p className="text-[11px] text-white/70">
                Gửi vào nhóm Zalo chi nhánh cho {missingStaff.length} bạn chưa nộp lịch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-5 overflow-y-auto space-y-3">
          <div className="text-xs font-medium text-gray-600 flex items-center justify-between">
            <span>Nội dung đã soạn sẵn chuẩn quy tắc thông báo Homies:</span>
            {copied && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check size={12} /> Đã sao chép!
              </span>
            )}
          </div>

          <textarea
            readOnly
            rows={12}
            value={messageText}
            className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-hidden resize-none leading-relaxed"
          />

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
            <Sparkles size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Bạn chỉ cần bấm <strong>Sao chép nội dung</strong> bên dưới, sau đó dán trực tiếp vào nhóm Zalo chung của quán.
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-xs ${
              copied
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-[#2F6FA8] hover:bg-[#255886]'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Đã sao chép tin nhắn</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Sao chép nội dung tin nhắn</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

